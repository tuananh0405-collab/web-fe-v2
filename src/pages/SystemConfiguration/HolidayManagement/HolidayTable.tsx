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
  useGetHolidaysQuery,
  useDeleteHolidayMutation,
  HolidayStatus,
  HolidayType,
} from "../../../redux/api/holidayApiSlice";
import { Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

const currentYear = new Date().getFullYear();

const HolidayTable = () => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [page, setPage] = useState(1);
  const limit = 10;

  // Filter state
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");
  const [holidayTypeFilter, setHolidayTypeFilter] = useState<HolidayType | "ALL">("ALL");
  const [yearFilter, setYearFilter] = useState<number>(currentYear);

  const { data, isLoading, error, refetch } = useGetHolidaysQuery(
    {
      token: token!,
      page,
      limit,
      status: status === "ALL" ? undefined : (status as HolidayStatus),
      holiday_type: holidayTypeFilter === "ALL" ? undefined : holidayTypeFilter,
      year: yearFilter,
    },
    { skip: !token }
  );

  const [deleteHoliday] = useDeleteHolidayMutation();

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Delete confirmation modal state
  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal();
  const [holidayToDelete, setHolidayToDelete] = useState<any | null>(null);

  if (isLoading) return <p className="p-4 text-center">Loading holidays...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load holidays 😢</p>
    );

  const holidays = data?.data ?? [];
  const pagination = data?.data?.pagination;
  
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
  const handleDeleteHoliday = async (holiday: any) => {
    if (!token) return;

    setHolidayToDelete(holiday);
    openDeleteModal();
  };

  // Confirm delete action
  const confirmDeleteHoliday = async () => {
    if (!holidayToDelete || !token) return;

    try {
      setDeletingId(holidayToDelete.id);
      await deleteHoliday({ token: token!, id: holidayToDelete.id }).unwrap();
      try {
        refetch();
      } catch (e) {
        /* ignore */
      }
      setDeletingId(null);
      closeDeleteModal();
      setHolidayToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete holiday", err);
      const errorMessage =
        err?.data?.message || "Failed to delete holiday. Please try again.";
      alert(errorMessage);
      setDeletingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get badge color for holiday type
  const getHolidayTypeBadgeColor = (type: string) => {
    switch (type) {
      case "PUBLIC_HOLIDAY":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "COMPANY_HOLIDAY":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
      case "REGIONAL_HOLIDAY":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      case "RELIGIOUS_HOLIDAY":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Format holiday type for display
  const formatHolidayType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        {/* Year Filter */}
        <select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(Number(e.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "ACTIVE" | "INACTIVE" | "ALL");
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ALL">All status</option>
        </select>

        {/* Holiday Type Filter */}
        <select
          value={holidayTypeFilter}
          onChange={(e) => {
            setHolidayTypeFilter(e.target.value as HolidayType | "ALL");
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          <option value="ALL">All Types</option>
          <option value={HolidayType.PUBLIC_HOLIDAY}>Public Holiday</option>
          <option value={HolidayType.COMPANY_HOLIDAY}>Company Holiday</option>
          <option value={HolidayType.REGIONAL_HOLIDAY}>Regional Holiday</option>
          <option value={HolidayType.RELIGIOUS_HOLIDAY}>Religious Holiday</option>
        </select>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Holiday Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Date
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
                Applies To
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Paid
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Mandatory
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Recurring
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
            {holidays.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  No holidays found for {yearFilter}.
                </TableCell>
              </TableRow>
            ) : (
              holidays.map((holiday: any) => (
                <TableRow key={holiday.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {holiday.holiday_name}
                    </span>
                    {holiday.description && (
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {holiday.description}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {formatDate(holiday.holiday_date)}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getHolidayTypeBadgeColor(holiday.holiday_type)}`}>
                      {formatHolidayType(holiday.holiday_type)}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {holiday.applies_to}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        holiday.is_paid
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {holiday.is_paid ? "Paid" : "Unpaid"}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {holiday.is_mandatory ? "Yes" : "No"}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {holiday.is_recurring ? "Yes" : "No"}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        holiday.status === "ACTIVE"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {holiday.status}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex items-center gap-3 justify-center">
                      <Link
                        to={`/holiday-config/${holiday.id}`}
                        className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        View Detail
                      </Link>

                      {/* Delete button */}
                      <button
                        type="button"
                        title="Delete holiday"
                        onClick={() => handleDeleteHoliday(holiday)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        {deletingId === holiday.id ? (
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
              Are you sure you want to delete holiday{" "}
              <strong>"{holidayToDelete?.holiday_name}"</strong>?
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
              onClick={confirmDeleteHoliday}
              disabled={deletingId === holidayToDelete?.id}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId === holidayToDelete?.id ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HolidayTable;
