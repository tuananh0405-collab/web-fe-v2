// src/redux/api/attendanceApiSlice.ts
import { apiSlice } from "./apiSlice";
import { ATTENDANCE_URL } from "../features/constants";

// ===== Types =====
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
  }),
});

// Hook dùng trong component
export const { useGetWorkSchedulesQuery } = attendanceApiSlice;
