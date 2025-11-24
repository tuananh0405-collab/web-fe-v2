import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Link } from "react-router"; // nếu bạn dùng react-router-dom thì import từ "react-router-dom"
import { useAppSelector } from "../../redux/hook";
import { useGetDepartmentsQuery, useGetManagersQuery, useUpdateDepartmentMutation } from "../../redux/api/employeeApiSlice";

const DepartmenTable = () => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

const [page, setPage] = useState(1);
const limit = 4;

// 🔎 filter state
const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");
const [search, setSearch] = useState("");
const [sortBy, setSortBy] = useState<
  | "created_at"
  | "department_code"
  | "department_name"
  | "description"
  | "id"
  | "level"
  | "manager_id"
  | "parent_department_id"
  | "parent_department_name"
  | "status"
  | "updated_at"
  | "office_address"
>("created_at");
const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");


const { data, isLoading, error } = useGetDepartmentsQuery(
  {
    token: token!,
    page,
    limit,
    status: status === "ALL" ? undefined : status, // ALL thì không gửi status
    search: search || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  },
  { skip: !token }
);

  const { data: managers, isLoading: isLoadingManagers } = useGetManagersQuery({ token: token! });
  const [updateDepartment] = useUpdateDepartmentMutation();

  if (isLoading) return <p className="p-4 text-center">Loading departments...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load departments 😢</p>
    );

  const pagination = data?.data?.pagination;
  const departments = data?.data?.departments ?? [];
  // Toggle sort: ASC -> DESC -> reset to default (created_at DESC)
  const toggleSort = (field: 
    | "created_at"
    | "department_code"
    | "department_name"
    | "description"
    | "id"
    | "level"
    | "manager_id"
    | "parent_department_id"
    | "parent_department_name"
    | "status"
    | "updated_at"
    | "office_address"
  ) => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder("ASC");
    } else if (sortBy === field && sortOrder === "ASC") {
      setSortOrder("DESC");
    } else {
      // reset to default
      setSortBy("created_at");
      setSortOrder("DESC");
    }
    setPage(1);
  };
const handleManagerChange = (departmentId: number, newManagerId: number) => {
    updateDepartment({
      token,
      id: departmentId,
      body: { manager_id: newManagerId },
    }).unwrap().then(() => {
      console.log("Manager updated successfully");
    }).catch((err) => {
      console.error("Failed to update manager", err);
    });
  };
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
       {/* 🌟 FILTER BAR */}
    <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
      {/* Search */}
      <input
        type="text"
        placeholder="Search by code or name..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1); // filter mới thì về page 1
        }}
        className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />

      {/* Status */}
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as any);
          setPage(1);
        }}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <option value="ALL">All status</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>

      {/* Sort by */}
          {/* Sort controls moved to the table header as small icons */}
    </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Department</span>
                    <button
                      type="button"
                      title="Sort by name"
                      onClick={() => toggleSort("department_name")}
                      className={`p-1 rounded ${sortBy === "department_name" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
                    >
                      {sortBy === "department_name" && sortOrder === "ASC" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : sortBy === "department_name" && sortOrder === "DESC" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l5-5 5 5M7 16l5 5 5-5" />
                        </svg>
                      )}
                    </button>
                  </div>
                </TableCell>

                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Code</span>
                    <button
                      type="button"
                      title="Sort by code"
                      onClick={() => toggleSort("department_code")}
                      className={`p-1 rounded ${sortBy === "department_code" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
                    >
                      {sortBy === "department_code" && sortOrder === "ASC" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      ) : sortBy === "department_code" && sortOrder === "DESC" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l5-5 5 5M7 16l5 5 5-5" />
                        </svg>
                      )}
                    </button>
                  </div>
                </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Description</span>
                  <button
                    type="button"
                    title="Sort by description"
                    onClick={() => toggleSort("description")}
                    className={`p-1 rounded ${sortBy === "description" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {sortBy === "description" && sortOrder === "ASC" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : sortBy === "description" && sortOrder === "DESC" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l5-5 5 5M7 16l5 5 5-5" />
                      </svg>
                    )}
                  </button>
                </div>
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <button
                    type="button"
                    title="Sort by status"
                    onClick={() => toggleSort("status")}
                    className={`p-1 rounded ${sortBy === "status" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {sortBy === "status" && sortOrder === "ASC" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : sortBy === "status" && sortOrder === "DESC" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l5-5 5 5M7 16l5 5 5-5" />
                      </svg>
                    )}
                  </button>
                </div>
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Office Address</span>
                  <button
                    type="button"
                    title="Sort by office address"
                    onClick={() => toggleSort("office_address")}
                    className={`p-1 rounded ${sortBy === "office_address" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {sortBy === "office_address" && sortOrder === "ASC" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : sortBy === "office_address" && sortOrder === "DESC" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l5-5 5 5M7 16l5 5 5-5" />
                      </svg>
                    )}
                  </button>
                </div>
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Manager</span>
                  <button
                    type="button"
                    title="Sort by manager"
                    onClick={() => toggleSort("manager_id")}
                    className={`p-1 rounded ${sortBy === "manager_id" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {sortBy === "manager_id" && sortOrder === "ASC" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : sortBy === "manager_id" && sortOrder === "DESC" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l5-5 5 5M7 16l5 5 5-5" />
                      </svg>
                    )}
                  </button>
                </div>
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {departments.length === 0 ? (
              <TableRow>
                <TableCell  className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full" />
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {d.department_name}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-4 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {d.department_code ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {d.description ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {d.status ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {d.office_address ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {/* Display current manager name */}
                    {d.manager_id ? (
                      managers?.data?.managers.find(manager => manager.id === d.manager_id)?.full_name ?? "-"
                    ) : (
                      <select
                        onChange={(e) => handleManagerChange(d.id, Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select Manager</option>
                        {managers?.data?.managers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.full_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <Link
                      to={`/department-config/${d.id}`}
                      className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      View Detail
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
    </div>
  );
};

export default DepartmenTable;
