import React from "react";
import { Modal } from "../../components/ui/modal";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EmployeeInfo {
  full_name: string;
  employee_code: string;
  email: string;
  department_name: string | null;
  position_name: string;
  join_date: string | null;
}

interface PeriodInfo {
  type: string;
  start_date: string;
  end_date: string;
  total_days: number;
}

interface Summary {
  total_working_days: number;
  total_working_hours: number;
  total_overtime_hours: number;
  total_late_count: number;
  total_early_leave_count: number;
  total_leave_days: number;
  total_absent_days: number;
  total_holidays: number;
  total_manday: number;
  attendance_rate: number;
}

interface DailyRecord {
  date: string;
  day_of_week: string;
  shift_name?: string | null;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
  check_in_status: string;
  check_out_status: string;
  working_hours: number;
  is_holiday: boolean;
  manday: number;
  remarks?: string | null;
}

interface EmployeeAttendanceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: "excel" | "pdf" | null;
  employee: EmployeeInfo;
  period: PeriodInfo;
  summary: Summary;
  dailyRecords: DailyRecord[];
}

export const EmployeeAttendanceExportModal: React.FC<
  EmployeeAttendanceExportModalProps
> = ({ isOpen, onClose, exportType, employee, period, summary, dailyRecords }) => {
  const handleExport = () => {
    if (exportType === "excel") {
      exportToExcel();
    } else if (exportType === "pdf") {
      exportToPDF();
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Employee Info & Summary
    const infoData = [
      ["Employee Attendance Report"],
      [],
      ["Employee Information"],
      ["Full Name", employee.full_name],
      ["Employee Code", employee.employee_code],
      ["Email", employee.email],
      ["Department", employee.department_name || "—"],
      ["Position", employee.position_name || "—"],
      ["Join Date", employee.join_date || "—"],
      [],
      ["Period Information"],
      ["Period Type", period.type],
      ["Start Date", period.start_date],
      ["End Date", period.end_date],
      ["Total Days", period.total_days],
      [],
      ["Summary"],
      ["Working Days", summary.total_working_days],
      ["Working Hours", summary.total_working_hours],
      ["Overtime Hours", summary.total_overtime_hours],
      ["Late Count", summary.total_late_count],
      ["Early Leave Count", summary.total_early_leave_count],
      ["Leave Days", summary.total_leave_days],
      ["Absent Days", summary.total_absent_days],
      ["Holidays", summary.total_holidays],
      ["Manday", summary.total_manday],
      ["Attendance Rate (%)", summary.attendance_rate],
    ];

    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(wb, wsInfo, "Summary");

    // Sheet 2: Daily Attendance Records
    const dailyData = dailyRecords.map((r) => ({
      Date: r.date,
      Day: r.day_of_week,
      Shift: r.shift_name || "—",
      "Scheduled Time":
        r.scheduled_start_time && r.scheduled_end_time
          ? `${r.scheduled_start_time} - ${r.scheduled_end_time}`
          : "—",
      "Check-in Status": r.check_in_status,
      "Check-out Status": r.check_out_status,
      "Working Hours": r.working_hours,
      Holiday: r.is_holiday ? "Yes" : "No",
      Manday: r.manday,
      Remarks: r.remarks || "—",
    }));

    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Attendance");

    // Set column widths for daily sheet
    wsDaily["!cols"] = [
      { wch: 12 }, // Date
      { wch: 10 }, // Day
      { wch: 15 }, // Shift
      { wch: 20 }, // Scheduled Time
      { wch: 15 }, // Check-in
      { wch: 15 }, // Check-out
      { wch: 14 }, // Working Hours
      { wch: 10 }, // Holiday
      { wch: 10 }, // Manday
      { wch: 25 }, // Remarks
    ];

    // Generate filename
    const filename = `${employee.employee_code}_Attendance_${period.start_date}_to_${period.end_date}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
    onClose();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Employee Attendance Report", 14, 15);

    // Employee Info
    doc.setFontSize(12);
    doc.text("Employee Information", 14, 28);
    doc.setFontSize(10);
    let y = 35;
    doc.text(`Name: ${employee.full_name}`, 14, y);
    y += 6;
    doc.text(`Code: ${employee.employee_code}`, 14, y);
    y += 6;
    doc.text(`Email: ${employee.email}`, 14, y);
    y += 6;
    doc.text(`Department: ${employee.department_name || "—"}`, 14, y);
    y += 6;
    doc.text(`Position: ${employee.position_name || "—"}`, 14, y);

    // Period
    y += 10;
    doc.setFontSize(12);
    doc.text("Period", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.text(
      `${period.type}: ${period.start_date} to ${period.end_date} (${period.total_days} days)`,
      14,
      y
    );

    // Summary Table
    y += 10;
    doc.setFontSize(12);
    doc.text("Summary", 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Working Days", summary.total_working_days],
        ["Working Hours", summary.total_working_hours],
        ["Overtime Hours", summary.total_overtime_hours],
        ["Late Count", summary.total_late_count],
        ["Early Leave Count", summary.total_early_leave_count],
        ["Leave Days", summary.total_leave_days],
        ["Absent Days", summary.total_absent_days],
        ["Holidays", summary.total_holidays],
        ["Manday", summary.total_manday],
        ["Attendance Rate (%)", summary.attendance_rate],
      ],
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
      },
    });

    // Daily Records Table (new page if needed)
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Daily Attendance Records", 14, 15);

    const tableData = dailyRecords.map((r) => [
      r.date,
      r.day_of_week,
      r.shift_name || "—",
      r.scheduled_start_time && r.scheduled_end_time
        ? `${r.scheduled_start_time}-${r.scheduled_end_time}`
        : "—",
      r.check_in_status,
      r.check_out_status,
      r.working_hours,
      r.is_holiday ? "Yes" : "No",
      r.manday,
      r.remarks || "—",
    ]);

    autoTable(doc, {
      startY: 22,
      head: [
        [
          "Date",
          "Day",
          "Shift",
          "Scheduled",
          "Check-in",
          "Check-out",
          "Hours",
          "Holiday",
          "Manday",
          "Remarks",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 18 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 12 },
        7: { cellWidth: 12 },
        8: { cellWidth: 12 },
        9: { cellWidth: 25 },
      },
    });

    // Generate filename
    const filename = `${employee.employee_code}_Attendance_${period.start_date}_to_${period.end_date}.pdf`;

    // Download file
    doc.save(filename);
    onClose();
  };

  if (!exportType) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl m-4">
      <div className="w-full p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Export Preview - {exportType === "excel" ? "Excel" : "PDF"}
        </h4>

        {/* Employee Info Preview */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h5 className="text-sm font-semibold mb-2 text-gray-800 dark:text-white/90">
            Employee: {employee.full_name} ({employee.employee_code})
          </h5>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Period:</span> {period.start_date} to{" "}
            {period.end_date}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Total Daily Records:</span>{" "}
            {dailyRecords.length}
          </p>
        </div>

        {/* Summary Preview */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="text-sm font-semibold mb-2 text-gray-800 dark:text-white/90">
            Summary
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Working Days:</span>{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                {summary.total_working_days}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Working Hours:</span>{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                {summary.total_working_hours}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">OT Hours:</span>{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                {summary.total_overtime_hours}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Late:</span>{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                {summary.total_late_count}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Leave Days:</span>{" "}
              <span className="font-medium text-gray-800 dark:text-white">
                {summary.total_leave_days}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Records Preview Table */}
        <div className="mb-6 max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Day
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Shift
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Check-in
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Check-out
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Hours
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Manday
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {dailyRecords.slice(0, 10).map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {record.date}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {record.day_of_week}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {record.shift_name || "—"}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {record.check_in_status}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {record.check_out_status}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {record.working_hours}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {record.manday}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dailyRecords.length > 10 && (
            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
              ... and {dailyRecords.length - 10} more records
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Export {exportType === "excel" ? "to Excel" : "to PDF"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
