import { apiSlice } from "./apiSlice";
import { LEAVE_URL } from "../features/constants";

// --- Types ---
export interface Pagination {
  has_next: boolean;
  has_prev: boolean;
  limit: number;
  page: number;
  total: number;
  total_pages: number;
}

export enum LeaveTypeStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum LeaveRecordStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum ProrationBasis {
  MONTHLY = "MONTHLY",
  DAILY = "DAILY",
  YEARLY = "YEARLY",
}

export interface LeaveType {
  id: number;
  leave_type_code: string;
  leave_type_name: string;
  description?: string | null;
  is_paid: boolean;
  requires_approval: boolean;
  requires_document: boolean;
  deducts_from_balance: boolean;
  max_days_per_year?: number | null;
  max_consecutive_days?: number | null;
  min_notice_days: number;
  exclude_holidays: boolean;
  exclude_weekends: boolean;
  allow_carry_over: boolean;
  max_carry_over_days?: number | null;
  carry_over_expiry_months: number;
  is_prorated: boolean;
  proration_basis: ProrationBasis | string;
  is_accrued: boolean;
  accrual_rate?: number | null;
  accrual_start_month: number;
  color_hex: string;
  icon?: string | null;
  sort_order: number;
  status: LeaveTypeStatus | string;
  created_at: string;
  updated_at: string;
}

export interface GetLeaveTypesResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    leave_types: LeaveType[];
    pagination: Pagination;
  };
  timestamp: string;
  path: string;
}

export interface GetLeaveTypeByIdResponse {
  status: string;
  statusCode: number;
  message: string;
  data: LeaveType;
  timestamp: string;
  path: string;
}

export interface CreateLeaveTypeRequest {
  leave_type_code: string;
  leave_type_name: string;
  description?: string;
  is_paid: boolean;
  requires_approval: boolean;
  requires_document: boolean;
  deducts_from_balance: boolean;
  max_days_per_year?: number;
  max_consecutive_days?: number;
  min_notice_days: number;
  exclude_holidays: boolean;
  exclude_weekends: boolean;
  allow_carry_over: boolean;
  max_carry_over_days?: number;
  carry_over_expiry_months: number;
  is_prorated: boolean;
  proration_basis: ProrationBasis;
  is_accrued: boolean;
  accrual_rate?: number;
  accrual_start_month: number;
  color_hex: string;
  icon?: string;
  sort_order: number;
}

export interface UpdateLeaveTypeRequest {
  leave_type_name?: string;
  description?: string;
  is_paid?: boolean;
  requires_approval?: boolean;
  requires_document?: boolean;
  deducts_from_balance?: boolean;
  max_days_per_year?: number;
  max_consecutive_days?: number;
  min_notice_days?: number;
  exclude_holidays?: boolean;
  exclude_weekends?: boolean;
  allow_carry_over?: boolean;
  max_carry_over_days?: number;
  carry_over_expiry_months?: number;
  proration_basis?: ProrationBasis;
  is_prorated?: boolean;
  is_accrued?: boolean;
  accrual_rate?: number;
  accrual_start_month?: number;
  color_hex?: string;
  icon?: string;
  sort_order?: number;
  status?: LeaveTypeStatus;
}

export interface CreateLeaveTypeResponse {
  status: string;
  statusCode: number;
  message: string;
  data: LeaveType;
  timestamp: string;
  path: string;
}

export interface UpdateLeaveTypeResponse {
  status: string;
  statusCode: number;
  message: string;
  data: LeaveType;
  timestamp: string;
  path: string;
}

export interface DeleteLeaveTypeResponse {
  status: string;
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
}

type GetLeaveTypesArgs = {
  token: string;
  page?: number;
  limit?: number;
  status?: LeaveTypeStatus | string;
  is_paid?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
};

// --- Leave Request Types ---
export interface LeaveRecord {
  id: number;
  employee_id: number;
  employee_code: string;
  department_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_calendar_days: number;
  total_working_days: number;
  total_leave_days: number;
  is_half_day_start: boolean;
  is_half_day_end: boolean;
  reason: string;
  supporting_document_url?: string;
  status: LeaveRecordStatus | string;
  requested_at: string;
  approval_level: number;
  current_approver_id?: number;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveRequestDto {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  is_half_day_start: boolean;
  is_half_day_end: boolean;
  reason: string;
  supporting_document_url?: string;
  metadata?: any;
}

export interface UpdateLeaveRecordDto {
  start_date?: string;
  end_date?: string;
  is_half_day_start?: boolean;
  is_half_day_end?: boolean;
  reason?: string;
  supporting_document_url?: string;
  metadata?: any;
}

export interface ApproveLeaveDto {
  approved_by: number;
  notes?: string;
}

export interface RejectLeaveDto {
  rejected_by: number;
  rejection_reason: string;
}

export interface CancelLeaveDto {
  cancellation_reason: string;
  cancelled_by?: number;
}

export interface LeaveRecordStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  cancelled_requests: number;
  total_days_taken: number;
}

export interface GetLeaveRecordsResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    leave_records: LeaveRecord[];
    pagination: Pagination;
  };
  timestamp: string;
  path: string;
}

export interface GetLeaveRecordByIdResponse {
  status: string;
  statusCode: number;
  message: string;
  data: LeaveRecord;
  timestamp: string;
  path: string;
}

export interface CreateLeaveRecordResponse {
  status: string;
  statusCode: number;
  message: string;
  data: LeaveRecord;
  timestamp: string;
  path: string;
}

export interface UpdateLeaveRecordResponse {
  status: string;
  statusCode: number;
  message: string;
  data: LeaveRecord;
  timestamp: string;
  path: string;
}

export interface LeaveActionResponse {
  status: string;
  statusCode: number;
  message: string;
  data: LeaveRecord;
  timestamp: string;
  path: string;
}

type GetLeaveRecordsArgs = {
  token: string;
  page?: number;
  limit?: number;
  employee_id?: number;
  status?: LeaveRecordStatus | string;
  leave_type_id?: number;
  start_date?: string;
  end_date?: string;
  department_id?: number;
};

// --- API Slice ---
export const leaveApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/leave/leave-types
    getLeaveTypes: builder.query<GetLeaveTypesResponse, GetLeaveTypesArgs>({
      query: ({ token, page = 1, limit = 10, status, is_paid, search, sort_by, sort_order }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (status) params.append("status", status);
        if (is_paid !== undefined) params.append("is_paid", String(is_paid));
        if (search) params.append("search", search);
        if (sort_by) params.append("sort_by", sort_by);
        if (sort_order) params.append("sort_order", sort_order);

        return {
          url: `${LEAVE_URL}/leave-types?${params.toString()}`,
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        };
      },
      providesTags: (result) =>
        result?.data?.leave_types
          ? [
              ...result.data.leave_types.map(({ id }) => ({
                type: "LeaveType" as const,
                id,
              })),
              { type: "LeaveType", id: "LIST" },
            ]
          : [{ type: "LeaveType", id: "LIST" }],
    }),

    // GET /api/v1/leave/leave-types/{id}
    getLeaveTypeById: builder.query<
      GetLeaveTypeByIdResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${LEAVE_URL}/leave-types/${id}`,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
      providesTags: (result, error, { id }) => [{ type: "LeaveType", id }],
    }),

    // GET /api/v1/leave/leave-types/active
    getActiveLeaveTypes: builder.query<
      GetLeaveTypesResponse,
      { token: string }
    >({
      query: ({ token }) => ({
        url: `${LEAVE_URL}/leave-types/active`,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
      providesTags: [{ type: "LeaveType", id: "ACTIVE" }],
    }),

    // POST /api/v1/leave/leave-types
    createLeaveType: builder.mutation<
      CreateLeaveTypeResponse,
      { token: string; body: CreateLeaveTypeRequest }
    >({
      query: ({ token, body }) => ({
        url: `${LEAVE_URL}/leave-types`,
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: [{ type: "LeaveType", id: "LIST" }, { type: "LeaveType", id: "ACTIVE" }],
    }),

    // PUT /api/v1/leave/leave-types/{id}
    updateLeaveType: builder.mutation<
      UpdateLeaveTypeResponse,
      { token: string; id: number; body: UpdateLeaveTypeRequest }
    >({
      query: ({ token, id, body }) => ({
        url: `${LEAVE_URL}/leave-types/${id}`,
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "LeaveType", id },
        { type: "LeaveType", id: "LIST" },
        { type: "LeaveType", id: "ACTIVE" },
      ],
    }),

    // DELETE /api/v1/leave/leave-types/{id}
    deleteLeaveType: builder.mutation<
      DeleteLeaveTypeResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${LEAVE_URL}/leave-types/${id}`,
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "LeaveType", id },
        { type: "LeaveType", id: "LIST" },
        { type: "LeaveType", id: "ACTIVE" },
      ],
    }),

    // ===== LEAVE REQUEST ENDPOINTS =====

    // GET /api/v1/leave/leave-records/me - Get my leave records (current employee)
    getMyLeaveRecords: builder.query<
      GetLeaveRecordsResponse,
      { token: string; page?: number; limit?: number }
    >({
      query: ({ token, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));

        return {
          url: `${LEAVE_URL}/leave-records/me?${params.toString()}`,
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        };
      },
      providesTags: [{ type: "LeaveType", id: "MY_RECORDS" }],
    }),

    // GET /api/v1/leave/leave-records - Get all leave records with filters
    getLeaveRecords: builder.query<GetLeaveRecordsResponse, GetLeaveRecordsArgs>({
      query: ({ token, page = 1, limit = 10, employee_id, status, leave_type_id, start_date, end_date, department_id }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (employee_id) params.append("employee_id", String(employee_id));
        if (status) params.append("status", status);
        if (leave_type_id) params.append("leave_type_id", String(leave_type_id));
        if (start_date) params.append("start_date", start_date);
        if (end_date) params.append("end_date", end_date);
        if (department_id) params.append("department_id", String(department_id));

        return {
          url: `${LEAVE_URL}/leave-records?${params.toString()}`,
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        };
      },
      providesTags: (result) =>
        result?.data?.leave_records
          ? [
              ...result.data.leave_records.map(({ id }) => ({
                type: "LeaveType" as const,
                id: `RECORD_${id}`,
              })),
              { type: "LeaveType", id: "RECORDS_LIST" },
            ]
          : [{ type: "LeaveType", id: "RECORDS_LIST" }],
    }),

    // POST /api/v1/leave/leave-records - Create a new leave request
    createLeaveRequest: builder.mutation<
      CreateLeaveRecordResponse,
      { token: string; body: CreateLeaveRequestDto }
    >({
      query: ({ token, body }) => ({
        url: `${LEAVE_URL}/leave-records`,
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: [
        { type: "LeaveType", id: "RECORDS_LIST" },
        { type: "LeaveType", id: "MY_RECORDS" },
      ],
    }),

    // GET /api/v1/leave/leave-records/{id} - Get leave record by ID
    getLeaveRecordById: builder.query<
      GetLeaveRecordByIdResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${LEAVE_URL}/leave-records/${id}`,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
      providesTags: (result, error, { id }) => [
        { type: "LeaveType", id: `RECORD_${id}` },
      ],
    }),

    // PUT /api/v1/leave/leave-records/{id} - Update a pending leave request
    updateLeaveRecord: builder.mutation<
      UpdateLeaveRecordResponse,
      { token: string; id: number; body: UpdateLeaveRecordDto }
    >({
      query: ({ token, id, body }) => ({
        url: `${LEAVE_URL}/leave-records/${id}`,
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "LeaveType", id: `RECORD_${id}` },
        { type: "LeaveType", id: "RECORDS_LIST" },
        { type: "LeaveType", id: "MY_RECORDS" },
      ],
    }),

    // POST /api/v1/leave/leave-records/{id}/approve - Approve a leave request
    approveLeaveRequest: builder.mutation<
      LeaveActionResponse,
      { token: string; id: number; body: ApproveLeaveDto }
    >({
      query: ({ token, id, body }) => ({
        url: `${LEAVE_URL}/leave-records/${id}/approve`,
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "LeaveType", id: `RECORD_${id}` },
        { type: "LeaveType", id: "RECORDS_LIST" },
        { type: "LeaveType", id: "MY_RECORDS" },
      ],
    }),

    // POST /api/v1/leave/leave-records/{id}/reject - Reject a leave request
    rejectLeaveRequest: builder.mutation<
      LeaveActionResponse,
      { token: string; id: number; body: RejectLeaveDto }
    >({
      query: ({ token, id, body }) => ({
        url: `${LEAVE_URL}/leave-records/${id}/reject`,
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "LeaveType", id: `RECORD_${id}` },
        { type: "LeaveType", id: "RECORDS_LIST" },
        { type: "LeaveType", id: "MY_RECORDS" },
      ],
    }),

    // POST /api/v1/leave/leave-records/{id}/cancel - Cancel a leave request
    cancelLeaveRequest: builder.mutation<
      LeaveActionResponse,
      { token: string; id: number; body: CancelLeaveDto }
    >({
      query: ({ token, id, body }) => ({
        url: `${LEAVE_URL}/leave-records/${id}/cancel`,
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "LeaveType", id: `RECORD_${id}` },
        { type: "LeaveType", id: "RECORDS_LIST" },
        { type: "LeaveType", id: "MY_RECORDS" },
      ],
    }),
  }),
});

export const {
  useGetLeaveTypesQuery,
  useGetLeaveTypeByIdQuery,
  useGetActiveLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  // Leave Request Hooks
  useGetMyLeaveRecordsQuery,
  useGetLeaveRecordsQuery,
  useCreateLeaveRequestMutation,
  useGetLeaveRecordByIdQuery,
  useUpdateLeaveRecordMutation,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
  useCancelLeaveRequestMutation,
} = leaveApiSlice;
