import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useAppSelector } from "../../redux/hook";
import {
  useDeleteAccountMutation,
  useGetAccountsQuery,
  useUpdateAccountByIdMutation,
  useUpdateAccountStatusMutation,
} from "../../redux/api/authApiSlice";
import { useState, useMemo, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import {
  useGetEmployeesQuery,
} from "../../redux/api/employeeApiSlice";

import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

interface EmployeeTableProps {
  onRefresh?: () => void;
}

export default function EmployeeTable({ onRefresh }: EmployeeTableProps = {}) {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );
  const user = useAppSelector(
    (state) => state.auth.userState?.data?.user
  );
  
  // Lọc theo role:
  // - DEPARTMENT_MANAGER: chỉ xem employees trong department của họ quản lý
  // - HR_MANAGER: xem tất cả employees (sẽ lọc bỏ ADMIN ở frontend)
  // - ADMIN: xem tất cả
  const departmentIdFilter: number | undefined =
    user?.role === "DEPARTMENT_MANAGER" && user?.managed_department_ids?.[0]
      ? user.managed_department_ids[0] // Sử dụng managed_department_ids từ token
      : undefined;

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

  // Status filter - default to ACTIVE
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const [deleteAccount] = useDeleteAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] =
    useUpdateAccountByIdMutation();
  const [updateAccountStatus, { isLoading: isUpdatingStatus }] =
    useUpdateAccountStatusMutation();
const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(search), 400);
  return () => clearTimeout(t);
}, [search]);

  // ====== STATUS CHANGE STATE ======
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedEmployeeForStatus, setSelectedEmployeeForStatus] = useState<any | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [statusAlertModal, setStatusAlertModal] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ====== EMPLOYEES ======
    const { data, isLoading, error, refetch } = useGetEmployeesQuery(
    {
      token: token!,
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder,
      department_id: departmentIdFilter, // 👈 thêm filter theo role
      search: debouncedSearch,
      status: statusFilter !== "ALL" ? statusFilter : undefined, // 👈 filter theo status
    },
    { skip: !token }
  );

  // Expose refetch function to parent
  useEffect(() => {
    if (onRefresh) {
      (window as any).__employeeTableRefetch = refetch;
    }
  }, [refetch, onRefresh]);

  // ====== ACCOUNTS (để lấy role) ======
  const { data: accountsData } = useGetAccountsQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const employeeRoleMap = useMemo(() => {
    const map = new Map<string, string>();

    if (!accountsData?.data?.accounts) return map;

    accountsData.data.accounts.forEach((account: any) => {
      if (account.employee_id && account.employee_id !== 0) {
        map.set(String(account.employee_id), account.role || "N/A");
      }
    });

    return map;
  }, [accountsData?.data?.accounts]);

  const employeeAccountMap = useMemo(() => {
    const map = new Map<string, string>();

    if (!accountsData?.data?.accounts) return map;

    accountsData.data.accounts.forEach((account: any) => {
      if (account.employee_id && account.employee_id !== 0) {
        map.set(String(account.employee_id), account.id);
      }
    });

    return map;
  }, [accountsData?.data?.accounts]);

  const employeeAccountStatusMap = useMemo(() => {
    const map = new Map<string, string>();

    if (!accountsData?.data?.accounts) return map;

    accountsData.data.accounts.forEach((account: any) => {
      if (account.employee_id && account.employee_id !== 0) {
        map.set(String(account.employee_id), account.status || "INACTIVE");
      }
    });

    return map;
  }, [accountsData?.data?.accounts]);

  const handleEditRole = (employeeId: number, currentRole: string) => {
    setEditingRoleId(employeeId);
    setSelectedRole(currentRole);
  };

  const handleCancelEdit = () => {
    setEditingRoleId(null);
    setSelectedRole("");
  };

  const handleSaveRole = async (employeeId: number, employee: any) => {
    if (!token || !selectedRole) return;

    const accountId = employeeAccountMap.get(String(employeeId));
    if (!accountId) {
      alert("Cannot find account for this employee");
      return;
    }

    try {
      await updateAccount({
        id: accountId,
        body: {
          email: employee.email,
          full_name: employee.full_name,
          role: selectedRole,
          status: employee.status,
          department_name: employee.department_name || "",
          position_name: employee.position_name || "",
          employee_code: employee.employee_code,
        },
      }).unwrap();

      refetch();
      setEditingRoleId(null);
      setSelectedRole("");
    } catch (err) {
      console.error("Failed to update role", err);
      alert("Failed to update role");
    }
  };

  // ====== STATUS CHANGE HANDLERS ======
  const openStatusModal = (employee: any) => {
    setSelectedEmployeeForStatus(employee);
    setStatusChangeReason("");
    setStatusModalOpen(true);
  };

  const handleStatusChange = async () => {
    if (!token || !selectedEmployeeForStatus) return;
    
    if (!statusChangeReason.trim()) {
      setStatusAlertModal({
        type: "error",
        message: "Please provide a reason",
      });
      return;
    }

    const accountId = employeeAccountMap.get(String(selectedEmployeeForStatus.id));
    if (!accountId) {
      setStatusAlertModal({
        type: "error",
        message: "Account ID not found",
      });
      return;
    }

    // Get account status from map (ACTIVE or LOCKED)
    const currentAccountStatus = employeeAccountStatusMap.get(String(selectedEmployeeForStatus.id)) || "LOCKED";
    const newStatus = currentAccountStatus === "ACTIVE" ? "LOCKED" : "ACTIVE";

    console.log("[STATUS CHANGE DEBUG]", {
      employeeId: selectedEmployeeForStatus.id,
      accountId,
      currentAccountStatus,
      newStatus,
      reason: statusChangeReason,
    });

    try {
      await updateAccountStatus({
        id: accountId,
        token,
        status: newStatus,
        reason: statusChangeReason,
      }).unwrap();

      // Close the confirm modal first
      setStatusModalOpen(false);
      setSelectedEmployeeForStatus(null);
      setStatusChangeReason("");
      
      // Refetch to get updated data
      await refetch();

      // Show success modal
      setStatusAlertModal({
        type: "success",
        message: `Account ${newStatus === "LOCKED" ? "deactivated" : "activated"} successfully!`,
      });
    } catch (err: any) {
      console.error("Failed to update account status:", err);
      
      // Close the confirm modal
      setStatusModalOpen(false);
      setSelectedEmployeeForStatus(null);
      setStatusChangeReason("");
      
      // Show error modal
      setStatusAlertModal({
        type: "error",
        message: err?.data?.message || "Failed to update account status",
      });
    }
  };

  if (isLoading) return <p className="p-4 text-center">Loading employees...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">
        Failed to load employees 😢
      </p>
    );

  let employees = data?.data?.employees || [];
  
  // Lọc theo role
  if (user?.role === "HR_MANAGER") {
    // HR_MANAGER: xem tất cả trừ ADMIN
    employees = employees.filter((emp: any) => {
      const empRole = employeeRoleMap.get(String(emp.id));
      return empRole !== "ADMIN";
    });
  }
  // DEPARTMENT_MANAGER: xem tất cả trong department (đã filter ở API level)
  
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
      {/* Search bar and Status Filter */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-3">
         <input
  type="text"
  placeholder="Search by code or name..."
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setPage(1);
  }}
  className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm ..."
/>

        </div>
        
        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "ACTIVE" | "INACTIVE" | "ALL");
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ALL">All</option>
          </select>
        </div>
        
        {/* Status Filter Dropdown */}
        {/* <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "ACTIVE" | "INACTIVE" | "ALL");
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ALL">All</option>
          </select>
        </div> */}
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* ===== HEADER ===== */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {/* các header giữ nguyên, mình không sửa lại cho ngắn */}
              {/* ... Employee Code, Email, Full Name, Role, Department, Position ... */}
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

              {/* Email */}
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

              {/* Full name */}
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

              {/* Role */}
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

              {/* Department */}
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
                    ) : sortBy === "department_name" &&
                      sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TableCell>

              {/* Position */}
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
                    ) : sortBy === "position_name" &&
                      sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TableCell>

              {/* Status */}
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <button
                    type="button"
                    title="Sort by status"
                    onClick={() => toggleSort("status")}
                    className={`p-1 rounded ${
                      sortBy === "status"
                        ? "text-brand-600"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {sortBy === "status" && sortOrder === "ASC" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : sortBy === "status" && sortOrder === "DESC" ? (
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

          {/* ===== BODY ===== */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {employees.map((emp) => (
              <TableRow key={emp.id}>
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
                        {emp.employee_code}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {emp.email}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {emp.full_name}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {(() => {
                    const role = employeeRoleMap.get(String(emp.id));
                    const currentRole = role || "N/A";

                    if (editingRoleId === emp.id) {
                      return (
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="HR_MANAGER">HR_MANAGER</option>
                          <option value="DEPARTMENT_MANAGER">
                            DEPARTMENT_MANAGER
                          </option>
                          <option value="EMPLOYEE">EMPLOYEE</option>
                        </select>
                      );
                    }

                    return currentRole;
                  })()}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {emp.department_name || "-"}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {emp.position_name || "-"}
                </TableCell>

                {/* Status Cell - Display Account Status */}
                <TableCell className="px-4 py-3 text-theme-sm">
                  {(() => {
                    const accountStatus = employeeAccountStatusMap.get(String(emp.id)) || "LOCKED";
                    return (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          accountStatus === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                        }`}
                      >
                        {accountStatus}
                      </span>
                    );
                  })()}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/employee-list/${emp.id}`}
                      className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      View Profile
                    </Link>

                    {/* NÚT ACTIVATE/DEACTIVATE */}
                    {(() => {
                      const accountStatus = employeeAccountStatusMap.get(String(emp.id)) || "LOCKED";
                      return (
                        <button
                          type="button"
                          onClick={() => openStatusModal(emp)}
                          disabled={isUpdatingStatus}
                          className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium ${
                            accountStatus === "ACTIVE"
                              ? "text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:text-red-500"
                              : "text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-500/10 dark:text-green-500"
                          }`}
                        >
                          {accountStatus === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      );
                    })()}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ===== PAGINATION ===== */}
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

      {/* ===== STATUS CHANGE MODAL ===== */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedEmployeeForStatus(null);
          setStatusChangeReason("");
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            {selectedEmployeeForStatus && employeeAccountStatusMap.get(String(selectedEmployeeForStatus.id)) === "ACTIVE" ? "Deactivate" : "Activate"} Account
          </h3>

          {selectedEmployeeForStatus && (
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to{" "}
              <strong>
                {employeeAccountStatusMap.get(String(selectedEmployeeForStatus.id)) === "ACTIVE" ? "deactivate" : "activate"}
              </strong>{" "}
              account for{" "}
              <span className="font-medium text-gray-800 dark:text-white/90">
                {selectedEmployeeForStatus.full_name}
              </span>{" "}
              ({selectedEmployeeForStatus.employee_code})?
            </p>
          )}

          <div className="mb-6">
            <Label>Reason <span className="text-error-500">*</span></Label>
            <textarea
              placeholder="Enter reason for status change"
              className="mt-1 h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={statusChangeReason}
              onChange={(e) => setStatusChangeReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setStatusModalOpen(false);
                setSelectedEmployeeForStatus(null);
                setStatusChangeReason("");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <Button
              size="sm"
              onClick={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== STATUS ALERT MODAL ===== */}
      <Modal
        isOpen={!!statusAlertModal}
        onClose={() => setStatusAlertModal(null)}
        className="max-w-md m-4"
      >
        <div className="w-full p-6">
          {statusAlertModal && (
            <>
              <Alert
                variant={statusAlertModal.type}
                title={statusAlertModal.type === "success" ? "Success" : "Failed"}
                message={statusAlertModal.message}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatusAlertModal(null)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
