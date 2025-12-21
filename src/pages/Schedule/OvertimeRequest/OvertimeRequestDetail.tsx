import { useState } from "react";
import { useParams } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { useAppSelector } from "../../../redux/hook";
import {
  useGetOvertimeRequestByIdQuery,
  useApproveOvertimeRequestMutation,
  useRejectOvertimeRequestMutation,
  useCancelOvertimeRequestMutation,
} from "../../../redux/api/attendanceApiSlice";
import { useGetEmployeeByIdQuery } from "../../../redux/api/employeeApiSlice";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { CheckCircle, XCircle, Ban } from "lucide-react";
import Alert from "../../../components/ui/alert/Alert";
import { useGetAccountByIdQuery } from "../../../redux/api/authApiSlice";

const OvertimeRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const userRole = useAppSelector(
    (state) => state.auth.userState?.data?.user?.role
  );
  const canAction = userRole !== "HR_MANAGER";
  const {
    isOpen: isApproveOpen,
    openModal: openApprove,
    closeModal: closeApprove,
  } = useModal();
  const {
    isOpen: isRejectOpen,
    openModal: openReject,
    closeModal: closeReject,
  } = useModal();
  const {
    isOpen: isCancelOpen,
    openModal: openCancel,
    closeModal: closeCancel,
  } = useModal();

  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const { data, isLoading, error } = useGetOvertimeRequestByIdQuery(
    { token: token!, id: Number(id) },
    { skip: !token || !id }
  );

  const overtimeRequest = data?.data;
  const requestedById = overtimeRequest?.requested_by;

  const { data: requestedByAcc, isLoading: isLoadingRequestedBy } =
    useGetAccountByIdQuery(
      { token: token!, id: String(requestedById) },
      { skip: !token || !requestedById }
    );

  const requesterName =
    requestedByAcc?.data?.full_name ||
    requestedByAcc?.data?.email ||
    `User ID: ${requestedById}`;

  // Fetch related data by ID
  const { data: employeeData } = useGetEmployeeByIdQuery(
    { token: token!, id: overtimeRequest?.employee_id ?? 0 },
    { skip: !token || !overtimeRequest?.employee_id }
  );

  const { data: approverData } = useGetAccountByIdQuery(
    { token: token!, id: overtimeRequest?.approved_by ?? 0 },
    { skip: !token || !overtimeRequest?.approved_by }
  );

  const [approveOvertimeRequest, { isLoading: isApproving }] =
    useApproveOvertimeRequestMutation();
  const [rejectOvertimeRequest, { isLoading: isRejecting }] =
    useRejectOvertimeRequestMutation();
  const [cancelOvertimeRequest, { isLoading: isCancelling }] =
    useCancelOvertimeRequestMutation();

  // Form states
  const [rejectionReason, setRejectionReason] = useState("");

  const [alert, setAlert] = useState<null | {
    type: "success" | "error";
    message: string;
  }>(null);

  if (isLoading) return <div>Loading…</div>;
  if (error || !overtimeRequest)
    return <div>Error loading overtime request</div>;

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };
  const formatDateTime2 = (dateString: string) => {
    // Extract time from ISO string without timezone conversion
    const timeMatch = dateString.match(/T(\d{2}):(\d{2})/);
    if (timeMatch) {
      const hours = timeMatch[1];
      const minutes = timeMatch[2];
      return `${hours}h${minutes}`;
    }
    // Fallback to original method
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Badge color helper
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "APPROVED":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "REJECTED":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Handle Approve
  const handleApprove = async () => {
    if (!token || !id) return;

    // Check if overtime_date is in the future
    if (overtimeRequest?.overtime_date) {
      const overtimeDate = new Date(overtimeRequest.overtime_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      overtimeDate.setHours(0, 0, 0, 0);
      
      if (overtimeDate < today) {
        setAlert({ 
          type: "error", 
          message: "Cannot approve request with start date in the past. You can only reject." 
        });
        closeApprove();
        return;
      }
    }

    try {
      await approveOvertimeRequest({
        token,
        id: Number(id),
      }).unwrap();

      closeApprove();
      setAlert({
        type: "success",
        message: "Overtime request approved successfully",
      });
    } catch (err: any) {
      console.error("Approve failed", err);
      setAlert({
        type: "error",
        message: err?.data?.message || "Failed to approve overtime request",
      });
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!token || !id) return;

    const reason = rejectionReason.trim();
    if (!reason) {
      setAlert({ type: "error", message: "Rejection reason is required." });
      return;
    }

    try {
      await rejectOvertimeRequest({
        token,
        id: Number(id),
        body: {
          rejection_reason: reason, // luôn gửi reason
        },
      }).unwrap();

      setRejectionReason("");
      closeReject();
      setAlert({
        type: "success",
        message: "Overtime request rejected successfully",
      });
    } catch (err: any) {
      console.error("Reject failed", err);
      setAlert({
        type: "error",
        message: err?.data?.message || "Failed to reject overtime request",
      });
    }
  };

  // Handle Cancel
  const handleCancel = async () => {
    if (!token || !id) return;

    try {
      await cancelOvertimeRequest({
        token,
        id: Number(id),
      }).unwrap();

      closeCancel();
      setAlert({
        type: "success",
        message: "Overtime request cancelled successfully",
      });
    } catch (err: any) {
      console.error("Cancel failed", err);
      setAlert({
        type: "error",
        message: err?.data?.message || "Failed to cancel overtime request",
      });
    }
  };

  return (
    <>
      <PageMeta
        title={`Overtime Request #${overtimeRequest?.id || "Detail"}`}
        description=""
      />

      <PageBreadcrumb
        pageTitle={`Request #${overtimeRequest.id}`}
        items={[
          { label: "Overtime Requests", to: "/overtime-requests" },
          { label: `Request #${overtimeRequest.id}` },
        ]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-between mb-5 lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Overtime Request Detail
          </h3>

          {/* Action buttons */}
          {overtimeRequest.status === "PENDING" && canAction && (
            <div className="flex gap-3">
              <button
                onClick={openApprove}
                className="flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={openReject}
                className="flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <div className="space-y-4">
                <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                  Request Information
                </h5>
                <div className="space-y-3">
                  
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Requested By
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {isLoadingRequestedBy ? "Loading…" : requesterName}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                        overtimeRequest.status
                      )}`}
                    >
                      {overtimeRequest.status}
                    </span>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Employee
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {employeeData?.data?.full_name ||
                        `Employee ID: ${overtimeRequest.employee_id}`}
                    </p>
                  </div>
                  {overtimeRequest.shift_id && (
                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Shift ID
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {overtimeRequest.shift_id}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Created At
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDateTime(overtimeRequest.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Overtime Details */}
              <div className="space-y-4">
                <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                  Overtime Details
                </h5>
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Overtime Date
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDate(overtimeRequest.overtime_date)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Start Time
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDateTime2(overtimeRequest.start_time)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      End Time
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDateTime2(overtimeRequest.end_time)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Estimated Hours
                    </p>
                    <p className="text-lg font-semibold text-brand-600 dark:text-brand-400">
                      {overtimeRequest.estimated_hours} hours
                    </p>
                  </div>
                  {overtimeRequest.actual_hours && (
                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Actual Hours
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {overtimeRequest.actual_hours} hours
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Reason
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {overtimeRequest.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval/Rejection Information */}
              {(overtimeRequest.status === "APPROVED" ||
                overtimeRequest.status === "REJECTED") && (
                <div className="space-y-4 col-span-2">
                  <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                    {overtimeRequest.status === "APPROVED" &&
                      "Approval Information"}
                    {overtimeRequest.status === "REJECTED" &&
                      "Rejection Information"}
                  </h5>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {overtimeRequest.status === "APPROVED" && (
                      <>
                        {overtimeRequest.approved_by && (
                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Approved By
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {approverData?.data?.full_name ||
                                `User ID: ${overtimeRequest.approved_by}`}
                            </p>
                          </div>
                        )}
                        {overtimeRequest.approved_at && (
                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Approved At
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {formatDateTime(overtimeRequest.approved_at)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {overtimeRequest.status === "REJECTED" &&
                      overtimeRequest.rejection_reason && (
                        <div className="col-span-2">
                          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                            Rejection Reason
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {overtimeRequest.rejection_reason}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {canAction && (
        <>
          {/* APPROVE MODAL */}
          <Modal
            isOpen={isApproveOpen}
            onClose={closeApprove}
            className="max-w-md m-4"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
                Approve Overtime Request
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    Are you sure you want to approve this overtime request?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    Employee:{" "}
                    {employeeData?.data?.full_name ||
                      overtimeRequest.employee_id}{" "}
                    | Hours: {overtimeRequest.estimated_hours}
                  </p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button size="sm" variant="outline" onClick={closeApprove}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isApproving ? "Approving..." : "Approve"}
                  </Button>
                </div>
              </div>
            </div>
          </Modal>

          {/* REJECT MODAL */}
          <Modal
            isOpen={isRejectOpen}
            onClose={closeReject}
            className="max-w-md m-4"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
                Reject Overtime Request
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>
                    Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button size="sm" variant="outline" onClick={closeReject}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReject}
                    disabled={isRejecting || !rejectionReason.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isRejecting ? "Rejecting..." : "Reject"}
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        </>
      )}

      {/* ALERT MODAL */}
      <Modal
        isOpen={!!alert}
        onClose={() => setAlert(null)}
        className="max-w-md m-4"
      >
        <div className="w-full p-6">
          {alert && (
            <>
              <Alert
                variant={alert.type}
                title={alert.type === "success" ? "Success" : "Failed"}
                message={alert.message}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAlert(null)}
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

export default OvertimeRequestDetail;
