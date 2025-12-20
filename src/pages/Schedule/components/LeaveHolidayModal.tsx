// src/pages/Schedule/components/LeaveHolidayModal.tsx
import React from "react";
import { Modal } from "../../../components/ui/modal";

interface LeaveHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveOrHoliday: { type: "leave" | "holiday"; data: any } | null;
  isHR?: boolean;
}

export const LeaveHolidayModal: React.FC<LeaveHolidayModalProps> = ({
  isOpen,
  onClose,
  leaveOrHoliday,
  isHR = false,
}) => {
  if (!leaveOrHoliday) return null;

  const isLeave = leaveOrHoliday.type === "leave";
  const title = isLeave ? "Leave Details" : "Holiday Details";
  const icon = isLeave ? "🌴" : "🎉";
  const data = leaveOrHoliday.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          {icon} {title}
        </h4>

        <div className="space-y-4">
          {/* Leave-specific fields */}
          {isLeave ? (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-4 border border-orange-200 dark:border-orange-800">
              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    Leave Type:
                  </span>{" "}
                  <span className="text-orange-700 dark:text-orange-300">
                    {data.leave_type_name || "N/A"}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    Start Date:
                  </span>{" "}
                  <span className="text-orange-700 dark:text-orange-300">
                    {data.start_date}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    End Date:
                  </span>{" "}
                  <span className="text-orange-700 dark:text-orange-300">
                    {data.end_date}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    Status:
                  </span>{" "}
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      data.status === "APPROVED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                    }`}
                  >
                    {data.status}
                  </span>
                </p>
                {data.reason && (
                  <p>
                    <span className="font-medium text-orange-900 dark:text-orange-200">
                      Reason:
                    </span>{" "}
                    <span className="text-orange-700 dark:text-orange-300">
                      {data.reason}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4 border border-purple-200 dark:border-purple-800">
              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-medium text-purple-900 dark:text-purple-200">
                    Holiday Name:
                  </span>{" "}
                  <span className="text-purple-700 dark:text-purple-300">
                    {data.holiday_name}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-purple-900 dark:text-purple-200">
                    Date:
                  </span>{" "}
                  <span className="text-purple-700 dark:text-purple-300">
                    {data.holiday_date}
                  </span>
                </p>
                {data.description && (
                  <p>
                    <span className="font-medium text-purple-900 dark:text-purple-200">
                      Description:
                    </span>{" "}
                    <span className="text-purple-700 dark:text-purple-300">
                      {data.description}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Close
          </button>
          {!isHR && (
            <button
              onClick={() => {
                const path = isLeave 
                  ? `/leave-requests/${data.id}` 
                  : `/holiday/${data.id}`;
                window.location.href = path;
              }}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Detail
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
