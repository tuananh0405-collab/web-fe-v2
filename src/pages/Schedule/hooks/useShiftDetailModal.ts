// src/pages/Schedule/hooks/useShiftDetailModal.ts
import { useState } from "react";
import {
  useGetEmployeeShiftByIdQuery,
  useManualEditEmployeeShiftMutation,
} from "../../../redux/api/shiftApiSlice";
import { LeaveHolidayModalState } from "../types";

interface UseShiftDetailModalProps {
  token: string | undefined;
  refetch: () => void;
}

export const useShiftDetailModal = ({
  token,
  refetch,
}: UseShiftDetailModalProps) => {
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [isShiftDetailOpen, setIsShiftDetailOpen] = useState(false);
  const [isEditingShift, setIsEditingShift] = useState(false);
  const [editShiftStatus, setEditShiftStatus] = useState<string>("");
  const [editShiftNotes, setEditShiftNotes] = useState<string>("");
  const [editShiftReason, setEditShiftReason] = useState<string>("");
  const [editShiftErrors, setEditShiftErrors] = useState<Record<string, string>>({});
  const [leaveHolidayModal, setLeaveHolidayModal] = useState<LeaveHolidayModalState>(null);

  const {
    data: shiftDetailRes,
    isLoading: isShiftLoading,
    isError: isShiftError,
  } = useGetEmployeeShiftByIdQuery(
    { token: token!, id: selectedShiftId ?? 0 },
    { skip: !token || !selectedShiftId }
  );

  const [manualEditShift, { isLoading: isEditingShiftLoading }] =
    useManualEditEmployeeShiftMutation();

  const shiftDetail = shiftDetailRes?.data;

  const handleOpenShiftDetail = (shiftId: number) => {
    setSelectedShiftId(shiftId);
    setIsShiftDetailOpen(true);
    setIsEditingShift(false);
  };

  const handleCloseShiftDetail = () => {
    setIsShiftDetailOpen(false);
    setSelectedShiftId(null);
    setIsEditingShift(false);
    setEditShiftStatus("");
    setEditShiftNotes("");
    setEditShiftReason("");
    setEditShiftErrors({});
  };

  const handleEditShift = () => {
    if (!shiftDetail) return;

    // Populate form with current values
    setEditShiftStatus(shiftDetail.status || "");
    setEditShiftNotes(shiftDetail.notes || "");
    setEditShiftReason("");
    setEditShiftErrors({});
    setIsEditingShift(true);
  };

  const handleCancelEdit = () => {
    setIsEditingShift(false);
    setEditShiftStatus("");
    setEditShiftNotes("");
    setEditShiftReason("");
    setEditShiftErrors({});
  };

  const handleSaveShiftEdit = async () => {
    if (!token || !selectedShiftId || !shiftDetail) return;

    // Validate form
    const errors: Record<string, string> = {};

    // Validate: Status must be different from original
    if (!editShiftStatus) {
      errors.status = "Please select a status";
    } else if (editShiftStatus === shiftDetail.status) {
      errors.status = `Please select a different status. Current status is ${shiftDetail.status}`;
    }

    // Validate: Edit reason is required
    if (!editShiftReason.trim()) {
      errors.edit_reason = "Edit reason is required";
    }

    setEditShiftErrors(errors);

    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await manualEditShift({
        token,
        id: selectedShiftId,
        body: {
          check_in_time: shiftDetail.check_in_time,
          check_out_time: shiftDetail.check_out_time,
          status: editShiftStatus,
          notes: editShiftNotes || null,
          edit_reason: editShiftReason,
        },
      }).unwrap();

      // Success - close modal and refetch calendar
      handleCloseShiftDetail();

      // Refetch calendar to update the weekly view with new status
      refetch();
    } catch (err: any) {
      console.error("Failed to edit shift:", err);
      setEditShiftErrors({ submit: err?.data?.message || "Failed to update shift. Please try again." });
    }
  };

  const handleOpenLeaveHolidayDetail = (
    type: "holiday" | "leave",
    data: any
  ) => {
    setLeaveHolidayModal({ type, data });
  };

  const handleCloseLeaveHolidayDetail = () => {
    setLeaveHolidayModal(null);
  };

  return {
    selectedShiftId,
    isShiftDetailOpen,
    shiftDetail,
    isShiftLoading,
    isShiftError,
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
    leaveHolidayModal,
    handleOpenShiftDetail,
    handleCloseShiftDetail,
    handleEditShift,
    handleCancelEdit,
    handleSaveShiftEdit,
    handleOpenLeaveHolidayDetail,
    handleCloseLeaveHolidayDetail,
  };
};
