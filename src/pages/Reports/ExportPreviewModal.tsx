import React from "react";
import { Modal } from "../../components/ui/modal";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: "excel" | "pdf" | null;
  data: any[];
  dateRange: { start: string; end: string };
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  exportType,
  data,
  dateRange,
}) => {
 const handleExport = async () => {
  if (exportType === "excel") exportToExcel();
  if (exportType === "pdf") await exportToPDF();
};


  const exportToExcel = () => {
    // Prepare data for Excel
    const excelData = data.map((row) => ({
      "Employee Code": row.employee_code || "",
      "Employee Name": row.full_name || "",
      Department: row.department_name || "",
      Position: row.position_name || "",
      "Working Days": row.working_days || 0,
      "Working Hours": row.total_working_hours || 0,
      "OT Hours": row.total_overtime_hours || 0,
      "Late Count": row.total_late_count || 0,
      "Early Leave Count": row.total_early_leave_count || 0,
      "Leave Days": row.total_leave_days || 0,
      "Absent Days": row.total_absent_days || 0,
      Manday: row.manday || 0,
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Employee Code
      { wch: 25 }, // Employee Name
      { wch: 20 }, // Department
      { wch: 20 }, // Position
      { wch: 14 }, // Working Days
      { wch: 15 }, // Working Hours
      { wch: 12 }, // OT Hours
      { wch: 12 }, // Late Count
      { wch: 17 }, // Early Leave Count
      { wch: 12 }, // Leave Days
      { wch: 13 }, // Absent Days
      { wch: 10 }, // Manday
    ];
    ws["!cols"] = colWidths;

    // Generate filename
    const filename = `Attendance_Report_${dateRange.start}_to_${dateRange.end}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
    onClose();
  };

 const fetchAsBase64 = async (url: string) => {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();

  // ArrayBuffer -> base64
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const norm = (v: any) => String(v ?? "").normalize("NFC"); // tránh lỗi dấu tổ hợp

const exportToPDF = async () => {
  const doc = new jsPDF("landscape");

  // 1) Register Vietnamese font
  const notoRegular = await fetchAsBase64("/fonts/NotoSans-Regular.ttf");
  doc.addFileToVFS("NotoSans-Regular.ttf", notoRegular);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");

  // Nếu muốn bold (optional)
  // const notoBold = await fetchAsBase64("/fonts/NotoSans-Bold.ttf");
  // doc.addFileToVFS("NotoSans-Bold.ttf", notoBold);
  // doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");

  // 2) Use the font
  doc.setFont("NotoSans", "normal");

  // Title
  doc.setFontSize(16);
  doc.text(norm("Attendance Report"), 14, 15);

  // Date range
  doc.setFontSize(10);
  doc.text(norm(`Period: ${dateRange.start} to ${dateRange.end}`), 14, 22);

  // Table data (normalize text fields)
  const tableData = data.map((row) => [
    norm(row.employee_code),
    norm(row.full_name),
    norm(row.department_name),
    norm(row.position_name),
    row.working_days ?? 0,
    row.total_working_hours ?? 0,
    row.total_overtime_hours ?? 0,
    row.total_late_count ?? 0,
    row.total_early_leave_count ?? 0,
    row.total_leave_days ?? 0,
    row.total_absent_days ?? 0,
    row.manday ?? 0,
  ]);

  autoTable(doc, {
    startY: 28,
    head: [[
      "Code","Name","Department","Position","Working Days","Working Hours",
      "OT Hours","Late","Early","Leave","Absent","Manday"
    ].map(norm)],
    body: tableData,

    // 3) IMPORTANT: set font for autoTable
    styles: { font: "NotoSans", fontSize: 7 },
    headStyles: { fillColor: [66, 139, 202], font: "NotoSans", fontSize: 8 },
    bodyStyles: { font: "NotoSans", fontSize: 7 },

    theme: "striped",
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 22 },
      6: { cellWidth: 18 },
      7: { cellWidth: 15 },
      8: { cellWidth: 15 },
      9: { cellWidth: 15 },
      10: { cellWidth: 15 },
      11: { cellWidth: 15 },
    },
  });

  const filename = `Attendance_Report_${dateRange.start}_to_${dateRange.end}.pdf`;
  doc.save(filename);
  onClose();
};


  if (!exportType) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl m-4">
      <div className="w-full p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Export Preview - {exportType === "excel" ? "Excel" : "PDF"}
        </h4>

        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="font-medium">Period:</span> {dateRange.start} to{" "}
            {dateRange.end}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Total Records:</span> {data.length}
          </p>
        </div>

        {/* Preview Table */}
        <div className="mb-6 max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Code
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Department
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Position
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Working Days
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Working Hours
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  OT Hours
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Late
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Early
                </th>

                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Leave
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Absent
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Manday
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {data.slice(0, 10).map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {row.employee_code}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {row.full_name}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {row.department_name}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {row.position_name}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {row.working_days}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {row.total_working_hours}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {row.total_overtime_hours}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {row.total_late_count}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {row.total_early_leave_count}{" "}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {row.total_leave_days}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {row.total_absent_days}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-gray-900 dark:text-gray-100">
                    {row.manday}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
              ... and {data.length - 10} more records
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
