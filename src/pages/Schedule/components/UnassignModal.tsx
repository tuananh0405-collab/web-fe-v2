// src/pages/Schedule/components/UnassignModal.tsx
import React from "react";
import Select from "react-select";
import { Modal } from "../../../components/ui/modal";

interface UnassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeOptions: { value: number; label: string }[];
  selectedUnassignEmployeeIds: number[];
  setSelectedUnassignEmployeeIds: (ids: number[]) => void;
  selectedAssignmentIds: number[];
  setSelectedAssignmentIds: (ids: number[]) => void;
  availableAssignments: any[];
  unassignProgress: string;
  unassignSuccessMsg: string | null;
  unassignErrorMsg: string | null;
  handleUnassign: () => void;
}

export const UnassignModal: React.FC<UnassignModalProps> = ({
  isOpen,
  onClose,
  employeeOptions,
  selectedUnassignEmployeeIds,
  setSelectedUnassignEmployeeIds,
  selectedAssignmentIds,
  setSelectedAssignmentIds,
  availableAssignments,
  unassignProgress,
  unassignSuccessMsg,
  unassignErrorMsg,
  handleUnassign,
}) => {
  // Group assignments by employee
  const groupedAssignments = React.useMemo(() => {
    const groups: { [employeeId: number]: any[] } = {};
    availableAssignments.forEach((assignment) => {
      const empId = assignment.employee_id;
      if (!groups[empId]) {
        groups[empId] = [];
      }
      groups[empId].push(assignment);
    });
    return groups;
  }, [availableAssignments]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl m-4">
      <div className="relative w-full max-w-6xl rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-9">
        <div className="px-2 pr-10">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Unassign Work Schedules
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Select employees and their work schedule assignments to remove.
          </p>
        </div>

        <div className="custom-scrollbar max-h-[500px] overflow-y-auto px-2 pb-3">
          {/* Step 1: Select employees */}
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Step 1: Select employees
            </p>
            <Select
              isMulti
              options={employeeOptions}
              value={employeeOptions.filter((opt) =>
                selectedUnassignEmployeeIds.includes(opt.value)
              )}
              onChange={(opts) => {
                const selected =
                  (opts as { value: number; label: string }[]) || [];

                const hasSelectAll = selected.some((opt) => opt.value === -1);
                const previouslyHadSelectAll =
                  selectedUnassignEmployeeIds.includes(-1);

                let ids: number[];

                if (hasSelectAll && !previouslyHadSelectAll) {
                  ids = employeeOptions
                    .filter((opt) => opt.value !== -1)
                    .map((opt) => opt.value);
                } else if (!hasSelectAll && previouslyHadSelectAll) {
                  ids = [];
                } else if (hasSelectAll) {
                  ids = selected
                    .filter((opt) => opt.value !== -1)
                    .map((opt) => opt.value);
                } else {
                  ids = selected.map((opt) => opt.value);
                }

                setSelectedUnassignEmployeeIds(ids);
                setSelectedAssignmentIds([]);
              }}
              placeholder="Select employees..."
              classNamePrefix="react-select"
              noOptionsMessage={() => "No employees found."}
              menuPosition="fixed"
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                menu: (base) => ({ ...base, zIndex: 99999 }),
              }}
            />
          </div>

          {/* Step 2: Show assignments grouped by employee */}
          {selectedUnassignEmployeeIds.length > 0 && Object.keys(groupedAssignments).length > 0 && (
            <div className="mb-4 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Step 2: Select assignments to unassign
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = availableAssignments.map((a: any) => a.assignment_id);
                      setSelectedAssignmentIds(allIds);
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAssignmentIds([])}
                    className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {Object.entries(groupedAssignments).map(([employeeId, assignments]) => {
                const firstAssignment = assignments[0];
                return (
                  <div key={employeeId} className="space-y-2">
                    {/* Employee header */}
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {firstAssignment.employee_code} - {firstAssignment.employee_name}
                      </h5>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {assignments.length} assignment{assignments.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Assignments grid - responsive: 1 col on mobile, 2 on tablet, 3 on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignments.map((assignment: any) => {
                        const isChecked = selectedAssignmentIds.includes(assignment.assignment_id);
                        return (
                          <label
                            key={assignment.assignment_id}
                            className={`flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                              isChecked
                                ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-400"
                                : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAssignmentIds([...selectedAssignmentIds, assignment.assignment_id]);
                                } else {
                                  setSelectedAssignmentIds(
                                    selectedAssignmentIds.filter((id) => id !== assignment.assignment_id)
                                  );
                                }
                              }}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white/90 truncate">
                                  {assignment.work_schedule?.schedule_name}
                                </p>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                                  #{assignment.assignment_id}
                                </span>
                              </div>
                              <div className="space-y-0.5 text-[11px] text-gray-600 dark:text-gray-400">
                                <p className="truncate">
                                  <span className="font-medium">Time:</span>{" "}
                                  {assignment.work_schedule?.start_time} - {assignment.work_schedule?.end_time}
                                </p>
                                <p className="truncate">
                                  <span className="font-medium">Period:</span>{" "}
                                  {assignment.effective_from} → {assignment.effective_to}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Progress message */}
          {unassignProgress && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {unassignProgress}
              </p>
            </div>
          )}

          {/* Success/Error messages */}
          {unassignSuccessMsg && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
              {unassignSuccessMsg}
            </p>
          )}
          {unassignErrorMsg && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {unassignErrorMsg}
            </p>
          )}
        </div>

        {/* Footer buttons */}
        <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={!!unassignProgress}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUnassign}
            disabled={selectedAssignmentIds.length === 0 || !!unassignProgress}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {unassignProgress
              ? "Processing..."
              : `Unassign (${selectedAssignmentIds.length})`}
          </button>
        </div>
      </div>
    </Modal>
  );
};
