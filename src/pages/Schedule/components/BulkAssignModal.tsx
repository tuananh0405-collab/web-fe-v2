// src/pages/Schedule/components/BulkAssignModal.tsx
import React from "react";
import { Modal } from "../../../components/ui/modal";
import DatePicker from "../../../components/form/date-picker";
import Select from "react-select";

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkEffectiveFrom: string;
  bulkEffectiveTo: string;
  setBulkEffectiveFrom: (date: string) => void;
  setBulkEffectiveTo: (date: string) => void;
  workScheduleOptions: { value: number; label: string }[];
  selectedSchedule: { value: number; label: string } | null;
  setSelectedSchedule: (schedule: { value: number; label: string } | null) => void;
  employeeOptions: { value: number; label: string }[];
  selectedEmployeeIds: number[];
  setSelectedEmployeeIds: (ids: number[]) => void;
  isLoading: boolean;
  isAssigning: boolean;
  bulkSuccessMsg: string | null;
  bulkErrorMsg: string | null;
  onAssign: () => void;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  isOpen,
  onClose,
  bulkEffectiveFrom,
  bulkEffectiveTo,
  setBulkEffectiveFrom,
  setBulkEffectiveTo,
  workScheduleOptions,
  selectedSchedule,
  setSelectedSchedule,
  employeeOptions,
  selectedEmployeeIds,
  setSelectedEmployeeIds,
  isLoading,
  isAssigning,
  bulkSuccessMsg,
  bulkErrorMsg,
  onAssign,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl m-4">
      <div className="w-full p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
          Assign shifts
        </h4>

        {/* Date range */}
        <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              Start date
            </p>
            <DatePicker
              id="bulk-start-picker"
              mode="single"
              defaultDate={bulkEffectiveFrom || undefined}
              placeholder="Select start date"
              onChange={(_selectedDates: Date[], dateStr: string) =>
                setBulkEffectiveFrom(dateStr)
              }
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              End date
            </p>
            <DatePicker
              id="bulk-end-picker"
              mode="single"
              defaultDate={bulkEffectiveTo || undefined}
              placeholder="Select end date"
              onChange={(_selectedDates: Date[], dateStr: string) =>
                setBulkEffectiveTo(dateStr)
              }
            />
          </div>
        </div>

        {/* Chọn ca đăng ký */}
        <div className="mb-4">
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
            Select work schedule
          </p>
          <Select
            options={workScheduleOptions}
            value={selectedSchedule}
            onChange={(opt) => setSelectedSchedule(opt)}
            placeholder="Select work schedule..."
            classNamePrefix="react-select"
            isClearable
          />
        </div>

        {/* Select employees */}
        {selectedSchedule && (
          <div className="mb-4">
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              Select employees for{" "}
              <span className="font-medium">{selectedSchedule.label}</span>
            </p>
            {isLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading employees...
              </p>
            ) : (
              <Select
                isMulti
                options={employeeOptions}
                value={employeeOptions.filter((opt) =>
                  selectedEmployeeIds.includes(opt.value)
                )}
                onChange={(opts) => {
                  const selected =
                    (opts as { value: number; label: string }[]) || [];

                  // Check if "Select All" was clicked
                  const hasSelectAll = selected.some(
                    (opt) => opt.value === -1
                  );
                  const previouslyHadSelectAll =
                    selectedEmployeeIds.includes(-1);

                  let ids: number[];

                  if (hasSelectAll && !previouslyHadSelectAll) {
                    // Select All was just clicked - select all employees
                    ids = employeeOptions
                      .filter((opt) => opt.value !== -1)
                      .map((opt) => opt.value);
                  } else if (!hasSelectAll && previouslyHadSelectAll) {
                    // Select All was deselected - clear all
                    ids = [];
                  } else if (hasSelectAll) {
                    // Select All is already selected, user clicked individual item
                    // Remove Select All and keep only the clicked items
                    ids = selected
                      .filter((opt) => opt.value !== -1)
                      .map((opt) => opt.value);
                  } else {
                    // Normal selection without Select All
                    ids = selected.map((opt) => opt.value);
                  }

                  setSelectedEmployeeIds(ids);
                }}
                placeholder="Select employees..."
                classNamePrefix="react-select"
                noOptionsMessage={() => "No employees found."}
              />
            )}
          </div>
        )}

        {/* Messages */}
        {bulkSuccessMsg && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            {bulkSuccessMsg}
          </p>
        )}
        {bulkErrorMsg && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {bulkErrorMsg}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onAssign}
            disabled={
              isAssigning ||
              !selectedSchedule ||
              selectedEmployeeIds.length === 0
            }
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {isAssigning ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
