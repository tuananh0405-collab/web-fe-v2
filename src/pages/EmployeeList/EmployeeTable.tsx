import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Link } from "react-router";
import { useAppSelector } from "../../redux/hook";
import { useGetDepartmentsQuery, useGetEmployeesQuery, useGetPositionsQuery } from "../../redux/api/employeeApiSlice";
// trên cùng file EmployeeTable.tsx (trước component)
const getStatusBadgeClasses = (status?: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "TERMINATED":
      return "bg-rose-50 text-rose-700 border border-rose-100";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-100";
    default:
      return "bg-gray-50 text-gray-600 border border-gray-100";
  }
};

const EmployeeTable = () => {
  // ✅ Lấy token (nếu API yêu cầu)
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const user = useAppSelector((state) => state.auth.userState?.data?.user);
  console.log('====================================');
  console.log(user?.role);
  console.log('====================================');
 const [page, setPage] = useState(1);
const limit = 4;

// filters
const [departmentId, setDepartmentId] = useState<string>("");
const [positionId, setPositionId] = useState<string>("");
const [status, setStatus] = useState<string>("");
const [search, setSearch] = useState<string>("");
const [sortBy, setSortBy] = useState<string>("created_at");
const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const { data, isLoading, error } = useGetEmployeesQuery(
  {
    token: token!,
    page,
    limit,
    department_id: departmentId ? Number(departmentId) : undefined,
    position_id: positionId ? Number(positionId) : undefined,
    status: status || undefined,
    search: search || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  },
  { skip: !token }
);

// lấy phòng ban & chức vụ để filter
const { data: deptRes } = useGetDepartmentsQuery(
  { token: token!, page: 1, limit: 100 },
  { skip: !token }
);
const { data: posRes } = useGetPositionsQuery(
  { token: token!, page: 1, limit: 100 },
  { skip: !token }
);

const departments = deptRes?.data?.departments ?? [];
const positions = posRes?.data?.positions ?? [];

  if (isLoading) return <p className="p-4 text-center">Loading employees...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load employees 😢</p>
    );

  // ✅ Lấy đúng dữ liệu theo response mới
  const employees = data?.data?.employees || [];
  const pagination = data?.data?.pagination;

  return (
    <>
      {/* FILTER BAR */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by code, email or name"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="h-9 w-56 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />

        <select
          value={departmentId}
          onChange={(e) => {
            setPage(1);
            setDepartmentId(e.target.value);
          }}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.department_name}
            </option>
          ))}
        </select>

        <select
          value={positionId}
          onChange={(e) => {
            setPage(1);
            setPositionId(e.target.value);
          }}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All positions</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.position_name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setPage(1);
            setSortBy(e.target.value);
          }}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="created_at">Sort by created date</option>
          <option value="full_name">Sort by name</option>
          <option value="employee_code">Sort by employee code</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) =>
            setSortOrder(e.target.value as "ASC" | "DESC")
          }
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-theme-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="DESC">DESC</option>
          <option value="ASC">ASC</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setPage(1);
            setDepartmentId("");
            setPositionId("");
            setStatus("");
            setSearch("");
            setSortBy("created_at");
            setSortOrder("DESC");
          }}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          Clear
        </button>
      </div>
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                User
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Email
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Position
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Department
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {employees.length === 0 ? (
              <TableRow>
                <TableCell  className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" />
      <div>
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {e.full_name}
        </span>
        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
          {e.employee_code || "-"}
        </span>
      </div>
    </div>

    {/* Badge status */}
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium " +
        getStatusBadgeClasses(e.status)
      }
    >
      {e.status || "UNKNOWN"}
    </span>
  </div>
</TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {e.email}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {e.position_name || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {e.department_name || e.department_id || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <Link
                      to={`/employee-list/${e.id}`}
                      className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      View Profile
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Pagination giống UserAccountTable */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.total_pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={!pagination.has_prev}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className={`px-3 py-1 rounded-md text-sm ${
                pagination.has_prev
                  ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800"
              }`}
            >
              Prev
            </button>
            <button
              disabled={!pagination.has_next}
              onClick={() => setPage((prev) => prev + 1)}
              className={`px-3 py-1 rounded-md text-sm ${
                pagination.has_next
                  ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div></>
  );
};

export default EmployeeTable;
