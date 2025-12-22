// src/pages/report/EmployeeAttendanceReport.tsx
import { useParams, useSearchParams } from "react-router";
import { useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAppSelector } from "../../redux/hook";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  useGetAttendanceEmployeeReportQuery,
} from "../../redux/api/reportingApiSlice";
import { EmployeeAttendanceExportModal } from "./EmployeeAttendanceExportModal";
import { FileText, FileSpreadsheet } from "lucide-react";

// Helper function to extract time from ISO string without timezone conversion
const formatTimeFromISO = (isoString: string | null | undefined): string => {
  if (!isoString) return "—";
  try {
    // Extract time portion from ISO string (e.g., "2025-12-01T13:31:00.000Z" -> "13:31:00")
    const timePart = isoString.split('T')[1]?.split('.')[0];
    return timePart || "—";
  } catch {
    return "—";
  }
};

// Helper function to extract date from ISO string (e.g., "2025-12-19T17:00:00.000Z" -> "2025-12-19")
const formatDateFromISO = (isoString: string | null | undefined): string => {
  if (!isoString) return "—";
  try {
    const datePart = isoString.split('T')[0];
    return datePart || "—";
  } catch {
    return "—";
  }
};

const EmployeeAttendanceReport = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  // Get date range from URL params, fallback to current month
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const startDate = searchParams.get("start_date") || formatDate(defaultStart);
  const endDate = searchParams.get("end_date") || formatDate(defaultEnd);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"excel" | "pdf" | null>(null);

  const {
    data,
    isLoading,
    isError,
  } = useGetAttendanceEmployeeReportQuery(
    {
      token: token!,
      employeeId: id!,
      period: "MONTH",
      start_date: startDate,
      end_date: endDate,
    },
    { skip: !token || !id }
  );

  const handleExportClick = (type: "excel" | "pdf") => {
    setExportType(type);
    setIsExportModalOpen(true);
  };

  if (!token) {
    return (
      <p className="p-4 text-center text-red-500">
        Missing access token. Please login again.
      </p>
    );
  }

  if (isLoading) {
    return <p className="p-4 text-center">Loading employee attendance...</p>;
  }

  if (isError || !data) {
    return (
      <p className="p-4 text-center text-red-500">
        Failed to load employee attendance report 😢
      </p>
    );
  }

  const detail = data.data;
  const emp = detail.employee;
  const summary = detail.summary;
  
  // Transform dates: add 1 day to all dates (shift 30/11 → 1/12, 1/12 → 2/12, etc.)
  const records = (detail.daily_records || []).map((record: any) => {
    const originalDate = new Date(record.date + 'T00:00:00');
    originalDate.setDate(originalDate.getDate() + 1);
    const newDate = originalDate.toISOString().split('T')[0];
    
    return {
      ...record,
      date: newDate,
    };
  });
  
  // Transform period dates (dates are directly in detail, not in detail.period)
  const transformedPeriod = {
    start_date: (() => {
      const d = new Date(detail.start_date + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })(),
    end_date: (() => {
      const d = new Date(detail.end_date + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })(),
  };

  return (
    <>
      <PageMeta title="Employee Attendance Report" description="" />
      <PageBreadcrumb
        pageTitle={`Attendance - ${emp.full_name}`}
        items={[
          { label: "Reports", to: "/attendence-report" },
          { label: "Employee Attendance" },
        ]}
      />

      <div className="space-y-5">
        {/* Export Buttons - Add at top */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleExportClick("excel")}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button
            onClick={() => handleExportClick("pdf")}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            <FileText size={16} />
            PDF
          </button>
        </div>

        {/* Employee info card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Employee Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Full Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {emp.full_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Employee Code
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {emp.employee_code}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {emp.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Department
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {emp.department_name ?? emp.department_id ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Position
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {emp.position_name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Join Date
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {formatDateFromISO(emp.join_date)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {transformedPeriod.start_date} → {transformedPeriod.end_date} • Total days: {detail.total_days}
            </p>
          </div>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            <SummaryItem label="Working Days" value={summary.total_working_days} />
            <SummaryItem label="Working Hours" value={summary.total_working_hours} />
            <SummaryItem label="Overtime Hours" value={summary.total_overtime_hours} />
            <SummaryItem label="Late Count" value={summary.total_late_count} />
            <SummaryItem label="Early Leave Count" value={summary.total_early_leave_count} />
            <SummaryItem label="Leave Days" value={summary.total_leave_days} />
            <SummaryItem label="Absent Days" value={summary.total_absent_days} />
            <SummaryItem label="Holidays" value={summary.total_holidays} />
            <SummaryItem label="Manday" value={summary.total_manday} />
            <SummaryItem
              label="Attendance Rate (%)"
              value={summary.attendance_rate}
            />
          </div>
        </div>

        {/* Daily records table */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Daily Attendance
          </h3>

          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Date
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Day
                  </TableCell>
                  {/* <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Shift
                  </TableCell> */}
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                     Time
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Check-in Time
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Check-out Time
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Working Hours
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Holiday
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Manday
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Remarks
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-center">
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No daily records.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((r) => (
                    <TableRow key={r.date}>
                      <TableCell className="px-5 py-3 text-sm text-gray-800 dark:text-gray-100">
                        {r.date}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.day_of_week}
                      </TableCell>
                      {/* <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.shift_name || r.scheduled_start_time && r.scheduled_end_time ? `${r.scheduled_start_time} - ${r.scheduled_end_time}` : "—"}
                      </TableCell> */}
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.scheduled_start_time && r.scheduled_end_time
                          ? `${r.scheduled_start_time} - ${r.scheduled_end_time}`
                          : "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {formatTimeFromISO(r.check_in_time)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {formatTimeFromISO(r.check_out_time)}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.working_hours}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.is_holiday ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.manday}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.remarks || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Export Preview Modal */}
      <EmployeeAttendanceExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportType(null);
        }}
        exportType={exportType}
        employee={emp}
        period={transformedPeriod}
        summary={summary}
        dailyRecords={records}
      />
    </>
  );
};

export default EmployeeAttendanceReport;

type SummaryItemProps = {
  label: string;
  value: number | string;
};

const SummaryItem = ({ label, value }: SummaryItemProps) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-left text-xs dark:border-gray-700 dark:bg-gray-900/40">
    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
      {value}
    </p>
  </div>
);
