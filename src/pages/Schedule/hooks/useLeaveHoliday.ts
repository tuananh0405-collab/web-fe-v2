// src/pages/Schedule/hooks/useLeaveHoliday.ts
import { useMemo, useCallback } from "react";
import { isDateInRange } from "../utils/scheduleHelpers";
import type { LeaveHolidayInfo } from "../types/scheduleTypes";

interface EmployeeWithLeaves {
  id: number;
  leaves: any[];
}

interface UseLeaveHolidayProps {
  holidays: any;
  employees: EmployeeWithLeaves[];
  leaveTypes: any;
}

export const useLeaveHoliday = ({
  holidays,
  employees,
  leaveTypes,
}: UseLeaveHolidayProps) => {
  // Memoize processed lists to avoid re-processing on every render
  const holidayList = useMemo(() => {
    return holidays?.data?.holidays || (Array.isArray(holidays?.data) ? holidays.data : []);
  }, [holidays]);

  const leaveTypeList = useMemo(() => {
    return leaveTypes?.data?.leave_types || (Array.isArray(leaveTypes?.data) ? leaveTypes.data : []);
  }, [leaveTypes]);

  // Create lookup maps for O(1) access
  const holidayMap = useMemo(() => {
    const map = new Map<string, any>();
    holidayList.forEach((h: any) => {
      map.set(h.holiday_date, h);
    });
    return map;
  }, [holidayList]);

  const leaveTypeMap = useMemo(() => {
    const map = new Map<number, any>();
    leaveTypeList.forEach((lt: any) => {
      map.set(lt.id, lt);
    });
    return map;
  }, [leaveTypeList]);

  // Group leaves by employee for faster lookup
  const leaveByEmployeeMap = useMemo(() => {
    const map = new Map<number, any[]>();
    employees.forEach((emp) => {
      if (emp.leaves && emp.leaves.length > 0) {
        map.set(emp.id, emp.leaves);
      }
    });
    return map;
  }, [employees]);

  const isEmployeeOnLeaveOrHoliday = useCallback(
    (employeeId: number, dateStr: string): boolean => {
      // Check holiday using map (O(1))
      if (holidayMap.has(dateStr)) return true;

      // Check leave using employee map (O(1) lookup + O(k) where k is leaves per employee)
      const employeeLeaves = leaveByEmployeeMap.get(employeeId);
      if (!employeeLeaves) return false;

      return employeeLeaves.some((leave) =>
        isDateInRange(dateStr, leave.start_date, leave.end_date)
      );
    },
    [holidayMap, leaveByEmployeeMap]
  );

  const getLeaveOrHolidayInfo = useCallback(
    (employeeId: number, dateStr: string): LeaveHolidayInfo | null => {
      // Check holiday first (higher priority)
      const holiday = holidayMap.get(dateStr);
      if (holiday) {
        return {
          type: "holiday" as const,
          label: `Holiday: ${holiday.holiday_name}`,
          color: "#6b7280", // gray-500 hex color for holidays
          data: holiday,
        };
      }

      // Check leave
      const employeeLeaves = leaveByEmployeeMap.get(employeeId);
      if (!employeeLeaves) return null;

      const leave = employeeLeaves.find((l) =>
        isDateInRange(dateStr, l.start_date, l.end_date)
      );

      if (leave) {
        const leaveType = leaveTypeMap.get(leave.leave_type_id);
        const leaveTypeName = leaveType?.leave_type_name || "Leave";
        const leaveColor = leaveType?.color_hex || "#8b5cf6"; // Default purple

        return {
          type: "leave" as const,
          label: leaveTypeName,
          color: leaveColor, // Use color_hex from leave type
          data: {
            ...leave,
            leave_type_name: leaveTypeName, // Add leave type name to data
            leave_type: leaveType, // Add full leave type object for reference
          },
        };
      }

      return null;
    },
    [holidayMap, leaveByEmployeeMap, leaveTypeMap]
  );

  return {
    isEmployeeOnLeaveOrHoliday,
    getLeaveOrHolidayInfo,
  };
};
