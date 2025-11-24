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
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";

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

  const { data: managers, isLoading: isLoadingManagers } = useGetManagersQuery({ token: token! });
  const [updateDepartment] = useUpdateDepartmentMutation();

  // modal state
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedManager, setSelectedManager] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const saveSelectedManager = async () => {
    if (selectedDeptId === null) return;
    setIsSaving(true);
    const body: any = { manager_id: selectedManager ? Number(selectedManager.id) : null };
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
    } finally {
      setIsSaving(false);
    }
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
                    {/* Plain text manager name in table */}
                    {managers?.data?.managers?.find((m: any) => String(m.id) === String(d.manager_id))?.full_name ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/department-config/${d.id}`}
                        className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        View Detail
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          // open modal and set selected dept + manager
                          setSelectedDeptId(d.id);
                          const mgr = managers?.data?.managers?.find(
                            (m: any) => String(m.id) === String(d.manager_id)
                          ) ?? null;
                          setSelectedManager(mgr);
                          openModal();
                        }}
                        className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200 ml-2 text-sm"
                      >
                        Change Manager
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
              }}
              placeholder="Search by employee_code - full_name"
              isClearable
              classNamePrefix="react-select"
            />
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
