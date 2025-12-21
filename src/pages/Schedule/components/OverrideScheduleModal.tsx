// src/pages/Schedule/components/OverrideScheduleModal.tsx
import React, { useState, useMemo } from "react";
import Select from "react-select";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Alert from "../../../components/ui/alert/Alert";
import Button from "../../../components/ui/button/Button";

interface OverrideScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchedule: any | null; // Current schedule with assignment_id
  assignmentId: number | null;
  selectedDate: string; // The date to swap (YYYY-MM-DD)
  allSchedules: any[];
  employees: any[]; // Employee data with scheduleAssignments
  onOverride: (data: {
    assignmentId: number;
    overrideScheduleId: number;
    fromDate: string;
    toDate: string;
    reason: string;
  }) => void;
  isSubmitting: boolean;
  resultModal: {
    show: boolean;
    type: "success" | "error";
    message: string;
  } | null;
  onCloseResult: () => void;
}

export const OverrideScheduleModal: React.FC<OverrideScheduleModalProps> = ({
  isOpen,
  onClose,
  currentSchedule,
  assignmentId,
  selectedDate,
  allSchedules,
  employees,
  onOverride,
  isSubmitting,
  resultModal,
  onCloseResult,
}) => {
  const [selectedOverrideScheduleId, setSelectedOverrideScheduleId] = useState<number | null>(null);
  const [reason, setReason] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const selectedSchedule = availableSchedules.find((s) => s.id === selectedOverrideScheduleId);

  // Helper function to check if two time ranges overlap
  const timeRangesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    // Convert time strings (HH:MM:SS) to minutes for comparison
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);

    // Check if ranges overlap: (start1 < end2) && (start2 < end1)
    return start1Min < end2Min && start2Min < end1Min;
  };

  // Check for schedule conflicts when user selects a new schedule
  const conflictingSchedule = useMemo(() => {
    if (!assignmentId || !selectedDate) {
      return null;
    }

    // Find the employee who owns this assignment
    let currentEmployee = null;
    let currentAssignment = null;
    for (const emp of employees) {
      const found = emp.scheduleAssignments?.find((a: any) => a.assignment_id === assignmentId);
      if (found) {
        currentEmployee = emp;
        currentAssignment = found;
        break;
      }
    }

    if (!currentEmployee || !currentAssignment) {
      console.warn("[Conflict Check] Employee/Assignment not found for assignmentId:", assignmentId);
      return null;
    }

    // Check if employee already has an assignment with the selected schedule for this date
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);

    // CRITICAL: Check if THIS assignment already has an override for the selected date
    if (currentAssignment.schedule_overrides && currentAssignment.schedule_overrides.length > 0) {
      for (const override of currentAssignment.schedule_overrides) {
        const overrideFrom = new Date(override.from_date);
        const overrideTo = new Date(override.to_date);
        overrideFrom.setHours(0, 0, 0, 0);
        overrideTo.setHours(0, 0, 0, 0);

        const overrideCoversDate = targetDate >= overrideFrom && targetDate <= overrideTo;

        if (overrideCoversDate && override.status === 'ACTIVE') {
          // This assignment already has an active override for this date
          const overrideSchedule = allSchedules.find((s) => s.id === override.override_work_schedule_id);

          return {
            type: 'already_overridden',
            assignment_id: currentAssignment.assignment_id,
            schedule_name: overrideSchedule?.schedule_name || 'Unknown',
            start_time: overrideSchedule?.start_time || '',
            end_time: overrideSchedule?.end_time || '',
            from_date: override.from_date,
            to_date: override.to_date,
            status: override.status,
            reason: override.reason,
            is_override: true,
          };
        }
      }
    }

    // If no override conflict, check if user selected a schedule
    if (!selectedOverrideScheduleId) {
      return null;
    }

    // Get the selected schedule details
    const selectedScheduleDetails = allSchedules.find((s) => s.id === selectedOverrideScheduleId);
    if (!selectedScheduleDetails) {
      return null;
    }

    const selectedStartTime = selectedScheduleDetails.start_time;
    const selectedEndTime = selectedScheduleDetails.end_time;

    // Check all assignments of this employee
    for (const assignment of currentEmployee.scheduleAssignments || []) {
      // IMPORTANT: Skip the current assignment being swapped to avoid false conflict
      if (assignment.assignment_id === assignmentId) {
        continue;
      }

      const effectiveFrom = new Date(assignment.effective_from);
      const effectiveTo = new Date(assignment.effective_to);
      effectiveFrom.setHours(0, 0, 0, 0);
      effectiveTo.setHours(0, 0, 0, 0);

      // Check if this assignment covers the selected date
      const coversDate = targetDate >= effectiveFrom && targetDate <= effectiveTo;
      
      if (!coversDate) continue;

      // First check schedule overrides for this date (overrides take precedence)
      let existingScheduleId = assignment.work_schedule_id;
      let isOverride = false;
      let overrideInfo = null;

      if (assignment.schedule_overrides && assignment.schedule_overrides.length > 0) {
        for (const override of assignment.schedule_overrides) {
          const overrideFrom = new Date(override.from_date);
          const overrideTo = new Date(override.to_date);
          overrideFrom.setHours(0, 0, 0, 0);
          overrideTo.setHours(0, 0, 0, 0);

          const overrideCoversDate = targetDate >= overrideFrom && targetDate <= overrideTo;

          if (overrideCoversDate) {
            existingScheduleId = override.override_work_schedule_id;
            isOverride = true;
            overrideInfo = {
              from_date: override.from_date,
              to_date: override.to_date,
              status: override.status,
              reason: override.reason,
            };
            break;
          }
        }
      }

      // Get the existing schedule details
      const existingSchedule = allSchedules.find((s) => s.id === existingScheduleId);
      if (!existingSchedule) continue;

      // Check 1: Same schedule ID
      if (existingScheduleId === selectedOverrideScheduleId) {
        return {
          type: 'same_schedule',
          assignment_id: assignment.assignment_id,
          schedule_name: existingSchedule.schedule_name,
          start_time: existingSchedule.start_time,
          end_time: existingSchedule.end_time,
          effective_from: assignment.effective_from,
          effective_to: assignment.effective_to,
          is_override: isOverride,
          ...overrideInfo,
        };
      }

      // Check 2: Time overlap
      const hasTimeOverlap = timeRangesOverlap(
        selectedStartTime,
        selectedEndTime,
        existingSchedule.start_time,
        existingSchedule.end_time
      );

      if (hasTimeOverlap) {
        return {
          type: 'time_overlap',
          assignment_id: assignment.assignment_id,
          schedule_name: existingSchedule.schedule_name,
          start_time: existingSchedule.start_time,
          end_time: existingSchedule.end_time,
          effective_from: assignment.effective_from,
          effective_to: assignment.effective_to,
          is_override: isOverride,
          ...overrideInfo,
        };
      }
    }

    return null;
  }, [assignmentId, selectedDate, selectedOverrideScheduleId, employees, allSchedules]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedOverrideScheduleId) {
      newErrors.schedule = "Please select a schedule to swap to";
    }

    if (!reason.trim()) {
      newErrors.reason = "Reason is required";
    }

    // Check for conflict - MUST block submission
    if (conflictingSchedule) {
      newErrors.conflict = "Cannot swap: Employee already has this schedule assigned for this date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !assignmentId || !selectedOverrideScheduleId) return;

    // Double-check conflict before submitting (safety check)
    if (conflictingSchedule) {
      console.error("Conflict detected, blocking submission:", conflictingSchedule);
      setErrors({ conflict: "Cannot swap: Employee already has this schedule assigned for this date." });
      return;
    }

    // Use selectedDate for both from_date and to_date (single-day swap)
    onOverride({
      assignmentId,
      overrideScheduleId: selectedOverrideScheduleId,
      fromDate: selectedDate,
      toDate: selectedDate,
      reason: reason.trim(),
    });
  };

  const handleClose = () => {
    setSelectedOverrideScheduleId(null);
    setReason("");
    setErrors({});
    onClose();
  };

  return (
    <>
      {/* Main Swap Modal */}
      <Modal isOpen={isOpen && !resultModal} onClose={handleClose} className="max-w-3xl m-4">
        <div className="w-full p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            🔄 Swap Schedule for {selectedDate}
          </h4>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Swap your schedule for this specific day. The selected schedule will replace your current schedule on {selectedDate}.
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

          {/* Override Schedule Selection */}
          <div className="mb-5">
            <Label>
              Select New Schedule <span className="text-red-500">*</span>
            </Label>
            <Select
              options={scheduleOptions}
              value={scheduleOptions.find((opt) => opt.value === selectedOverrideScheduleId) || null}
              onChange={(opt) => {
                setSelectedOverrideScheduleId(opt?.value || null);
                setErrors((prev) => ({ ...prev, schedule: "" }));
              }}
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
            {errors.schedule && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.schedule}</p>
            )}
          </div>

          {/* Reason */}
          <div className="mb-5">
            <Label>
              Reason <span className="text-red-500">*</span>
            </Label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors((prev) => ({ ...prev, reason: "" }));
              }}
              placeholder="Enter reason for schedule override..."
              rows={3}
              className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                errors.reason
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.reason}</p>
            )}
          </div>

          {/* Preview Swap Schedule */}
          {selectedSchedule && !conflictingSchedule && (
            <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                ✨ Preview: Schedule After Swap
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {currentSchedule?.schedule_name} → {selectedSchedule.schedule_name}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Date:</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {selectedDate}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">New Time:</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {selectedSchedule.start_time} - {selectedSchedule.end_time}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">New Break:</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {selectedSchedule.break_duration_minutes || 0} minutes
                  </p>
                </div>
              </div>
              <p className="mt-3 pt-3 border-t border-green-200 dark:border-green-700 text-xs text-gray-600 dark:text-gray-400">
                ℹ️ Note: This is a single-day swap. Your schedule will return to normal the next day.
              </p>
            </div>
          )}

          {/* Conflict Warning */}
          {conflictingSchedule && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2 flex items-center gap-1">
                ⚠️ Schedule Conflict Detected
              </p>
              {conflictingSchedule.type === 'already_overridden' ? (
                <p className="text-sm text-red-900 dark:text-red-100 mb-2">
                  This schedule has already been overridden for <strong>{selectedDate}</strong>. You cannot create another override for the same date.
                </p>
              ) : conflictingSchedule.type === 'same_schedule' ? (
                <p className="text-sm text-red-900 dark:text-red-100 mb-2">
                  Employee already has <strong>{conflictingSchedule.schedule_name}</strong> assigned for <strong>{selectedDate}</strong>
                </p>
              ) : (
                <p className="text-sm text-red-900 dark:text-red-100 mb-2">
                  Selected schedule has <strong>overlapping work hours</strong> with existing schedule on <strong>{selectedDate}</strong>
                </p>
              )}
              <div className="bg-white/50 dark:bg-black/20 rounded p-3 space-y-1 text-sm">
                <p className="text-gray-800 dark:text-gray-200">
                  <span className="font-semibold">Conflicting Schedule:</span> {conflictingSchedule.schedule_name}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Time:</span> {conflictingSchedule.start_time} - {conflictingSchedule.end_time}
                </p>
                {conflictingSchedule.is_override ? (
                  <>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Type:</span>{" "}
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        Schedule Override
                      </span>
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Status:</span>{" "}
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        conflictingSchedule.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : conflictingSchedule.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                      }`}>
                        {conflictingSchedule.status}
                      </span>
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Period:</span> {conflictingSchedule.from_date} to {conflictingSchedule.to_date}
                    </p>
                    {conflictingSchedule.reason && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Reason:</span> {conflictingSchedule.reason}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Assignment Period:</span> {conflictingSchedule.effective_from} to {conflictingSchedule.effective_to}
                  </p>
                )}
              </div>
              <p className="mt-3 text-xs text-red-700 dark:text-red-300">
                {conflictingSchedule.type === 'same_schedule' 
                  ? "❌ Cannot swap to this schedule because employee is already assigned to it for this date. Please choose a different schedule."
                  : "❌ Cannot swap to this schedule because the work hours overlap with an existing schedule. Please choose a schedule with different working hours."
                }
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !!conflictingSchedule}
              size="sm"
            >
              {isSubmitting ? "Swapping..." : "Confirm Swap"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Result Modal */}
      <Modal
        isOpen={!!resultModal}
        onClose={onCloseResult}
        className="max-w-md m-4"
      >
        <div className="w-full p-6">
          {resultModal && (
            <>
              <Alert
                variant={resultModal.type}
                title={resultModal.type === "success" ? "Success" : "Failed"}
                message={resultModal.message}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCloseResult}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};
