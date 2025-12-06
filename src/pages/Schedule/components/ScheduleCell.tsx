// src/pages/Schedule/components/ScheduleCell.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeRow, UISimpleShift, ShiftType } from "../types";
import {
  formatDate,
  formatTimeRange,
  shiftTypeClasses,
  getShiftStatusColor,
  isDayInWorkDays,
  getEffectiveScheduleForDate,
  MAX_VISIBLE_SHIFTS,
} from "../utils";

interface ScheduleCellProps {
  day: Date;
  employee: EmployeeRow;
  today: Date;
  leaveOrHoliday: { type: "holiday" | "leave"; label: string; color: string; data: any } | null;
  shiftsByEmployeeAndDay: Record<string, UISimpleShift[]>;
  activeWorkSchedules: any[];
  departmentShifts: any[];
  onOpenCellModal: (employee: EmployeeRow, date: Date, shifts: UISimpleShift[]) => void;
  onOpenShiftDetail: (shiftId: number) => void;
  onOpenLeaveHolidayDetail: (type: "holiday" | "leave", data: any) => void;
  onEditWorkSchedule: (scheduleId: number) => void;
  isHR?: boolean; // HR role flag
}

export const ScheduleCell: React.FC<ScheduleCellProps> = ({
  day,
  employee,
  today,
  leaveOrHoliday,
  shiftsByEmployeeAndDay,
  activeWorkSchedules,
  departmentShifts,
  onOpenCellModal,
  onOpenShiftDetail,
  onOpenLeaveHolidayDetail,
  onEditWorkSchedule,
  isHR = false,
}) => {
  const navigate = useNavigate();
  const dayKey = formatDate(day);
  const cellDate = new Date(day);
  cellDate.setHours(0, 0, 0, 0);
  const isFuture = cellDate > today;

  // For past/today: show employee shifts
  // For future: show work schedule
  if (!isFuture) {
    // PAST/TODAY: Show Employee Shifts
    const key = `${employee.id}-${dayKey}`;
    const allShifts = shiftsByEmployeeAndDay[key] || [];

    // Sort shifts by start time (earliest first)
    const shifts = [...allShifts].sort((a, b) => {
      const timeA = new Date(a.start).getTime();
      const timeB = new Date(b.start).getTime();
      return timeA - timeB;
    });

    const visible = shifts.slice(0, MAX_VISIBLE_SHIFTS);
    const moreCount = shifts.length - visible.length;

    return (
      <div
        className={`relative border-l border-gray-200 px-2 py-2 min-h-[80px] text-xs align-top dark:border-gray-800 ${
          leaveOrHoliday
            ? "bg-purple-50/30 dark:bg-purple-950/10"
            : ""
        }`}
      >
        {/* nút … luôn hiển thị ở góc trên phải - hide for HR */}
        {!isHR && (
          <button
            type="button"
            onClick={() => onOpenCellModal(employee, day, shifts)}
            className="absolute right-2 top-1 text-lg leading-none text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300"
            title="View shifts / assign work schedule"
          >
            …
          </button>
        )}

        <div className="mt-4 space-y-1">
          {/* Show leave/holiday badge */}
          {leaveOrHoliday && (
            <div
              className="rounded-md px-2 py-1.5 text-[11px] font-medium border"
              style={{
                backgroundColor: leaveOrHoliday.type === "holiday" 
                  ? "#e5e7eb" // gray-200
                  : `${leaveOrHoliday.color}20`, // 20% opacity of color_hex
                color: leaveOrHoliday.type === "holiday"
                  ? "#1f2937" // gray-800
                  : leaveOrHoliday.color,
                borderColor: leaveOrHoliday.type === "holiday"
                  ? "#9ca3af" // gray-400  
                  : leaveOrHoliday.color,
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <div
                  className="cursor-pointer hover:opacity-80"
                  onClick={() =>
                    onOpenLeaveHolidayDetail(
                      leaveOrHoliday.type,
                      leaveOrHoliday.data
                    )
                  }
                >
                  <span>{leaveOrHoliday.label}</span>
                </div>
                {leaveOrHoliday.type === "leave" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/leave-requests/${leaveOrHoliday.data.id}`);
                    }}
                    className="text-[10px] underline hover:no-underline"
                  >
                    View Detail
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Show shifts */}
          {visible.map((shift) => {
            // Use status-based color for regular shifts, type-based for overtime
            const shiftType = shift.type as ShiftType;
            const badgeColor =
              shift.type === "OVERTIME"
                ? shiftTypeClasses[shiftType]
                : getShiftStatusColor(shift.status || "SCHEDULED");

            return (
              <div
                key={shift.id}
                onClick={() => {
                  // Don't open shift detail for overtime requests
                  if (!shift.isOvertimeRequest) {
                    onOpenShiftDetail(shift.id);
                  }
                }}
                className={`rounded-md px-2 py-1 text-[11px] leading-tight ${
                  !shift.isOvertimeRequest
                    ? "cursor-pointer hover:opacity-90"
                    : ""
                } ${badgeColor}`}
              >
                <div className="truncate font-medium">{shift.title}</div>
                <div className="text-[10px] opacity-90">
                  {formatTimeRange(shift.start, shift.end)}
                </div>
              </div>
            );
          })}

          {moreCount > 0 && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              +{moreCount} more…
            </p>
          )}
        </div>
      </div>
    );
  } else {
    // FUTURE: Show Work Schedule (with override support)
    const { schedule, overrideInfo, overtimeInfo, actualShift } =
      getEffectiveScheduleForDate(
        employee.scheduleAssignments,
        dayKey,
        activeWorkSchedules,
        employee.id,
        departmentShifts
      );

    // If schedule exists but work_days is missing, try to get it from activeWorkSchedules
    let effectiveWorkDays = schedule?.work_days || "";
    if (schedule && !effectiveWorkDays) {
      const fullSchedule = activeWorkSchedules.find(ws => ws.id === schedule.id);
      effectiveWorkDays = fullSchedule?.work_days || "";
    }

    // Check if current day is in schedule's work_days
    const shouldShowSchedule = schedule && effectiveWorkDays
      ? isDayInWorkDays(day, effectiveWorkDays)
      : false; // No schedule or no work_days = no display

    console.log(
      `[SCHEDULE CHECK] Employee: ${employee.employeeCode}, Date: ${dayKey}, Schedule: ${schedule?.schedule_name}, work_days: "${effectiveWorkDays}", shouldShow: ${shouldShowSchedule}`
    );

    return (
      <div
        className={`relative border-l border-gray-200 px-2 py-2 min-h-[80px] text-xs align-top dark:border-gray-800 ${
          leaveOrHoliday
            ? "bg-purple-50/30 dark:bg-purple-950/10"
            : "bg-blue-50/20 dark:bg-blue-950/5"
        }`}
      >
        {/* nút … - hide for HR */}
        {!isHR && (
          <button
            type="button"
            onClick={() => onOpenCellModal(employee, day, [])}
            className="absolute right-2 top-1 text-lg leading-none text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300"
            title="Assign work schedule"
          >
            …
          </button>
        )}

        <div className="mt-4 space-y-1">
          {/* Show leave/holiday if exists */}
          {leaveOrHoliday && (
            <div
              className="rounded-md px-2 py-1.5 text-[11px] font-medium border"
              style={{
                backgroundColor: leaveOrHoliday.type === "holiday" 
                  ? "#e5e7eb" // gray-200
                  : `${leaveOrHoliday.color}20`, // 20% opacity of color_hex
                color: leaveOrHoliday.type === "holiday"
                  ? "#1f2937" // gray-800
                  : leaveOrHoliday.color,
                borderColor: leaveOrHoliday.type === "holiday"
                  ? "#9ca3af" // gray-400
                  : leaveOrHoliday.color,
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <div
                  className="cursor-pointer hover:opacity-80"
                  onClick={() =>
                    onOpenLeaveHolidayDetail(
                      leaveOrHoliday.type,
                      leaveOrHoliday.data
                    )
                  }
                >
                  <span>{leaveOrHoliday.label}</span>
                </div>
              </div>
            </div>
          )}

          {/* Show work schedule with override indicator - only if day is in work_days */}
          {shouldShowSchedule && !leaveOrHoliday && (
            <div className="space-y-1">
              {/* Schedule change indicator */}
              {overrideInfo && (
                <div className="rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800 px-2 py-1 text-[10px] text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Temporary change</span>
                  </div>
                  <div className="text-[9px] opacity-80 mt-0.5">
                    {overrideInfo.reason}
                  </div>
                </div>
              )}

              {/* Work schedule */}
              <div
                onClick={(e) => {
                  if (!isHR) {
                    e.stopPropagation();
                    onEditWorkSchedule(schedule.id);
                  }
                }}
                className={`rounded-md px-2 py-1.5 text-[11px] border ${
                  !isHR ? "cursor-pointer hover:opacity-80" : "cursor-default"
                } transition-opacity ${
                  overrideInfo
                    ? "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-300 dark:border-amber-800"
                    : "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-800"
                }`}
                title={!isHR ? "View work schedule details" : "Work schedule (view only)"}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold truncate ${
                      overrideInfo
                        ? "text-amber-900 dark:text-amber-200"
                        : "text-blue-900 dark:text-blue-200"
                    }`}
                    title={schedule.schedule_name}
                  >
                    {schedule.schedule_name}
                  </div>
                  <div
                    className={`font-medium ${
                      overrideInfo
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {schedule.start_time?.substring(0, 5)} -{" "}
                    {schedule.end_time?.substring(0, 5)}
                  </div>
                </div>
              </div>

              {/* Overtime indicator */}
              {overtimeInfo && (
                <div className="rounded-md bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-800 px-2 py-1.5 text-[11px]">
                  <div className="flex items-center gap-1 font-semibold text-orange-900 dark:text-orange-200">
                    <span>Overtime</span>
                  </div>
                  <div className="text-orange-700 dark:text-orange-300 font-medium">
                    {overtimeInfo.start_time?.substring(0, 5)} -{" "}
                    {overtimeInfo.end_time?.substring(0, 5)}
                  </div>
                  <div className="text-[9px] text-orange-600 dark:text-orange-400 mt-0.5">
                    {overtimeInfo.reason}
                  </div>
                </div>
              )}

              {/* Actual shift badge (for SCHEDULE_CHANGE) */}
              {actualShift && overrideInfo?.type === "SCHEDULE_CHANGE" && (
                <div className="rounded-md bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 px-2 py-1.5 text-[11px]">
                  <div className="flex items-center gap-1 font-semibold text-green-900 dark:text-green-200">
                    <span>Actual Shift</span>
                  </div>
                  <div className="text-green-700 dark:text-green-300 font-medium">
                    {actualShift.start_time?.substring(0, 5)} -{" "}
                    {actualShift.end_time?.substring(0, 5)}
                  </div>
                  <div className="text-[9px] text-green-600 dark:text-green-400 mt-0.5">
                    {actualShift.schedule_name || "Scheduled shift"}
                  </div>
                </div>
              )}
            </div>
          )}

          {!shouldShowSchedule && !leaveOrHoliday && (
            <div className="text-[10px] text-gray-400 dark:text-gray-600 text-center pt-2">
              No schedule
            </div>
          )}
        </div>
      </div>
    );
  }
};
