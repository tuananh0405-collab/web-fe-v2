import { AUTH_URL, ROLE_URL } from "../features/constants";
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
  department_id: number;
  position_id: number;
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

// --- Role Types ---
interface Permission {
  id: number;
  code: string;
  resource: string;
  action: string;
  description?: string;
}

interface RolePermission extends Permission {
  assigned_at?: Date;
}

interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  level: number;
  is_system_role: boolean;
  status: string;
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}

interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

interface GetRolesResponse {
  status: string;
  message: string;
  data: {
    roles: Role[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

interface GetRoleResponse {
  status: string;
  message: string;
  data: Role;
}

interface GetRoleWithPermissionsResponse {
  status: string;
  message: string;
  data: RoleWithPermissions;
}

interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  level: number;
  status?: string;
}

interface CreateRoleResponse {
  status: string;
  message: string;
  data: Role;
}

interface UpdateRoleRequest {
  code?: string;
  name?: string;
  description?: string;
  level?: number;
  status?: string;
}

interface UpdateRoleResponse {
  status: string;
  message: string;
  data: Role;
}

interface AssignPermissionsRequest {
  permission_ids: number[];
}

interface AssignPermissionsResponse {
  status: string;
  message: string;
  data: {
    role_id: number;
    permission_ids: number[];
    total_permissions: number;
  };
}

interface GetRolePermissionsResponse {
  status: string;
  message: string;
  data: {
    role_id: number;
    permissions: RolePermission[];
    total: number;
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

    // ===== ROLE MANAGEMENT =====

    // Get all roles with pagination
    getRoles: builder.query<
      GetRolesResponse,
      {
        token: string;
        page?: number;
        limit?: number;
        status?: string;
      }
    >({
      query: ({ token, page = 1, limit = 20, status }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (status) params.set("status", status);

        return {
          url: `${ROLE_URL}?${params.toString()}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      },
      providesTags: ["Roles"],
    }),

    // Get role by ID
    getRoleById: builder.query<
      GetRoleResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${ROLE_URL}/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Roles", id }],
    }),

    // Get role by ID with permissions
    getRoleWithPermissions: builder.query<
      GetRoleWithPermissionsResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${ROLE_URL}/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "Roles", id },
        { type: "RolePermissions", id },
      ],
    }),

    // Create a new role
    createRole: builder.mutation<
      CreateRoleResponse,
      { token: string; body: CreateRoleRequest }
    >({
      query: ({ token, body }) => ({
        url: `${ROLE_URL}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      }),
      invalidatesTags: ["Roles"],
    }),

    // Update role
    updateRole: builder.mutation<
      UpdateRoleResponse,
      { token: string; id: number; body: UpdateRoleRequest }
    >({
      query: ({ token, id, body }) => ({
        url: `${ROLE_URL}/${id}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Roles",
        { type: "Roles", id },
      ],
    }),

    // Delete role
    deleteRole: builder.mutation<
      { status: string; message: string },
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${ROLE_URL}/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Roles",
        { type: "Roles", id },
      ],
    }),

    // Assign permissions to role
    assignPermissions: builder.mutation<
      AssignPermissionsResponse,
      { token: string; id: number; body: AssignPermissionsRequest }
    >({
      query: ({ token, id, body }) => ({
        url: `${ROLE_URL}/${id}/permissions`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "RolePermissions", id },
        { type: "Roles", id },
      ],
    }),

    // Get role permissions
    getRolePermissions: builder.query<
      GetRolePermissionsResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${ROLE_URL}/${id}/permissions`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: (_result, _error, { id }) => [
        { type: "RolePermissions", id },
      ],
    }),

    // Remove permission from role
    removePermission: builder.mutation<
      { status: string; message: string },
      { token: string; id: number; permissionId: number }
    >({
      query: ({ token, id, permissionId }) => ({
        url: `${ROLE_URL}/${id}/permissions/${permissionId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "RolePermissions", id },
        { type: "Roles", id },
      ],
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
  // Role Management Hooks
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useGetRoleWithPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useAssignPermissionsMutation,
  useGetRolePermissionsQuery,
  useRemovePermissionMutation,
} = authApiSlice;
