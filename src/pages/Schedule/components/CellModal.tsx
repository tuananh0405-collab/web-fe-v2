// src/pages/Schedule/components/CellModal.tsx
import React from "react";
import { Modal } from "../../../components/ui/modal";
import { EmployeeRow, UISimpleShift } from "../types";
import { formatTimeRange, shiftTypeClasses } from "../utils";

interface CellModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellModal: {
    employee: EmployeeRow;
    date: Date;
    shifts: UISimpleShift[];
  } | null;
  workSchedules: any[];
  selectedScheduleId: number | null;
  setSelectedScheduleId: (id: number | null) => void;
  isLoading: boolean;
  isAssigning: boolean;
  onAssignSchedule: () => void;
  isHR?: boolean; // HR role flag
}

export const CellModal: React.FC<CellModalProps> = ({
  isOpen,
  onClose,
  cellModal,
  workSchedules,
  selectedScheduleId,
  setSelectedScheduleId,
  isLoading,
  isAssigning,
  onAssignSchedule,
  isHR = false,
}) => {
  if (!cellModal) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="w-full p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
          {cellModal.employee.fullName}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {cellModal.employee.employeeCode} •{" "}
          {cellModal.employee.departmentName}
          <br />
          {cellModal.date.toDateString()}
        </p>

        {/* Shifts on this day */}
        <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Shifts on this day
        </h5>

        {cellModal.shifts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No shifts for this day.
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            {cellModal.shifts.map((shift) => (
              <div
                key={shift.id}
                className={`rounded-md px-3 py-2 text-sm ${
                  shiftTypeClasses[shift.type]
                }`}
              >
                <p className="font-medium">
                  {formatTimeRange(shift.start, shift.end)}
                </p>
                <p className="text-xs opacity-80">{shift.title}</p>
              </div>
            ))}
          </div>
        )}

        {/* Assign work schedule - hide for HR */}
        {!isHR && (
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Assign Work Schedule
            </h5>

          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading work schedules...
            </p>
          ) : workSchedules.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No work schedules available.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                title="Select work schedule"
                aria-label="Select work schedule"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={selectedScheduleId ?? ""}
                onChange={(e) =>
                  setSelectedScheduleId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Select work schedule</option>
                {workSchedules.map((ws: any) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.schedule_name} ({ws.start_time} - {ws.end_time})
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selectedScheduleId || isAssigning}
                onClick={onAssignSchedule}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          )}
        </div>
        )}

        <div className="mt-5 flex justify-end">
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
