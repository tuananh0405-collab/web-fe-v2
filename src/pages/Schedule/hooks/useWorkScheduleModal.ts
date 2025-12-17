// src/pages/Schedule/hooks/useWorkScheduleModal.ts
import { useState } from "react";
import { 
  useUpdateWorkScheduleMutation,
  useCreateScheduleOverrideMutation 
} from "../../../redux/api/attendanceApiSlice";

interface UseWorkScheduleModalProps {
  token: string | undefined;
  activeWorkSchedules: any[];
  refetch: () => void;
}

export const useWorkScheduleModal = ({
  token,
  activeWorkSchedules,
  refetch,
}: UseWorkScheduleModalProps) => {
  // Detail view state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<any | null>(null);
  
  // Edit modal state
  const [isEditWorkScheduleModalOpen, setIsEditWorkScheduleModalOpen] = useState(false);
  const [selectedWorkScheduleId, setSelectedWorkScheduleId] = useState<number | null>(null);
  const [editScheduleName, setEditScheduleName] = useState("");
  const [editScheduleType, setEditScheduleType] = useState("FIXED");
  const [editWorkDays, setEditWorkDays] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editBreakDuration, setEditBreakDuration] = useState("60");
  const [editLateTolerance, setEditLateTolerance] = useState("15");
  const [editEarlyLeaveTolerance, setEditEarlyLeaveTolerance] = useState("15");
  const [editScheduleStatus, setEditScheduleStatus] = useState("ACTIVE");
  const [editScheduleErrors, setEditScheduleErrors] = useState<Record<string, string>>({});

  // Override modal state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideResultModal, setOverrideResultModal] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [currentAssignmentId, setCurrentAssignmentId] = useState<number | null>(null);
  const [selectedSwapDate, setSelectedSwapDate] = useState<string>("");

  const [updateWorkSchedule, { isLoading: isUpdatingSchedule }] = useUpdateWorkScheduleMutation();
  const [createScheduleOverride] = useCreateScheduleOverrideMutation();

  // Open detail modal first
  const openWorkScheduleDetail = (scheduleId: number, assignmentId?: number, dateStr?: string, scheduleData?: any) => {
    // Use provided scheduleData if available (contains is_override info), otherwise find in activeWorkSchedules
    const schedule = scheduleData || activeWorkSchedules.find((ws: any) => ws.id === scheduleId);
    if (!schedule) return;

    setSelectedScheduleDetail(schedule);
    setSelectedWorkScheduleId(scheduleId);
    setCurrentAssignmentId(assignmentId || null);
    setSelectedSwapDate(dateStr || "");
    setIsDetailModalOpen(true);
  };

  // Close detail modal
  const closeWorkScheduleDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedScheduleDetail(null);
    setSelectedWorkScheduleId(null);
  };

  // Open edit modal from detail view
  const openEditFromDetail = () => {
    if (!selectedScheduleDetail) return;

    // Populate edit form with current schedule data
    setEditScheduleName(selectedScheduleDetail.schedule_name || "");
    setEditScheduleType(selectedScheduleDetail.schedule_type || "FIXED");
    setEditWorkDays(selectedScheduleDetail.work_days || "");
    setEditStartTime(selectedScheduleDetail.start_time || "");
    setEditEndTime(selectedScheduleDetail.end_time || "");
    setEditBreakDuration(String(selectedScheduleDetail.break_duration_minutes || 60));
    setEditLateTolerance(String(selectedScheduleDetail.late_tolerance_minutes || 15));
    setEditEarlyLeaveTolerance(String(selectedScheduleDetail.early_leave_tolerance_minutes || 15));
    setEditScheduleStatus(selectedScheduleDetail.status || "ACTIVE");
    setEditScheduleErrors({});

    // Close detail modal and open edit modal
    setIsDetailModalOpen(false);
    setIsEditWorkScheduleModalOpen(true);
  };

  // Legacy function - now opens detail first
  const openEditWorkScheduleModal = (scheduleId: number) => {
    openWorkScheduleDetail(scheduleId);
  };

  const closeEditWorkScheduleModal = () => {
    setIsEditWorkScheduleModalOpen(false);
    setSelectedWorkScheduleId(null);
    setEditScheduleName("");
    setEditScheduleType("FIXED");
    setEditWorkDays("");
    setEditStartTime("");
    setEditEndTime("");
    setEditBreakDuration("60");
    setEditLateTolerance("15");
    setEditEarlyLeaveTolerance("15");
    setEditScheduleStatus("ACTIVE");
    setEditScheduleErrors({});
    
    // Also clear detail modal state
    setSelectedScheduleDetail(null);
  };

  const validateWorkScheduleForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editScheduleName.trim()) {
      errors.schedule_name = "Schedule name is required";
    }

    if (!editWorkDays.trim()) {
      errors.work_days = "Work days are required (e.g., 1,2,3,4,5 for Mon-Fri)";
    } else {
      // Validate format: should be comma-separated numbers 1-7
      const days = editWorkDays.split(',').map(d => d.trim());
      const invalidDays = days.filter(d => !/^[1-7]$/.test(d));
      if (invalidDays.length > 0) {
        errors.work_days = "Invalid format. Use numbers 1-7 (1=Mon, 7=Sun) separated by commas";
      }
    }

    if (!editStartTime.trim()) {
      errors.start_time = "Start time is required (HH:MM:SS format)";
    } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(editStartTime)) {
      errors.start_time = "Invalid time format. Use HH:MM:SS (e.g., 08:00:00)";
    }

    if (!editEndTime.trim()) {
      errors.end_time = "End time is required (HH:MM:SS format)";
    } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(editEndTime)) {
      errors.end_time = "Invalid time format. Use HH:MM:SS (e.g., 17:00:00)";
    }

    setEditScheduleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveWorkSchedule = async () => {
    if (!token || !selectedWorkScheduleId) return;

    if (!validateWorkScheduleForm()) {
      return;
    }

    try {
      await updateWorkSchedule({
        token,
        id: selectedWorkScheduleId,
        body: {
          schedule_name: editScheduleName.trim(),
          schedule_type: editScheduleType,
          work_days: editWorkDays.trim(),
          start_time: editStartTime.trim(),
          end_time: editEndTime.trim(),
          break_duration_minutes: parseInt(editBreakDuration, 10),
          late_tolerance_minutes: parseInt(editLateTolerance, 10),
          early_leave_tolerance_minutes: parseInt(editEarlyLeaveTolerance, 10),
          status: editScheduleStatus,
        },
      }).unwrap();

      // Success - close modal and refetch
      closeEditWorkScheduleModal();
      refetch();
    } catch (err: any) {
      console.error("Failed to update work schedule:", err);
      // Set error for display
      setEditScheduleErrors({
        submit: err?.data?.message || "Failed to update schedule. Please try again."
      });
    }
  };

  // Override functionality
  const openOverrideModal = (assignmentId: number, dateStr: string) => {
    setCurrentAssignmentId(assignmentId);
    setSelectedSwapDate(dateStr);
    setIsOverrideModalOpen(true);
    setIsDetailModalOpen(false); // Close detail modal
    setOverrideResultModal(null);
  };

  const closeOverrideModal = () => {
    setIsOverrideModalOpen(false);
    setCurrentAssignmentId(null);
    setSelectedSwapDate("");
  };

  const closeOverrideResultModal = async () => {
    setOverrideResultModal(null);
    closeOverrideModal();
    closeWorkScheduleDetail();
    // Force refetch to ensure fresh data before allowing next action
    await refetch();
  };

  const handleOverrideSchedule = async (data: {
    assignmentId: number;
    overrideScheduleId: number;
    fromDate: string;
    toDate: string;
    reason: string;
  }) => {
    if (!token) return;

    setIsSubmittingOverride(true);

    try {
      await createScheduleOverride({
        token,
        assignmentId: data.assignmentId,
        body: {
          type: "SCHEDULE_CHANGE",
          from_date: data.fromDate,
          to_date: data.toDate,
          override_work_schedule_id: data.overrideScheduleId,
          reason: data.reason,
        },
      }).unwrap();

      // Success - refetch data immediately
      await refetch();
      
      setOverrideResultModal({
        show: true,
        type: "success",
        message: "Schedule override created successfully!",
      });
      setIsSubmittingOverride(false);
    } catch (err: any) {
      setIsSubmittingOverride(false);
      const errorMsg = err?.data?.message || "Failed to create schedule override. Please try again.";
      setOverrideResultModal({
        show: true,
        type: "error",
        message: errorMsg,
      });
      console.error("Override schedule error:", err);
    }
  };

  return {
    // Detail modal
    isDetailModalOpen,
    selectedScheduleDetail,
    selectedWorkScheduleId,
    openWorkScheduleDetail,
    closeWorkScheduleDetail,
    openEditFromDetail,
    
    // Override modal
    isOverrideModalOpen,
    openOverrideModal,
    closeOverrideModal,
    handleOverrideSchedule,
    isSubmittingOverride,
    overrideResultModal,
    closeOverrideResultModal,
    currentAssignmentId,
    selectedSwapDate,
    
    // Edit modal
    isEditWorkScheduleModalOpen,
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
    openEditWorkScheduleModal,
    closeEditWorkScheduleModal,
    handleSaveWorkSchedule,
  };
};
