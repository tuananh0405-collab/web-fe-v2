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
// type GetDepartmentsArgs = { token: string; page?: number; limit?: number };
type GetDepartmentsArgs = {
  token: string;
  page?: number;
  limit?: number;
  status?: string;
  parent_department_id?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
};

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
  position_name:string;
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
// Employee item cho LIST (GET /employees)
export interface EmployeeListItem {
  id: string;                // API trả string
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  department_id: number;
  department_name: string;
  position_id: number;
  position_name: string;
  status: string;
  onboarding_status: string;
  created_at: string;
  updated_at: string;
}

// Query params cho GET /employees
export interface GetEmployeesQueryArgs {
  token: string;
  page?: number;
  limit?: number;
  department_id?: number;
  position_id?: number;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

// export interface GetEmployeesQueryArgs {
//   token: string;
//   department_id?: number;
//   status?: string;
//   search?: string;
// }
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
// ----- Terminate Employee -----
export interface TerminateEmployeeRequest {
  termination_date: string;   // "2025-11-23"
  termination_reason: string; // lý do
}

export interface TerminateEmployeeResponse {
  status: string;
  statusCode: number;
  message: string;
  data: Employee; // backend trả lại object Employee đã update
  errorCode: string;
  timestamp: string;
  path: string;
}

export const employeeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<GetDepartmentsResponse, GetDepartmentsArgs>({
  query: ({
    token,
    page = 1,
    limit = 10,
    status,
    parent_department_id,
    search,
    sort_by,
    sort_order,
  }) => {
    const params: any = { page, limit };

    if (status) params.status = status;
    if (typeof parent_department_id !== "undefined") {
      params.parent_department_id = parent_department_id;
    }
    if (search) params.search = search;
    if (sort_by) params.sort_by = sort_by;
    if (sort_order) params.sort_order = sort_order;

    return {
      url: `${EMPLOYEE_URL}/departments`,
      method: "GET",
      params,
    };
  },
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

    // getEmployees: builder.query<
    //   GetEmployeesResponse,
    //   { token: string; page?: number; limit?: number }
    // >({
    //   query: ({ token, page = 1, limit = 10 }) => ({
    //     url: `${EMPLOYEE_URL}/employees`,
    //     method: "GET",
    //     params: { page, limit },
    //   }),
    // }),
getEmployees: builder.query<GetEmployeesResponse, GetEmployeesQueryArgs>({
  query: ({
    token,
    page = 1,
    limit = 10,
    department_id,
    position_id,
    status,
    search,
    sort_by = "created_at",
    sort_order = "DESC",
  }) => {
    const params: Record<string, any> = {
      page,
      limit,
      sort_by,
      sort_order,
    };

    if (typeof department_id === "number") params.department_id = department_id;
    if (typeof position_id === "number") params.position_id = position_id;
    if (status && status !== "--") params.status = status;
    if (search && search.trim()) params.search = search.trim();

    return {
      url: `${EMPLOYEE_URL}/employees`,
      method: "GET",
      params,
      // headers: { Authorization: `Bearer ${token}` }, // nếu backend yêu cầu auth thì mở comment này
    };
  },
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
getManagers: builder.query({
      query: () => ({
        url: `${EMPLOYEE_URL}/employees/managers/list`,
        method: "GET",
      }),
    }),

    terminateEmployee: builder.mutation<
  TerminateEmployeeResponse,
  { token: string; id: number | string; body: TerminateEmployeeRequest }
>({
  query: ({ token, id, body }) => ({
    url: `${EMPLOYEE_URL}/employees/${id}/terminate`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  }),
  invalidatesTags: (result, error, { id }) => [
    "Employees",
    { type: "Employees", id }, // để getEmployeeById refetch
  ],
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
  useGetPositionsQuery,
  useGetManagersQuery,
  useTerminateEmployeeMutation
} = employeeApiSlice;
