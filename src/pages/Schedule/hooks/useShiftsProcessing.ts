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

// Extract time from ISO timestamp (e.g., "2025-12-05T12:29:00.000Z" -> "12:29:00")
function extractTimeFromISO(isoString?: string | null): string {
  if (!isoString) return "00:00:00";
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "00:00:00";
    
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const seconds = date.getUTCSeconds().toString().padStart(2, "0");
    
    return `${hours}:${minutes}:${seconds}`;
  } catch {
    return "00:00:00";
  }
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

        // If we have active schedules data, validate against it
        if (activeWorkSchedules.length > 0) {
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
        }
        // If activeWorkSchedules is empty (API error), show shifts anyway with basic validation

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
      console.log("[useShiftsProcessing] Processing overtime data:", overtime.data.data.length, "requests");
      const weekStartDate = new Date(weekDays[0]);
      const weekEndDate = new Date(weekDays[6]);
      weekStartDate.setHours(0, 0, 0, 0);
      weekEndDate.setHours(23, 59, 59, 999);

      console.log("[useShiftsProcessing] Week range:", weekStartDate.toISOString(), "to", weekEndDate.toISOString());

      overtime.data.data.forEach((ot: any) => {
        console.log("[useShiftsProcessing] Processing OT:", ot.id, "employee:", ot.employee_id, "date:", ot.overtime_date, "status:", ot.status);

        // Only show APPROVED overtime requests
        if (ot.status !== "APPROVED") {
          console.log("[useShiftsProcessing] Skipping OT", ot.id, "- not APPROVED");
          return;
        }

        // Convert employee_id to number (API returns string)
        const employeeId = Number(ot.employee_id);
        console.log("[useShiftsProcessing] Converted employee_id:", employeeId);

        // Skip if employee has leave/holiday on that date
        if (isEmployeeOnLeaveOrHoliday(employeeId, ot.overtime_date)) {
          console.log("[useShiftsProcessing] Skipping OT", ot.id, "- employee has leave/holiday");
          return;
        }

        // Parse date correctly to avoid timezone issues
        const [year, month, day] = ot.overtime_date.split('-').map(Number);
        const otDate = new Date(year, month - 1, day);
        otDate.setHours(0, 0, 0, 0);
        console.log("[useShiftsProcessing] OT date:", otDate.toISOString(), "in range?", otDate >= weekStartDate && otDate <= weekEndDate);

        if (otDate >= weekStartDate && otDate <= weekEndDate) {
          // Extract time from ISO timestamps (start_time and end_time are full ISO strings)
          const startTime = extractTimeFromISO(ot.start_time);
          const endTime = extractTimeFromISO(ot.end_time);
          
          const overtimeShift = {
            id: ot.id,
            employeeId: employeeId, // Use converted number
            title: `OT: ${ot.reason || "Overtime"}`,
            start: combineDateTime(ot.overtime_date, startTime),
            end: combineDateTime(ot.overtime_date, endTime),
            type: "OVERTIME" as ShiftType,
            date: ot.overtime_date,
            isOvertimeRequest: true,
          };
          
          console.log("[useShiftsProcessing] Adding OT shift:", overtimeShift);
          list.push(overtimeShift);
        }
      });
    } else {
      console.log("[useShiftsProcessing] No overtime data available");
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
