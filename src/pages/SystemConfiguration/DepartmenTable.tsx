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
import Select from "react-select";

const DepartmenTable = () => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

const [page, setPage] = useState(1);
const limit = 4;

// 🔎 filter state
const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");
const [search, setSearch] = useState("");
const [sortBy, setSortBy] = useState<"created_at" | "department_name" | "department_code">("created_at");
const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");


const { data, isLoading, error, refetch } = useGetDepartmentsQuery(
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

  // react-select options for managers
  // Ensure value is a number to avoid mismatches (backend may return id as string)
  const managerOptions = managers?.data?.managers?.map((m: any) => ({ value: Number(m.id), label: m.full_name })) ?? [];

  if (isLoading) return <p className="p-4 text-center">Loading departments...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load departments 😢</p>
    );

  // ✅ lấy đúng mảng và thông tin phân trang
  const departments = data?.data?.departments ?? [];
  console.log('====================================');
  console.log(departments);
  console.log('====================================');
  const pagination = data?.data?.pagination;
const handleManagerChange = (departmentId: number, newManagerId: number | null) => {
    // Use updateDepartment but only send manager_id in the body (backend will accept partial updates)
    // When clearing (newManagerId === null) we send manager_id: null
    const body: any = { manager_id: typeof newManagerId === "number" ? Number(newManagerId) : null };

    updateDepartment({ token: token!, id: departmentId, body })
      .unwrap()
      .then(() => {
        console.log("Manager updated via updateDepartment (minimal body)");
        // ensure we refresh the departments list to get the new manager_id
        try {
          refetch();
        } catch (e) {
          // ignore
        }
      })
      .catch((err: any) => {
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
      <select
        value={sortBy}
        onChange={(e) => {
          setSortBy(e.target.value as any);
          setPage(1);
        }}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <option value="created_at">Sort by created date</option>
        <option value="department_code">Sort by code</option>
        <option value="department_name">Sort by name</option>
      </select>

      {/* Sort order */}
      <select
        value={sortOrder}
        onChange={(e) => {
          setSortOrder(e.target.value as "ASC" | "DESC");
          setPage(1);
        }}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      >
        <option value="DESC">DESC</option>
        <option value="ASC">ASC</option>
      </select>
    </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Department
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Description
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Office Address
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Manager
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
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {d.department_code}
                        </span>
                      </div>
                    </div>
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
                    {/* Searchable dropdown for manager (react-select) */}
                    <Select
                      isDisabled={isLoadingManagers}
                      isLoading={isLoadingManagers}
                      options={managerOptions}
                      value={
                        managerOptions.find((o: any) => String(o.value) === String(d.manager_id)) ?? null
                      }
                      onChange={(opt: any) => {
                        console.debug("Select onChange opt:", opt);
                        // opt can be null when cleared; otherwise opt.value should be the id
                        const val = typeof opt === "object" && opt !== null ? opt.value : null;
                        handleManagerChange(d.id, val ?? null);
                      }}
                      placeholder="Select manager..."
                      isClearable
                      classNamePrefix="react-select"
                    />
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
