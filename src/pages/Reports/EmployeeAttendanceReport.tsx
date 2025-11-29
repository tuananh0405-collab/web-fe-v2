// src/pages/report/EmployeeAttendanceReport.tsx
import { useParams } from "react-router";
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

const EmployeeAttendanceReport = () => {
  const { id } = useParams<{ id: string }>();
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const {
    data,
    isLoading,
    isError,
  } = useGetAttendanceEmployeeReportQuery(
    {
      token: token!,
      employeeId: id!,
      // nếu muốn có filter period/start/end có thể truyền thêm sau
    },
    { skip: !token || !id }
  );

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
  const period = detail.period;
  const records = detail.daily_records || [];

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
                {emp.join_date || "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Period:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {period.type}
            </span>{" "}
            ({period.start_date} → {period.end_date}) • Total days:{" "}
            {period.total_days}
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
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Shift
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Scheduled Time
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Check-in Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Check-out Status
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

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
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
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.shift_name || "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.scheduled_start_time && r.scheduled_end_time
                          ? `${r.scheduled_start_time} - ${r.scheduled_end_time}`
                          : "—"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.check_in_status}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-gray-500 dark:text-gray-300">
                        {r.check_out_status}
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
