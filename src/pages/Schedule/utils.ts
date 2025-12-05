// src/pages/Schedule/utils.ts
import { ShiftType, EffectiveScheduleResult } from "./types";

// ===== Constants =====
export const EDIT_HISTORY_DATE_RANGE = {
  START_DATE: '2025-01-01',
  END_DATE: '2025-12-31',
} as const;

export function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0-6
  const diff = (day === 0 ? -6 : 1) - day; // lùi về thứ 2
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTimeRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);

  // Format to HH:MM (24-hour format)
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}

export const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const shiftTypeClasses: Record<ShiftType, string> = {
  SHIFT:
    "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-200",
  OVERTIME:
    "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-200",
  ABSENT:
    "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-200",
  MEETING:
    "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200",
};

// Helper to get the effective schedule for a specific date, considering overrides
export function getEffectiveScheduleForDate(
  scheduleAssignments: any[],
  dateStr: string,
  allWorkSchedules: any[],
  employeeId: number,
  departmentShifts: any[] = []
): EffectiveScheduleResult {
  const currentDate = new Date(dateStr);
  currentDate.setHours(0, 0, 0, 0);

  // Find assignment that covers this date
  const matchingAssignment = scheduleAssignments?.find((assignment: any) => {
    const effectiveFrom = new Date(assignment.effective_from);
    const effectiveTo = new Date(assignment.effective_to);
    effectiveFrom.setHours(0, 0, 0, 0);
    effectiveTo.setHours(0, 0, 0, 0);
    const isDateInRange =
      currentDate >= effectiveFrom && currentDate <= effectiveTo;
    const isActive = assignment.work_schedule?.status === "ACTIVE";
    return isDateInRange && isActive;
  });

  if (!matchingAssignment) {
    return {
      schedule: null,
      overrideInfo: null,
      overtimeInfo: null,
      actualShift: null,
    };
  }

  // Check for actual shift on this date (use shift_date from API)
  const actualShift = departmentShifts.find(
    (shift: any) =>
      shift.employee_id === employeeId && shift.shift_date === dateStr
  );

  console.log(
    `[DEBUG] Looking for shift on ${dateStr} for employee ${employeeId}:`,
    actualShift
  );

  // Check for APPROVED schedule overrides on this date
  const approvedOverride = matchingAssignment.schedule_overrides?.find(
    (override: any) => {
      if (override.status !== "APPROVED") return false;

      const overrideFrom = new Date(override.from_date);
      const overrideTo = new Date(override.to_date || override.from_date);
      overrideFrom.setHours(0, 0, 0, 0);
      overrideTo.setHours(0, 0, 0, 0);

      return currentDate >= overrideFrom && currentDate <= overrideTo;
    }
  );

  // If there's an approved SCHEDULE_CHANGE override, use the override schedule
  if (
    approvedOverride?.type === "SCHEDULE_CHANGE" &&
    approvedOverride.override_work_schedule_id
  ) {
    const overrideSchedule = allWorkSchedules.find(
      (ws: any) => ws.id === approvedOverride.override_work_schedule_id
    );
    return {
      schedule: overrideSchedule || matchingAssignment.work_schedule,
      overrideInfo: {
        type: "SCHEDULE_CHANGE",
        reason: approvedOverride.reason || "Schedule changed temporarily",
      },
      overtimeInfo: null,
      actualShift,
    };
  }

  // If there's an approved OVERTIME override, return original schedule + overtime info
  if (approvedOverride?.type === "OVERTIME") {
    return {
      schedule: matchingAssignment.work_schedule,
      overrideInfo: null,
      overtimeInfo: {
        start_time: approvedOverride.overtime_start_time,
        end_time: approvedOverride.overtime_end_time,
        reason: approvedOverride.reason || "Overtime",
      },
      actualShift,
    };
  }

  // No override, return original schedule
  return {
    schedule: matchingAssignment.work_schedule,
    overrideInfo: null,
    overtimeInfo: null,
    actualShift,
  };
}

export const getShiftStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 border border-green-300 dark:bg-green-500/10 dark:text-green-200";
    case "ABSENT":
      return "bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/10 dark:text-red-200";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-500/10 dark:text-yellow-200";
    case "SCHEDULED":
    default:
      return "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/10 dark:text-blue-200";
  }
};

// Colors for leave/holiday/overtime
export const getLeaveColor = () =>
  "bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/10 dark:text-purple-200";
export const getHolidayColor = () =>
  "bg-gray-200 text-gray-800 border border-gray-400 dark:bg-gray-500/10 dark:text-gray-200";

// Helper: Get day of week from date (1=Mon, 7=Sun)
export const getDayOfWeek = (date: Date): number => {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return day === 0 ? 7 : day; // Convert: 0(Sun)→7, 1(Mon)→1, ..., 6(Sat)→6
};

// Helper: Check if date's day of week is in work_days
export const isDayInWorkDays = (date: Date, workDays: string): boolean => {
  if (!workDays || workDays.trim() === '') return true; // No work_days = work all days (default behavior)
  
  const dayOfWeek = getDayOfWeek(date);
  const workDayNumbers = workDays
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
  
  console.log(`[isDayInWorkDays] Date: ${date.toDateString()}, Day: ${dayOfWeek}, work_days: "${workDays}", parsed: [${workDayNumbers.join(',')}], result: ${workDayNumbers.includes(dayOfWeek)}`);
  
  return workDayNumbers.includes(dayOfWeek);
};

export const MAX_VISIBLE_SHIFTS = 2;

// Helper to generate page items (from OvertimeRequestTable)
export const getPageItems = (total: number, current: number) => {
  const items: number[] = [];
  if (total <= 10) {
    for (let i = 1; i <= total; i++) items.push(i);
    return items;
  }

  const delta = 2;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  items.push(1);
  if (left > 2) items.push(-1);
  for (let i = left; i <= right; i++) items.push(i);
  if (right < total - 1) items.push(-1);
  items.push(total);
  return items;
};

export function formatWeekRange(start: Date, end: Date) {
  return `${start.toLocaleDateString(undefined)} — ${end.toLocaleDateString(
    undefined
  )}`;
}
