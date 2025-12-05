// src/pages/Schedule/components/EditHistoryModal.tsx
import React from "react";
import Select from "react-select";
import { Modal } from "../../../components/ui/modal";
import { EmployeeRow } from "../types";

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeRow[];
  selectedHistoryEmployeeId: number | null;
  setSelectedHistoryEmployeeId: (id: number | null) => void;
  editHistoryData: any;
}

export const EditHistoryModal: React.FC<EditHistoryModalProps> = ({
  isOpen,
  onClose,
  employees,
  selectedHistoryEmployeeId,
  setSelectedHistoryEmployeeId,
  editHistoryData,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl m-4">
      <div className="w-full p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          📝 Attendance Edit History
        </h4>

        {/* Employee Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Employee
          </label>
          <Select
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.employeeCode} - ${emp.fullName}`,
            }))}
            value={
              selectedHistoryEmployeeId
                ? employees
                    .map((emp) => ({
                      value: emp.id,
                      label: `${emp.employeeCode} - ${emp.fullName}`,
                    }))
                    .find((opt) => opt.value === selectedHistoryEmployeeId)
                : null
            }
            onChange={(opt) => setSelectedHistoryEmployeeId(opt?.value || null)}
            placeholder="Select an employee to view history..."
            classNamePrefix="react-select"
            isClearable
          />
        </div>

        {/* History Table */}
        <div className="custom-scrollbar max-h-[500px] overflow-y-auto">
          {!editHistoryData?.data || editHistoryData.data.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {selectedHistoryEmployeeId
                ? "No edit history found for this employee."
                : "Please select an employee to view their edit history."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Shift ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Field Changed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Old Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      New Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Edited By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Edited At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {editHistoryData.data.map((log: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {log.shift_date || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {log.shift_id || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{log.field_changed || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.old_value || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.new_value || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.edit_reason || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {log.edited_by_user_name || "—"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.edited_by_role || ""}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.edited_at
                          ? new Date(log.edited_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
