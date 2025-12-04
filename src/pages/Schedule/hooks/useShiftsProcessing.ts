// src/pages/Schedule/hooks/useShiftsProcessing.ts
import { useMemo } from "react";
import { combineDateTime } from "../utils/scheduleHelpers";
import type { UISimpleShift } from "../types/scheduleTypes";

interface EmployeeWithData {
  id: number;
  shifts: any[];
  leaves: any[];
}

interface UseShiftsProcessingProps {
  employees: EmployeeWithData[];
  overtime: any;
  weekDays: Date[];
  isEmployeeOnLeaveOrHoliday: (employeeId: number, dateStr: string) => boolean;
}

export const useShiftsProcessing = ({
  employees,
  overtime,
  weekDays,
  isEmployeeOnLeaveOrHoliday,
}: UseShiftsProcessingProps) => {
  // Process all shifts into unified format
  const allShifts: UISimpleShift[] = useMemo(() => {
    const list: UISimpleShift[] = [];

    // Process shifts from each employee
    employees.forEach((emp) => {
      emp.shifts.forEach((shift: any) => {
        // Skip if employee has leave/holiday on that date
        if (isEmployeeOnLeaveOrHoliday(emp.id, shift.shift_date)) {
          return;
        }

        list.push({
          id: shift.id,
          employeeId: emp.id,
          title: shift.schedule_name || "Shift",
          start: combineDateTime(shift.shift_date, shift.scheduled_start_time),
          end: combineDateTime(shift.shift_date, shift.scheduled_end_time),
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
  }, [employees, overtime, isEmployeeOnLeaveOrHoliday, weekDays]);

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
