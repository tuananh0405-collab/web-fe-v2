// src/redux/api/attendanceApiSlice.ts
import { apiSlice } from "./apiSlice";
import { ATTENDANCE_URL } from "../features/constants";

/* ========= Types ========= */

export enum OvertimeStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface OvertimeRequest {
  id: number;
  employee_id: number;
  shift_id?: number;
  overtime_date: string;
  start_time: string;
  end_time: string;
  estimated_hours: number;
  actual_hours?: number;
  reason: string;
  status: OvertimeStatus | string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOvertimeRequestDto {
  shift_id?: number;
  overtime_date: string;
  start_time: string;
  end_time: string;
  estimated_hours: number;
  reason: string;
}

export interface UpdateOvertimeRequestDto {
  start_time?: string;
  end_time?: string;
  estimated_hours?: number;
  reason?: string;
}

export interface RejectOvertimeDto {
  rejection_reason?: string;
}

export interface GetOvertimeRequestsResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    data: OvertimeRequest[];
    total: number;
  };
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface GetOvertimeRequestByIdResponse {
  status: string;
  statusCode: number;
  message: string;
  data: OvertimeRequest;
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface OvertimeActionResponse {
  status: string;
  statusCode: number;
  message: string;
  data: OvertimeRequest;
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface WorkSchedule {
  id: number;
  schedule_name: string;
  schedule_type: string; // "FIXED" | ...
  work_days: string; // "1,2,3,4,5"
  start_time: string; // "08:00:00"
  end_time: string; // "17:00:00"
  break_duration_minutes: number;
  late_tolerance_minutes: number;
  early_leave_tolerance_minutes: number;
  status: string; // "ACTIVE" | "INACTIVE"
}

export interface GetWorkSchedulesResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    data: WorkSchedule[];
    total: number;
  };
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface GetWorkSchedulesArgs {
  token: string;
  status?: string;
  schedule_type?: string;
  limit?: number;
  offset?: number;
}

/* --- GET by id --- */

export interface GetWorkScheduleByIdResponse {
  status: string;
  statusCode: number;
  message: string;
  data: WorkSchedule;
  errorCode: string;
  timestamp: string;
  path: string;
}

/* --- UPDATE (PUT) body --- */

export interface UpdateWorkScheduleRequest {
  schedule_name: string;
  schedule_type: string;
  work_days: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  late_tolerance_minutes: number;
  early_leave_tolerance_minutes: number;
  status: string;
}

/* ---------- NEW: CREATE (POST) body & response ---------- */

export interface CreateWorkScheduleRequest {
  schedule_name: string;
  schedule_type: string;
  work_days: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  late_tolerance_minutes: number;
  early_leave_tolerance_minutes: number;
  // status không có trong sample body, backend sẽ default "ACTIVE"
}

export interface CreateWorkScheduleResponse {
  status: string;
  statusCode: number; // 201
  message: string;
  data: WorkSchedule;
  errorCode: string;
  timestamp: string;
  path: string;
}

/* --- DELETE (deactivate) response --- */

export interface DeactivateWorkScheduleResponse {
  status: string;
  statusCode: number;
  message: string;
  errorCode: string;
  timestamp: string;
  path: string;
}
export interface AssignWorkScheduleRequest {
  employee_ids: number[];     // [101, 102, ...]
  effective_from: string;     // "2024-01-01"
  effective_to: string;       // "2024-12-31"
}

export interface AssignWorkScheduleResponse {
  status: string;             // "SUCCESS"
  statusCode: number;         // 200
  message: string;            // "Work schedule assigned to employees successfully..."
  errorCode: string;          // "SUCCESS"
  timestamp: string;
  path: string;
}

/* --- Calendar API (Employee Shifts with Schedule Assignments) --- */

export interface ScheduleOverride {
  id: string;
  type: "SCHEDULE_CHANGE" | "OVERTIME";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  to_date?: string;
  from_date: string;
  created_at: string;
  created_by: number;
  shift_created: boolean;
  override_work_schedule_id?: number; // For SCHEDULE_CHANGE type
  overtime_end_time?: string; // For OVERTIME type
  overtime_start_time?: string; // For OVERTIME type
}

export interface EmployeeCalendarAssignment {
  assignment_id: number;
  work_schedule_id: number;
  effective_from: string;
  effective_to: string;
  work_schedule: {
    id: number;
    schedule_name: string;
    schedule_type: string;
    start_time: string;
    end_time: string;
    break_duration_minutes: number;
    late_tolerance_minutes: number;
    early_leave_tolerance_minutes: number;
    status: string; // "ACTIVE" | "INACTIVE"
  };
  schedule_overrides: ScheduleOverride[];
  // Note: shifts are at employee level, not assignment level
}

export interface EmployeeCalendarData {
  employee_id: number;
  employee_code: string;
  full_name: string;
  email: string;
  department_name: string;
  department_id: number;
  assignments: EmployeeCalendarAssignment[];
  shifts: EmployeeShift[]; // Shifts are at employee level
}

export interface GetEmployeeShiftsCalendarResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    data: EmployeeCalendarData[];
    total: number;
  };
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface GetEmployeeShiftsCalendarArgs {
  token: string;
  department_id?: number;
  limit?: number;
  offset?: number;
}

// Employee Shifts by Department (for actual shifts data)
export interface EmployeeShift {
  shift_id: number; // API returns shift_id, not id
  employee_id?: number;
  employee_code?: string;
  work_schedule_id: number;
  shift_date: string;
  start_time: string; // API returns start_time, not scheduled_start_time
  end_time: string; // API returns end_time, not scheduled_end_time
  check_in_time?: string;
  check_out_time?: string;
  work_hours?: number;
  overtime_hours?: number;
  late_minutes?: number;
  early_leave_minutes?: number;
  status: string; // "SCHEDULED" | "COMPLETED" | "ABSENT" | "IN_PROGRESS"
  schedule_name?: string;
  notes?: string;
  is_override?: boolean; // API includes this field
}

export interface GetEmployeeShiftsByDepartmentResponse {
  status: string;
  statusCode: number;
  message: string;
  data: EmployeeShift[];
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface GetEmployeeShiftsByDepartmentArgs {
  token: string;
  department_id: number;
  from_date: string;
  to_date: string;
}

/* ========= API slice ========= */

export const attendanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ===== WORK SCHEDULES =====
    // GET list
    getWorkSchedules: builder.query<GetWorkSchedulesResponse, GetWorkSchedulesArgs>({
      query: ({ token, status, schedule_type, limit, offset }) => {
        const params: Record<string, any> = {};
        if (status) params.status = status;
        if (schedule_type) params.schedule_type = schedule_type;
        if (typeof limit !== "undefined") params.limit = limit;
        if (typeof offset !== "undefined") params.offset = offset;

        return {
          url: `${ATTENDANCE_URL}/work-schedules`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        };
      },
      providesTags: ["WorkSchedules"],
    }),

    // GET /work-schedules/{id}
    getWorkScheduleById: builder.query<
      GetWorkScheduleByIdResponse,
      { token: string; id: number | string }
    >({
      query: ({ token, id }) => ({
        url: `${ATTENDANCE_URL}/work-schedules/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: (result, error, arg) => [
        { type: "WorkSchedules", id: arg.id },
      ],
    }),

    // ---------- NEW: POST /work-schedules ----------
    createWorkSchedule: builder.mutation<
      CreateWorkScheduleResponse,
      { token: string; body: CreateWorkScheduleRequest }
    >({
      query: ({ token, body }) => ({
        url: `${ATTENDANCE_URL}/work-schedules`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["WorkSchedules"],
    }),
    // ----------------------------------------------

    // PUT /work-schedules/{id}
    updateWorkSchedule: builder.mutation<
      GetWorkScheduleByIdResponse,
      { token: string; id: number | string; body: UpdateWorkScheduleRequest }
    >({
      query: ({ token, id, body }) => ({
        url: `${ATTENDANCE_URL}/work-schedules/${id}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "WorkSchedules",
        { type: "WorkSchedules", id },
      ],
    }),

    // DELETE /work-schedules/{id} (deactivate)
    deactivateWorkSchedule: builder.mutation<
      DeactivateWorkScheduleResponse,
      { token: string; id: number | string }
    >({
      query: ({ token, id }) => ({
        url: `${ATTENDANCE_URL}/work-schedules/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        "WorkSchedules",
        { type: "WorkSchedules", id },
      ],
    }),

     assignWorkSchedule: builder.mutation<
      AssignWorkScheduleResponse,
      { token: string; id: number | string; body: AssignWorkScheduleRequest }
    >({
      query: ({ token, id, body }) => ({
        url: `${ATTENDANCE_URL}/work-schedules/${id}/assign`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      }),
    }),

    // ===== EMPLOYEE SHIFTS CALENDAR =====
    getEmployeeShiftsCalendar: builder.query<
      GetEmployeeShiftsCalendarResponse,
      GetEmployeeShiftsCalendarArgs
    >({
      query: ({ token, department_id, limit, offset }) => {
        const params: Record<string, any> = {};
        if (department_id) params.department_id = department_id;
        if (typeof limit !== "undefined") params.limit = limit;
        if (typeof offset !== "undefined") params.offset = offset;

        return {
          url: `${ATTENDANCE_URL}/employee-shifts/calendar`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        };
      },
      providesTags: ["WorkSchedules"],
    }),

    // ===== OVERTIME REQUESTS =====
    // POST /api/v1/attendance/overtime-requests - Create overtime request (Employee)
    createOvertimeRequest: builder.mutation<
      OvertimeActionResponse,
      { token: string; body: CreateOvertimeRequestDto }
    >({
      query: ({ token, body }) => ({
        url: `${ATTENDANCE_URL}/overtime-requests`,
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: [{ type: "Attendance", id: "OVERTIME_LIST" }],
    }),

    // GET /api/v1/attendance/overtime-requests - Get all overtime requests (HR/Manager)
    getOvertimeRequests: builder.query<
      GetOvertimeRequestsResponse,
      {
        token: string;
        status?: OvertimeStatus | string;
        limit?: number;
        offset?: number;
      }
    >({
      query: ({ token, status, limit = 50, offset = 0 }) => {
        const params: Record<string, any> = {
          limit,
          offset,
        };
        if (status) params.status = status;

        return {
          url: `${ATTENDANCE_URL}/overtime-requests`,
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          params,
        };
      },
      providesTags: (result) =>
        result?.data?.data
          ? [
              ...result.data.data.map(({ id }) => ({
                type: "Attendance" as const,
                id: `OVERTIME_${id}`,
              })),
              { type: "Attendance", id: "OVERTIME_LIST" },
            ]
          : [{ type: "Attendance", id: "OVERTIME_LIST" }],
    }),

    // GET /api/v1/attendance/overtime-requests/my-requests - Get my overtime requests (Employee)
    getMyOvertimeRequests: builder.query<
      GetOvertimeRequestsResponse,
      {
        token: string;
        status?: OvertimeStatus | string;
        limit?: number;
        offset?: number;
      }
    >({
      query: ({ token, status, limit = 50, offset = 0 }) => {
        const params: Record<string, any> = {
          limit,
          offset,
        };
        if (status) params.status = status;

        return {
          url: `${ATTENDANCE_URL}/overtime-requests/my-requests`,
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          params,
        };
      },
      providesTags: [{ type: "Attendance", id: "MY_OVERTIME" }],
    }),

    // GET /api/v1/attendance/overtime-requests/pending - Get pending overtime requests (HR/Manager)
    getPendingOvertimeRequests: builder.query<
      GetOvertimeRequestsResponse,
      { token: string; limit?: number; offset?: number }
    >({
      query: ({ token, limit = 50, offset = 0 }) => ({
        url: `${ATTENDANCE_URL}/overtime-requests/pending`,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        params: { limit, offset },
      }),
      providesTags: [{ type: "Attendance", id: "PENDING_OVERTIME" }],
    }),

    // GET /api/v1/attendance/overtime-requests/{id} - Get overtime request details
    getOvertimeRequestById: builder.query<
      GetOvertimeRequestByIdResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${ATTENDANCE_URL}/overtime-requests/${id}`,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "Attendance", id: `OVERTIME_${id}` },
      ],
    }),

    // PUT /api/v1/attendance/overtime-requests/{id} - Update overtime request (Employee - before approval)
    updateOvertimeRequest: builder.mutation<
      OvertimeActionResponse,
      { token: string; id: number; body: UpdateOvertimeRequestDto }
    >({
      query: ({ token, id, body }) => ({
        url: `${ATTENDANCE_URL}/overtime-requests/${id}`,
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Attendance", id: `OVERTIME_${id}` },
        { type: "Attendance", id: "OVERTIME_LIST" },
        { type: "Attendance", id: "MY_OVERTIME" },
      ],
    }),

    // POST /api/v1/attendance/overtime-requests/{id}/approve - Approve overtime request (HR/Manager)
    approveOvertimeRequest: builder.mutation<
      OvertimeActionResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${ATTENDANCE_URL}/overtime-requests/${id}/approve`,
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Attendance", id: `OVERTIME_${id}` },
        { type: "Attendance", id: "OVERTIME_LIST" },
        { type: "Attendance", id: "PENDING_OVERTIME" },
      ],
    }),

    // POST /api/v1/attendance/overtime-requests/{id}/reject - Reject overtime request (HR/Manager)
    rejectOvertimeRequest: builder.mutation<
      OvertimeActionResponse,
      { token: string; id: number; body: RejectOvertimeDto }
    >({
      query: ({ token, id, body }) => ({
        url: `${ATTENDANCE_URL}/overtime-requests/${id}/reject`,
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Attendance", id: `OVERTIME_${id}` },
        { type: "Attendance", id: "OVERTIME_LIST" },
        { type: "Attendance", id: "PENDING_OVERTIME" },
      ],
    }),

    // POST /api/v1/attendance/overtime-requests/{id}/cancel - Cancel your own overtime request (Employee)
    cancelOvertimeRequest: builder.mutation<
      OvertimeActionResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${ATTENDANCE_URL}/overtime-requests/${id}/cancel`,
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Attendance", id: `OVERTIME_${id}` },
        { type: "Attendance", id: "OVERTIME_LIST" },
        { type: "Attendance", id: "MY_OVERTIME" },
      ],
    }),

    // ===== EMPLOYEE SHIFTS BY DEPARTMENT =====
    // GET /api/v1/attendance/employee-shifts/department/{department_id}
    getEmployeeShiftsByDepartment: builder.query<
      GetEmployeeShiftsByDepartmentResponse,
      GetEmployeeShiftsByDepartmentArgs
    >({
      query: ({ token, department_id, from_date, to_date }) => ({
        url: `${ATTENDANCE_URL}/employee-shifts/department/${department_id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          from_date,
          to_date,
        },
      }),
      providesTags: ["WorkSchedules"],
    }),

  
    
  }),
});

// Hook dùng trong component
export const {
  useGetWorkSchedulesQuery,
  useGetEmployeeShiftsCalendarQuery,
  useGetEmployeeShiftsByDepartmentQuery,
  // Overtime Request Hooks
  useCreateOvertimeRequestMutation,
  useGetOvertimeRequestsQuery,
  useGetMyOvertimeRequestsQuery,
  useGetPendingOvertimeRequestsQuery,
  useGetOvertimeRequestByIdQuery,
  useUpdateOvertimeRequestMutation,
  useApproveOvertimeRequestMutation,
  useRejectOvertimeRequestMutation,
  useCancelOvertimeRequestMutation,
   useGetWorkScheduleByIdQuery,
  useCreateWorkScheduleMutation,  // 👈 NEW
  useUpdateWorkScheduleMutation,
  useDeactivateWorkScheduleMutation,
  useAssignWorkScheduleMutation
} = attendanceApiSlice;
/* ========= Hooks ========= */

