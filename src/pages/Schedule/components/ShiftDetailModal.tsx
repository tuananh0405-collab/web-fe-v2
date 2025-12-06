// src/pages/Schedule/components/ShiftDetailModal.tsx
import React from "react";
import { Modal } from "../../../components/ui/modal";

interface ShiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShiftId: number | null;
  shiftDetail: any;
  isLoading: boolean;
  isError: boolean;
  isEditingShift: boolean;
  editShiftStatus: string;
  setEditShiftStatus: (status: string) => void;
  editShiftNotes: string;
  setEditShiftNotes: (notes: string) => void;
  editShiftReason: string;
  setEditShiftReason: (reason: string) => void;
  editShiftErrors: Record<string, string>;
  setEditShiftErrors: (errors: Record<string, string>) => void;
  isEditingShiftLoading: boolean;
  onEditShift: () => void;
  onCancelEdit: () => void;
  onSaveShiftEdit: () => void;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  isOpen,
  onClose,
  selectedShiftId,
  shiftDetail,
  isLoading,
  isError,
  isEditingShift,
  editShiftStatus,
  setEditShiftStatus,
  editShiftNotes,
  setEditShiftNotes,
  editShiftReason,
  setEditShiftReason,
  editShiftErrors,
  setEditShiftErrors,
  isEditingShiftLoading,
  onEditShift,
  onCancelEdit,
  onSaveShiftEdit,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="w-full p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
          Shift Detail {selectedShiftId ? `#${selectedShiftId}` : ""}
        </h4>

        {isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading shift detail...
          </p>
        )}

        {isError && (
          <p className="text-sm text-red-500">Failed to load shift detail.</p>
        )}

        {shiftDetail && !isEditingShift && (
          <div className="space-y-2 text-sm text-gray-800 dark:text-gray-100">
            <p>
              <span className="font-medium">Employee Code:</span>{" "}
              {shiftDetail.employee_code}
            </p>
            <p>
              <span className="font-medium">Shift Date:</span>{" "}
              {shiftDetail.shift_date}
            </p>
            <p>
              <span className="font-medium">Scheduled:</span>{" "}
              {shiftDetail.scheduled_start_time} -{" "}
              {shiftDetail.scheduled_end_time}
            </p>
            <p>
              <span className="font-medium">Check-in:</span>{" "}
              {shiftDetail.check_in_time || "—"}
            </p>
            <p>
              <span className="font-medium">Check-out:</span>{" "}
              {shiftDetail.check_out_time || "—"}
            </p>
            <p>
              <span className="font-medium">Work hours:</span>{" "}
              {shiftDetail.work_hours}
            </p>
            <p>
              <span className="font-medium">Overtime hours:</span>{" "}
              {shiftDetail.overtime_hours}
            </p>
            <p>
              <span className="font-medium">Late minutes:</span>{" "}
              {shiftDetail.late_minutes}
            </p>
            <p>
              <span className="font-medium">Early leave minutes:</span>{" "}
              {shiftDetail.early_leave_minutes}
            </p>
            <p>
              <span className="font-medium">Status:</span> {shiftDetail.status}
            </p>
            {shiftDetail.notes && (
              <p>
                <span className="font-medium">Notes:</span> {shiftDetail.notes}
              </p>
            )}
          </div>
        )}

        {shiftDetail && isEditingShift && (
          <div className="space-y-4">
            {/* Read-only info */}
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 pb-4 border-b border-gray-200 dark:border-gray-700">
              <p>
                <span className="font-medium">Employee Code:</span>{" "}
                {shiftDetail.employee_code}
              </p>
              <p>
                <span className="font-medium">Shift Date:</span>{" "}
                {shiftDetail.shift_date}
              </p>
              <p>
                <span className="font-medium">Scheduled:</span>{" "}
                {shiftDetail.scheduled_start_time} -{" "}
                {shiftDetail.scheduled_end_time}
              </p>
            </div>

            {/* Editable fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={editShiftStatus}
                onChange={(e) => {
                  setEditShiftStatus(e.target.value);
                  if (editShiftErrors.status) {
                    setEditShiftErrors({ ...editShiftErrors, status: "" });
                  }
                }}
                className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                  editShiftErrors.status
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                aria-label="Shift status"
              >
                <option value="">Select status</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="HOLIDAY">HOLIDAY</option>
                <option value="ABSENT">ABSENT</option>
              </select>
              {editShiftErrors.status && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {editShiftErrors.status}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={editShiftNotes}
                onChange={(e) => setEditShiftNotes(e.target.value)}
                rows={3}
                placeholder="Adjusted due to forgot check-in"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Edit Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={editShiftReason}
                onChange={(e) => {
                  setEditShiftReason(e.target.value);
                  if (editShiftErrors.edit_reason) {
                    setEditShiftErrors({
                      ...editShiftErrors,
                      edit_reason: "",
                    });
                  }
                }}
                rows={2}
                placeholder="Employee forgot to check-in, HR corrected based on evidence"
                className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                  editShiftErrors.edit_reason
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              />
              {editShiftErrors.edit_reason && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {editShiftErrors.edit_reason}
                </p>
              )}
            </div>

            {/* Submit error */}
            {editShiftErrors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {editShiftErrors.submit}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          {!isEditingShift ? (
            <>
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Close
              </button>
              <button
                onClick={onEditShift}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onCancelEdit}
                disabled={isEditingShiftLoading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={onSaveShiftEdit}
                disabled={
                  isEditingShiftLoading || !editShiftStatus || !editShiftReason
                }
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {isEditingShiftLoading ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
