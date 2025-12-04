// src/pages/Schedule/hooks/useShiftsProcessing.ts
import { useMemo } from "react";

type ShiftType = "SHIFT" | "OVERTIME" | "ABSENT" | "MEETING";

interface UISimpleShift {
  id: number;
  employeeId: number;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  type: ShiftType;
  date: string;
  status?: string;
  isOvertimeRequest?: boolean;
}

// Helper functions
function normalizeTime(timeStr?: string | null): string {
  if (!timeStr) return "00:00:00";

  const parts = timeStr.split(":");

  const h = (parts[0] ?? "0").padStart(2, "0");
  const m = (parts[1] ?? "0").padStart(2, "0");
  const s = (parts[2] ?? "0").padStart(2, "0");

  return `${h}:${m}:${s}`;
}

function combineDateTime(dateStr: string, timeStr: string): string {
  const t = normalizeTime(timeStr);
  const dt = new Date(`${dateStr}T${t}`);

  if (Number.isNaN(dt.getTime())) {
    const fallback = new Date(`${dateStr}T00:00:00`);
    return fallback.toISOString();
  }

  return dt.toISOString();
}

interface EmployeeWithData {
  id: number;
  shifts?: any[];
  leaves?: any[];
}

interface UseShiftsProcessingProps {
  employees: EmployeeWithData[];
  overtime: any;
  weekDays: Date[];
  isEmployeeOnLeaveOrHoliday: (employeeId: number, dateStr: string) => boolean;
  activeWorkSchedules: any[]; // List of ACTIVE work schedules
}

export const useShiftsProcessing = ({
  employees,
  overtime,
  weekDays,
  isEmployeeOnLeaveOrHoliday,
  activeWorkSchedules,
}: UseShiftsProcessingProps) => {
  // Create a Set of active work schedule IDs for O(1) lookup
  const activeScheduleIds = useMemo(() => {
    return new Set(activeWorkSchedules.map((ws: any) => ws.id));
  }, [activeWorkSchedules]);

  // Create a Map of work schedule details for quick lookup
  const workScheduleMap = useMemo(() => {
    const map = new Map<number, any>();
    activeWorkSchedules.forEach((ws: any) => {
      map.set(ws.id, ws);
    });
    return map;
  }, [activeWorkSchedules]);

  // Helper: Get day of week from date string (1=Mon, 7=Sun)
  const getDayOfWeek = (dateStr: string): number => {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    return day === 0 ? 7 : day; // Convert: 0(Sun)→7, 1(Mon)→1, ..., 6(Sat)→6
  };

  // Helper: Check if day is in work_days
  const isDayInWorkDays = (dateStr: string, workDays: string): boolean => {
    const dayOfWeek = getDayOfWeek(dateStr);
    const workDayNumbers = workDays
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    return workDayNumbers.includes(dayOfWeek);
  };

  // Process all shifts into unified format
  const allShifts: UISimpleShift[] = useMemo(() => {
    const list: UISimpleShift[] = [];

    // Process shifts from each employee (if available)
    employees.forEach((emp) => {
      const shifts = emp.shifts ?? [];
      shifts.forEach((shift: any) => {
        // Skip if employee has leave/holiday on that date
        if (isEmployeeOnLeaveOrHoliday(emp.id, shift.shift_date)) {
          return;
        }

        // Skip if work_schedule_id is null, 0, or invalid
        if (!shift.work_schedule_id || shift.work_schedule_id === 0) {
          console.warn(`[useShiftsProcessing] Skipping shift ${shift.shift_id} - invalid work_schedule_id:`, shift.work_schedule_id);
          return;
        }

        // Skip if shift's work_schedule is INACTIVE (not in active schedules list)
        if (!activeScheduleIds.has(shift.work_schedule_id)) {
          console.warn(`[useShiftsProcessing] Skipping shift ${shift.shift_id} - work_schedule_id ${shift.work_schedule_id} not in ACTIVE schedules`);
          return;
        }

        // Get the work schedule details
        const workSchedule = workScheduleMap.get(shift.work_schedule_id);
        if (!workSchedule) {
          console.warn(`[useShiftsProcessing] Skipping shift ${shift.shift_id} - work_schedule not found`);
          return;
        }

        // Check if shift date's day of week is in work_days
        if (workSchedule.work_days && !isDayInWorkDays(shift.shift_date, workSchedule.work_days)) {
          const dayOfWeek = getDayOfWeek(shift.shift_date);
          console.warn(`[useShiftsProcessing] Skipping shift ${shift.shift_id} - day ${dayOfWeek} not in work_days [${workSchedule.work_days}]`);
          return;
        }

        list.push({
          id: shift.shift_id || shift.id, // Use shift_id from calendar API
          employeeId: emp.id,
          title: shift.schedule_name || "Shift",
          start: combineDateTime(shift.shift_date, shift.start_time), // Use start_time from calendar API
          end: combineDateTime(shift.shift_date, shift.end_time), // Use end_time from calendar API
          type: "SHIFT",
          date: shift.shift_date,
          status: shift.status || "SCHEDULED",
        });
      });
    });

    // Add APPROVED overtime requests
    if (overtime?.data?.data) {
      const weekStartDate = new Date(weekDays[0]);
      const weekEndDate = new Date(weekDays[6]);

      overtime.data.data.forEach((ot: any) => {
        // Skip if employee has leave/holiday on that date
        if (isEmployeeOnLeaveOrHoliday(ot.employee_id, ot.overtime_date)) {
          return;
        }

        const otDate = new Date(ot.overtime_date);
        if (otDate >= weekStartDate && otDate <= weekEndDate) {
          list.push({
            id: ot.id,
            employeeId: ot.employee_id,
            title: `OT: ${ot.reason || "Overtime"}`,
            start: combineDateTime(ot.overtime_date, ot.start_time),
            end: combineDateTime(ot.overtime_date, ot.end_time),
            type: "OVERTIME",
            date: ot.overtime_date,
            isOvertimeRequest: true,
          });
        }
      });
    }

    return list;
  }, [employees, overtime, isEmployeeOnLeaveOrHoliday, weekDays, activeScheduleIds, workScheduleMap]);

  // Group shifts by employee and day for O(1) lookup
  const shiftsByEmployeeAndDay = useMemo(() => {
    const map: Record<string, UISimpleShift[]> = {};

    for (const shift of allShifts) {
      const key = `${shift.employeeId}-${shift.date}`;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(shift);
    }

    return map;
  }, [allShifts]);

  return {
    allShifts,
    shiftsByEmployeeAndDay,
  };
};
