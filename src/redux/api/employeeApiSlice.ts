import { apiSlice } from "./apiSlice";
import { EMPLOYEE_URL } from "../features/constants";

// --- Types ---
export interface Pagination {
  has_next: boolean;
  has_prev: boolean;
  limit: number;
  page: number;
  total: number;
  total_pages: number;
}
export interface Department {
  id: number;
  department_code: string;
  department_name: string;
  description: string | null;
  parent_department_id: number | null;
  level: number;
  path: string | null;
  manager_id: number | null;
  office_address: string | null;
  // API trong ảnh trả lat/long dạng chuỗi → dùng string cho an toàn
  office_latitude: string | null;
  office_longitude: string | null;
  office_radius_meters: number | null;
  status: string; // "ACTIVE" | ...
  created_at: string;
  updated_at: string;
}

export interface GetDepartmentsResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    departments: Department[];
    pagination: Pagination;
  };
  timestamp: string;
  path: string;
}
type GetDepartmentsArgs = { token: string; page?: number; limit?: number };

export interface GetDepartmentByIdResponse {
  status: string;
  statusCode: number;
  message: string;
  data: Department; // 👈 chỉ 1 object
  timestamp: string;
  path: string;
}

export interface UpdateDepartmentRequest {
  department_code: string;
  department_name: string;
  description: string | null;
  parent_department_id: number | null;
  manager_id: number | null;
  office_address: string | null;
  office_latitude: string | null;
  office_longitude: string | null;
  office_radius_meters: number | null;
}

// Body cho POST /employee/departments
export interface CreateDepartmentRequest {
  department_code: string;
  department_name: string;
  description: string | null;
  parent_department_id: number | null;
  manager_id: number | null;
  office_address: string | null;
  office_latitude: string | null;
  office_longitude: string | null;
  office_radius_meters: number | null;
}

// Response của POST giống hệt get-by-id/update
export interface CreateDepartmentResponse {
  status: string;
  statusCode: number;
  message: string;
  data: Department;
  timestamp: string;
  path: string;
}

// --- Employee Types ---
export interface Employee {
  id: number;
  account_id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  national_id: string | null;
  email: string;
  phone_number: string | null;
  personal_email: string | null;
  address: Record<string, unknown>; // tuỳ backend, đang là object rỗng {}
  department_id: number;
  department_name: string;
  position_id: number;
  manager_id: number | null;
  hire_date: string;
  employment_type: string; // "FULL_TIME" | ...
  status: string; // "ACTIVE" | ...
  termination_date: string | null;
  termination_reason: string | null;
  emergency_contact: Record<string, unknown>;
  onboarding_status: string;
  onboarding_completed_at: string | null;
  profile_completion_percentage: number;
  external_refs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GetEmployeesResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    employees: Employee[];
    pagination: Pagination;
  };
  errorCode: string;
  timestamp: string;
  path: string;
}
export interface GetEmployeesQueryArgs {
  token: string;
  department_id?: number;
  status?: string;
  search?: string;
}
// Body cho PUT /employee/employees/{id}
export interface UpdateEmployeeRequest {
  first_name: string;
  last_name: string;
  date_of_birth: string; // "1990-01-01"
  gender: string; // "MALE" | "FEMALE" | ...
  national_id: string | null;
  email: string;
  phone_number: string | null;
  personal_email: string | null;
  address: Record<string, unknown>; // swagger đang là {}
  department_id: number;
  position_id: number;
  manager_id: number | null;
  hire_date: string; // "2025-10-07"
  employment_type: string; // "FULL_TIME" | ...
  status: string; // "ACTIVE" | ...
  termination_date: string | null;
  termination_reason: string | null;
  emergency_contact: Record<string, unknown>;
  onboarding_status: string; // "PENDING" | ...
  profile_completion_percentage: number;
  external_refs: Record<string, unknown>;
}
// Body cho POST /employee/employees
export interface CreateEmployeeRequest {
  employee_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // "1990-01-01"
  gender: string; // "MALE" | "FEMALE" | ...
  email: string;
  phone_number: string;
  department_id: number;
  position_id: number;
  manager_id: number;
  hire_date: string; // "2025-10-07"
  employment_type: string; // "FULL_TIME" | ...
}

// Response envelope của POST /employee/employees
export interface CreateEmployeeResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    id: number;
    account_id: number | null;
    employee_code: string;
    full_name: string;
    email: string;
    hire_date: string;
    onboarding_status: string;
    created_at: string;
  };
  errorCode: string;
  timestamp: string;
  path: string;
}
interface GetEmployeeByIdResponse {
  status: string;
  statusCode: number;
  message: string;
  data: Employee;
  path: string;
  timestamp: string;
}
export interface Position {
  id: number;
  position_code: string;
  position_name: string;
  description: string;
  level: number;
  department_id: number;
  suggested_role: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GetPositionByIdResponse {
  status: string;
  statusCode: number;
  message: string;
  data: Position;
  errorCode?: string;
  timestamp?: string;
  path?: string;
}
export interface GetPositionsResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    positions: Position[];
    pagination: Pagination;
  };
  errorCode?: string;
  timestamp?: string;
  path?: string;
}
export const employeeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<GetDepartmentsResponse, GetDepartmentsArgs>({
      query: ({ token, page = 1, limit = 10 }) => ({
        url: `${EMPLOYEE_URL}/departments`,
        method: "GET",
        params: { page, limit }, 
      }),
      providesTags: ["Departments"],
    }),
    // GET /employee/departments/:id
    getDepartmentById: builder.query<
      GetDepartmentByIdResponse,
      { token: string; id: number | string }
    >({
      query: ({ token, id }) => ({
        url: `${EMPLOYEE_URL}/departments/${id}`,
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
      providesTags: (result, error, arg) => [
        { type: "Departments", id: arg.id },
      ],
    }),

    updateDepartment: builder.mutation<
      GetDepartmentByIdResponse,
      { token: string; id: number | string; body: UpdateDepartmentRequest }
    >({
      query: ({ token, id, body }) => ({
        url: `${EMPLOYEE_URL}/departments/${id}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Departments",
        { type: "Departments", id },
      ],
    }),

    createDepartment: builder.mutation<
      CreateDepartmentResponse,
      { token: string; body: CreateDepartmentRequest }
    >({
      query: ({ token, body }) => ({
        url: `${EMPLOYEE_URL}/departments`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["Departments"],
    }),

    getEmployees: builder.query<
      GetEmployeesResponse,
      { token: string; page?: number; limit?: number }
    >({
      query: ({ token, page = 1, limit = 10 }) => ({
        url: `${EMPLOYEE_URL}/employees`,
        method: "GET",
        params: { page, limit },
      }),
    }),

    getEmployeeById: builder.query<
      GetEmployeeByIdResponse,
      { token: string; id: number | string }
    >({
      query: ({ token, id }) => ({
        url: `${EMPLOYEE_URL}/employees/${id}`,
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }),
      providesTags: (result, error, arg) => [{ type: "Employees", id: arg.id }],
    }),

    updateEmployee: builder.mutation<
      Employee, // response là object employee
      { token: string; id: number | string; body: UpdateEmployeeRequest }
    >({
      query: ({ token, id, body }) => ({
        url: `${EMPLOYEE_URL}/employees/${id}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Employees",
        { type: "Employees", id },
      ],
    }),

    createEmployee: builder.mutation<
      CreateEmployeeResponse,
      { token: string; body: CreateEmployeeRequest }
    >({
      query: ({ token, body }) => ({
        url: `${EMPLOYEE_URL}/employees`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["Employees"],
    }),

    getPositionById: builder.query<
  GetPositionByIdResponse,
  { token: string; id: number | string }
>({
  query: ({ token, id }) => ({
    url: `${EMPLOYEE_URL}/positions/${id}`,
    method: "GET",
  }),
}),

getPositions: builder.query<
  GetPositionsResponse,
  { token: string; page?: number; limit?: number }
>({
  query: ({ token, page = 1, limit = 10 }) => ({
    url: `${EMPLOYEE_URL}/positions`,
    method: "GET",
    params: { page, limit },
  }),
  providesTags: ["Positions"],
}),

  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useUpdateDepartmentMutation,
  useCreateDepartmentMutation,
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useUpdateEmployeeMutation,
  useCreateEmployeeMutation,
  useGetPositionByIdQuery,
  useGetPositionsQuery
} = employeeApiSlice;
