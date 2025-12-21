import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Link } from "react-router"; // nếu bạn dùng react-router-dom thì import từ "react-router-dom"
import { useAppSelector } from "../../../redux/hook";
import { 
  useGetDepartmentsQuery, 
  useGetManagersQuery, 
  useUpdateDepartmentMutation, 
  useDeleteDepartmentMutation, 
  useGetEmployeesQuery, 
  useGetEmployeeByIdQuery,
  useAssignManagerToDepartmentMutation,
  useUnassignManagerFromDepartmentMutation 
} from "../../../redux/api/employeeApiSlice";
import Select from "react-select";
import { Trash2, ChevronUp, ChevronDown, ChevronsUpDown, UserCheck, UserX } from "lucide-react";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
type ManagerNameCellProps = {
  managerId: number | null | undefined;
  token: string | undefined | null;
};

const ManagerNameCell: React.FC<ManagerNameCellProps> = ({ managerId, token }) => {
  const { data, isLoading } = useGetEmployeeByIdQuery(
    { token: token || "", id: managerId as number },
    {
      skip: !token || !managerId,
    }
  );

  if (!managerId) {
    return <span>-</span>;
  }

  if (isLoading) {
    return <span className="text-xs text-gray-400">Loading...</span>;
  }

  const fullName = data?.data?.full_name;

  return <span>{fullName || "-"}</span>;
};

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
console.log('====================================');
console.log(data);
console.log('====================================');
  const { data: managers, isLoading: isLoadingManagers } = useGetManagersQuery({ token: token! });

  // Fetch all employees to check department staff count
  const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );
  
  const [updateDepartment] = useUpdateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();
  const [assignManager] = useAssignManagerToDepartmentMutation();
  const [unassignManager] = useUnassignManagerFromDepartmentMutation();

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // modal state
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedManager, setSelectedManager] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation modal state
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const [departmentToDelete, setDepartmentToDelete] = useState<any | null>(null);
  const [employeeCountInDept, setEmployeeCountInDept] = useState<number>(0);

  // Assign/Unassign Manager modal state
  const { isOpen: isAssignManagerModalOpen, openModal: openAssignManagerModal, closeModal: closeAssignManagerModal } = useModal();
  const [departmentForManager, setDepartmentForManager] = useState<any | null>(null);
  const [managerAction, setManagerAction] = useState<"assign" | "unassign">("assign");
  const [selectedNewManager, setSelectedNewManager] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Alert modal state for notifications
  const [alert, setAlert] = useState<
    null | { type: "success" | "error"; message: string }
  >(null);

  // react-select options for managers
  // In modal we want label as "employee_code - full_name" and value as full manager object
  const managerOptions =
    managers?.data?.managers?.map((m: any) => ({ value: m, label: `${m.employee_code} - ${m.full_name}` })) ?? [];

  if (isLoading) return <p className="p-4 text-center">Loading departments...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load departments 😢</p>
    );

  // ✅ lấy đúng mảng và thông tin phân trang
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

  // helper to generate an array of page items (numbers or -1 for ellipses)
    const getPageItems = (total: number, current: number) => {
      const items: number[] = [];
      if (total <= 10) {
        for (let i = 1; i <= total; i++) items.push(i);
        return items;
      }

      // for many pages, show: 1, ..., left..right, ..., total
      const delta = 2; // neighbor range
      const left = Math.max(2, current - delta);
      const right = Math.min(total - 1, current + delta);

      items.push(1);
      if (left > 2) items.push(-1);
      for (let i = left; i <= right; i++) items.push(i);
      if (right < total - 1) items.push(-1);
      items.push(total);
      return items;
    };

  // Helper function to count employees in a department
  const getEmployeeCountInDepartment = (departmentId: number): number => {
    if (!employeesData?.data?.employees) {
      return 0;
    }
    
    const employees = employeesData.data.employees;
    const employeesInDept = employees.filter((emp: any) => {
      return emp.department_id === departmentId;
    });
    
    return employeesInDept.length;
  };

  // Handle delete with staff check
  const handleDeleteDepartment = async (dept: any) => {
    if (!token) return;
    
    // Check if employee data is still loading
    if (isLoadingEmployees) {
      alert("Please wait, loading employee data...");
      return;
    }
    
    const employeeCount = getEmployeeCountInDepartment(dept.id);
    
    // Open modal with department info and employee count
    setDepartmentToDelete(dept);
    setEmployeeCountInDept(employeeCount);
    openDeleteModal();
  };

  // Confirm delete action
  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete || !token) return;

    try {
      setDeletingId(departmentToDelete.id);
      await deleteDepartment({ token: token!, id: departmentToDelete.id }).unwrap();
      try {
        refetch();
      } catch (e) {
        /* ignore */
      }
      setDeletingId(null);
      closeDeleteModal();
      setDepartmentToDelete(null);
      setEmployeeCountInDept(0);
    } catch (err: any) {
      console.error("Failed to delete department", err);
      const errorMessage = err?.data?.message || "Failed to delete department. Please try again.";
      alert(errorMessage);
      setDeletingId(null);
    }
  };


  const saveSelectedManager = async () => {
    if (selectedDeptId === null) return;
    // Validation: manager must be selected and must have a numeric id
    if (!selectedManager) {
      setFormError("Please select a manager.");
      return;
    }
    const mgrId = Number(selectedManager.id);
    if (!Number.isFinite(mgrId) || Number.isNaN(mgrId)) {
      setFormError("Selected manager has an invalid ID.");
      return;
    }

    setFormError(null);
    setIsSaving(true);
    const body: any = { manager_id: mgrId };
    try {
      await updateDepartment({ token: token!, id: selectedDeptId, body }).unwrap();
      try {
        refetch();
      } catch (e) {
        // ignore
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save manager", err);
      setFormError("Failed to save manager. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle assign manager action
  const handleAssignManager = (dept: any) => {
    setDepartmentForManager(dept);
    setManagerAction("assign");
    setSelectedNewManager(null);
    openAssignManagerModal();
  };

  // Handle unassign manager action
  const handleUnassignManager = (dept: any) => {
    setDepartmentForManager(dept);
    setManagerAction("unassign");
    openAssignManagerModal();
  };

  // Confirm assign/unassign manager
  const confirmManagerAction = async () => {
    if (!departmentForManager || !token) return;

    if (managerAction === "assign" && !selectedNewManager) {
      setAlert({ type: "error", message: "Please select a manager." });
      return;
    }

    try {
      setIsProcessing(true);
      
      if (managerAction === "assign") {
        // Convert to number to ensure proper type
        const managerId = Number(selectedNewManager.id);
        if (!Number.isFinite(managerId) || managerId <= 0) {
          setAlert({ type: "error", message: "Invalid manager ID." });
          setIsProcessing(false);
          return;
        }

        await assignManager({
          token,
          id: departmentForManager.id,
          body: { manager_id: managerId }
        }).unwrap();
        setAlert({ 
          type: "success", 
          message: `Manager "${selectedNewManager.full_name}" has been successfully assigned to "${departmentForManager.department_name}".` 
        });
      } else {
        await unassignManager({
          token,
          id: departmentForManager.id
        }).unwrap();
        setAlert({ 
          type: "success", 
          message: `Manager has been successfully unassigned from "${departmentForManager.department_name}".` 
        });
      }

      try {
        refetch();
      } catch (e) {
        /* ignore */
      }
      
      closeAssignManagerModal();
      setDepartmentForManager(null);
      setSelectedNewManager(null);
    } catch (err: any) {
      console.error(`Failed to ${managerAction} manager`, err);
      const errorMessage = err?.data?.message || `Failed to ${managerAction} manager. Please try again.`;
      setAlert({ type: "error", message: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const pagination = data?.data?.pagination;
  
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
      {/* <select
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
      </select> */}

      {/* Sort by */}
          {/* Sort controls moved to the table header as small icons */}
    </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Department</span>
                    <button
                      type="button"
                      title="Sort by name"
                      onClick={() => toggleSort("department_name")}
                      className={`p-1 rounded ${sortBy === "department_name" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
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

                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Code</span>
                    <button
                      type="button"
                      title="Sort by code"
                      onClick={() => toggleSort("department_code")}
                      className={`p-1 rounded ${sortBy === "department_code" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
                    >
                      {sortBy === "department_code" && sortOrder === "ASC" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : sortBy === "department_code" && sortOrder === "DESC" ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronsUpDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Description</span>
                  <button
                    type="button"
                    title="Sort by description"
                    onClick={() => toggleSort("description")}
                    className={`p-1 rounded ${sortBy === "description" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
                  >
                    {sortBy === "description" && sortOrder === "ASC" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : sortBy === "description" && sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </TableCell>
              {/* <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <button
                    type="button"
                    title="Sort by status"
                    onClick={() => toggleSort("status")}
                    className={`p-1 rounded ${sortBy === "status" ? "text-brand-600" : "text-gray-400 dark:text-gray-500"}`}
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
              </TableCell> */}
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
                      <ChevronUp className="h-4 w-4" />
                    ) : sortBy === "office_address" && sortOrder === "DESC" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronsUpDown className="h-5 w-5" />
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
                        <ChevronUp className="h-4 w-4" />
                      ) : sortBy === "manager_id" && sortOrder === "DESC" ? (
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
                  {/* <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {d.status ?? "-"}
                  </TableCell> */}
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {d.office_address ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {/* Plain text manager name in table */}
                    {/* {managers?.data?.managers?.find((m: any) => String(m.id) === String(d.manager_id))?.full_name ?? "-"} */}
                     <ManagerNameCell managerId={d.manager_id} token={token} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/department-config/${d.id}`}
                        className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        View Detail
                      </Link>

                      {/* Assign/Unassign Manager button */}
                      {d.manager_id ? (
                        <button
                          type="button"
                          title="Unassign manager"
                          onClick={() => handleUnassignManager(d)}
                          className="ml-3 text-sm text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                        >
                          <UserX className="h-4 w-4 inline" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Assign manager"
                          onClick={() => handleAssignManager(d)}
                          className="ml-3 text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <UserCheck className="h-4 w-4 inline" />
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        type="button"
                        title="Delete department"
                        onClick={() => handleDeleteDepartment(d)}
                        className="ml-3 text-sm text-red-600 hover:text-red-800"
                      >
                        {deletingId === d.id ? (
                          <span className="text-xs">Deleting...</span>
                        ) : (
                          <Trash2 className="h-4 w-4 inline" />
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
      {/* Change Manager Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4 p-6">
        <h3 className="text-lg font-medium mb-4">Change Manager</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Select Manager</label>
            <Select
              isDisabled={isLoadingManagers}
              isLoading={isLoadingManagers}
              options={managerOptions}
              value={
                selectedManager
                  ? { value: selectedManager, label: `${selectedManager.employee_code} - ${selectedManager.full_name}` }
                  : null
              }
              onChange={(opt: any) => {
                const val = opt && opt.value ? opt.value : null;
                setSelectedManager(val);
                setFormError(null);
              }}
              placeholder="Search by employee_code - full_name"
              isClearable
              classNamePrefix="react-select"
            />
                {formError && (
                  <p className="text-sm text-red-600 mt-2">{formError}</p>
                )}
          </div>

          {/* Selected manager details */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
            {selectedManager ? (
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <p><strong>ID:</strong> {selectedManager.id}</p>
                <p><strong>Employee code:</strong> {selectedManager.employee_code}</p>
                <p><strong>Full name:</strong> {selectedManager.full_name}</p>
                <p><strong>Email:</strong> {selectedManager.email}</p>
                <p><strong>Department:</strong> {selectedManager.department_name ?? selectedManager.department_id}</p>
                <p><strong>Position:</strong> {selectedManager.position_name ?? selectedManager.position_id}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No manager selected</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={closeModal}>Cancel</Button>
            <Button size="sm" onClick={saveSelectedManager} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} className="max-w-[500px] m-4 p-6">
        <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
          {employeeCountInDept > 0 ? "Cannot Delete Department" : "Confirm Delete"}
        </h3>
        <div className="space-y-4">
          {employeeCountInDept > 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Cannot delete department <strong>"{departmentToDelete?.department_name}"</strong> because it has{" "}
                <strong>{employeeCountInDept} employee(s)</strong>.
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                Please reassign or remove all employees before deleting this department.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Are you sure you want to delete department <strong>"{departmentToDelete?.department_name}"</strong>?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                This department has no employees. This action cannot be undone.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            {employeeCountInDept === 0 && (
              <Button
                size="sm"
                onClick={confirmDeleteDepartment}
                disabled={deletingId === departmentToDelete?.id}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingId === departmentToDelete?.id ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Assign/Unassign Manager Modal */}
      <Modal isOpen={isAssignManagerModalOpen} onClose={closeAssignManagerModal} className="max-w-md m-4">
        <div className="w-full p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            {managerAction === "assign" ? "Assign Manager" : "Unassign Manager"}
          </h3>

          {managerAction === "assign" ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a manager for department: <span className="font-semibold">{departmentForManager?.department_name}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Manager
                </label>
                <Select
                  isDisabled={isLoadingManagers}
                  isLoading={isLoadingManagers}
                  options={managerOptions}
                  value={
                    selectedNewManager
                      ? { value: selectedNewManager, label: `${selectedNewManager.employee_code} - ${selectedNewManager.full_name}` }
                      : null
                  }
                  onChange={(opt: any) => {
                    const val = opt && opt.value ? opt.value : null;
                    setSelectedNewManager(val);
                  }}
                  placeholder="Search by employee_code - full_name"
                  isClearable
                  classNamePrefix="react-select"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to unassign the manager from department: <span className="font-semibold">{departmentForManager?.department_name}</span>?
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={closeAssignManagerModal}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmManagerAction}
              disabled={isProcessing || (managerAction === "assign" && !selectedNewManager)}
            >
              {isProcessing ? "Processing..." : managerAction === "assign" ? "Assign" : "Unassign"}
            </Button>
          </div>
        </div>
      </Modal>

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

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {getPageItems(pagination.total_pages, pagination.page).map((p, idx) =>
                p === -1 ? (
                  <span key={`e-${idx}`} className="px-2 text-sm text-gray-500">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={p === pagination.page}
                    className={`px-3 py-1 rounded-md text-sm ${
                      p === pagination.page
                        ? 'bg-brand-600 text-white dark:bg-brand-500'
                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
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

      {/* Alert Modal for Notifications */}
      <Modal
        isOpen={!!alert}
        onClose={() => setAlert(null)}
        className="max-w-md m-4"
      >
        <div className="w-full p-6">
          {alert && (
            <>
              <Alert
                variant={alert.type}
                title={alert.type === "success" ? "Success" : "Failed"}
                message={alert.message}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAlert(null)}
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
};

export default DepartmenTable;
