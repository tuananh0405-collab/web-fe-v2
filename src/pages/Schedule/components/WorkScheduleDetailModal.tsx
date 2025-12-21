// src/pages/Schedule/components/WorkScheduleDetailModal.tsx
import React from "react";
import { Modal } from "../../../components/ui/modal";

interface WorkScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleDetail: any | null;
  assignmentId: number | null;
  selectedDate: string; // The date to swap (YYYY-MM-DD)
  onEdit: () => void;
  onOverride: (assignmentId: number, dateStr: string) => void;
  isOverride?: boolean; // Flag to indicate if this is an override schedule
  isHR?: boolean;
}

const formatWorkDays = (workDays: string) => {
  if (!workDays) return "N/A";
  const dayMap: Record<string, string> = {
    "1": "Mon",
    "2": "Tue",
    "3": "Wed",
    "4": "Thu",
    "5": "Fri",
    "6": "Sat",
    "7": "Sun",
  };
  return workDays
    .split(",")
    .map((d) => dayMap[d.trim()] || d)
    .join(", ");
};

export const WorkScheduleDetailModal: React.FC<WorkScheduleDetailModalProps> = ({
  isOpen,
  onClose,
  scheduleDetail,
  assignmentId,
  selectedDate,
  onEdit,
  onOverride,
  isOverride = false,
  isHR = false,
}) => {
  if (!scheduleDetail) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="w-full p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
          Work Schedule Detail
        </h4>

        <div className="space-y-2 text-sm text-gray-800 dark:text-gray-100">
          <p>
            <span className="font-medium">Schedule Name:</span>{" "}
            {scheduleDetail.schedule_name || "N/A"}
          </p>
          <p>
            <span className="font-medium">Work Days:</span>{" "}
            {formatWorkDays(scheduleDetail.work_days)}
          </p>
          <p>
            <span className="font-medium">Time:</span>{" "}
            {scheduleDetail.start_time} - {scheduleDetail.end_time}
          </p>
          <p>
            <span className="font-medium">Late Tolerance:</span>{" "}
            {scheduleDetail.late_tolerance_minutes || 0} minutes
          </p>
          <p>
            <span className="font-medium">Early Arrival Tolerance:</span>{" "}
            {scheduleDetail.early_arrival_tolerance_minutes || 60} minutes
          </p>
          <p>
            <span className="font-medium">Early Leave Tolerance:</span>{" "}
            {scheduleDetail.early_leave_tolerance_minutes || 0} minutes
          </p>
          <p>
            <span className="font-medium">Late Leave Tolerance:</span>{" "}
            {scheduleDetail.late_leave_tolerance_minutes || 60} minutes
          </p>
          {scheduleDetail.created_at && (
            <p>
              <span className="font-medium">Created:</span>{" "}
              {new Date(scheduleDetail.created_at).toLocaleString()}
            </p>
          )}
          {scheduleDetail.updated_at && (
            <p>
              <span className="font-medium">Last Updated:</span>{" "}
              {new Date(scheduleDetail.updated_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          {!isHR && assignmentId && !isOverride && (
            <button
              onClick={() => onOverride(assignmentId, selectedDate)}
              className="rounded-lg border border-brand-500 bg-white px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-400 dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-brand-900/20"
            >
              Swap
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
