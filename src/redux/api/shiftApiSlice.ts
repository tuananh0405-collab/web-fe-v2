// src/redux/api/shiftApiSlice.ts
import { apiSlice } from "./apiSlice";
import { ATTENDANCE_URL } from "../features/constants";

/* =======================
 * Types dùng chung
 * ======================= */

export interface EmployeeShift {
  id: number;
  employee_id: number;
  employee_code: string;
  department_id: number;
  shift_date: string; // "2025-11-27"
  work_schedule_id: number;
  scheduled_start_time: string; // "22:00:00"
  scheduled_end_time: string;   // "06:00:00"
  check_in_time: string | null; // ISO datetime
  check_out_time: string | null;
  work_hours: number;
  overtime_hours: number;
  break_hours: number;
  late_minutes: number;
  early_leave_minutes: number;
  status: string; // "SCHEDULED" | "IN_PROGRESS" | ...
  notes: string | null;
}

export interface PaginatedShiftList {
  data: EmployeeShift[];
  total: number;
}

/* ===== Calendar view ===== */

export interface CalendarShift {
  shift_id: number;
  shift_date: string; // "2025-11-27"
  schedule_name: string;
  start_time: string; // "08:00:00"
  end_time: string;   // "17:00:00"
  status: string;     // "IN_PROGRESS" | ...
  shift_type: string; // "REGULAR" | ...
  check_in_time: string | null; // "05:00"
  work_hours: number;
  overtime_hours: number;
  late_minutes: number;
  early_leave_minutes: number;
}

export interface CalendarEmployee {
  employee_id: number;
  employee_code: string;
  full_name: string;
  department_name: string;
  department_id: number;
  shifts: CalendarShift[];
}

export interface GetEmployeeShiftCalendarResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    from_date: string;
    to_date: string;
    total_employees: number;
    employees: CalendarEmployee[];
  };
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface GetEmployeeShiftCalendarArgs {
  token: string;
  from_date: string; // "YYYY-MM-DD"
  to_date: string;   // "YYYY-MM-DD"
  department_id?: number;
  employee_ids?: number[];
}

/* ===== List shifts (HR / Manager) ===== */

export interface GetEmployeeShiftsResponse {
  status: string;
  statusCode: number;
  message: string;
  data: PaginatedShiftList;
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface GetEmployeeShiftsArgs {
  token: string;
  from_date: string;
  to_date: string;
  status?: string;        // "SCHEDULED" | "IN_PROGRESS" | ...
  employee_id?: number;
  department_id?: number;
  limit?: number;
  offset?: number;
}

/* ===== Department shifts (with path departmentId) ===== */

export interface GetDepartmentEmployeeShiftsArgs {
  token: string;
  departmentId: number | string; // path param
  from_date: string;
  to_date: string;
  status?: string;
  employee_id?: number;
  department_id?: number; // query (trùng tên nhưng theo swagger có)
  limit?: number;
  offset?: number;
}

/* ===== Shift detail by ID ===== */

export interface GetEmployeeShiftByIdResponse {
  status: string;
  statusCode: number;
  message: string;
  data: EmployeeShift;
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface GetEmployeeShiftByIdArgs {
  token: string;
  id: number | string;
}

/* ===== Manual edit shift (PATCH) ===== */

export interface ManualEditShiftRequest {
  check_in_time?: string | null;  // ISO datetime
  check_out_time?: string | null; // ISO datetime
  status?: string;
  notes?: string | null;
  edit_reason?: string;
}

export interface ManualEditShiftResponse {
  status: string;
  statusCode: number;
  message: string;
  data: EmployeeShift;
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface ManualEditShiftArgs {
  token: string;
  id: number | string;
  body: ManualEditShiftRequest;
}

/* =======================
 * API Slice
 * ======================= */

export const shiftApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/attendance/employee-shifts/calendar
    getEmployeeShiftCalendar: builder.query<
      GetEmployeeShiftCalendarResponse,
      GetEmployeeShiftCalendarArgs
    >({
      query: ({ token, from_date, to_date, department_id, employee_ids }) => {
        const params: Record<string, any> = { from_date, to_date };
        if (typeof department_id !== "undefined") {
          params.department_id = department_id;
        }
        if (employee_ids && employee_ids.length > 0) {
          params.employee_ids = employee_ids;
        }

        return {
          url: `${ATTENDANCE_URL}/employee-shifts/calendar`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        };
      },
    }),

    // GET /api/v1/attendance/employee-shifts
    getEmployeeShifts: builder.query<
      GetEmployeeShiftsResponse,
      GetEmployeeShiftsArgs
    >({
      query: ({
        token,
        from_date,
        to_date,
        status,
        employee_id,
        department_id,
        limit,
        offset,
      }) => {
        const params: Record<string, any> = {
          from_date,
          to_date,
        };

        if (status) params.status = status;
        if (typeof employee_id !== "undefined") params.employee_id = employee_id;
        if (typeof department_id !== "undefined")
          params.department_id = department_id;
        if (typeof limit !== "undefined") params.limit = limit;
        if (typeof offset !== "undefined") params.offset = offset;

        return {
          url: `${ATTENDANCE_URL}/employee-shifts`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        };
      },
    }),

    // GET /api/v1/attendance/employee-shifts/department/{departmentId}
    getDepartmentEmployeeShifts: builder.query<
      GetEmployeeShiftsResponse,
      GetDepartmentEmployeeShiftsArgs
    >({
      query: ({
        token,
        departmentId,
        from_date,
        to_date,
        status,
        employee_id,
        department_id,
        limit,
        offset,
      }) => {
        const params: Record<string, any> = {
          from_date,
          to_date,
        };

        if (status) params.status = status;
        if (typeof employee_id !== "undefined") params.employee_id = employee_id;
        if (typeof department_id !== "undefined")
          params.department_id = department_id;
        if (typeof limit !== "undefined") params.limit = limit;
        if (typeof offset !== "undefined") params.offset = offset;

        return {
          url: `${ATTENDANCE_URL}/employee-shifts/department/${departmentId}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        };
      },
    }),

    // GET /api/v1/attendance/employee-shifts/{id}
    getEmployeeShiftById: builder.query<
      GetEmployeeShiftByIdResponse,
      GetEmployeeShiftByIdArgs
    >({
      query: ({ token, id }) => ({
        url: `${ATTENDANCE_URL}/employee-shifts/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: (_result, _error, arg) => [
        { type: "Attendance", id: `SHIFT-${arg.id}` },
      ],
    }),

    // PATCH /api/v1/attendance/employee-shifts/{id}/manual-edit
    manualEditEmployeeShift: builder.mutation<
      ManualEditShiftResponse,
      ManualEditShiftArgs
    >({
      query: ({ token, id, body }) => ({
        url: `${ATTENDANCE_URL}/employee-shifts/${id}/manual-edit`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Attendance", id: `SHIFT-${id}` },
        { type: "Attendance", id: "CALENDAR" },
        "WorkSchedules",
      ],
    }),
  }),
});

// Hooks export
export const {
  useGetEmployeeShiftCalendarQuery,
  useGetEmployeeShiftsQuery,
  useGetDepartmentEmployeeShiftsQuery,
  useGetEmployeeShiftByIdQuery,
  useManualEditEmployeeShiftMutation,
} = shiftApiSlice;
