// src/pages/Schedule/hooks/useEmployeeScheduleData.ts
import { useMemo, useEffect, useState, useCallback } from "react";
import { useAppSelector } from "../../../redux/hook";
import { useGetEmployeesQuery } from "../../../redux/api/employeeApiSlice";
import {
  useGetOvertimeRequestsQuery,
  OvertimeStatus,
} from "../../../redux/api/attendanceApiSlice";
import { useGetHolidaysQuery } from "../../../redux/api/holidayApiSlice";
import { useGetLeaveTypesQuery } from "../../../redux/api/leaveApiSlice";

interface EmployeeData {
  id: number;
  fullName: string;
  employeeCode: string;
  departmentName: string;
  avatarUrl?: string;
  scheduleAssignments: any[]; // Array of work schedule assignments with date ranges
  shifts: any[];
  leaves: any[];
}

interface UseEmployeeScheduleDataProps {
  currentPage: number;
  employeesPerPage: number;
  fromDate: string;
  toDate: string;
}

export const useEmployeeScheduleData = ({
  currentPage,
  employeesPerPage,
  fromDate,
  toDate,
}: UseEmployeeScheduleDataProps) => {
  const authState = useAppSelector((state) => state.auth.userState?.data);
  const token = authState?.access_token;
  const user = authState?.user;

  const role = user?.role;
  const managedDeptId =
    role === "DEPARTMENT_MANAGER" && (user as any)?.managed_department_ids?.length > 0
      ? (user as any).managed_department_ids[0]
      : undefined;

  // State to store fetched data for each employee
  const [employeeDataMap, setEmployeeDataMap] = useState<Map<number, Partial<EmployeeData>>>(
    new Map()
  );
  const [fetchingIds, setFetchingIds] = useState<Set<number>>(new Set());

  // Fetch employees list (with pagination)
  const employeesQuery = useGetEmployeesQuery(
    {
      token: token!,
      page: currentPage,
      limit: employeesPerPage,
      department_id:
        role === "DEPARTMENT_MANAGER" && managedDeptId
          ? managedDeptId
          : undefined,
    },
    { skip: !token }
  );

  // Fetch global data (shared across all employees)
  const overtimeQuery = useGetOvertimeRequestsQuery(
    {
      token: token!,
      status: OvertimeStatus.APPROVED,
      limit: 1000,
      offset: 0,
    },
    { skip: !token }
  );

  const holidaysQuery = useGetHolidaysQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const leaveTypesQuery = useGetLeaveTypesQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  // Fetch data for a single employee
  const fetchEmployeeData = useCallback(
    async (employeeId: number) => {
      if (!token || fetchingIds.has(employeeId)) return;

      setFetchingIds((prev) => new Set(prev).add(employeeId));

      try {
        // Parallel fetch all employee-specific data
        const [scheduleRes, shiftsRes, leavesRes] = await Promise.all([
          fetch(
            `/api/v1/attendance/work-schedules/assignments/employee/${employeeId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).then((r) => (r.ok ? r.json() : null)),

          fetch(
            `/api/v1/attendance/employee-shifts/employee/${employeeId}?from_date=${fromDate}&to_date=${toDate}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).then((r) => (r.ok ? r.json() : null)),

          fetch(
            `/api/v1/leave/leave-records?employee_id=${employeeId}&start_date=${fromDate}&end_date=${toDate}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).then((r) => (r.ok ? r.json() : null)),
        ]);

        setEmployeeDataMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(employeeId, {
            scheduleAssignments: scheduleRes?.data ?? [],
            shifts: shiftsRes?.data?.data ?? [],
            leaves: leavesRes?.data?.leave_records ?? [],
          });
          return newMap;
        });
      } catch (error) {
        console.error(`Failed to fetch data for employee ${employeeId}:`, error);
      } finally {
        setFetchingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(employeeId);
          return newSet;
        });
      }
    },
    [token, fromDate, toDate, fetchingIds]
  );

  // Fetch data for all employees on current page
  useEffect(() => {
    const employees = employeesQuery.data?.data?.employees ?? [];
    employees.forEach((emp: any) => {
      // Only fetch if we don't have data for this employee yet
      if (!employeeDataMap.has(emp.id)) {
        fetchEmployeeData(emp.id);
      }
    });
  }, [employeesQuery.data, employeeDataMap, fetchEmployeeData]);

  // Re-fetch when date range changes
  useEffect(() => {
    const employees = employeesQuery.data?.data?.employees ?? [];
    // Clear cache and re-fetch all
    setEmployeeDataMap(new Map());
    employees.forEach((emp: any) => {
      fetchEmployeeData(emp.id);
    });
  }, [fromDate, toDate]); // Don't include fetchEmployeeData to avoid infinite loop

  // Combine employee base info with fetched data
  const employeesWithData: EmployeeData[] = useMemo(() => {
    const employees = employeesQuery.data?.data?.employees ?? [];

    return employees.map((emp: any) => {
      const extraData = employeeDataMap.get(emp.id);

      return {
        id: emp.id,
        fullName: emp.full_name,
        employeeCode: emp.employee_code,
        departmentName: emp.department_name,
        avatarUrl: undefined,
        scheduleAssignments: extraData?.scheduleAssignments ?? [],
        shifts: extraData?.shifts ?? [],
        leaves: extraData?.leaves ?? [],
      };
    });
  }, [employeesQuery.data, employeeDataMap]);

  const isLoading =
    employeesQuery.isLoading ||
    overtimeQuery.isLoading ||
    fetchingIds.size > 0;

  const isError = employeesQuery.isError;

  // Refetch function to clear cache and reload all data
  const refetch = useCallback(() => {
    const employees = employeesQuery.data?.data?.employees ?? [];
    setEmployeeDataMap(new Map());
    employees.forEach((emp: any) => {
      fetchEmployeeData(emp.id);
    });
    employeesQuery.refetch();
    overtimeQuery.refetch();
    holidaysQuery.refetch();
    leaveTypesQuery.refetch();
  }, [employeesQuery, overtimeQuery, holidaysQuery, leaveTypesQuery, fetchEmployeeData]);

  return {
    token,
    user,
    role,
    managedDeptId,
    employees: employeesWithData,
    pagination: {
      total: employeesQuery.data?.data?.pagination?.total ?? 0,
      totalPages: employeesQuery.data?.data?.pagination?.total_pages ?? 1,
      hasNext: employeesQuery.data?.data?.pagination?.has_next ?? false,
      hasPrev: employeesQuery.data?.data?.pagination?.has_prev ?? false,
    },
    overtime: overtimeQuery.data,
    holidays: holidaysQuery.data,
    leaveTypes: leaveTypesQuery.data,
    isLoading,
    isError,
    refetch,
  };
};
