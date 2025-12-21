import { useState } from "react";
import { useParams } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { useAppSelector } from "../../../redux/hook";
import {
  useGetLeaveRecordByIdQuery,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
  useCancelLeaveRequestMutation,
  useGetLeaveTypeByIdQuery,
} from "../../../redux/api/leaveApiSlice";
import {
  useGetEmployeeByIdQuery,
  useGetDepartmentByIdQuery,
} from "../../../redux/api/employeeApiSlice";
import { useGetAccountByIdQuery } from "../../../redux/api/authApiSlice";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { CheckCircle, XCircle, Ban } from "lucide-react";
import Alert from "../../../components/ui/alert/Alert";

const LeaveRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
   const userRole = useAppSelector(
      (state) => state.auth.userState?.data?.user?.role
    )
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
  const currentUser = useAppSelector((state) => state.auth.userState?.data);

  const { data, isLoading, error } = useGetLeaveRecordByIdQuery(
    { token: token!, id: Number(id) },
    { skip: !token || !id }
  );

  const leaveRecord = data?.data;

  // Fetch related data by ID
  const { data: employeeData } = useGetEmployeeByIdQuery(
    { token: token!, id: leaveRecord?.employee_id ?? 0 },
    { skip: !token || !leaveRecord?.employee_id }
  );

  const { data: departmentData } = useGetDepartmentByIdQuery(
    { token: token!, id: leaveRecord?.department_id ?? 0 },
    { skip: !token || !leaveRecord?.department_id }
  );

  const { data: leaveTypeData } = useGetLeaveTypeByIdQuery(
    { token: token!, id: leaveRecord?.leave_type_id ?? 0 },
    { skip: !token || !leaveRecord?.leave_type_id }
  );

  const { data: approverData } = useGetAccountByIdQuery(
    { token: token!, id: leaveRecord?.approved_by ?? 0 },
    { skip: !token || !leaveRecord?.approved_by }
  );

  const [approveLeaveRequest, { isLoading: isApproving }] =
    useApproveLeaveRequestMutation();
  const [rejectLeaveRequest, { isLoading: isRejecting }] =
    useRejectLeaveRequestMutation();
  const [cancelLeaveRequest, { isLoading: isCancelling }] =
    useCancelLeaveRequestMutation();

 // Form states
const [approveNotes, setApproveNotes] = useState("");
const [rejectionReason, setRejectionReason] = useState("");
const [cancellationReason, setCancellationReason] = useState("");

// Reject validation state
const [rejectTouched, setRejectTouched] = useState(false);
const rejectReasonIsEmpty = !rejectionReason.trim();


  const [alert, setAlert] = useState<
    null | { type: "success" | "error"; message: string }
  >(null);

  if (isLoading) return <div>Loading…</div>;
  if (error || !leaveRecord) return <div>Error loading leave request</div>;

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
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Handle Approve
  const handleApprove = async () => {
    if (!token || !id) return;

    const userId = currentUser?.user?.id ? Number(currentUser.user.id) : undefined;
    if (!userId) {
      setAlert({ type: "error", message: "User ID not found. Please login again." });
      return;
    }

    // Check if start_date is in the future
    if (leaveRecord?.start_date) {
      const startDate = new Date(leaveRecord.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        setAlert({ 
          type: "error", 
          message: "Cannot approve request with start date in the past. You can only reject." 
        });
        closeApprove();
        return;
      }
    }

    try {
      await approveLeaveRequest({
        token,
        id: Number(id),
        body: {
          approved_by: userId,
          notes: approveNotes.trim() || undefined,
        },
      }).unwrap();

      setApproveNotes("");
      closeApprove();
      setAlert({ type: "success", message: "Leave request approved successfully" });
    } catch (err: any) {
      console.error("Approve failed", err);
      setAlert({
        type: "error",
        message: err?.data?.message || "Failed to approve leave request",
      });
    }
  };

  // Handle Reject
const handleReject = async () => {
  setRejectTouched(true);

  if (!token || !id || rejectReasonIsEmpty) {
    setAlert({ type: "error", message: "Rejection reason is required" });
    return;
  }

  const userId = currentUser?.user?.id ? Number(currentUser.user.id) : undefined;
  if (!userId) {
    setAlert({ type: "error", message: "User ID not found. Please login again." });
    return;
  }

  try {
    await rejectLeaveRequest({
      token,
      id: Number(id),
      body: {
        rejected_by: userId,
        rejection_reason: rejectionReason.trim(),
      },
    }).unwrap();

    setRejectionReason("");
    setRejectTouched(false);
    closeReject();
    setAlert({ type: "success", message: "Leave request rejected successfully" });
  } catch (err: any) {
    console.error("Reject failed", err);
    setAlert({
      type: "error",
      message: err?.data?.message || "Failed to reject leave request",
    });
  }
};


  // Handle Cancel
  const handleCancel = async () => {
    if (!token || !id || !cancellationReason.trim()) {
      setAlert({ type: "error", message: "Cancellation reason is required" });
      return;
    }

    const userId = currentUser?.user?.id ? Number(currentUser.user.id) : undefined;

    try {
      await cancelLeaveRequest({
        token,
        id: Number(id),
        body: {
          cancellation_reason: cancellationReason.trim(),
          cancelled_by: userId, // Optional: only if admin/manager
        },
      }).unwrap();

      setCancellationReason("");
      closeCancel();
      setAlert({
        type: "success",
        message: "Leave request cancelled successfully",
      });
    } catch (err: any) {
      console.error("Cancel failed", err);
      setAlert({
        type: "error",
        message: err?.data?.message || "Failed to cancel leave request",
      });
    }
  };

  return (
    <>
      <PageMeta
        title={`Leave Request #${leaveRecord?.id || "Detail"}`}
        description=""
      />

      <PageBreadcrumb
        pageTitle={`Request #${leaveRecord.id}`}
        items={[
          { label: "Leave Requests", to: "/leave-requests" },
          { label: `Request #${leaveRecord.id}` },
        ]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex items-center justify-between mb-5 lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Leave Request Detail
          </h3>

          {/* Action buttons */}
          {leaveRecord.status === "PENDING" && canAction && (
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
              {/* <button
                onClick={openCancel}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <Ban className="h-4 w-4" />
                Cancel
              </button> */}
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
                  {/* <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Request ID
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      #{leaveRecord.id}
                    </p>
                  </div> */}
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                        leaveRecord.status
                      )}`}
                    >
                      {leaveRecord.status}
                    </span>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Requested At
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDateTime(leaveRecord.requested_at)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Employee
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {employeeData?.data?.full_name || leaveRecord.employee_code}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Department
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {departmentData?.data?.department_name || `Department ID: ${leaveRecord.department_id}`}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Leave Type
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {leaveTypeData?.data?.leave_type_name || `Leave Type ID: ${leaveRecord.leave_type_id}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="space-y-4">
                <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                  Leave Details
                </h5>
                <div className="space-y-3">
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Start Date
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDate(leaveRecord.start_date)}
                      {leaveRecord.is_half_day_start && (
                        <span className="ml-2 text-xs text-gray-500">(Half Day)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      End Date
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDate(leaveRecord.end_date)}
                      {leaveRecord.is_half_day_end && (
                        <span className="ml-2 text-xs text-gray-500">(Half Day)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Total Calendar Days
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {leaveRecord.total_calendar_days} days
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Total Working Days
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {leaveRecord.total_working_days} days
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Total Leave Days
                    </p>
                    <p className="text-lg font-semibold text-brand-600 dark:text-brand-400">
                      {leaveRecord.total_leave_days} days
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Reason
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {leaveRecord.reason}
                    </p>
                  </div>
                  {leaveRecord.supporting_document_url && (
                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Supporting Document
                      </p>
                      <a
                        href={leaveRecord.supporting_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 hover:underline dark:text-brand-400"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Information */}
              {(leaveRecord.status === "APPROVED" ||
                leaveRecord.status === "REJECTED" ||
                leaveRecord.status === "CANCELLED") && (
                <div className="space-y-4 col-span-2">
                  <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                    {leaveRecord.status === "APPROVED" && "Approval Information"}
                    {leaveRecord.status === "REJECTED" && "Rejection Information"}
                    {leaveRecord.status === "CANCELLED" && "Cancellation Information"}
                  </h5>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {leaveRecord.status === "APPROVED" && (
                      <>
                        <div>
                          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                            Approved By
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {approverData?.data?.full_name || (leaveRecord.approved_by ? `User ID: ${leaveRecord.approved_by}` : "-")}
                          </p>
                        </div>
                        <div>
                          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                            Approved At
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {leaveRecord.approved_at
                              ? formatDateTime(leaveRecord.approved_at)
                              : "-"}
                          </p>
                        </div>
                      </>
                    )}
                    {leaveRecord.status === "REJECTED" && leaveRecord.rejection_reason && (
                      <div className="col-span-2">
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Rejection Reason
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {leaveRecord.rejection_reason}
                        </p>
                      </div>
                    )}
                    {leaveRecord.status === "CANCELLED" && (
                      <>
                        {leaveRecord.cancelled_at && (
                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Cancelled At
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {formatDateTime(leaveRecord.cancelled_at)}
                            </p>
                          </div>
                        )}
                        {leaveRecord.cancellation_reason && (
                          <div className="col-span-2">
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Cancellation Reason
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {leaveRecord.cancellation_reason}
                            </p>
                          </div>
                        )}
                      </>
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
      <Modal isOpen={isApproveOpen} onClose={closeApprove} className="max-w-md m-4">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
            Approve Leave Request
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Notes (optional)</Label>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Add any approval notes..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
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
  onClose={() => {
    setRejectTouched(false);
    closeReject();
  }}
  className="max-w-md m-4"
>
  <div className="p-6">
    <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
      Reject Leave Request
    </h3>

    <div className="space-y-4">
      <div>
        <Label>
          Rejection Reason <span className="text-red-500">*</span>
        </Label>

        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          onBlur={() => setRejectTouched(true)}
          placeholder="Please provide a reason for rejection..."
          rows={3}
          required
          aria-invalid={rejectTouched && rejectReasonIsEmpty}
          className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-900 dark:text-gray-100
            ${rejectTouched && rejectReasonIsEmpty
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-gray-700"
            }`}
        />

        {rejectTouched && rejectReasonIsEmpty && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            Rejection reason is required.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setRejectTouched(false);
            closeReject();
          }}
        >
          Cancel
        </Button>

        <Button
          size="sm"
          onClick={handleReject}
          disabled={isRejecting || rejectReasonIsEmpty}
          className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
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
                <Button size="sm" variant="outline" onClick={() => setAlert(null)}>
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

export default LeaveRequestDetail;
