// src/redux/api/attendanceApiSlice.ts
import { apiSlice } from "./apiSlice";
import { ATTENDANCE_URL } from "../features/constants";

// ===== Types =====
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
  schedule_type: string; // "FIXED" | "FLEXIBLE" | ...
  work_days: string; // ví dụ "1,2,3,4,5"
  start_time: string; // "08:00:00"
  end_time: string; // "17:00:00"
  break_duration_minutes: number;
  late_tolerance_minutes: number;
  early_leave_tolerance_minutes: number;
  status: string; // "ACTIVE" | "INACTIVE"
}

export interface GetWorkSchedulesResponse {
  status: string; // "SUCCESS"
  statusCode: number; // 200
  message: string;
  data: {
    data: WorkSchedule[];
    total: number;
  };
  errorCode: string;
  timestamp: string;
  path: string;
}

// Query args (status, schedule_type, limit, offset)
export interface GetWorkSchedulesArgs {
  token: string;
  status?: string; // "ACTIVE" | "INACTIVE"
  schedule_type?: string; // "FIXED" | "FLEXIBLE" ...
  limit?: number;
  offset?: number;
}

// ===== API Slice =====
export const attendanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ===== WORK SCHEDULES =====
    // GET /api/v1/attendance/work-schedules?status=ACTIVE&schedule_type=FIXED...
    getWorkSchedules: builder.query<
      GetWorkSchedulesResponse,
      GetWorkSchedulesArgs
    >({
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
  }),
});

// Hook dùng trong component
export const {
  useGetWorkSchedulesQuery,
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
} = attendanceApiSlice;
