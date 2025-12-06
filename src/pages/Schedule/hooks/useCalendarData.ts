// src/pages/Schedule/hooks/useCalendarData.ts
import { useMemo } from "react";
import {
  useGetEmployeeShiftsCalendarQuery,
  useGetWorkSchedulesQuery,
  useGetOvertimeRequestsQuery,
  OvertimeStatus,
} from "../../../redux/api/attendanceApiSlice";
import { useGetHolidaysQuery } from "../../../redux/api/holidayApiSlice";
import { 
  useGetLeaveTypesQuery, 
  useGetLeaveRecordsQuery,
  LeaveRecordStatus 
} from "../../../redux/api/leaveApiSlice";
import { EmployeeRow as EmployeeRowType } from "../types";

interface UseCalendarDataParams {
  token: string | undefined;
  departmentId: number | undefined;
  limit: number;
  offset: number;
}

interface UseCalendarDataReturn {
  // Processed data
  employees: EmployeeRowType[];
  departmentShifts: any[];
  activeWorkSchedules: any[];
  overtime: any;
  holidays: any;
  leaveTypes: any;
  leaveRecords: any;
  
  // Pagination
  total: number;
  totalPages: number;
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  
  // Refetch function
  refetch: () => void;
}

/**
 * Custom hook to encapsulate all data fetching and processing logic
 * for the employee schedule calendar view.
 * 
 * This hook:
 * - Fetches calendar data (employees, shifts, assignments)
 * - Fetches global data (work schedules, overtime, holidays, leave types)
 * - Processes raw API data into usable formats
 * - Returns loading states and refetch function
 */
export const useCalendarData = ({
  token,
  departmentId,
  limit,
  offset,
}: UseCalendarDataParams): UseCalendarDataReturn => {
  // ===== Fetch employee calendar data =====
  const {
    data: calendarData,
    isLoading: isLoadingCalendar,
    isError: isErrorCalendar,
    refetch: refetchCalendar,
  } = useGetEmployeeShiftsCalendarQuery(
    {
      token: token!,
      department_id: departmentId,
      limit,
      offset,
    },
    { skip: !token }
  );

  // ===== Fetch global data =====
  const { data: overtimeData } = useGetOvertimeRequestsQuery(
    {
      token: token!,
      status: OvertimeStatus.APPROVED,
      limit: 1000,
      offset: 0,
    },
    { skip: !token }
  );

  const { data: holidaysData } = useGetHolidaysQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const { data: leaveTypesData } = useGetLeaveTypesQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const { data: leaveRecordsData } = useGetLeaveRecordsQuery(
    {
      token: token!,
      department_id: departmentId,
      status: LeaveRecordStatus.APPROVED,
      limit: 1000,
    },
    { skip: !token || !departmentId }
  );

  const { data: workSchedulesData } = useGetWorkSchedulesQuery(
    {
      token: token!,
      status: "ACTIVE",
      limit: 100,
      offset: 0,
    },
    { skip: !token }
  );

  // ===== Process calendar data into employees array =====
  const employees: EmployeeRowType[] = useMemo(() => {
    const calendarEmployees = calendarData?.data?.data ?? [];
    // API response has data array directly, not data.leave_records
    const allLeaveRecords = Array.isArray(leaveRecordsData?.data) 
      ? leaveRecordsData.data 
      : (leaveRecordsData?.data?.leave_records ?? []);

    return calendarEmployees.map((emp: any) => ({
      id: emp.employee_id,
      fullName: emp.full_name,
      employeeCode: emp.employee_code,
      departmentName: emp.department_name,
      email: emp.email,
      scheduleAssignments: emp.assignments ?? [],
      shifts: emp.shifts ?? [],
      // Filter leave records for this specific employee
      leaves: allLeaveRecords.filter(
        (leave: any) => leave.employee_id === emp.employee_id
      ),
    }));
  }, [calendarData, leaveRecordsData]);

  // ===== Calculate pagination =====
  const total = calendarData?.data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  // ===== Extract global data =====
  const overtime = overtimeData;
  const holidays = holidaysData;
  const leaveTypes = leaveTypesData;
  const leaveRecords = leaveRecordsData;
  const activeWorkSchedules = workSchedulesData?.data?.data ?? [];

  // ===== Extract all shifts from calendar data =====
  // Shifts are at employee level, not assignment level
  const departmentShifts = useMemo(() => {
    const calendarEmployees = calendarData?.data?.data ?? [];
    const allShifts: any[] = [];

    calendarEmployees.forEach((emp: any) => {
      if (Array.isArray(emp.shifts)) {
        // Add employee_id to each shift for easier lookup
        const shiftsWithEmployeeId = emp.shifts.map((shift: any) => ({
          ...shift,
          employee_id: emp.employee_id,
        }));
        allShifts.push(...shiftsWithEmployeeId);
      }
    });

    return allShifts;
  }, [calendarData]);

  // ===== Loading states =====
  const isLoading = isLoadingCalendar;
  const isError = isErrorCalendar;
  const refetch = refetchCalendar;

  return {
    // Processed data
    employees,
    departmentShifts,
    activeWorkSchedules,
    overtime,
    holidays,
    leaveTypes,
    leaveRecords,
    
    // Pagination
    total,
    totalPages,
    
    // Loading states
    isLoading,
    isError,
    
    // Refetch function
    refetch,
  };
};
