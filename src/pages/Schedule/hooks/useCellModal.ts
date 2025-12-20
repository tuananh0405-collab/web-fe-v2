// src/pages/Schedule/hooks/useCellModal.ts
import { useState } from "react";
import { useModal } from "../../../hooks/useModal";
import { useAssignWorkScheduleMutation } from "../../../redux/api/attendanceApiSlice";
import { CellModalState, EmployeeRow as EmployeeRowType, UISimpleShift } from "../types";
import { formatDate } from "../utils";

interface UseCellModalProps {
  token: string | undefined;
  refetch: () => void;
}

export const useCellModal = ({
  token,
  refetch,
}: UseCellModalProps) => {
  const [cellModal, setCellModal] = useState<CellModalState>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const [assignWorkSchedule, { isLoading: isAssigning }] =
    useAssignWorkScheduleMutation();

  const handleOpenCellModal = (
    employee: EmployeeRowType,
    date: Date,
    shifts: UISimpleShift[],
    leaveOrHoliday?: { type: "holiday" | "leave"; label: string; color: string; data: any } | null
  ) => {
    setCellModal({ employee, date, shifts, leaveOrHoliday });
    setSelectedScheduleId(null); // reset chọn schedule
    openModal();
  };

  const closeCellModal = () => {
    setCellModal(null);
    setSelectedScheduleId(null);
    closeModal();
  };

  const handleAssignSchedule = async () => {
    if (!cellModal || !selectedScheduleId || !token) return;

    try {
      // hiện tại: assign cho đúng ngày của cell
      // nếu muốn assign cả tuần thì đổi effective_to = formatDate(weekDays[6])
      const effectiveDate = formatDate(cellModal.date);

      await assignWorkSchedule({
        token,
        id: selectedScheduleId, // path param: work schedule id
        body: {
          employee_ids: [cellModal.employee.id],
          effective_from: effectiveDate,
          effective_to: effectiveDate,
        },
      }).unwrap();

      // Refetch data to show updated schedule
      closeCellModal();
      setTimeout(() => {
        refetch();
      }, 300);
    } catch (err: any) {
      console.error("Assign work schedule failed", err);
      
      // Extract detailed error message
      let errorMessage = "Failed to assign schedule";
      let conflictDetails = "";
      
      // Try to extract from data.message
      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Try to extract from data.error (may contain conflict info)
      if (err?.data?.error) {
        const errorText = err.data.error;
        
        // Check if error contains time conflict info
        if (errorText.includes("conflict") || errorText.includes("overlaps") || errorText.includes("already assigned")) {
          conflictDetails = `\n\n⚠️ ${errorText}`;
          
          // Try to extract schedule names and times if available
          const timePattern = /(\d{1,2}:\d{2})/g;
          const times = errorText.match(timePattern);
          if (times && times.length >= 2) {
            conflictDetails += `\nConflicting time range: ${times.join(" - ")}`;
          }
        }
      }
      
      // Try to extract from data.details (if API provides structured conflict info)
      if (err?.data?.details) {
        const details = err.data.details;
        
        if (details.conflictingSchedule) {
          const conflict = details.conflictingSchedule;
          conflictDetails += `\n\nConflicts with: ${conflict.schedule_name || "Existing schedule"}`;
          
          if (conflict.start_time && conflict.end_time) {
            conflictDetails += `\nTime: ${conflict.start_time.substring(0,5)} - ${conflict.end_time.substring(0,5)}`;
          }
        }
        
        if (details.existingSchedules && Array.isArray(details.existingSchedules)) {
          conflictDetails += `\n\nExisting schedules on this day:`;
          details.existingSchedules.forEach((sch: any) => {
            conflictDetails += `\n  • ${sch.schedule_name}: ${sch.start_time?.substring(0,5)} - ${sch.end_time?.substring(0,5)}`;
          });
        }
      }
      
      // Show user-friendly alert with all available details
      alert(`❌ ${errorMessage}${conflictDetails}\n\nPlease check the schedule time ranges and try again.`);
    }
  };

  return {
    cellModal,
    selectedScheduleId,
    setSelectedScheduleId,
    isOpen,
    isAssigning,
    handleOpenCellModal,
    closeCellModal,
    handleAssignSchedule,
  };
};
