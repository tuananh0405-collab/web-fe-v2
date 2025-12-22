// src/redux/api/reportingApiSlice.ts
import { apiSlice } from "./apiSlice";
import { REPORTING_URL } from "../features/constants";

/* ========== TYPES ========== */

export type AttendancePeriod =
  | "DAY"
  | "WEEK"
  | "MONTH"
  | "QUARTER"
  | "YEAR"
  | "CUSTOM";

export interface AttendanceEmployeeReportItem {
  employee_id: string;        // backend trả string
  employee_code: string;
  full_name: string;
  department_id: string;
  department_name: string | null;
  position_name: string | null;

  working_days: number | string;
  total_working_hours: number | string;
  total_overtime_hours: number | string;
  total_late_count: number | string;
  total_early_leave_count: number | string;
  total_leave_days: number | string;
  total_absent_days: number | string;
  manday: number | string;
  attendance_rate: number | string;
}

export interface AttendanceEmployeesReportData {
  data: AttendanceEmployeeReportItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  period: AttendancePeriod | string;
  start_date: string;
  end_date: string;
}

export interface GetAttendanceEmployeesReportResponse {
  status: string;
  statusCode: number;
  message: string;
  data: AttendanceEmployeesReportData;
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface GetAttendanceEmployeesReportArgs {
  token: string;
  period?: AttendancePeriod | string; // DAY | WEEK | MONTH | QUARTER | YEAR | CUSTOM
  start_date?: string;                // "YYYY-MM-DD"
  end_date?: string;                  // "YYYY-MM-DD"
  search?: string;                    // name or code
  department_id?: number;             // filter by department (for managers)
  page?: number;
  limit?: number;
}
// Kiểu cho phần employee info
export interface EmployeeAttendanceInfo {
  employee_id: string;
  employee_code: string;
  full_name: string;
  email: string;
  department_id: string;
  department_name: string | null;
  position_name: string;
  join_date: string | null;
}

// Kiểu cho period
export interface EmployeeAttendancePeriodInfo {
  type: AttendancePeriod; // "DAY" | "WEEK" | ...
  start_date: string;
  end_date: string;
  total_days: number;
}

// Summary tổng
export interface EmployeeAttendanceSummary {
  total_working_days: number;
  total_working_hours: number;
  total_overtime_hours: number;
  total_late_count: number;
  total_early_leave_count: number;
  total_leave_days: number;
  total_absent_days: number;
  total_holidays: number;
  total_manday: number;
  attendance_rate: number;
}

// Daily record
export interface EmployeeAttendanceDailyRecord {
  date: string;
  day_of_week: string;
  shift_name?: string | null;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  check_in_status: string;   // "ON_TIME" | "LATE" | "EARLY" | "ABSENT" | ...
  check_out_status: string;
  working_hours: number;
  is_holiday: boolean;
  manday: number;
  remarks?: string | null;
}

// Response của endpoint /employee/{employeeId}
export interface GetEmployeeAttendanceReportResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    employee: EmployeeAttendanceInfo;
    period: EmployeeAttendancePeriodInfo;
    summary: EmployeeAttendanceSummary;
    daily_records: EmployeeAttendanceDailyRecord[];
  };
  errorCode: string;
  timestamp: string;
  path: string;
}

// Args khi gọi hook
export interface GetEmployeeAttendanceReportArgs {
  token: string;
  employeeId: number | string;
  period?: AttendancePeriod;     // optional – backend có thể dùng
  start_date?: string;     // "YYYY-MM-DD"
  end_date?: string;       // "YYYY-MM-DD"
}

/* ========== SLICE ========== */

export const reportingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/reporting/reports/attendance/employees
    getAttendanceEmployeesReport: builder.query<
      GetAttendanceEmployeesReportResponse,
      GetAttendanceEmployeesReportArgs
    >({
      query: ({
        token,
        period,
        start_date,
        end_date,
        search,
        department_id,
        page = 1,
        limit = 20,
      }) => {
        const params: Record<string, any> = {
          page,
          limit,
        };

        // if (period) params.period = period;
        if (start_date) params.start_date = start_date;
        if (end_date) params.end_date = end_date;
        if (search) params.search = search;
        if (department_id) params.department_id = department_id;

        return {
          url: `${REPORTING_URL}/reports/attendance/employees`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        };
      },
      // nếu sau này có mutation invalidates report thì dùng tag này
      providesTags: ["AttendanceReports"],
    }),

    getAttendanceEmployeeReport: builder.query<
  GetEmployeeAttendanceReportResponse,
  GetEmployeeAttendanceReportArgs
>({
  query: ({ token, employeeId, period, start_date, end_date }) => {
    const params: Record<string, any> = {};
    if (period) params.period = period;
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;

    return {
      url: `${REPORTING_URL}/reports/attendance/employee/${employeeId}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    };
  },
}),

  }),
});

// Hook dùng trong component
export const {
  useGetAttendanceEmployeesReportQuery,
  useGetAttendanceEmployeeReportQuery
} = reportingApiSlice;
