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

    logout: builder.mutation<void, void>({
      query: () => ({
        url: `${AUTH_URL}/logout`,
        method: "POST",
       
      }),
    }),

    // ✅ New endpoint: Get all admin accounts
    getAccounts: builder.query<
      GetAccountsResponse,
      { token: string; page?: number; limit?: number }
    >({
      query: ({ token, page = 1, limit = 10 }) => ({
        url: `${AUTH_URL}/admin/accounts?page=${page}&limit=${limit}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
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
// ✅ NEW: Cập nhật trạng thái tài khoản (ACTIVE ↔ LOCKED)
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
      { id: string;  body: UpdateAccountRequest }
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

  }),
});

// --- Hooks ---
export const { useSignInMutation, 
  useLogoutMutation,
   useGetAccountsQuery, 
   useGetAccountByIdQuery,
  useRefreshTokenMutation,
  useUpdateAccountStatusMutation,
  useUpdateAccountByIdMutation
  } =
  authApiSlice;
