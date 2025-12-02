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
} from "../../redux/api/authApiSlice";
import { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import {
  useGetEmployeesQuery,
  useTerminateEmployeeMutation,
} from "../../redux/api/employeeApiSlice";

import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import DatePicker from "../../components/form/date-picker";
import Button from "../../components/ui/button/Button";

export default function EmployeeTable() {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );
  const user = useAppSelector(
    (state) => state.auth.userState?.data?.user
  );
  // Nếu là DEPARTMENT_MANAGER thì chỉ xem được nhân viên thuộc phòng ban được quản lý
  const departmentIdFilter: number | undefined =
    user?.role === "DEPARTMENT_MANAGER"
      ? user?.managed_department_ids?.[0]
      : undefined;
console.log('====================================');
console.log(departmentIdFilter);
console.log('====================================');
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
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const [deleteAccount] = useDeleteAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] =
    useUpdateAccountByIdMutation();

  // ====== TERMINATE STATE ======
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [terminateForm, setTerminateForm] = useState({
    termination_date: "",
    termination_reason: "",
  });
  const [terminateErrors, setTerminateErrors] = useState<{
    termination_date?: string;
    termination_reason?: string;
  }>({});
  const [terminateEmployee, { isLoading: isTerminating }] =
    useTerminateEmployeeMutation();

  // ====== EMPLOYEES ======
    const { data, isLoading, error, refetch } = useGetEmployeesQuery(
    {
      token: token!,
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder,
      department_id: departmentIdFilter, // 👈 thêm filter theo role
    },
    { skip: !token }
  );
console.log('====================================');
console.log(data);
console.log('====================================');

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

  // ====== TERMINATE HANDLERS ======
  const openTerminateModal = (employee: any) => {
    if (employee.status !== "ACTIVE") return; // chỉ cho terminate ACTIVE

    setSelectedEmployee(employee);
    setTerminateForm({
      termination_date: "",
      termination_reason: "",
    });
    setTerminateErrors({});
    setTerminateModalOpen(true);
  };

  const handleTerminate = async () => {
    if (!token || !selectedEmployee) return;

    const errs: typeof terminateErrors = {};
    if (!terminateForm.termination_date) {
      errs.termination_date = "Termination date is required";
    }
    if (!terminateForm.termination_reason.trim()) {
      errs.termination_reason = "Termination reason is required";
    }
    if (Object.keys(errs).length > 0) {
      setTerminateErrors(errs);
      return;
    }

    try {
      await terminateEmployee({
        token,
        id: selectedEmployee.id, // id employee
        body: {
          termination_date: terminateForm.termination_date,
          termination_reason: terminateForm.termination_reason,
        },
      }).unwrap();

      setTerminateModalOpen(false);
      setSelectedEmployee(null);
      refetch(); // load lại list
    } catch (err) {
      console.error("Terminate employee failed", err);
      alert("Terminate employee failed");
    }
  };

  if (isLoading) return <p className="p-4 text-center">Loading employees...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">
        Failed to load employees 😢
      </p>
    );

  const employees = data?.data?.employees || [];
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
      {/* Search bar (chưa wire search) */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by code or name..."
            className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </div>
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
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {emp.status}
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

                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/employee-list/${emp.id}`}
                      className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      View Profile
                    </Link>

                    {/* NÚT TERMINATE */}
                    <button
                      type="button"
                      onClick={() => openTerminateModal(emp)}
                      disabled={emp.status !== "ACTIVE"}
                      title={
                        emp.status === "ACTIVE"
                          ? "Terminate employee"
                          : "Employee already terminated"
                      }
                      className={`inline-flex items-center justify-center rounded-full p-1.5 text-sm ${
                        emp.status === "ACTIVE"
                          ? "text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        emp.status === "ACTIVE" ? "text-red-600" : "text-gray-400"
                      }`}>
                        {emp.status === "ACTIVE" ? "Active" : "Deactive"}
                      </span>
                    </button>
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

      {/* ===== MODAL TERMINATE ===== */}
      <Modal
        isOpen={terminateModalOpen}
        onClose={() => setTerminateModalOpen(false)}
        className="max-w-[500px] m-4"
      >
        <div className="w-full p-6">
          <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            Terminate Employee
          </h4>
          {selectedEmployee && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              You are terminating{" "}
              <span className="font-medium">
                {selectedEmployee.full_name}
              </span>{" "}
              ({selectedEmployee.employee_code}). Please provide termination
              date and reason.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <DatePicker
                id="termination-date"
                label="Termination Date"
                mode="single"
                placeholder="Select termination date"
                defaultDate={terminateForm.termination_date}
                onChange={(_, dateStr) =>
                  setTerminateForm((prev) => ({
                    ...prev,
                    termination_date: dateStr,
                  }))
                }
              />
              {terminateErrors.termination_date && (
                <p className="mt-1 text-xs text-error-500">
                  {terminateErrors.termination_date}
                </p>
              )}
            </div>

            <div>
              <Label>Termination Reason</Label>
              <textarea
                className="mt-1 h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={terminateForm.termination_reason}
                onChange={(e) =>
                  setTerminateForm((prev) => ({
                    ...prev,
                    termination_reason: e.target.value,
                  }))
                }
              />
              {terminateErrors.termination_reason && (
                <p className="mt-1 text-xs text-error-500">
                  {terminateErrors.termination_reason}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setTerminateModalOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <Button
              size="sm"
              onClick={handleTerminate}
              disabled={isTerminating}
            >
              {isTerminating ? "Terminating..." : "Confirm Terminate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
