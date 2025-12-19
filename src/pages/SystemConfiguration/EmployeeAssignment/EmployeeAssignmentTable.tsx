import { useState, useMemo } from "react";
import { useAppSelector } from "../../../redux/hook";
import { useGetEmployeesQuery } from "../../../redux/api/employeeApiSlice";
import { useGetAccountsQuery } from "../../../redux/api/authApiSlice";
import {
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "../../../components/ui/table";
import Button from "../../../components/ui/button/Button";
import { MoreVertical } from "lucide-react";
import AssignDepartmentModal from "../EmployeeAssignment/AssignDepartmentModal";
import AssignPositionModal from "../EmployeeAssignment/AssignPositionModal";
import TransferDepartmentModal from "../EmployeeAssignment/TransferDepartmentModal";
import RemoveDepartmentModal from "../EmployeeAssignment/RemoveDepartmentModal";
import RemovePositionModal from "../EmployeeAssignment/RemovePositionModal";

interface EmployeeAssignmentTableProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function EmployeeAssignmentTable({
  onSuccess,
  onError,
}: EmployeeAssignmentTableProps) {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [page, setPage] = useState(1);
  const limit = 10;

  // Filter state
  const [employeeCodeFilter, setEmployeeCodeFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const { data: employees, isLoading, error, refetch } = useGetEmployeesQuery(
    { token: token!, limit, page },
    { skip: !token }
  );

  // Fetch accounts to get roles
  const { data: accountsData, refetch: refetchAccounts } = useGetAccountsQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  // Create employee_id -> role map from accounts
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

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [modalType, setModalType] = useState<
    | "assign-department"
    | "assign-position"
    | "transfer-department"
    | "remove-department"
    | "remove-position"
    | null
  >(null);

  // State for dropdown menu
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const openModal = (type: typeof modalType, employee: any) => {
    setSelectedEmployee(employee);
    setModalType(type);
    setOpenDropdownId(null); // Close dropdown when opening modal
  };

  const closeModal = () => {
    setSelectedEmployee(null);
    setModalType(null);
    // Refetch data after closing modal to get updated list
    refetch();
    refetchAccounts();
  };

  if (isLoading) {
    return <p className="p-4 text-center">Loading employees...</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-center text-red-500">Failed to load employees 😢</p>
    );
  }

  // Filter: Only show employees that have an account with role !== "ADMIN"
  let filteredEmployees = employees?.data?.employees?.filter((emp: any) => {
    const accountRole = employeeRoleMap.get(String(emp.id));
    // Only show if employee has an account AND role is not ADMIN
    return accountRole && accountRole !== "ADMIN";
  }) || [];

  // Apply client-side filters
  if (employeeCodeFilter) {
    filteredEmployees = filteredEmployees.filter((emp: any) =>
      emp.employee_code?.toLowerCase().includes(employeeCodeFilter.toLowerCase())
    );
  }

  if (roleFilter !== "ALL") {
    filteredEmployees = filteredEmployees.filter((emp: any) => {
      const accountRole = employeeRoleMap.get(String(emp.id));
      return accountRole === roleFilter;
    });
  }

  const pagination = employees?.data?.pagination;

  // Helper to generate page items
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
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
          {/* Employee Code Search */}
          <input
            type="text"
            placeholder="Search by employee code..."
            value={employeeCodeFilter}
            onChange={(e) => {
              setEmployeeCodeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="ALL">All Roles</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="HR_MANAGER">HR Manager</option>
            <option value="DEPARTMENT_MANAGER">Department Manager</option>
          </select>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  ID
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Employee Code
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Full Name
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Email
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Department
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Position
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Role
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp: any) => (
                  <TableRow key={emp.id}>
                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      {emp.id}
                    </TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {emp.employee_code}
                      </span>
                    </TableCell>

                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'N/A'}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      {emp.email}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      {emp.department_name || (
                        <span className="text-gray-400 italic">Not assigned</span>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      {emp.position_name || (
                        <span className="text-gray-400 italic">Not assigned</span>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        {employeeRoleMap.get(String(emp.id)) || "N/A"}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        {!emp.department_id ? (
                          // Only 1 action: show button directly
                          <button
                            onClick={() => openModal("assign-department", emp)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                          >
                            Assign Dept
                          </button>
                        ) : (
                          // Multiple actions: show dropdown
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === String(emp.id) ? null : String(emp.id))}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>

                            {openDropdownId === String(emp.id) && (
                              <>
                                {/* Backdrop to close dropdown */}
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenDropdownId(null)}
                                />

                                {/* Dropdown menu */}
                                <div className="absolute right-0 z-20 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                                  <button
                                    onClick={() => openModal("transfer-department", emp)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-2"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                                    Transfer Dept
                                  </button>

                                  <button
                                    onClick={() => openModal("remove-department", emp)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                  >
                                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                    Remove Dept
                                  </button>

                                  {!emp.position_id ? (
                                    <button
                                      onClick={() => openModal("assign-position", emp)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                      Assign Position
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => openModal("remove-position", emp)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                                      Remove Position
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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

              {/* Page number buttons */}
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

      {/* Modals */}
      {selectedEmployee && modalType === "assign-department" && (
        <AssignDepartmentModal
          employee={selectedEmployee}
          onClose={closeModal}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      {selectedEmployee && modalType === "assign-position" && (
        <AssignPositionModal
          employee={selectedEmployee}
          onClose={closeModal}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      {selectedEmployee && modalType === "transfer-department" && (
        <TransferDepartmentModal
          employee={selectedEmployee}
          onClose={closeModal}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      {selectedEmployee && modalType === "remove-department" && (
        <RemoveDepartmentModal
          employee={selectedEmployee}
          onClose={closeModal}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      {selectedEmployee && modalType === "remove-position" && (
        <RemovePositionModal
          employee={selectedEmployee}
          onClose={closeModal}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
    </>
  );
}
