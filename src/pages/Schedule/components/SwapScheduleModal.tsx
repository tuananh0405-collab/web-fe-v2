// src/pages/Schedule/components/SwapScheduleModal.tsx
import React, { useState, useMemo } from "react";
import Select from "react-select";
import { Modal } from "../../../components/ui/modal";

interface SwapScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchedule: any | null;
  allSchedules: any[];
  onSwap: (targetScheduleId: number) => void;
  isSwapping: boolean;
  swapErrorMsg: string | null;
}

export const SwapScheduleModal: React.FC<SwapScheduleModalProps> = ({
  isOpen,
  onClose,
  currentSchedule,
  allSchedules,
  onSwap,
  isSwapping,
  swapErrorMsg,
}) => {
  const [selectedTargetScheduleId, setSelectedTargetScheduleId] = useState<number | null>(null);

  // Filter out current schedule from the list
  const availableSchedules = useMemo(() => {
    if (!currentSchedule) return [];
    return allSchedules.filter((s) => s.id !== currentSchedule.id && s.status === "ACTIVE");
  }, [currentSchedule, allSchedules]);

  const scheduleOptions = useMemo(() => {
    return availableSchedules.map((schedule) => ({
      value: schedule.id,
      label: `${schedule.schedule_name} (${schedule.start_time} - ${schedule.end_time})`,
    }));
  }, [availableSchedules]);

  const handleSwap = () => {
    if (selectedTargetScheduleId) {
      onSwap(selectedTargetScheduleId);
    }
  };

  const selectedSchedule = availableSchedules.find((s) => s.id === selectedTargetScheduleId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-4">
      <div className="w-full p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          🔄 Swap Work Schedule Times
        </h4>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Select a schedule to swap times with. The start time, end time, and break duration will be exchanged between the two schedules.
        </p>

        {/* Current Schedule Info */}
        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
            Current Schedule
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {currentSchedule?.schedule_name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Time:</span> {currentSchedule?.start_time} - {currentSchedule?.end_time}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Break:</span> {currentSchedule?.break_duration_minutes || 0} minutes
          </p>
        </div>

        {/* Target Schedule Selection */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Schedule to Swap With
          </label>
          <Select
            options={scheduleOptions}
            value={scheduleOptions.find((opt) => opt.value === selectedTargetScheduleId) || null}
            onChange={(opt) => setSelectedTargetScheduleId(opt?.value || null)}
            placeholder="Choose a schedule..."
            classNamePrefix="react-select"
            isClearable
            menuPosition="fixed"
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 99999 }),
              menu: (base) => ({ ...base, zIndex: 99999 }),
            }}
          />
        </div>

        {/* Target Schedule Preview */}
        {selectedSchedule && (
          <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
              Target Schedule (will receive current schedule's times)
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {selectedSchedule.schedule_name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Current Time:</span> {selectedSchedule.start_time} - {selectedSchedule.end_time}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Current Break:</span> {selectedSchedule.break_duration_minutes || 0} minutes
            </p>
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
              <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                ↓ Will become:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">New Time:</span> {currentSchedule?.start_time} - {currentSchedule?.end_time}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">New Break:</span> {currentSchedule?.break_duration_minutes || 0} minutes
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {swapErrorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{swapErrorMsg}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSwapping}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSwap}
            disabled={!selectedTargetScheduleId || isSwapping}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSwapping ? "Swapping..." : "Swap Schedules"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
