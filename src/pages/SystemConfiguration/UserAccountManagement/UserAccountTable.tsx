import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useAppSelector } from "../../../redux/hook";
import { useGetAccountsQuery, useUpdateAccountStatusMutation } from "../../../redux/api/authApiSlice";
import { useGetDepartmentsQuery } from "../../../redux/api/employeeApiSlice";
import { useState, useEffect } from "react";
import { Lock, Unlock, ChevronUp, ChevronDown, ChevronsUpDown, Search, Filter } from "lucide-react";

export default function UserAccountTable() {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState<"employee_code" | "email" | "full_name" | "role" | "department_name" | "position_name" | "status" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [updateAccountStatus] = useUpdateAccountStatusMutation();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useGetAccountsQuery(
    {
      token: token!,
      page,
      limit,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      role: roleFilter || undefined,
      department_id: departmentFilter ? Number(departmentFilter) : undefined,
      sort_by: sortBy,
      sort_order: sortOrder
    },
    { skip: !token }
  );
console.log('====================================');
console.log(data);
console.log('====================================');
  const { data: departments } = useGetDepartmentsQuery({
    token: token!,
    limit: 100,
  }, { skip: !token });

  if (isLoading) return <p className="p-4 text-center">Loading accounts...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load accounts 😢</p>
    );

  const accounts = data?.data?.accounts || [];
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

  const clearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setStatusFilter("");
    setRoleFilter("");
    setDepartmentFilter("");
    setPage(1);
  };

  const handleToggleStatus = async (accountId: number, currentStatus: string, fullName: string) => {
    if (!token) return;

    const newStatus = currentStatus === "ACTIVE" ? "LOCKED" : "ACTIVE";
    const action = newStatus === "LOCKED" ? "lock" : "unlock";
    const reason = newStatus === "LOCKED" ? "Vi phạm tiêu chuẩn" : "Khôi phục tài khoản";

    const ok = window.confirm(`Are you sure you want to ${action} account "${fullName}"?`);
    if (!ok) return;

    try {
      setUpdatingId(String(accountId));
      await updateAccountStatus({
        id: String(accountId),
        token,
        status: newStatus,
        reason,
      }).unwrap();

      try { refetch(); } catch (e) { }
      setUpdatingId(null);
    } catch (err) {
      console.error(`Failed to ${action} account`, err);
      setUpdatingId(null);
      alert(`Failed to ${action} account. Please try again.`);
    }
  };

  const hasActiveFilters = searchTerm || statusFilter || roleFilter || departmentFilter;

  // generate page items
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
      {/* Search and Filter Bar */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex flex-col gap-4">
          {/* Search and Filter Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, name, or employee code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters || hasActiveFilters
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-brand-600 text-white rounded-full">
                  {[searchTerm, statusFilter, roleFilter, departmentFilter].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="LOCKED">Locked</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="DEPARTMENT_MANAGER">Department Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">All Departments</option>
                  {departments?.data?.departments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <div className="md:col-span-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>User Code</span>
                  <button type="button" title="Sort by code" onClick={() => toggleSort("employee_code")}
                    className={`p-1 rounded ${sortBy === "employee_code" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}>
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

              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <button type="button" title="Sort by email" onClick={() => toggleSort("email")}
                    className={`p-1 rounded ${sortBy === "email" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}>
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

              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Full Name</span>
                  <button type="button" title="Sort by full name" onClick={() => toggleSort("full_name")}
                    className={`p-1 rounded ${sortBy === "full_name" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}>
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

              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Role</span>
                  <button type="button" title="Sort by role" onClick={() => toggleSort("role")}
                    className={`p-1 rounded ${sortBy === "role" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}>
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

              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Department</span>
                  <button type="button" title="Sort by department" onClick={() => toggleSort("department_name")}
                    className={`p-1 rounded ${sortBy === "department_name" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}>
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

              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Position</span>
                  <button type="button" title="Sort by position" onClick={() => toggleSort("position_name")}
                    className={`p-1 rounded ${sortBy === "position_name" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}>
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

              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                  No accounts found. {hasActiveFilters && "Try adjusting your filters."}
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <img width={40} height={40} src="/images/user/user.png" alt="avatar" className="object-cover" />
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {acc.employee_code || "N/A"}
                        </span>
                        <span className={`block text-theme-xs ${acc.status === "ACTIVE"
                            ? "text-green-600 dark:text-green-400"
                            : acc.status === "LOCKED"
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}>
                          {acc.status}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{acc.email}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">{acc.full_name}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${acc.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        : acc.role === "HR_MANAGER"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : acc.role === "DEPARTMENT_MANAGER"
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                      {acc.role}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">{acc.department_name || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">{acc.position_name || "-"}</TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        to={`/user-account-config/${acc.id}`}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 underline hover:no-underline text-sm"
                      >
                        Details
                      </Link>

                      <button
                        type="button"
                        title={acc.status === "ACTIVE" ? "Lock account" : "Unlock account"}
                        onClick={() => handleToggleStatus(acc.id, acc.status, acc.full_name)}
                        className={`${acc.status === "ACTIVE"
                            ? "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          }`}
                        disabled={updatingId === String(acc.id)}
                      >
                        {updatingId === String(acc.id) ? (
                          <span className="text-xs">Updating...</span>
                        ) : acc.status === "ACTIVE" ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      {pagination && pagination.total_pages > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={!pagination.has_prev}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className={`px-3 py-1 rounded-md text-sm ${pagination.has_prev
                  ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed"
                }`}
            >
              Prev
            </button>

            <div className="flex items-center gap-1">
              {getPageItems(pagination.total_pages, pagination.page).map((p, idx) =>
                p === -1 ? (
                  <span key={`e-${idx}`} className="px-2 text-sm text-gray-500">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={p === pagination.page}
                    className={`px-3 py-1 rounded-md text-sm ${p === pagination.page
                        ? 'bg-brand-600 text-white dark:bg-brand-500'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                      }`}
                    aria-current={p === pagination.page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              disabled={!pagination.has_next}
              onClick={() => setPage((prev) => prev + 1)}
              className={`px-3 py-1 rounded-md text-sm ${pagination.has_next
                  ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed"
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
