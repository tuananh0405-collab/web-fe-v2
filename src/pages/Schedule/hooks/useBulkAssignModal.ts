// src/pages/Schedule/hooks/useBulkAssignModal.ts
import { useState, useMemo, useEffect } from "react";
import { useAssignWorkScheduleMutation } from "../../../redux/api/attendanceApiSlice";
import { formatDate } from "../utils";
import { EmployeeRow } from "../types";

interface UseBulkAssignModalProps {
  token: string | undefined;
  weekDays: Date[];
  workSchedules: any[];
  refetch: () => void;
  departmentId: number | undefined;
  employees: EmployeeRow[]; // Employees from calendar API
}

export const useBulkAssignModal = ({
  token,
  weekDays,
  workSchedules,
  refetch,
  departmentId,
  employees,
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

  // Build employee options from calendar employees (includes all employees even without schedule/shift)
  const employeeOptions = useMemo(() => {
    if (!selectedSchedule || !employees || employees.length === 0) {
      return [{ value: -1, label: "Select All" }];
    }

    // Use employees from calendar API - they already include all employees
    const options = employees.map((emp) => ({
      value: emp.id,
      label: `${emp.employeeCode} - ${emp.fullName}`,
    }));

    // Add "Select All" option at the beginning
    return [{ value: -1, label: "Select All" }, ...options];
  }, [selectedSchedule, employees]);

  // Reset selected employees when schedule changes
  useEffect(() => {
    if (selectedSchedule) {
      setSelectedEmployeeIds([]);
    }
  }, [selectedSchedule]);

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
    isLoading: false, // Employees come from calendar, already loaded
    workScheduleOptions,
    employeeOptions,
    openBulkModal,
    closeBulkModal,
    handleBulkAssign,
  };
};
