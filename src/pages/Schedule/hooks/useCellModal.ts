// src/pages/Schedule/hooks/useCellModal.ts
import { useState } from "react";
import { useModal } from "../../../hooks/useModal";
import { useAssignWorkScheduleMutation } from "../../../redux/api/attendanceApiSlice";
import { CellModalState, EmployeeRow as EmployeeRowType, UISimpleShift } from "../types";
import { formatDate } from "../utils";

interface UseCellModalProps {
  token: string | undefined;
  weekDays: Date[];
  refetch: () => void;
}

export const useCellModal = ({
  token,
  weekDays,
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
    shifts: UISimpleShift[]
  ) => {
    setCellModal({ employee, date, shifts });
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
    } catch (err) {
      console.error("Assign work schedule failed", err);
      // tuỳ bạn: có thể show Alert ở đây
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
