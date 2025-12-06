// src/pages/Schedule/EmployeeSchedule.tsx
import { useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useGetAttendanceEditHistoryQuery } from "../../redux/api/attendanceApiSlice";
import { useAppSelector } from "../../redux/hook";

// Custom hooks
import { useWeekNavigation } from "./hooks/useWeekNavigation";
import { useCalendarData } from "./hooks/useCalendarData";
import { useLeaveHoliday } from "./hooks/useLeaveHoliday";
import { useShiftsProcessing } from "./hooks/useShiftsProcessing";
import { useBulkAssignModal } from "./hooks/useBulkAssignModal";
import { useUnassignModal } from "./hooks/useUnassignModal";
import { useEditHistoryModal } from "./hooks/useEditHistoryModal";
import { useWorkScheduleModal } from "./hooks/useWorkScheduleModal";
import { useShiftDetailModal } from "./hooks/useShiftDetailModal";
import { useCellModal } from "./hooks/useCellModal";

// Local imports
import { EDIT_HISTORY_DATE_RANGE } from "./utils";
import { BulkAssignModal } from "./components/BulkAssignModal";
import { UnassignModal } from "./components/UnassignModal";
import { EditHistoryModal } from "./components/EditHistoryModal";
import { LeaveHolidayModal } from "./components/LeaveHolidayModal";
import { CellModal } from "./components/CellModal";
import { ShiftDetailModal } from "./components/ShiftDetailModal";
import { EditWorkScheduleModal } from "./components/EditWorkScheduleModal";
import { WorkScheduleDetailModal } from "./components/WorkScheduleDetailModal";
import { WeekNavigationHeader } from "./components/WeekNavigationHeader";
import { ScheduleTableHeader } from "./components/ScheduleTableHeader";
import { EmployeeRow } from "./components/EmployeeRow";
import { PaginationControls } from "./components/PaginationControls";

/* =======================
 * Component
 * ======================= */

const EmployeeSchedule = () => {
  const authState = useAppSelector((state) => state.auth.userState?.data);
  const token = authState?.access_token;
  const user = authState?.user;

  // Get department_id from managed_department_ids array or user's department_id
  const departmentId = useMemo(() => {
    const managedDeptIds = (user as any)?.managed_department_ids;
    if (Array.isArray(managedDeptIds) && managedDeptIds.length > 0) {
      return managedDeptIds[0];
    }
    return (user as any)?.department_id;
  }, [user]);

  // ===== Week navigation =====
  const { weekStart, goToPreviousWeek, goToNextWeek, goToThisWeek } = useWeekNavigation();

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Week days calculation
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // ===== Fetch and process all calendar data with custom hook =====
  const {
    employees,
    departmentShifts,
    activeWorkSchedules,
    overtime,
    holidays,
    leaveTypes,
    totalPages,
    isLoading,
    isError,
    refetch,
  } = useCalendarData({
    token,
    departmentId,
    limit,
    offset,
  });

  // ===== Leave/Holiday logic with custom hook =====
  const { isEmployeeOnLeaveOrHoliday, getLeaveOrHolidayInfo } = useLeaveHoliday(
    {
      holidays,
      employees,
      leaveTypes,
    }
  );

  // ===== Process shifts with custom hook =====
  const { shiftsByEmployeeAndDay } = useShiftsProcessing({
    employees,
    overtime,
    weekDays,
    isEmployeeOnLeaveOrHoliday,
    activeWorkSchedules,
  });

  // ===== Use custom hooks for modal management =====
  const bulkAssignModal = useBulkAssignModal({
    token,
    weekDays,
    employees,
    workSchedules: activeWorkSchedules,
    refetch,
  });

  const unassignModal = useUnassignModal({
    token,
    employees,
    refetch,
  });

  const editHistoryModal = useEditHistoryModal();

  const workScheduleModal = useWorkScheduleModal({
    token,
    activeWorkSchedules,
    refetch,
  });

  const shiftDetailModal = useShiftDetailModal({
    token,
    refetch,
  });

  const cellModal = useCellModal({
    token,
    refetch,
  });

  const { data: editHistoryData, isLoading: isEditHistoryLoading } = useGetAttendanceEditHistoryQuery(
    {
      token: token!,
      employeeId: undefined, // Query tất cả employees trong department
      startDate: EDIT_HISTORY_DATE_RANGE.START_DATE,
      endDate: EDIT_HISTORY_DATE_RANGE.END_DATE,
      offset: 0,
    },
    { skip: !token || !editHistoryModal.isEditHistoryModalOpen }
  );


  /* ======================= RENDER ======================= */

  if (!token) {
    return (
      <p className="p-4 text-center text-red-500">
        Missing access token. Please login again.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <PageMeta title="Employee Schedule" description="" />
        Loading weekly schedule...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        <PageMeta title="Employee Schedule" description="" />
        Failed to load weekly schedule.
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Employee Schedule" description="" />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {/* Header: điều khiển tuần */}
        <WeekNavigationHeader
          weekDays={weekDays}
          onPreviousWeek={goToPreviousWeek}
          onThisWeek={goToThisWeek}
          onNextWeek={goToNextWeek}
          onOpenBulkModal={bulkAssignModal.openBulkModal}
          onOpenUnassignModal={unassignModal.openUnassignModal}
          onOpenEditHistoryModal={editHistoryModal.openEditHistoryModal}
        />

        {/* Grid: 1 cột employees + 7 cột ngày */}
        <div className="border border-gray-200 rounded-xl overflow-hidden dark:border-gray-800">
          <ScheduleTableHeader weekDays={weekDays} />

          {/* Rows: mỗi employee một hàng */}
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return employees.map((emp) => (
              <EmployeeRow
                key={emp.id}
                employee={emp}
                weekDays={weekDays}
                today={today}
                getLeaveOrHolidayInfo={getLeaveOrHolidayInfo}
                shiftsByEmployeeAndDay={shiftsByEmployeeAndDay}
                activeWorkSchedules={activeWorkSchedules}
                departmentShifts={departmentShifts}
                onOpenCellModal={cellModal.handleOpenCellModal}
                onOpenShiftDetail={shiftDetailModal.handleOpenShiftDetail}
                onOpenLeaveHolidayDetail={shiftDetailModal.handleOpenLeaveHolidayDetail}
                onEditWorkSchedule={workScheduleModal.openEditWorkScheduleModal}
              />
            ));
          })()}
        </div>

        {/* Pagination controls - similar to OvertimeRequestTable */}
        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
      {/* Modal ĐĂNG KÝ CA HÀNG LOẠT */}
      <BulkAssignModal
        isOpen={bulkAssignModal.isBulkModalOpen}
        onClose={bulkAssignModal.closeBulkModal}
        bulkEffectiveFrom={bulkAssignModal.bulkEffectiveFrom}
        bulkEffectiveTo={bulkAssignModal.bulkEffectiveTo}
        setBulkEffectiveFrom={bulkAssignModal.setBulkEffectiveFrom}
        setBulkEffectiveTo={bulkAssignModal.setBulkEffectiveTo}
        workScheduleOptions={bulkAssignModal.workScheduleOptions}
        selectedSchedule={bulkAssignModal.selectedSchedule}
        setSelectedSchedule={bulkAssignModal.setSelectedSchedule}
        employeeOptions={bulkAssignModal.employeeOptions}
        selectedEmployeeIds={bulkAssignModal.selectedEmployeeIds}
        setSelectedEmployeeIds={bulkAssignModal.setSelectedEmployeeIds}
        isLoading={isLoading}
        isAssigning={bulkAssignModal.isAssigning}
        bulkSuccessMsg={bulkAssignModal.bulkSuccessMsg}
        bulkErrorMsg={bulkAssignModal.bulkErrorMsg}
        onAssign={bulkAssignModal.handleBulkAssign}
      />

      {/* Modal UNASSIGN WORK SCHEDULE */}
      <UnassignModal
        isOpen={unassignModal.isUnassignModalOpen}
        onClose={unassignModal.closeUnassignModal}
        employeeOptions={unassignModal.employeeOptions}
        selectedUnassignEmployeeIds={unassignModal.selectedUnassignEmployeeIds}
        setSelectedUnassignEmployeeIds={unassignModal.setSelectedUnassignEmployeeIds}
        selectedAssignmentIds={unassignModal.selectedAssignmentIds}
        setSelectedAssignmentIds={unassignModal.setSelectedAssignmentIds}
        availableAssignments={unassignModal.availableAssignments}
        unassignProgress={unassignModal.unassignProgress}
        unassignSuccessMsg={unassignModal.unassignSuccessMsg}
        unassignErrorMsg={unassignModal.unassignErrorMsg}
        handleUnassign={unassignModal.handleUnassign}
      />

      {/* Modal xem toàn bộ ca trong 1 ô + Assign Work Schedule */}
      <CellModal
        isOpen={!!cellModal.cellModal && cellModal.isOpen}
        onClose={cellModal.closeCellModal}
        cellModal={cellModal.cellModal}
        workSchedules={activeWorkSchedules}
        selectedScheduleId={cellModal.selectedScheduleId}
        setSelectedScheduleId={cellModal.setSelectedScheduleId}
        isLoading={isLoading}
        isAssigning={cellModal.isAssigning}
        onAssignSchedule={cellModal.handleAssignSchedule}
      />

      {/* Modal chi tiết 1 shift */}
      <ShiftDetailModal
        isOpen={shiftDetailModal.isShiftDetailOpen}
        onClose={shiftDetailModal.handleCloseShiftDetail}
        selectedShiftId={shiftDetailModal.selectedShiftId}
        shiftDetail={shiftDetailModal.shiftDetail}
        isLoading={shiftDetailModal.isShiftLoading}
        isError={shiftDetailModal.isShiftError}
        isEditingShift={shiftDetailModal.isEditingShift}
        editShiftStatus={shiftDetailModal.editShiftStatus}
        setEditShiftStatus={shiftDetailModal.setEditShiftStatus}
        editShiftNotes={shiftDetailModal.editShiftNotes}
        setEditShiftNotes={shiftDetailModal.setEditShiftNotes}
        editShiftReason={shiftDetailModal.editShiftReason}
        setEditShiftReason={shiftDetailModal.setEditShiftReason}
        editShiftErrors={shiftDetailModal.editShiftErrors}
        setEditShiftErrors={shiftDetailModal.setEditShiftErrors}
        isEditingShiftLoading={shiftDetailModal.isEditingShiftLoading}
        onEditShift={shiftDetailModal.handleEditShift}
        onCancelEdit={shiftDetailModal.handleCancelEdit}
        onSaveShiftEdit={shiftDetailModal.handleSaveShiftEdit}
      />

      {/* Modal View Edit History */}
      <EditHistoryModal
        isOpen={editHistoryModal.isEditHistoryModalOpen}
        onClose={editHistoryModal.closeEditHistoryModal}
        employees={employees}
        selectedHistoryEmployeeId={editHistoryModal.selectedHistoryEmployeeId}
        setSelectedHistoryEmployeeId={editHistoryModal.setSelectedHistoryEmployeeId}
        editHistoryData={editHistoryData}
        isLoading={isEditHistoryLoading}
      />

      {/* Modal chi tiết Leave/Holiday */}
      <LeaveHolidayModal
        isOpen={!!shiftDetailModal.leaveHolidayModal}
        onClose={shiftDetailModal.handleCloseLeaveHolidayDetail}
        leaveOrHoliday={shiftDetailModal.leaveHolidayModal}
      />

      {/* Modal Work Schedule Detail */}
      <WorkScheduleDetailModal
        isOpen={workScheduleModal.isDetailModalOpen}
        onClose={workScheduleModal.closeWorkScheduleDetail}
        scheduleDetail={workScheduleModal.selectedScheduleDetail}
        onEdit={workScheduleModal.openEditFromDetail}
      />

      {/* Modal Edit Work Schedule */}
      <EditWorkScheduleModal
        isOpen={workScheduleModal.isEditWorkScheduleModalOpen}
        onClose={workScheduleModal.closeEditWorkScheduleModal}
        editScheduleName={workScheduleModal.editScheduleName}
        setEditScheduleName={workScheduleModal.setEditScheduleName}
        editScheduleType={workScheduleModal.editScheduleType}
        setEditScheduleType={workScheduleModal.setEditScheduleType}
        editWorkDays={workScheduleModal.editWorkDays}
        setEditWorkDays={workScheduleModal.setEditWorkDays}
        editStartTime={workScheduleModal.editStartTime}
        setEditStartTime={workScheduleModal.setEditStartTime}
        editEndTime={workScheduleModal.editEndTime}
        setEditEndTime={workScheduleModal.setEditEndTime}
        editBreakDuration={workScheduleModal.editBreakDuration}
        setEditBreakDuration={workScheduleModal.setEditBreakDuration}
        editLateTolerance={workScheduleModal.editLateTolerance}
        setEditLateTolerance={workScheduleModal.setEditLateTolerance}
        editEarlyLeaveTolerance={workScheduleModal.editEarlyLeaveTolerance}
        setEditEarlyLeaveTolerance={workScheduleModal.setEditEarlyLeaveTolerance}
        editScheduleStatus={workScheduleModal.editScheduleStatus}
        setEditScheduleStatus={workScheduleModal.setEditScheduleStatus}
        editScheduleErrors={workScheduleModal.editScheduleErrors}
        setEditScheduleErrors={workScheduleModal.setEditScheduleErrors}
        isUpdatingSchedule={workScheduleModal.isUpdatingSchedule}
        onSave={workScheduleModal.handleSaveWorkSchedule}
      />
    </>
  );
};

export default EmployeeSchedule;
