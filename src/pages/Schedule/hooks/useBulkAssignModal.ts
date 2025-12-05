// src/pages/Schedule/hooks/useBulkAssignModal.ts
import { useState, useMemo } from "react";
import { useAssignWorkScheduleMutation } from "../../../redux/api/attendanceApiSlice";
import { formatDate } from "../utils";
import { EmployeeRow as EmployeeRowType } from "../types";

interface UseBulkAssignModalProps {
  token: string | undefined;
  weekDays: Date[];
  employees: EmployeeRowType[];
  workSchedules: any[];
  refetch: () => void;
}

export const useBulkAssignModal = ({
  token,
  weekDays,
  employees,
  workSchedules,
  refetch,
}: UseBulkAssignModalProps) => {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkEffectiveFrom, setBulkEffectiveFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  });
  const [bulkEffectiveTo, setBulkEffectiveTo] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);
  const [bulkErrorMsg, setBulkErrorMsg] = useState<string | null>(null);

  const [assignWorkSchedule, { isLoading: isAssigning }] =
    useAssignWorkScheduleMutation();

  // react-select options
  const workScheduleOptions = useMemo(
    () =>
      workSchedules.map((ws: any) => ({
        value: ws.id,
        label: `${ws.schedule_name} (${ws.start_time} - ${ws.end_time})`,
      })),
    [workSchedules]
  );

  const employeeOptions = useMemo(() => {
    const options = employees.map((emp) => ({
      value: emp.id,
      label: `${emp.employeeCode} - ${emp.fullName}`,
    }));

    // Add "Select All" option at the beginning
    return [{ value: -1, label: "Select All" }, ...options];
  }, [employees]);

  const openBulkModal = () => {
    // default theo tuần đang xem
    // default Start date: tomorrow
    const t = new Date();
    t.setDate(t.getDate() + 1);
    setBulkEffectiveFrom(formatDate(t));
    setBulkEffectiveTo(formatDate(weekDays[6]));
    setSelectedSchedule(null);
    setSelectedEmployeeIds([]);
    setBulkSuccessMsg(null);
    setBulkErrorMsg(null);
    setIsBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    setIsBulkModalOpen(false);
  };

  const handleBulkAssign = async () => {
    if (!token) return;
    if (!bulkEffectiveFrom || !bulkEffectiveTo) {
      setBulkErrorMsg("Please select effective dates.");
      setBulkSuccessMsg(null);
      return;
    }
    if (!selectedSchedule) {
      setBulkErrorMsg("Please select a work schedule.");
      setBulkSuccessMsg(null);
      return;
    }
    if (selectedEmployeeIds.length === 0) {
      setBulkErrorMsg("Please select employees to assign.");
      setBulkSuccessMsg(null);
      return;
    }

    try {
      await assignWorkSchedule({
        token,
        id: selectedSchedule.value,
        body: {
          employee_ids: selectedEmployeeIds.map(Number),
          effective_from: bulkEffectiveFrom,
          effective_to: bulkEffectiveTo,
        },
      }).unwrap();

      setBulkErrorMsg(null);
      setBulkSuccessMsg(
        `Assigned "${selectedSchedule.label}" successfully to ${selectedEmployeeIds.length} employee(s).`
      );

      // Refetch data to show updated schedule
      setTimeout(() => {
        refetch();
        closeBulkModal();
      }, 800);
    } catch (err: any) {
      console.error("Bulk assign failed", err);
      setBulkSuccessMsg(null);
      setBulkErrorMsg(err?.data?.message || "Assign failed, please try again.");
    }
  };

  return {
    isBulkModalOpen,
    bulkEffectiveFrom,
    bulkEffectiveTo,
    setBulkEffectiveFrom,
    setBulkEffectiveTo,
    selectedSchedule,
    setSelectedSchedule,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    bulkSuccessMsg,
    bulkErrorMsg,
    isAssigning,
    workScheduleOptions,
    employeeOptions,
    openBulkModal,
    closeBulkModal,
    handleBulkAssign,
  };
};
