// src/pages/work-schedule/WorkScheduleTable.tsx
import { useState } from "react";
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
  WorkSchedule,
} from "../../redux/api/attendanceApiSlice";
import { ChevronsUpDown, ChevronUp, ChevronDown, Eye, Slash } from "lucide-react";
import { formatWorkDays } from "../../utils/workDays";

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

  const [deactivateSchedule, { isLoading: isDeactivating }] =
    useDeactivateWorkScheduleMutation();

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

  const handleDeactivate = async (id: number) => {
    if (!token) return;
    const confirm = window.confirm(
      "Deactivate this work schedule? Existing shifts will not be removed."
    );
    if (!confirm) return;

    try {
      await deactivateSchedule({ token, id }).unwrap();
      onSuccess("Work schedule deactivated successfully");
      refetch();
    } catch (e: any) {
      console.error(e);
      const msg = e?.data?.message || "Failed to deactivate work schedule";
      onError(msg);
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
          <select
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
          </select>

          <select
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
          </select>
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

              <TableCell
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
              </TableCell>

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

                <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  {ws.schedule_type}
                </TableCell>

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
                    <button
                      type="button"
                      onClick={() => onView(ws.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>

                    <button
                      type="button"
                      disabled={isDeactivating || ws.status === "INACTIVE"}
                      onClick={() => handleDeactivate(ws.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Slash className="h-4 w-4" />
                      {ws.status === "INACTIVE" ? "Inactive" : "Deactivate"}
                    </button>
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
    </div>
  );
};

export default WorkScheduleTable;
