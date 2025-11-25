import { AUTH_URL } from "../features/constants";
import { apiSlice } from "./apiSlice";

// --- Types ---
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
      full_name: string;
      role: string;
    };
  };
}

interface Account {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  department_name: string;
  position_name: string;
  employee_code: string;
}

interface GetAccountsResponse {
  status: string;
  message: string;
  data: {
    accounts: Account[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

interface GetAccountById {
  status: string;
  statusCode: number;
  message: string;
  data: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    department_name: string;
    position_name: string;
    employee_code: string;
    created_at: string;
    updated_at: string;
  };
}

interface UpdateAccountRequest {
  email: string;
  full_name: string;
  role: string;
  status: string;
  department_name: string;
  position_name: string;
  employee_code: string;
}

interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
  suggested_role: "ADMIN" | "HR_MANAGER" | "DEPARTMENT_MANAGER" | "EMPLOYEE";
  department_name?: string;
  department_id?: number;
  employee_id?: number;
  employee_code?: string;
  position_id?: number;
  position_name?: string;
}

interface RegisterResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
}

// --- Endpoints ---
export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    signIn: builder.mutation<LoginResponse, LoginRequest>({
      query: (data) => ({
        url: `${AUTH_URL}/login`,
        method: "POST",
        body: data,
      }),
    }),

    register: builder.mutation<RegisterResponse, { token: string; body: RegisterRequest }>({
      query: ({ token, body }) => ({
        url: `${AUTH_URL}/register`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      }),
      invalidatesTags: ["Accounts"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: `${AUTH_URL}/logout`,
        method: "POST",
      }),
    }),

    // ✅ New endpoint: Get all admin accounts (supports sorting and filtering)
    getAccounts: builder.query<
      GetAccountsResponse,
      {
        token: string;
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        role?: string;
        department_id?: number;
        sort_by?: string;
        sort_order?: "ASC" | "DESC";
      }
    >({
      query: ({ token, page = 1, limit = 10, search, status, role, department_id, sort_by, sort_order }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (role) params.set("role", role);
        if (department_id) params.set("department_id", String(department_id));
        if (sort_by) params.set("sort_by", sort_by);
        if (sort_order) params.set("sort_order", sort_order);

        return {
          url: `${AUTH_URL}/admin/accounts?${params.toString()}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      },
      providesTags: ["Accounts"],
    }),

    // ✅ Get Account by ID
    getAccountById: builder.query<
      GetAccountById,
      { token: string; id: string }
    >({
      query: ({ token, id }) => ({
        url: `${AUTH_URL}/admin/accounts/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    }),

    refreshToken: builder.mutation<
      { access_token: string; refresh_token: string },
      { refresh_token: string }
    >({
      query: (data) => ({
        url: `${AUTH_URL}/refresh`,
        method: "POST",
        body: data,
      }),
    }),

    // ✅ Update status account (Active ↔ Locked)
    updateAccountStatus: builder.mutation<
      {
        status: string;
        statusCode: number;
        message: string;
        data: { id: string; status: string; updated_at: string };
      },
      { id: string; token: string; status: string; reason?: string }
    >({
      query: ({ id, token, status, reason }) => ({
        url: `${AUTH_URL}/admin/accounts/${id}/status`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: {
          status,
          reason: reason || (status === "LOCKED" ? "Vi phạm tiêu chuẩn" : "Khôi phục tài khoản"),
        },
      }),
      invalidatesTags: ["Accounts"],
    }),

    updateAccountById: builder.mutation<
      GetAccountById,
      { id: string; body: UpdateAccountRequest }
    >({
      query: ({ id, body }) => ({
        url: `${AUTH_URL}/admin/accounts/${id}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      }),
      invalidatesTags: ["Accounts"],
    }),

    // DELETE account
    deleteAccount: builder.mutation<
      { status: string; message: string },
      { id: string; token: string }
    >({
      query: ({ id, token }) => ({
        url: `${AUTH_URL}/admin/accounts/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => ["Accounts", { type: "Accounts", id }],
    }),

  }),
});

// --- Hooks ---
export const {
  useSignInMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetAccountsQuery,
  useGetAccountByIdQuery,
  useRefreshTokenMutation,
  useUpdateAccountStatusMutation,
  useUpdateAccountByIdMutation,
  useDeleteAccountMutation,
} = authApiSlice;
