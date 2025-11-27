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
  useGetLeaveRecordsQuery,
  LeaveRecordStatus,
} from "../../../redux/api/leaveApiSlice";
import { CheckCircle, XCircle } from "lucide-react";

const LeaveRequestTable = () => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [page, setPage] = useState(1);
  const limit = 10;

  // Filter state
  const [status, setStatus] = useState<LeaveRecordStatus | "ALL">("ALL");
  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data, isLoading, error } = useGetLeaveRecordsQuery(
    {
      token: token!,
      page,
      limit,
      status: status === "ALL" ? undefined : status,
      leave_type_id: leaveTypeId ? Number(leaveTypeId) : undefined,
      employee_id: employeeId ? Number(employeeId) : undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
    { skip: !token }
  );

  if (isLoading) return <p className="p-4 text-center">Loading leave requests...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load leave requests 😢</p>
    );

  const leaveRecords = data?.data?.leave_records ?? [];

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

  // Badge color helper
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "APPROVED":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const pagination = data?.data?.pagination;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
        {/* Employee ID */}
        <input
          type="text"
          placeholder="Employee ID..."
          value={employeeId}
          onChange={(e) => {
            setEmployeeId(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Leave Type ID */}
        <input
          type="text"
          placeholder="Leave Type ID..."
          value={leaveTypeId}
          onChange={(e) => {
            setLeaveTypeId(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />

        {/* Start Date */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />

        {/* End Date */}
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
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
                Employee
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Leave Type
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Start Date
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                End Date
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Days
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
            {leaveRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  No leave requests found
                </TableCell>
              </TableRow>
            ) : (
              leaveRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {record.id}
                  </TableCell>

                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {record.employee_code}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        ID: {record.employee_id}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {record.leave_type_id}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {formatDate(record.start_date)}
                    {record.is_half_day_start && (
                      <span className="ml-1 text-xs text-gray-400">(Half)</span>
                    )}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    {formatDate(record.end_date)}
                    {record.is_half_day_end && (
                      <span className="ml-1 text-xs text-gray-400">(Half)</span>
                    )}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {record.total_leave_days}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="flex items-center gap-3 justify-center">
                      <Link
                        to={`/leave-requests/${record.id}`}
                        className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        View Detail
                      </Link>
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
  );
};

export default LeaveRequestTable;
