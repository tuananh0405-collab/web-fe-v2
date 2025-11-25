import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useAppSelector } from "../../redux/hook";
import { useDeleteAccountMutation, useGetAccountsQuery } from "../../redux/api/authApiSlice";
import { useState, useMemo } from "react";
import { Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useGetEmployeesQuery } from "../../redux/api/employeeApiSlice";
// (table uses API data)

export default function EmployeeTable() {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );
  const [page, setPage] = useState(1);
  const limit = 5;
  const [sortBy, setSortBy] = useState<
    | "employee_code"
    | "email"
    | "full_name"
    | "role"
    | "department_name"
    | "position_name"
    | "status"
    | "created_at"
  >("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteAccount] = useDeleteAccountMutation();

  const { data, isLoading, error, refetch } = useGetEmployeesQuery(
    { token: token!, page, limit, sort_by: sortBy, sort_order: sortOrder },
    { skip: !token }
  );

  // Fetch all accounts once - don't tie it to the employee pagination
  const { data: accountsData } = useGetAccountsQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const employeeRoleMap = useMemo(() => {
    const map = new Map<string, string>();
    
    if (!accountsData?.data?.accounts) {
      console.log("No accounts data available");
      return map;
    }
    
    accountsData.data.accounts.forEach((account: any) => {
      if (account.employee_id && account.employee_id !== 0) {
        map.set(String(account.employee_id), account.role || "N/A");
      }
    });
    
    console.log("Employee Role Map created with", map.size, "entries");
    return map;
  }, [accountsData?.data?.accounts]);

  console.log("Employee Role Map:", employeeRoleMap);

  if (isLoading) return <p className="p-4 text-center">Loading employees...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">
        Failed to load employees 😢
      </p>
    );

  const accounts = data?.data?.employees || [];
  const pagination = data?.data?.pagination;
  
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder("ASC");
    } else if (sortBy === field && sortOrder === "ASC") {
      setSortOrder("DESC");
    } else {
      setSortBy("created_at");
      setSortOrder("DESC");
    }
    setPage(1);
  };

  // generate page items like in DepartmentTable
  const getPageItems = (total: number, current: number) => {
    const items: number[] = [];
    if (total <= 10) {
      for (let i = 1; i <= total; i++) items.push(i);
      return items;
    }
    const delta = 2;
    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);
    items.push(1);
    if (left > 2) items.push(-1);
    for (let i = left; i <= right; i++) items.push(i);
    if (right < total - 1) items.push(-1);
    items.push(total);
    return items;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by code or name..."
            className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            // you can wire this to a search state later
          />
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                <div className="flex items-center justify-between">
                  <span>Employee Code</span>
                  <button
                    type="button"
                    title="Sort by code"
                    onClick={() => toggleSort("employee_code")}
                    className={`p-1 rounded ${
                      sortBy === "employee_code"
                        ? "text-brand-600"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {sortBy === "employee_code" && sortOrder === "ASC" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : sortBy === "employee_code" && sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <button
                    type="button"
                    title="Sort by email"
                    onClick={() => toggleSort("email")}
                    className={`p-1 rounded ${
                      sortBy === "email"
                        ? "text-brand-600"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {sortBy === "email" && sortOrder === "ASC" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : sortBy === "email" && sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                <div className="flex items-center justify-between">
                  <span>Full Name</span>
                  <button
                    type="button"
                    title="Sort by full name"
                    onClick={() => toggleSort("full_name")}
                    className={`p-1 rounded ${
                      sortBy === "full_name"
                        ? "text-brand-600"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {sortBy === "full_name" && sortOrder === "ASC" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : sortBy === "full_name" && sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                <div className="flex items-center justify-between">
                  <span>Role</span>
                  <button
                    type="button"
                    title="Sort by role"
                    onClick={() => toggleSort("role")}
                    className={`p-1 rounded ${
                      sortBy === "role"
                        ? "text-brand-600"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {sortBy === "role" && sortOrder === "ASC" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : sortBy === "role" && sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                <div className="flex items-center justify-between">
                  <span>Department</span>
                  <button
                    type="button"
                    title="Sort by department"
                    onClick={() => toggleSort("department_name")}
                    className={`p-1 rounded ${
                      sortBy === "department_name"
                        ? "text-brand-600"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {sortBy === "department_name" && sortOrder === "ASC" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : sortBy === "department_name" && sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                <div className="flex items-center justify-between">
                  <span>Position</span>
                  <button
                    type="button"
                    title="Sort by position"
                    onClick={() => toggleSort("position_name")}
                    className={`p-1 rounded ${
                      sortBy === "position_name"
                        ? "text-brand-600"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {sortBy === "position_name" && sortOrder === "ASC" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : sortBy === "position_name" && sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {accounts.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        width={40}
                        height={40}
                        src="/images/user/user.png"
                        alt="img"
                      />
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {acc.employee_code}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {acc.status}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {acc.email}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {acc.full_name}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {(() => {
                    const role = employeeRoleMap.get(String(acc.id));
                    return role || "N/A";
                  })()}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {acc.department_name || "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {acc.position_name || "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/employee-list/${acc.id}`}
                      className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      View Profile
                    </Link>

                    <button
                      type="button"
                      title="Delete employee"
                      onClick={async () => {
                        if (!token) return;
                        const ok = window.confirm(
                          `Delete employee ${acc.full_name}?`
                        );
                        if (!ok) return;
                        try {
                          setDeletingId(acc.id);
                          await deleteAccount({
                            id: String(acc.id),
                            token: token!,
                          }).unwrap();
                          try {
                            refetch();
                          } catch (e) {}
                          setDeletingId(null);
                        } catch (err) {
                          console.error("Failed to delete employee", err);
                          setDeletingId(null);
                        }
                      }}
                      className="ml-3 text-sm text-red-600 hover:text-red-800"
                    >
                      {deletingId === acc.id ? (
                        <span className="text-xs">Deleting...</span>
                      ) : (
                        <Trash2 className="h-4 w-4 inline" />
                      )}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* ✅ Pagination Section */}
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

            <div className="flex items-center gap-1">
              {getPageItems(pagination.total_pages, pagination.page).map(
                (p, idx) =>
                  p === -1 ? (
                    <span
                      key={`e-${idx}`}
                      className="px-2 text-sm text-gray-500"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      disabled={p === pagination.page}
                      className={`px-3 py-1 rounded-md text-sm ${
                        p === pagination.page
                          ? "bg-brand-600 text-white dark:bg-brand-500"
                          : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                      }`}
                      aria-current={p === pagination.page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
              )}
            </div>

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
}
