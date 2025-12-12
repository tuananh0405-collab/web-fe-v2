// src/pages/Schedule/components/OvertimeModal.tsx
import React, { useMemo } from "react";
import { Modal } from "../../../components/ui/modal";

interface OvertimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  overtimeRequestId: number | null;
  overtimeRequests: any[];
}

export const OvertimeModal: React.FC<OvertimeModalProps> = ({
  isOpen,
  onClose,
  overtimeRequestId,
  overtimeRequests,
}) => {
  // Find overtime data from the list by id
  const overtimeData = useMemo(() => {
    if (!overtimeRequestId || !overtimeRequests) return null;
    return overtimeRequests.find((ot: any) => ot.id === overtimeRequestId);
  }, [overtimeRequestId, overtimeRequests]);

  if (!overtimeData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          ⏰ Overtime Details
        </h4>

        <div className="space-y-4">
          <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-4 border border-orange-200 dark:border-orange-800">
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium text-orange-900 dark:text-orange-200">
                  Overtime Date:
                </span>{" "}
                <span className="text-orange-700 dark:text-orange-300">
                  {new Date(overtimeData.overtime_date).toLocaleDateString()}
                </span>
              </p>
              <p>
                <span className="font-medium text-orange-900 dark:text-orange-200">
                  Time:
                </span>{" "}
                <span className="text-orange-700 dark:text-orange-300">
                  {new Date(overtimeData.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(overtimeData.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </p>
              <p>
                <span className="font-medium text-orange-900 dark:text-orange-200">
                  Estimated Hours:
                </span>{" "}
                <span className="text-orange-700 dark:text-orange-300">
                  {overtimeData.estimated_hours} hours
                </span>
              </p>
              <p>
                <span className="font-medium text-orange-900 dark:text-orange-200">
                  Status:
                </span>{" "}
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    overtimeData.status === "APPROVED"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : overtimeData.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                  }`}
                >
                  {overtimeData.status}
                </span>
              </p>
              {overtimeData.reason && (
                <p>
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    Reason:
                  </span>{" "}
                  <span className="text-orange-700 dark:text-orange-300">
                    {overtimeData.reason}
                  </span>
                </p>
              )}
              {overtimeData.approved_by && (
                <p>
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    Approved By (ID):
                  </span>{" "}
                  <span className="text-orange-700 dark:text-orange-300">
                    {overtimeData.approved_by}
                  </span>
                </p>
              )}
              {overtimeData.requested_by && (
                <p>
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    Requested By (ID):
                  </span>{" "}
                  <span className="text-orange-700 dark:text-orange-300">
                    {overtimeData.requested_by}
                  </span>
                </p>
              )}
              {overtimeData.approved_at && (
                <p>
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    Approved At:
                  </span>{" "}
                  <span className="text-orange-700 dark:text-orange-300">
                    {new Date(overtimeData.approved_at).toLocaleString()}
                  </span>
                </p>
              )}
              {overtimeData.requested_at && (
                <p>
                  <span className="font-medium text-orange-900 dark:text-orange-200">
                    Requested At:
                  </span>{" "}
                  <span className="text-orange-700 dark:text-orange-300">
                    {new Date(overtimeData.requested_at).toLocaleString()}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Close
          </button>
          <button
            onClick={() => {
              window.location.href = `/overtime-requests/${overtimeData.id}`;
            }}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Detail
          </button>
        </div>
      </div>
    </Modal>
  );
};
