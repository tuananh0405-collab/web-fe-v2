// src/pages/Schedule/components/CellModal.tsx
import React, { useMemo } from "react";
import { Modal } from "../../../components/ui/modal";
import { EmployeeRow, UISimpleShift } from "../types";
import { formatTimeRange, shiftTypeClasses, formatDate, getAllEffectiveSchedulesForDate, isDayInWorkDays } from "../utils";

interface CellModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellModal: {
    employee: EmployeeRow;
    date: Date;
    shifts: UISimpleShift[];
    leaveOrHoliday?: { type: "holiday" | "leave"; label: string; color: string; data: any } | null;
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

  // Get assigned schedules for this date
  const assignedSchedules = useMemo(() => {
    if (!cellModal) return [];
    
    const dayKey = formatDate(cellModal.date);
    const allSchedules = getAllEffectiveSchedulesForDate(
      cellModal.employee.scheduleAssignments,
      dayKey,
      workSchedules
    );

    // Filter by work_days
    return allSchedules.filter((schedule) => {
      if (!schedule) return false;
      const effectiveWorkDays = schedule?.work_days || "";
      return effectiveWorkDays && isDayInWorkDays(cellModal.date, effectiveWorkDays);
    });
  }, [cellModal, workSchedules]);

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

        {/* Show leave/holiday if present, otherwise show shifts and schedules */}
        {cellModal.leaveOrHoliday ? (
          <div className="mb-4">
            <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              {cellModal.leaveOrHoliday.type === "holiday" ? "Holiday" : "Leave"}
            </h5>
            <div
              className="rounded-md px-3 py-2 text-sm font-medium border"
              style={{
                backgroundColor: cellModal.leaveOrHoliday.type === "holiday" 
                  ? "#e5e7eb" // gray-200
                  : `${cellModal.leaveOrHoliday.color}20`, // 20% opacity
                color: cellModal.leaveOrHoliday.type === "holiday"
                  ? "#1f2937" // gray-800
                  : cellModal.leaveOrHoliday.color,
                borderColor: cellModal.leaveOrHoliday.type === "holiday"
                  ? "#9ca3af" // gray-400
                  : cellModal.leaveOrHoliday.color,
              }}
            >
              {cellModal.leaveOrHoliday.label}
            </div>
          </div>
        ) : (
          <>
            {/* Shifts on this day (non-OT) */}
            <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Shifts on this day
            </h5>

            {cellModal.shifts.filter(s => s.type !== "OVERTIME").length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No shifts for this day.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {cellModal.shifts.filter(s => s.type !== "OVERTIME").map((shift) => (
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

            {/* Assigned work schedules */}
            {assignedSchedules.length > 0 && (
              <div className="mb-4">
                <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Assigned Work Schedules
                </h5>
                <div className="space-y-2">
                  {assignedSchedules.map((schedule, idx) => (
                    <div
                      key={`${schedule.id}-${idx}`}
                      className="rounded-md px-3 py-2 text-sm bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-300 dark:border-blue-800"
                    >
                      <p className="font-semibold text-blue-900 dark:text-blue-200">
                        {schedule.schedule_name}
                      </p>
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Overtime requests - always show if present */}
        {cellModal.shifts.filter(s => s.type === "OVERTIME").length > 0 && (
          <div className="mb-4">
            <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Overtime Requests
            </h5>
            <div className="space-y-2">
              {cellModal.shifts.filter(s => s.type === "OVERTIME").map((shift) => (
                <div
                  key={shift.id}
                  className="rounded-md px-3 py-2 text-sm bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-200"
                >
                  <p className="font-medium">
                    {formatTimeRange(shift.start, shift.end)}
                  </p>
                  <p className="text-xs opacity-90">{shift.title}</p>
                </div>
              ))}
            </div>
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
