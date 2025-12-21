// src/pages/Schedule/components/EditHistoryModal.tsx
import React, { useMemo } from "react";
import Select from "react-select";
import { Modal } from "../../../components/ui/modal";
import { EmployeeRow } from "../types";
import { useGetEmployeesQuery } from "../../../redux/api/employeeApiSlice";
import { useGetEmployeeShiftsQuery } from "../../../redux/api/shiftApiSlice";
import { useGetWorkSchedulesQuery } from "../../../redux/api/attendanceApiSlice";
import { useAppSelector } from "../../../redux/hook";

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeRow[];
  selectedHistoryEmployeeId: number | null;
  setSelectedHistoryEmployeeId: (id: number | null) => void;
  editHistoryData: any;
  isLoading?: boolean;
}

export const EditHistoryModal: React.FC<EditHistoryModalProps> = ({
  isOpen,
  onClose,
  employees,
  selectedHistoryEmployeeId,
  setSelectedHistoryEmployeeId,
  editHistoryData,
  isLoading = false,
}) => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  // Fetch all employees to get names for history records
  const { data: allEmployeesData } = useGetEmployeesQuery(
    { token: token!, limit: 100 },
    { skip: !token || !isOpen }
  );

  // Get date range from edit history data (earliest to latest shift_date)
  const dateRange = useMemo(() => {
    if (!editHistoryData?.data || editHistoryData.data.length === 0) {
      // Default to current month if no data
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        from_date: firstDay.toISOString().split('T')[0],
        to_date: lastDay.toISOString().split('T')[0],
      };
    }
    
    const dates = editHistoryData.data
      .map((log: any) => log.shift_date)
      .filter(Boolean)
      .sort();
    
    return {
      from_date: dates[0] || new Date().toISOString().split('T')[0],
      to_date: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
    };
  }, [editHistoryData]);

  // Fetch employee shifts to get work_schedule_id
  const { data: employeeShiftsData } = useGetEmployeeShiftsQuery(
    {
      token: token!,
      from_date: dateRange.from_date,
      to_date: dateRange.to_date,
      limit: 100,
    },
    { skip: !token || !isOpen }
  );

  // Fetch work schedules to get schedule names
  const { data: workSchedulesData } = useGetWorkSchedulesQuery(
    { token: token!, limit: 100 },
    { skip: !token || !isOpen }
  );

  // Create employee lookup map
  const employeeMap = useMemo(() => {
    const map = new Map<number, any>();
    const allEmployees = allEmployeesData?.data?.employees || [];
    allEmployees.forEach((emp: any) => {
      map.set(emp.id, emp);
    });
    return map;
  }, [allEmployeesData]);

  // Create work schedule lookup map (work_schedule_id -> schedule data)
  const scheduleMap = useMemo(() => {
    const map = new Map<number, any>();
    const schedules = workSchedulesData?.data?.work_schedules || [];
    schedules.forEach((schedule: any) => {
      map.set(schedule.id, schedule);
    });
    return map;
  }, [workSchedulesData]);

  // Create shift lookup map (shift_id -> shift data with work_schedule_id)
  const shiftMap = useMemo(() => {
    const map = new Map<number, any>();
    const shifts = employeeShiftsData?.data?.data || [];
    shifts.forEach((shift: any) => {
      map.set(shift.id, shift);
    });
    return map;
  }, [employeeShiftsData]);

  // Filter history data based on selected employee
  const filteredHistoryData = React.useMemo(() => {
    if (!editHistoryData?.data) return null;
    
    if (!selectedHistoryEmployeeId) {
      return editHistoryData;
    }
    
    return {
      ...editHistoryData,
      data: editHistoryData.data.filter(
        (log: any) => log.employee_id === selectedHistoryEmployeeId
      ),
    };
  }, [editHistoryData, selectedHistoryEmployeeId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[98vw] xl:max-w-[85vw] w-full m-2 sm:m-4">
      <div className="w-full p-3 sm:p-4 md:p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          📝 Attendance Edit History
        </h4>

        {/* Employee Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Employee (Optional)
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
            placeholder="All employees..."
            classNamePrefix="react-select"
            isClearable
          />
        </div>

        {/* History Table */}
        <div className="custom-scrollbar max-h-[60vh] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-inner">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Loading edit history...
            </div>
          ) : !filteredHistoryData?.data || filteredHistoryData.data.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {selectedHistoryEmployeeId
                ? "No edit history found for this employee."
                : "No edit history found."}
            </div>
          ) : (
            <div className="relative">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{minWidth: '140px'}}>
                      Employee
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{minWidth: '100px'}}>
                      Date
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{minWidth: '120px'}}>
                      Field Changed
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{minWidth: '100px'}}>
                      Old Value
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{minWidth: '100px'}}>
                      New Value
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{minWidth: '150px'}}>
                      Reason
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{minWidth: '120px'}}>
                      Edited By
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{minWidth: '160px'}}>
                      Edited At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredHistoryData.data.map((log: any, idx: number) => {
                    const employee = employeeMap.get(log.employee_id);
                    const shift = shiftMap.get(log.shift_id);
                    const schedule = shift ? scheduleMap.get(shift.work_schedule_id) : null;
                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          <div className="font-medium">
                            {employee?.full_name || log.employee_name || "—"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {employee?.employee_code || log.employee_code || `ID: ${log.employee_id}`}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {log.shift_date || "—"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          <span className="font-medium">{log.field_changed || "—"}</span>
                        </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.old_value || "—"}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {log.new_value || "—"}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="max-w-[200px] truncate" title={log.edit_reason}>
                          {log.edit_reason || "—"}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {log.edited_by_user_name || "—"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {log.edited_by_role || ""}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="whitespace-nowrap">
                          {log.edited_at
                            ? new Date(log.edited_at).toLocaleString()
                            : "—"}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
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
