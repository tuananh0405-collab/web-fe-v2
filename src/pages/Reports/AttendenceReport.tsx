import { useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import DatePicker from "../../components/form/date-picker";
import { useAppSelector } from "../../redux/hook";
import { useGetAttendanceEmployeesReportQuery } from "../../redux/api/reportingApiSlice";
import { useGetDepartmentsQuery } from "../../redux/api/employeeApiSlice";
import { Link } from "react-router";
import { ExportPreviewModal } from "./ExportPreviewModal";
import { FileText, FileSpreadsheet } from "lucide-react";

type PeriodType = "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// giống logic pagination trong EmployeeTable
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

const AttendanceReport = () => {
  const authState = useAppSelector((state) => state.auth.userState?.data);
  const token = authState?.access_token;
  const user = authState?.user;

  // Get department_id from managed_department_ids array or user's department_id
  const departmentId = useMemo(() => {
    const managedDeptIds = (user as any)?.managed_department_ids;
    if (Array.isArray(managedDeptIds) && managedDeptIds.length > 0) {
      return managedDeptIds[0];
    }
    return (user as any)?.department_id;
  }, [user]);

  // ====== Filter state ======
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [period, setPeriod] = useState<PeriodType>("MONTH");
  const [startDate, setStartDate] = useState<string>(formatDate(defaultStart));
  const [endDate, setEndDate] = useState<string>(formatDate(defaultEnd));
  const [search, setSearch] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(undefined);

  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch departments for HR filter
  const { data: departmentsData } = useGetDepartmentsQuery(
    { token: token!, limit: 100 },
    { skip: !token || user?.role !== "HR_MANAGER" }
  );
  const departments = departmentsData?.data?.departments || [];

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"excel" | "pdf" | null>(null);

  // ====== Call report API ======
  // For HR: use selected department filter, for Manager: use their department
  const finalDepartmentId = user?.role === "HR_MANAGER" ? selectedDepartmentId : departmentId;
  
  const { data, isLoading, error } = useGetAttendanceEmployeesReportQuery(
    {
      token: token!,
      period,
      start_date: startDate,
      end_date: endDate,
      department_id: finalDepartmentId,
      search: search || undefined,
      page,
      limit,
    },
    { skip: !token }
  );

  const rows = data?.data?.data ?? [];
  const meta = data?.data;
  const totalPages = meta?.total_pages ?? 1;
  const currentPage = meta?.page ?? 1;

  const handleStartChange = (_dates: Date[], dateStr: string) => {
    if (!dateStr) return;
    setStartDate(dateStr);
    setPage(1);
  };

  const handleEndChange = (_dates: Date[], dateStr: string) => {
    if (!dateStr) return;
    setEndDate(dateStr);
    setPage(1);
  };

  const handlePeriodChange = (value: PeriodType) => {
    setPeriod(value);
    setPage(1);
  };

  const handleExportClick = (type: "excel" | "pdf") => {
    setExportType(type);
    setIsExportModalOpen(true);
  };

  const pageItems = useMemo(
    () => getPageItems(totalPages, currentPage),
    [totalPages, currentPage]
  );

  if (!token) {
    return (
      <p className="p-4 text-center text-red-500">
        Missing access token. Please login again.
      </p>
    );
  }

  return (
    <>
      <PageMeta title="Attendance Report" description="" />
      <PageBreadcrumb
        pageTitle="Attendance Report"
        showTitleLeft={false}
        items={[
          { label: "Reports" },
        
        ]}
      />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* === Title Section === */}
        <div className="border-b border-gray-100 px-6 py-4 dark:border-white/[0.05]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Reports
          </h3>
        </div>

        {/* === Filters header === */}
        <div className="flex flex-col gap-4 px-6 py-4 border-b border-gray-100 dark:border-white/[0.05] lg:flex-row lg:items-end lg:justify-between overflow-visible">
          <div className="flex flex-wrap items-end gap-4">
            {/* Period */}
            {/* Period */}
            {/* <div>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                Period
              </p>
              <select
                value={period}
                onChange={(e) =>
                  handlePeriodChange(e.target.value as PeriodType)
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="DAY">Day</option>
                <option value="WEEK">Week</option>
                <option value="MONTH">Month</option>
                <option value="QUARTER">Quarter</option>
                <option value="YEAR">Year</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div> */}

            {/* Start date */}
            <div className="w-40 relative z-10">
              <DatePicker
                id="report-start"
                label="Start Date"
                mode="single"
                placeholder="YYYY-MM-DD"
                defaultDate={startDate}
                onChange={handleStartChange}
              />
            </div>

            {/* End date */}
            <div className="w-40 relative z-10">
              <DatePicker
                id="report-end"
                label="End Date"
                mode="single"
                placeholder="YYYY-MM-DD"
                defaultDate={endDate}
                onChange={handleEndChange}
              />
            </div>

            {/* Department filter - Only for HR */}
            {user?.role === "HR_MANAGER" && (
              <div className="w-56">
                <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                  Department
                </p>
                <select
                  aria-label="Filter by department"
                  value={selectedDepartmentId || ""}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value ? Number(e.target.value) : undefined);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right side: Search and Export */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* Search */}
            <div className="w-full sm:w-64">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                Search by name or code
              </p>
              <input
                type="text"
                placeholder="Employee name or code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleExportClick("excel")}
                disabled={!rows || rows.length === 0}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet size={16} />
                Excel
              </button>
              <button
                onClick={() => handleExportClick("pdf")}
                disabled={!rows || rows.length === 0}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* === Table === */}
        <div className="max-w-full overflow-x-auto">
          {isLoading ? (
            <p className="p-4 text-center">Loading attendance report...</p>
          ) : error ? (
            <p className="p-4 text-center text-red-500">
              Failed to load attendance report 😢
            </p>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Employee
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Department
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Working Days
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Working Hours
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    OT Hours
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Late Count
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Early Leave Count
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Leave Days
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Absent Days
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Manday
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Details
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                      colSpan={10}
                    >
                      No data for selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.employee_id}>
                      {/* Employee basic info */}
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" />
                          <div>
                            <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                              {r.full_name}
                            </span>
                            <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                              {r.employee_code}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Department */}
                      <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                        {r.department_name || r.department_id || "—"}
                      </TableCell>

                      {/* Working Days */}
                      <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        {r.working_days}
                      </TableCell>

                      {/* Working Hours */}
                      <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        {r.total_working_hours}
                      </TableCell>

                      {/* OT Hours */}
                      <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        {r.total_overtime_hours}
                      </TableCell>

                      {/* Late Count */}
                      <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        {r.total_late_count}
                      </TableCell>

                      {/* Early Leave Count */}
                      <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        {r.total_early_leave_count}
                      </TableCell>

                      {/* Leave Days */}
                      <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        {r.total_leave_days}
                      </TableCell>

                      {/* Absent Days */}
                      <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        {r.total_absent_days}
                      </TableCell>

                      {/* Manday */}
                      <TableCell className="px-4 py-3 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                        {r.manday}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          <Link
                            to={`/attendence-report/${r.employee_id}`}
                            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                          >
                            Details
                          </Link>
                        </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* === Pagination === */}
        {meta && rows.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className={`rounded-md px-3 py-1 text-sm ${
                  currentPage > 1
                    ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                }`}
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {pageItems.map((p, idx) =>
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
                      disabled={p === currentPage}
                      className={`rounded-md px-3 py-1 text-sm ${
                        p === currentPage
                          ? "bg-brand-600 text-white dark:bg-brand-500"
                          : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                      }`}
                      aria-current={p === currentPage ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className={`rounded-md px-3 py-1 text-sm ${
                  currentPage < totalPages
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

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportType(null);
        }}
        exportType={exportType}
        data={rows}
        dateRange={{ start: startDate, end: endDate }}
      />
    </>
  );
};

export default AttendanceReport;
