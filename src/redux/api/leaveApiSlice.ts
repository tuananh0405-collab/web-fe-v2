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
  }),
});

export const {
  useGetLeaveTypesQuery,
  useGetLeaveTypeByIdQuery,
  useGetActiveLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
} = leaveApiSlice;
