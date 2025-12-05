// src/pages/Schedule/components/EmployeeRow.tsx
import React from "react";
import { EmployeeRow as EmployeeRowType, UISimpleShift } from "../types";
import { formatDate } from "../utils";
import { ScheduleCell } from "./ScheduleCell";

interface EmployeeRowProps {
  employee: EmployeeRowType;
  weekDays: Date[];
  today: Date;
  getLeaveOrHolidayInfo: (employeeId: number, dateStr: string) => { type: "holiday" | "leave"; label: string; data: any } | null;
  shiftsByEmployeeAndDay: Record<string, UISimpleShift[]>;
  activeWorkSchedules: any[];
  departmentShifts: any[];
  onOpenCellModal: (employee: EmployeeRowType, date: Date, shifts: UISimpleShift[]) => void;
  onOpenShiftDetail: (shiftId: number) => void;
  onOpenLeaveHolidayDetail: (type: "holiday" | "leave", data: any) => void;
  onEditWorkSchedule: (scheduleId: number) => void;
}

export const EmployeeRow: React.FC<EmployeeRowProps> = ({
  employee,
  weekDays,
  today,
  getLeaveOrHolidayInfo,
  shiftsByEmployeeAndDay,
  activeWorkSchedules,
  departmentShifts,
  onOpenCellModal,
  onOpenShiftDetail,
  onOpenLeaveHolidayDetail,
  onEditWorkSchedule,
}) => {
  return (
    <div className="grid grid-cols-[260px_repeat(7,_minmax(120px,1fr))] border-t border-gray-200 dark:border-gray-800">
      {/* Employee info */}
      <div className="flex items-center gap-3 px-4 py-4 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="w-10 h-10 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-white font-semibold">
          <span className="text-sm">
            {employee.fullName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            {employee.fullName}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
            {employee.employeeCode}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {employee.departmentName}
          </p>
        </div>
      </div>

      {/* Week cells: show shifts for past/today, work schedule for future */}
      {weekDays.map((day, idx) => (
        <ScheduleCell
          key={idx}
          day={day}
          employee={employee}
          today={today}
          leaveOrHoliday={getLeaveOrHolidayInfo(employee.id, formatDate(day))}
          shiftsByEmployeeAndDay={shiftsByEmployeeAndDay}
          activeWorkSchedules={activeWorkSchedules}
          departmentShifts={departmentShifts}
          onOpenCellModal={onOpenCellModal}
          onOpenShiftDetail={onOpenShiftDetail}
          onOpenLeaveHolidayDetail={onOpenLeaveHolidayDetail}
          onEditWorkSchedule={onEditWorkSchedule}
        />
      ))}
    </div>
  );
};
