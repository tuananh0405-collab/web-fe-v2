// src/pages/Schedule/hooks/useUnassignModal.ts
import { useState, useMemo } from "react";
import { useUnassignWorkScheduleMutation } from "../../../redux/api/attendanceApiSlice";
import { EmployeeRow as EmployeeRowType } from "../types";

interface UseUnassignModalProps {
  token: string | undefined;
  employees: EmployeeRowType[];
  refetch: () => void;
}

export const useUnassignModal = ({
  token,
  employees,
  refetch,
}: UseUnassignModalProps) => {
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [selectedUnassignEmployeeIds, setSelectedUnassignEmployeeIds] =
    useState<number[]>([]);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<number[]>(
    []
  );
  const [unassignProgress, setUnassignProgress] = useState<string>("");
  const [unassignSuccessMsg, setUnassignSuccessMsg] = useState<string | null>(
    null
  );
  const [unassignErrorMsg, setUnassignErrorMsg] = useState<string | null>(null);

  const [unassignWorkSchedule] = useUnassignWorkScheduleMutation();

  const employeeOptions = useMemo(() => {
    const options = employees.map((emp) => ({
      value: emp.id,
      label: `${emp.employeeCode} - ${emp.fullName}`,
    }));

    // Add "Select All" option at the beginning
    return [{ value: -1, label: "Select All" }, ...options];
  }, [employees]);

  const availableAssignments = useMemo(() => {
    // Nếu không chọn ai thì trả về mảng rỗng luôn
    if (selectedUnassignEmployeeIds.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return employees
      // 1. Chỉ lấy những nhân viên đang được chọn
      .filter((emp) => selectedUnassignEmployeeIds.includes(emp.id))
      // 2. Gộp (flat) tất cả assignment của các nhân viên đó lại thành 1 mảng duy nhất
      .flatMap((emp) =>
        emp.scheduleAssignments
          // 3. Lọc lấy những assignment có status ACTIVE và effective_to > ngày hiện tại
          .filter((assignment: any) => {
            if (assignment.work_schedule?.status !== "ACTIVE") return false;
            
            // Kiểm tra effective_to phải lớn hơn ngày hiện tại
            if (assignment.effective_to) {
              const effectiveToDate = new Date(assignment.effective_to);
              effectiveToDate.setHours(0, 0, 0, 0);
              return effectiveToDate > today;
            }
            
            return false;
          })
          // 4. Map thêm thông tin nhân viên vào assignment
          .map((assignment: any) => ({
            ...assignment,
            employee_id: emp.id,
            employee_code: emp.employeeCode,
            employee_name: emp.fullName,
          }))
      );
  }, [selectedUnassignEmployeeIds, employees]);

  const openUnassignModal = () => {
    setSelectedUnassignEmployeeIds([]);
    setSelectedAssignmentIds([]);
    setUnassignProgress("");
    setUnassignSuccessMsg(null);
    setUnassignErrorMsg(null);
    setIsUnassignModalOpen(true);
  };

  const closeUnassignModal = () => {
    setIsUnassignModalOpen(false);
  };

  const handleUnassign = async () => {
    if (!token) return;

    if (selectedAssignmentIds.length === 0) {
      setUnassignErrorMsg("Please select assignments to unassign.");
      setUnassignSuccessMsg(null);
      return;
    }

    setUnassignProgress(
      `Unassigning 0/${selectedAssignmentIds.length} assignments...`
    );
    setUnassignErrorMsg(null);
    setUnassignSuccessMsg(null);

    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process each assignment sequentially
    for (let i = 0; i < selectedAssignmentIds.length; i++) {
      const assignmentId = selectedAssignmentIds[i];
      setUnassignProgress(
        `Unassigning ${i + 1}/${selectedAssignmentIds.length} assignments...`
      );

      try {
        await unassignWorkSchedule({ token, assignmentId }).unwrap();
        results.success++;
      } catch (err: any) {
        results.failed++;
        const errorMsg =
          err?.data?.message ||
          `Failed to unassign assignment #${assignmentId}`;
        results.errors.push(errorMsg);
        console.error(`Unassign assignment ${assignmentId} failed:`, err);
      }
    }

    // Show final result
    setUnassignProgress("");

    if (results.failed === 0) {
      setUnassignSuccessMsg(
        `Successfully unassigned ${results.success} assignment(s).`
      );

      // Refetch and close after success
      setTimeout(() => {
        refetch();
        closeUnassignModal();
      }, 1500);
    } else {
      setUnassignErrorMsg(
        `Completed with ${results.success} success, ${
          results.failed
        } failed. Errors: ${results.errors.join("; ")}`
      );
    }
  };

  return {
    isUnassignModalOpen,
    selectedUnassignEmployeeIds,
    setSelectedUnassignEmployeeIds,
    selectedAssignmentIds,
    setSelectedAssignmentIds,
    unassignProgress,
    unassignSuccessMsg,
    unassignErrorMsg,
    employeeOptions,
    availableAssignments,
    openUnassignModal,
    closeUnassignModal,
    handleUnassign,
  };
};
