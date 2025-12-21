// src/pages/work-schedule/WorkScheduleTable.tsx
import { useState } from "react";
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
  useGetWorkSchedulesQuery,
  useDeactivateWorkScheduleMutation,
  useActivateWorkScheduleMutation,
  WorkSchedule,
} from "../../redux/api/attendanceApiSlice";
import { ChevronsUpDown, ChevronUp, ChevronDown, Eye, Slash, Trash } from "lucide-react";
import { formatWorkDays } from "../../utils/workDays";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

interface WorkScheduleTableProps {
  onView: (id: number) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

type SortField =
  | "schedule_name"
  | "schedule_type"
  | "start_time"
  | "end_time"
  | "status"
  | "id";

const WorkScheduleTable = ({
  onView,
  onSuccess,
  onError,
}: WorkScheduleTableProps) => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [page, setPage] = useState(1);
  const limit = 10;
  const [sortBy, setSortBy] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState<string>("");

  // Deactivate modal state
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  
  // Activate modal state
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [activateReason, setActivateReason] = useState("");
  
  const [alertModal, setAlertModal] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [deactivateSchedule, { isLoading: isDeactivating }] =
    useDeactivateWorkScheduleMutation();
  const [activateSchedule, { isLoading: isActivating }] =
    useActivateWorkScheduleMutation();

  const { data, isLoading, error, refetch } = useGetWorkSchedulesQuery(
    {
      token: token!,
      limit,
      offset: (page - 1) * limit,
      status: statusFilter || undefined,
      schedule_type: scheduleTypeFilter || undefined,
    },
    { skip: !token }
  );

  const schedules: WorkSchedule[] = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openDeactivateModal = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    setDeactivateReason("");
    setDeactivateModalOpen(true);
  };

  const openActivateModal = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    setActivateReason("");
    setActivateModalOpen(true);
  };

  const handleDeactivate = async () => {
    if (!token || !selectedSchedule) return;
    
    if (!deactivateReason.trim()) {
      setAlertModal({
        type: "error",
        message: "Please provide a reason for deactivation",
      });
      return;
    }

    try {
      await deactivateSchedule({ 
        token, 
        id: selectedSchedule.id,
        reason: deactivateReason.trim()
      }).unwrap();
      
      setDeactivateModalOpen(false);
      setSelectedSchedule(null);
      setDeactivateReason("");
      
      setAlertModal({
        type: "success",
        message: "Work schedule deactivated successfully",
      });
      
      refetch();
    } catch (e: any) {
      console.error(e);
      const msg = e?.data?.message || "Failed to deactivate work schedule";
      setAlertModal({
        type: "error",
        message: msg,
      });
    }
  };

  const handleActivate = async () => {
    if (!token || !selectedSchedule) return;
    
    if (!activateReason.trim()) {
      setAlertModal({
        type: "error",
        message: "Please provide a reason for activation",
      });
      return;
    }

    try {
      await activateSchedule({ 
        token, 
        id: selectedSchedule.id,
        reason: activateReason.trim()
      }).unwrap();
      
      setActivateModalOpen(false);
      setSelectedSchedule(null);
      setActivateReason("");
      
      setAlertModal({
        type: "success",
        message: "Work schedule activated successfully",
      });
      
      refetch();
    } catch (e: any) {
      console.error(e);
      const msg = e?.data?.message || "Failed to activate work schedule";
      setAlertModal({
        type: "error",
        message: msg,
      });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortBy !== field) {
      setSortBy(field);
      setSortOrder("ASC");
    } else if (sortOrder === "ASC") {
      setSortOrder("DESC");
    } else {
      // reset
      setSortBy("id");
      setSortOrder("DESC");
    }
  };

  const sortedSchedules = [...schedules].sort((a, b) => {
    const dir = sortOrder === "ASC" ? 1 : -1;

    const getValue = (s: WorkSchedule) => {
      switch (sortBy) {
        case "schedule_name":
          return s.schedule_name || "";
        case "schedule_type":
          return s.schedule_type || "";
        case "start_time":
          return s.start_time || "";
        case "end_time":
          return s.end_time || "";
        case "status":
          return s.status || "";
        case "id":
        default:
          return s.id;
      }
    };

    const va = getValue(a);
    const vb = getValue(b);

    if (typeof va === "number" && typeof vb === "number") {
      return (va - vb) * dir;
    }
    return String(va).localeCompare(String(vb)) * dir;
  });

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field)
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;

    if (sortOrder === "ASC")
      return <ChevronUp className="h-4 w-4 text-brand-600" />;
    return <ChevronDown className="h-4 w-4 text-brand-600" />;
  };

  // Note: formatWorkDays is now imported from src/utils/workDays

  const getPageItems = (totalPages: number, current: number) => {
    const items: number[] = [];
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }
    const delta = 2;
    const left = Math.max(2, current - delta);
    const right = Math.min(totalPages - 1, current + delta);
    items.push(1);
    if (left > 2) items.push(-1);
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push(-1);
    items.push(totalPages);
    return items;
  };

  if (isLoading)
    return <p className="p-4 text-center">Loading work schedules...</p>;

  if (error)
    return (
      <p className="p-4 text-center text-red-500">
        Failed to load work schedules 😢
      </p>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Filter & Search bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-3">
          {/* <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select> */}

          {/* <select
            value={scheduleTypeFilter}
            onChange={(e) => {
              setScheduleTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">All Types</option>
            <option value="FIXED">FIXED</option>
            <option value="FLEXIBLE">FLEXIBLE</option>
          </select> */}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("schedule_name")}
                  className="flex items-center gap-1"
                >
                  <span>Name</span>
                  {getSortIcon("schedule_name")}
                </button>
              </TableCell>

              {/* <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("schedule_type")}
                  className="flex items-center gap-1"
                >
                  <span>Type</span>
                  {getSortIcon("schedule_type")}
                </button>
              </TableCell> */}

              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Work Days
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("start_time")}
                  className="flex items-center gap-1"
                >
                  <span>Start</span>
                  {getSortIcon("start_time")}
                </button>
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("end_time")}
                  className="flex items-center gap-1"
                >
                  <span>End</span>
                  {getSortIcon("end_time")}
                </button>
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="flex items-center gap-1"
                >
                  <span>Status</span>
                  {getSortIcon("status")}
                </button>
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {sortedSchedules.map((ws) => (
              <TableRow key={ws.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex flex-col">
                    <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {ws.schedule_name}
                    </span>
                    <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                      ID: {ws.id}
                    </span>
                  </div>
                </TableCell>

                {/* <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {ws.schedule_type}
                </TableCell> */}

                <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {formatWorkDays(ws.work_days)}
                </TableCell>

                <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {ws.start_time}
                </TableCell>

                <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {ws.end_time}
                </TableCell>

                <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ws.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-300"
                    }`}
                  >
                    {ws.status}
                  </span>
                </TableCell>

                <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      to={`/work-schedule/${ws.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="h-4 w-4" />
                      View Detail
                    </Link>

                    {ws.status === "ACTIVE" && (
                      <button
                        type="button"
                        disabled={isDeactivating}
                        onClick={() => openDeactivateModal(ws)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {sortedSchedules.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No work schedules found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages}
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 rounded-md text-sm ${
              page > 1
                ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                : "bg-gray-100 text-gray-400 dark:bg-gray-800"
            }`}
          >
            Prev
          </button>

          <div className="flex items-center gap-1">
            {getPageItems(totalPages, page).map((p, idx) =>
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
                  disabled={p === page}
                  className={`px-3 py-1 rounded-md text-sm ${
                    p === page
                      ? "bg-brand-600 text-white dark:bg-brand-500"
                      : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 rounded-md text-sm ${
              page < totalPages
                ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                : "bg-gray-100 text-gray-400 dark:bg-gray-800"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={deactivateModalOpen}
        onClose={() => {
          setDeactivateModalOpen(false);
          setSelectedSchedule(null);
          setDeactivateReason("");
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Delete Work Schedule
          </h3>

          {selectedSchedule && (
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the work schedule{" "}
              <span className="font-medium text-gray-800 dark:text-white/90">
                "{selectedSchedule.schedule_name}"
              </span>
              ? Existing shifts will not be removed.
            </p>
          )}

          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setDeactivateModalOpen(false);
                setSelectedSchedule(null);
                setDeactivateReason("");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <Button size="sm" onClick={handleDeactivate} disabled={isDeactivating}>
              {isDeactivating ? "Deactivating..." : "Confirm Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Activate Confirmation Modal */}
      <Modal
        isOpen={activateModalOpen}
        onClose={() => {
          setActivateModalOpen(false);
          setSelectedSchedule(null);
          setActivateReason("");
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Activate Work Schedule
          </h3>

          {selectedSchedule && (
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to activate the work schedule{" "}
              <span className="font-medium text-gray-800 dark:text-white/90">
                "{selectedSchedule.schedule_name}"
              </span>
              ?
            </p>
          )}

          <div className="mb-6">
            <Label>
              Reason <span className="text-error-500">*</span>
            </Label>
            <textarea
              placeholder="Enter reason for activation"
              className="mt-1 h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={activateReason}
              onChange={(e) => setActivateReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setActivateModalOpen(false);
                setSelectedSchedule(null);
                setActivateReason("");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <Button size="sm" onClick={handleActivate} disabled={isActivating}>
              {isActivating ? "Activating..." : "Confirm Activate"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Alert Modal */}
      <Modal
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        className="max-w-md m-4"
      >
        <div className="w-full p-6">
          {alertModal && (
            <>
              <Alert
                variant={alertModal.type}
                title={alertModal.type === "success" ? "Success" : "Failed"}
                message={alertModal.message}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAlertModal(null)}
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

export default WorkScheduleTable;
