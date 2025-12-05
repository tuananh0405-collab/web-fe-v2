// src/pages/Schedule/components/EditWorkScheduleModal.tsx
import React, { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Modal } from "../../../components/ui/modal";

interface EditWorkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editScheduleName: string;
  setEditScheduleName: (name: string) => void;
  editScheduleType: string;
  setEditScheduleType: (type: string) => void;
  editWorkDays: string;
  setEditWorkDays: (days: string) => void;
  editStartTime: string;
  setEditStartTime: (time: string) => void;
  editEndTime: string;
  setEditEndTime: (time: string) => void;
  editBreakDuration: string;
  setEditBreakDuration: (duration: string) => void;
  editLateTolerance: string;
  setEditLateTolerance: (tolerance: string) => void;
  editEarlyLeaveTolerance: string;
  setEditEarlyLeaveTolerance: (tolerance: string) => void;
  editScheduleStatus: string;
  setEditScheduleStatus: (status: string) => void;
  editScheduleErrors: Record<string, string>;
  setEditScheduleErrors: (errors: Record<string, string>) => void;
  isUpdatingSchedule: boolean;
  onSave: () => void;
}

export const EditWorkScheduleModal: React.FC<EditWorkScheduleModalProps> = ({
  isOpen,
  onClose,
  editScheduleName,
  setEditScheduleName,
  editScheduleType,
  setEditScheduleType,
  editWorkDays,
  setEditWorkDays,
  editStartTime,
  setEditStartTime,
  editEndTime,
  setEditEndTime,
  editBreakDuration,
  setEditBreakDuration,
  editLateTolerance,
  setEditLateTolerance,
  editEarlyLeaveTolerance,
  setEditEarlyLeaveTolerance,
  editScheduleStatus,
  setEditScheduleStatus,
  editScheduleErrors,
  setEditScheduleErrors,
  isUpdatingSchedule,
  onSave,
}) => {
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  // Initialize flatpickr time pickers
  useEffect(() => {
    if (!isOpen) return;

    const startTimePicker = startTimeRef.current
      ? flatpickr(startTimeRef.current, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          defaultDate: editStartTime || "08:00",
          onChange: (_selectedDates, dateStr) => {
            setEditStartTime(dateStr);
            if (editScheduleErrors.start_time) {
              setEditScheduleErrors({ ...editScheduleErrors, start_time: "" });
            }
          },
        })
      : null;

    const endTimePicker = endTimeRef.current
      ? flatpickr(endTimeRef.current, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          defaultDate: editEndTime || "17:00",
          onChange: (_selectedDates, dateStr) => {
            setEditEndTime(dateStr);
            if (editScheduleErrors.end_time) {
              setEditScheduleErrors({ ...editScheduleErrors, end_time: "" });
            }
          },
        })
      : null;

    return () => {
      startTimePicker?.destroy();
      endTimePicker?.destroy();
    };
  }, [isOpen, editStartTime, editEndTime, editScheduleErrors, setEditStartTime, setEditEndTime, setEditScheduleErrors]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-4">
      <div className="w-full p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          ✏️ Edit Work Schedule
        </h4>

        <div className="space-y-4">
          {/* Schedule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Schedule Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editScheduleName}
              onChange={(e) => {
                setEditScheduleName(e.target.value);
                if (editScheduleErrors.schedule_name) {
                  setEditScheduleErrors({
                    ...editScheduleErrors,
                    schedule_name: "",
                  });
                }
              }}
              placeholder="e.g., Standard Office Hours"
              className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                editScheduleErrors.schedule_name
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            />
            {editScheduleErrors.schedule_name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {editScheduleErrors.schedule_name}
              </p>
            )}
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Schedule Type
            </label>
            <select
              value={editScheduleType}
              onChange={(e) => setEditScheduleType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              aria-label="Schedule Type"
            >
              <option value="FIXED">Fixed</option>
              <option value="FLEXIBLE">Flexible</option>
              <option value="SHIFT">Shift-based</option>
            </select>
          </div>

          {/* Work Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Work Days <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editWorkDays}
              onChange={(e) => {
                setEditWorkDays(e.target.value);
                if (editScheduleErrors.work_days) {
                  setEditScheduleErrors({
                    ...editScheduleErrors,
                    work_days: "",
                  });
                }
              }}
              placeholder="e.g., 1,2,3,4,5 (1=Mon, 7=Sun)"
              className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                editScheduleErrors.work_days
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            />
            {editScheduleErrors.work_days && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {editScheduleErrors.work_days}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter comma-separated numbers (1=Monday, 2=Tuesday, ..., 7=Sunday)
            </p>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                ref={startTimeRef}
                type="text"
                value={editStartTime}
                onChange={(e) => {
                  setEditStartTime(e.target.value);
                  if (editScheduleErrors.start_time) {
                    setEditScheduleErrors({
                      ...editScheduleErrors,
                      start_time: "",
                    });
                  }
                }}
                placeholder="08:00"
                className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                  editScheduleErrors.start_time
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                readOnly
              />
              {editScheduleErrors.start_time && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {editScheduleErrors.start_time}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                ref={endTimeRef}
                type="text"
                value={editEndTime}
                onChange={(e) => {
                  setEditEndTime(e.target.value);
                  if (editScheduleErrors.end_time) {
                    setEditScheduleErrors({
                      ...editScheduleErrors,
                      end_time: "",
                    });
                  }
                }}
                placeholder="17:00"
                className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                  editScheduleErrors.end_time
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                readOnly
              />
              {editScheduleErrors.end_time && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {editScheduleErrors.end_time}
                </p>
              )}
            </div>
          </div>

          {/* Break Duration, Late Tolerance, Early Leave Tolerance */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Break (min)
              </label>
              <input
                type="number"
                value={editBreakDuration}
                onChange={(e) => setEditBreakDuration(e.target.value)}
                placeholder="60"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Late (min)
              </label>
              <input
                type="number"
                value={editLateTolerance}
                onChange={(e) => setEditLateTolerance(e.target.value)}
                placeholder="15"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Early (min)
              </label>
              <input
                type="number"
                value={editEarlyLeaveTolerance}
                onChange={(e) => setEditEarlyLeaveTolerance(e.target.value)}
                placeholder="15"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={editScheduleStatus}
              onChange={(e) => setEditScheduleStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              aria-label="Schedule Status"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Submit Error */}
          {editScheduleErrors.submit && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {editScheduleErrors.submit}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUpdatingSchedule}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isUpdatingSchedule}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {isUpdatingSchedule ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
