import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Link } from "react-router";
import { useAppSelector } from "../../../redux/hook";
import {
  useGetLeaveTypesQuery,
  useDeleteLeaveTypeMutation,
  LeaveTypeStatus,
} from "../../../redux/api/leaveApiSlice";
import { Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

const LeaveTypeTable = () => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [page, setPage] = useState(1);
  const limit = 4;

  // Filter state
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");
  const [isPaidFilter, setIsPaidFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<
    | "created_at"
    | "leave_type_code"
    | "leave_type_name"
    | "max_days_per_year"
    | "status"
    | "is_paid"
    | "sort_order"
  >("sort_order");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const { data, isLoading, error, refetch } = useGetLeaveTypesQuery(
    {
      token: token!,
      page,
      limit,
      status: status === "ALL" ? undefined : status,
      is_paid: isPaidFilter === "ALL" ? undefined : isPaidFilter === "PAID",
      search: search || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
    { skip: !token }
  );

  console.log("Leave Types Data:", data);

  const [deleteLeaveType] = useDeleteLeaveTypeMutation();

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Delete confirmation modal state
  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal();
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<any | null>(null);

  if (isLoading) return <p className="p-4 text-center">Loading leave types...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load leave types 😢</p>
    );

  const leaveTypes = data?.data ?? [];

  // Toggle sort: ASC -> DESC -> reset to default (sort_order ASC)
  const toggleSort = (
    field:
      | "created_at"
      | "leave_type_code"
      | "leave_type_name"
      | "max_days_per_year"
      | "status"
      | "is_paid"
      | "sort_order"
  ) => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder("ASC");
    } else if (sortBy === field && sortOrder === "ASC") {
      setSortOrder("DESC");
    } else {
      // reset to default
      setSortBy("sort_order");
      setSortOrder("ASC");
    }
    setPage(1);
  };

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

  // Handle delete
  const handleDeleteLeaveType = async (leaveType: any) => {
    if (!token) return;

    setLeaveTypeToDelete(leaveType);
    openDeleteModal();
  };

  // Confirm delete action
  const confirmDeleteLeaveType = async () => {
    if (!leaveTypeToDelete || !token) return;

    try {
      setDeletingId(leaveTypeToDelete.id);
      await deleteLeaveType({ token: token!, id: leaveTypeToDelete.id }).unwrap();
      try {
        refetch();
      } catch (e) {
        /* ignore */
      }
      setDeletingId(null);
      closeDeleteModal();
      setLeaveTypeToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete leave type", err);
      const errorMessage =
        err?.data?.message || "Failed to delete leave type. Please try again.";
      alert(errorMessage);
      setDeletingId(null);
    }
  };

  const pagination = data?.data?.pagination;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by code or name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
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

        {/* Is Paid */}
        <select
          value={isPaidFilter}
          onChange={(e) => {
            setIsPaidFilter(e.target.value as any);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="ALL">All types</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
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
                Order
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Leave Type
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Code
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Max Days/Year
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Type
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {leaveTypes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  No leave types found
                </TableCell>
              </TableRow>
            ) : (
              leaveTypes.map((lt) => (
                <TableRow key={lt.id}>
                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {lt.sort_order}
                  </TableCell>

                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: lt.color_hex }}
                      >
                        {lt.icon ? (
                          <span className="text-white text-lg">{lt.icon}</span>
                        ) : (
                          <span className="text-white text-xs font-bold">
                            {lt.leave_type_code.substring(0, 2)}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {lt.leave_type_name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {lt.description || "-"}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-4 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">
                      {lt.leave_type_code}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {lt.max_days_per_year ?? "Unlimited"}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        lt.is_paid
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                      }`}
                    >
                      {lt.is_paid ? "Paid" : "Unpaid"}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        lt.status === "ACTIVE"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {lt.status}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex items-center gap-3 justify-center">
                      <Link
                        to={`/leave-type-config/${lt.id}`}
                        className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        View Detail
                      </Link>

                      {/* Delete button */}
                      <button
                        type="button"
                        title="Delete leave type"
                        onClick={() => handleDeleteLeaveType(lt)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        {deletingId === lt.id ? (
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        className="max-w-[500px] m-4 p-6"
      >
        <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
          Confirm Delete
        </h3>
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Are you sure you want to delete leave type{" "}
              <strong>"{leaveTypeToDelete?.leave_type_name}"</strong>?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmDeleteLeaveType}
              disabled={deletingId === leaveTypeToDelete?.id}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId === leaveTypeToDelete?.id ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

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
  );
};

export default LeaveTypeTable;
