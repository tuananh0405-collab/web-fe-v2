// src/pages/Schedule/EmployeeSchedule.tsx
import { useMemo, useState, useEffect, useRef } from "react";
import Select from "react-select";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import DatePicker from "../../components/form/date-picker";
import {
  useGetEmployeeShiftByIdQuery,
  useManualEditEmployeeShiftMutation,
} from "../../redux/api/shiftApiSlice";
import {
  useAssignWorkScheduleMutation,
  useGetEmployeeShiftsCalendarQuery,
  useGetWorkSchedulesQuery,
  useUnassignWorkScheduleMutation,
  useGetAttendanceEditHistoryQuery,
  useUpdateWorkScheduleMutation,
} from "../../redux/api/attendanceApiSlice";
import { useNavigate } from "react-router";
import { useAppSelector } from "../../redux/hook";
import { useGetHolidaysQuery } from "../../redux/api/holidayApiSlice";
import { useGetLeaveTypesQuery } from "../../redux/api/leaveApiSlice";
import {
  useGetOvertimeRequestsQuery,
  OvertimeStatus,
} from "../../redux/api/attendanceApiSlice";

// Custom hooks
import { useLeaveHoliday } from "./hooks/useLeaveHoliday";
import { useShiftsProcessing } from "./hooks/useShiftsProcessing";

/* =======================
 * UI Types
 * ======================= */

interface EmployeeRow {
  id: number;
  fullName: string;
  employeeCode: string;
  departmentName: string;
  email: string;
  scheduleAssignments: any[];
  shifts: any[];
  leaves: any[];
}

type ShiftType = "SHIFT" | "OVERTIME" | "ABSENT" | "MEETING";

interface UISimpleShift {
  id: number; // shift_id từ API
  employeeId: number;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  type: ShiftType;
  date: string;
  status?: string; // shift status: SCHEDULED, COMPLETED, ABSENT, IN_PROGRESS
  isOvertimeRequest?: boolean; // true if this is an overtime request, not a shift
}

/* =======================
 * Helpers
 * ======================= */

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0-6
  const diff = (day === 0 ? -6 : 1) - day; // lùi về thứ 2
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeRange(startISO: string, endISO: string) {
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

const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const shiftTypeClasses: Record<ShiftType, string> = {
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
function getEffectiveScheduleForDate(
  scheduleAssignments: any[],
  dateStr: string,
  allWorkSchedules: any[],
  employeeId: number,
  departmentShifts: any[] = []
): {
  schedule: any | null;
  overrideInfo: { type: string; reason: string } | null;
  overtimeInfo: { start_time: string; end_time: string; reason: string } | null;
  actualShift: any | null;
} {
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

const getShiftStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800 border border-green-300 dark:bg-green-500/10 dark:text-green-200";
    case "ABSENT":
      return "bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/10 dark:text-red-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-200";
    case "SCHEDULED":
    default:
      return "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/10 dark:text-blue-200";
  }
};

// Colors for leave/holiday/overtime
const getLeaveColor = () =>
  "bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/10 dark:text-purple-200";
const getHolidayColor = () =>
  "bg-gray-200 text-gray-800 border border-gray-400 dark:bg-gray-500/10 dark:text-gray-200";

// Helper: Get day of week from date (1=Mon, 7=Sun)
const getDayOfWeek = (date: Date): number => {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return day === 0 ? 7 : day; // Convert: 0(Sun)→7, 1(Mon)→1, ..., 6(Sat)→6
};

// Helper: Check if date's day of week is in work_days
const isDayInWorkDays = (date: Date, workDays: string): boolean => {
  const dayOfWeek = getDayOfWeek(date);
  const workDayNumbers = workDays
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
  return workDayNumbers.includes(dayOfWeek);
};

const MAX_VISIBLE_SHIFTS = 2;

type CellModalState = {
  employee: EmployeeRow;
  date: Date;
  shifts: UISimpleShift[];
} | null;

type LeaveHolidayModalState = {
  type: "holiday" | "leave";
  data: any;
} | null;

/* =======================
 * Component
 * ======================= */

const EmployeeSchedule = () => {
  const navigate = useNavigate();
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

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday());
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Helper to generate page items (from OvertimeRequestTable)
  const getPageItems = (total: number, current: number) => {
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

  // Bulk assign modal state
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

  // Unassign modal state
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

  // Edit History modal state
  const [isEditHistoryModalOpen, setIsEditHistoryModalOpen] = useState(false);
  const [selectedHistoryEmployeeId, setSelectedHistoryEmployeeId] = useState<number | null>(null);

  // Edit Work Schedule modal state
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

  // Refs for flatpickr time pickers
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  // Week days calculation
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // ===== Fetch employee calendar data =====
  const {
    data: calendarData,
    isLoading: isLoadingCalendar,
    isError: isErrorCalendar,
    refetch: refetchCalendar,
  } = useGetEmployeeShiftsCalendarQuery(
    {
      token: token!,
      department_id: departmentId,
      limit,
      offset,
    },
    { skip: !token }
  );

  // ===== Fetch global data =====
  const { data: overtimeData } = useGetOvertimeRequestsQuery(
    {
      token: token!,
      status: OvertimeStatus.APPROVED,
      limit: 1000,
      offset: 0,
    },
    { skip: !token }
  );

  const { data: holidaysData } = useGetHolidaysQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const { data: leaveTypesData } = useGetLeaveTypesQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const { data: workSchedulesData, isError: isWorkSchedulesError } = useGetWorkSchedulesQuery(
    {
      token: token!,
      status: "ACTIVE",
      limit: 100,
      offset: 0,
    },
    { skip: !token }
  );

  // Log work schedules error for debugging
  if (isWorkSchedulesError) {
    console.warn("[EmployeeSchedule] Work schedules API failed - shifts will be shown without schedule validation");
  }

  console.log("calendar data: ", calendarData);

  // Process calendar data
  const employees: EmployeeRow[] = useMemo(() => {
    const calendarEmployees = calendarData?.data?.data ?? [];
    return calendarEmployees.map((emp: any) => ({
      id: emp.employee_id,
      fullName: emp.full_name,
      employeeCode: emp.employee_code,
      departmentName: emp.department_name,
      email: emp.email,
      scheduleAssignments: emp.assignments ?? [],
      shifts: emp.shifts ?? [], // Get shifts from calendar API
      leaves: [], // Calendar API doesn't include leaves, fetch separately if needed
    }));
  }, [calendarData]);

  console.log("employees: ", employees);

  const total = calendarData?.data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const overtime = overtimeData;
  const holidays = holidaysData;
  const leaveTypes = leaveTypesData;
  const activeWorkSchedules = workSchedulesData?.data?.data ?? [];

  console.log("[DEBUG] Active work schedules count:", activeWorkSchedules.length);
  if (isWorkSchedulesError) {
    console.warn("[DEBUG] Work schedules API failed - shifts will show without schedule validation");
  }

  // Extract all shifts from calendar data (shifts are at employee level, not assignment level)
  const departmentShifts = useMemo(() => {
    const calendarEmployees = calendarData?.data?.data ?? [];
    const allShifts: any[] = [];

    console.log("[DEBUG] Calendar data:", calendarData);
    console.log("[DEBUG] Calendar employees count:", calendarEmployees.length);

    calendarEmployees.forEach((emp: any) => {
      console.log(`[DEBUG] Employee ${emp.employee_code} shifts:`, emp.shifts);
      if (Array.isArray(emp.shifts)) {
        // Add employee_id to each shift for easier lookup
        const shiftsWithEmployeeId = emp.shifts.map((shift: any) => ({
          ...shift,
          employee_id: emp.employee_id,
        }));
        allShifts.push(...shiftsWithEmployeeId);
      }
    });

    console.log(
      "[DEBUG] Total department shifts extracted:",
      allShifts.length,
      allShifts
    );
    return allShifts;
  }, [calendarData]);

  const isLoading = isLoadingCalendar;
  const isError = isErrorCalendar;
  const refetch = refetchCalendar;

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

  // ===== Get work schedules for assignment (use the same data from hook) =====
  const workSchedules = activeWorkSchedules;

  const [assignWorkSchedule, { isLoading: isAssigning }] =
    useAssignWorkScheduleMutation();

  const [unassignWorkSchedule] = useUnassignWorkScheduleMutation();

  const { data: editHistoryData } = useGetAttendanceEditHistoryQuery(
    {
      token: token!,
      employeeId: selectedHistoryEmployeeId || undefined,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      offset: 0,
    },
    { skip: !token }
  );

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null
  );

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

  // ===== Unassign Modal Functions =====
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

  // ===== Edit History Modal Functions =====
  const openEditHistoryModal = () => {
    setSelectedHistoryEmployeeId(null);
    setIsEditHistoryModalOpen(true);
  };

  const closeEditHistoryModal = () => {
    setIsEditHistoryModalOpen(false);
    setSelectedHistoryEmployeeId(null);
  };

  // ===== Edit Work Schedule Modal Functions =====
  const [updateWorkSchedule, { isLoading: isUpdatingSchedule }] = useUpdateWorkScheduleMutation();

  const openEditWorkScheduleModal = (scheduleId: number) => {
    const schedule = activeWorkSchedules.find((ws: any) => ws.id === scheduleId);
    if (!schedule) return;

    setSelectedWorkScheduleId(scheduleId);
    setEditScheduleName(schedule.schedule_name || "");
    setEditScheduleType(schedule.schedule_type || "FIXED");
    setEditWorkDays(schedule.work_days || "");
    setEditStartTime(schedule.start_time || "");
    setEditEndTime(schedule.end_time || "");
    setEditBreakDuration(String(schedule.break_duration_minutes || 60));
    setEditLateTolerance(String(schedule.late_tolerance_minutes || 15));
    setEditEarlyLeaveTolerance(String(schedule.early_leave_tolerance_minutes || 15));
    setEditScheduleStatus(schedule.status || "ACTIVE");
    setEditScheduleErrors({});
    setIsEditWorkScheduleModalOpen(true);
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
      errors.start_time = "Start time is required (HH:MM format)";
    } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(editStartTime)) {
      errors.start_time = "Invalid time format. Use HH:MM (e.g., 08:00)";
    }

    if (!editEndTime.trim()) {
      errors.end_time = "End time is required (HH:MM format)";
    } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(editEndTime)) {
      errors.end_time = "Invalid time format. Use HH:MM (e.g., 17:00)";
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

  // Initialize flatpickr time pickers for work schedule edit
  useEffect(() => {
    if (!isEditWorkScheduleModalOpen) return;

    const startTimePicker = startTimeRef.current
      ? flatpickr(startTimeRef.current, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          defaultDate: editStartTime || "08:00",
          onChange: (_selectedDates, dateStr) => {
            setEditStartTime(dateStr);
            if (editScheduleErrors.start_time) {
              setEditScheduleErrors({ ...editScheduleErrors, start_time: "" });
            }
          },
        })
      : null;

    const endTimePicker = endTimeRef.current
      ? flatpickr(endTimeRef.current, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          defaultDate: editEndTime || "17:00",
          onChange: (_selectedDates, dateStr) => {
            setEditEndTime(dateStr);
            if (editScheduleErrors.end_time) {
              setEditScheduleErrors({ ...editScheduleErrors, end_time: "" });
            }
          },
        })
      : null;

    return () => {
      startTimePicker?.destroy();
      endTimePicker?.destroy();
    };
  }, [isEditWorkScheduleModalOpen, editStartTime, editEndTime, editScheduleErrors]);

  const availableAssignments = useMemo(() => {
    // Nếu không chọn ai thì trả về mảng rỗng luôn
    if (selectedUnassignEmployeeIds.length === 0) return [];

    return employees
      // 1. Chỉ lấy những nhân viên đang được chọn
      .filter((emp) => selectedUnassignEmployeeIds.includes(emp.id))
      // 2. Gộp (flat) tất cả assignment của các nhân viên đó lại thành 1 mảng duy nhất
      .flatMap((emp) => 
        emp.scheduleAssignments
          // 3. Lọc lấy những assignment có status ACTIVE
          .filter((assignment: any) => assignment.work_schedule?.status === "ACTIVE")
          // 4. Map thêm thông tin nhân viên vào assignment
          .map((assignment: any) => ({
            ...assignment,
            employee_id: emp.id,
            employee_code: emp.employeeCode,
            employee_name: emp.fullName,
          }))
      );
  }, [selectedUnassignEmployeeIds, employees]);

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

  // ===== Week navigation & date picker =====
  // small helpers for week navigation
  function goToPreviousWeek() {
    setWeekStart((ws) => {
      const d = new Date(ws);
      d.setDate(d.getDate() - 7);
      return getMonday(d);
    });
  }

  function goToNextWeek() {
    setWeekStart((ws) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + 7);
      return getMonday(d);
    });
  }

  function goToThisWeek() {
    setWeekStart(getMonday());
  }

  function formatWeekRange(start: Date, end: Date) {
    // const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    // return `${start.toLocaleDateString(undefined, opts)} — ${end.toLocaleDateString(undefined, opts)}`;

    return `${start.toLocaleDateString(undefined)} — ${end.toLocaleDateString(
      undefined
    )}`;
  }

  // ===== Modal xem tất cả ca trong 1 ô =====
  const [cellModal, setCellModal] = useState<CellModalState>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const handleOpenCellModal = (
    employee: EmployeeRow,
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

  // ===== Assign Work Schedule cho cell hiện tại =====
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

  // ===== Modal chi tiết 1 shift (GET /employee-shifts/{id}) =====
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

  const {
    data: shiftDetailRes,
    isLoading: isShiftLoading,
    isError: isShiftError,
  } = useGetEmployeeShiftByIdQuery(
    { token: token!, id: selectedShiftId ?? 0 },
    { skip: !token || !selectedShiftId }
  );

  const [isShiftDetailOpen, setIsShiftDetailOpen] = useState(false);

  // ===== Edit shift state =====
  const [isEditingShift, setIsEditingShift] = useState(false);
  const [editShiftStatus, setEditShiftStatus] = useState<string>("");
  const [editShiftNotes, setEditShiftNotes] = useState<string>("");
  const [editShiftReason, setEditShiftReason] = useState<string>("");
  const [editShiftErrors, setEditShiftErrors] = useState<Record<string, string>>({});

  const [manualEditShift, { isLoading: isEditingShiftLoading }] =
    useManualEditEmployeeShiftMutation();

  // ===== Modal for Leave/Holiday Detail =====
  const [leaveHolidayModal, setLeaveHolidayModal] =
    useState<LeaveHolidayModalState>(null);

  const handleOpenShiftDetail = (shiftId: number) => {
    setSelectedShiftId(shiftId);
    setIsShiftDetailOpen(true);
    setIsEditingShift(false);
  };

  const handleCloseShiftDetail = () => {
    setIsShiftDetailOpen(false);
    setSelectedShiftId(null);
    setIsEditingShift(false);
    setEditShiftStatus("");
    setEditShiftNotes("");
    setEditShiftReason("");
    setEditShiftErrors({});
  };

  const handleEditShift = () => {
    if (!shiftDetail) return;
    
    // Populate form with current values
    setEditShiftStatus(shiftDetail.status || "");
    setEditShiftNotes(shiftDetail.notes || "");
    setEditShiftReason("");
    setEditShiftErrors({});
    setIsEditingShift(true);
  };

  const handleCancelEdit = () => {
    setIsEditingShift(false);
    setEditShiftStatus("");
    setEditShiftNotes("");
    setEditShiftReason("");
    setEditShiftErrors({});
  };

  const handleSaveShiftEdit = async () => {
    if (!token || !selectedShiftId || !shiftDetail) return;

    // Validate form
    const errors: Record<string, string> = {};

    // Validate: Status must be different from original
    if (!editShiftStatus) {
      errors.status = "Please select a status";
    } else if (editShiftStatus === shiftDetail.status) {
      errors.status = `Please select a different status. Current status is ${shiftDetail.status}`;
    }

    // Validate: Edit reason is required
    if (!editShiftReason.trim()) {
      errors.edit_reason = "Edit reason is required";
    }

    setEditShiftErrors(errors);

    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await manualEditShift({
        token,
        id: selectedShiftId,
        body: {
          check_in_time: shiftDetail.check_in_time,
          check_out_time: shiftDetail.check_out_time,
          status: editShiftStatus,
          notes: editShiftNotes || null,
          edit_reason: editShiftReason,
        },
      }).unwrap();

      // Success - close modal and refetch calendar
      handleCloseShiftDetail();
      
      // Refetch calendar to update the weekly view with new status
      refetch();
    } catch (err: any) {
      console.error("Failed to edit shift:", err);
      setEditShiftErrors({ submit: err?.data?.message || "Failed to update shift. Please try again." });
    }
  };

  const handleOpenLeaveHolidayDetail = (
    type: "holiday" | "leave",
    data: any
  ) => {
    setLeaveHolidayModal({ type, data });
  };

  const handleCloseLeaveHolidayDetail = () => {
    setLeaveHolidayModal(null);
  };

  const shiftDetail = shiftDetailRes?.data;

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Weekly Schedule
            </h2>

            <div className="flex items-center gap-3 mt-2 w-full">
              {/* left: arrows + quick actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousWeek}
                  title="Previous week"
                  className="rounded-md border border-gray-200/80 bg-white px-3 py-1 text-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={goToThisWeek}
                  title="This week"
                  className="rounded-md px-3 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-200"
                >
                  This week
                </button>

                <button
                  type="button"
                  onClick={goToNextWeek}
                  title="Next week"
                  className="rounded-md border border-gray-200/80 bg-white px-3 py-1 text-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                >
                  ›
                </button>
              </div>

              {/* center: human-friendly week range */}
              <div className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="font-medium text-gray-800 dark:text-white/90">
                  {formatWeekRange(weekDays[0], weekDays[6])}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {dayLabels[0]} — {dayLabels[6]}
                </div>
              </div>

              {/* right: date picker to jump to any week */}
              {/* <div className="ml-auto w-[180px]">
                <DatePicker
                  id="week-picker"
                  mode="single"
                  label={undefined}
                  defaultDate={toISODate(weekStart)}
                  placeholder="Jump to date"
                  onChange={handleWeekChange}
                />
              </div> */}
            </div>
          </div>

          {/* NEW: nút Assign & Unassign */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openEditHistoryModal}
              className="inline-flex items-center justify-center rounded-full border border-purple-500 px-4 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-200 dark:hover:bg-purple-500/10"
            >
              View Edit History
            </button>
            <button
              type="button"
              onClick={openUnassignModal}
              className="inline-flex items-center justify-center rounded-full border border-red-500 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-200 dark:hover:bg-red-500/10"
            >
              Unassign
            </button>
            <button
              type="button"
              onClick={openBulkModal}
              className="inline-flex items-center justify-center rounded-full border border-brand-500 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-200 dark:hover:bg-brand-500/10"
            >
              Assign
            </button>
          </div>
        </div>

        {/* Grid: 1 cột employees + 7 cột ngày */}
        <div className="border border-gray-200 rounded-xl overflow-hidden dark:border-gray-800">
          <div className="grid grid-cols-[260px_repeat(7,_minmax(120px,1fr))] bg-gray-50 dark:bg-gray-900/40">
            <div className="border-b border-gray-200 dark:border-gray-800" />
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className="border-b border-l border-gray-200 px-4 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400"
              >
                <div>{dayLabels[idx]}</div>
                <div className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {day.getMonth() + 1}/{day.getDate()}/{day.getFullYear()}
                </div>
              </div>
            ))}
          </div>

          {/* Rows: mỗi employee một hàng */}
          {employees.map((emp) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return (
              <div
                key={emp.id}
                className="grid grid-cols-[260px_repeat(7,_minmax(120px,1fr))] border-t border-gray-200 dark:border-gray-800"
              >
                {/* Employee info */}
                <div className="flex items-center gap-3 px-4 py-4 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
                  <div className="w-10 h-10 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-white font-semibold">
                    <span className="text-sm">
                      {emp.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {emp.fullName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                      {emp.employeeCode}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {emp.departmentName}
                    </p>
                  </div>
                </div>

                {/* Week cells: show shifts for past/today, work schedule for future */}
                {weekDays.map((day, idx) => {
                  const dayKey = formatDate(day);
                  const cellDate = new Date(day);
                  cellDate.setHours(0, 0, 0, 0);
                  const isFuture = cellDate > today;

                  // Get leave/holiday info
                  const leaveOrHoliday = getLeaveOrHolidayInfo(emp.id, dayKey);

                  // For past/today: show employee shifts
                  // For future: show work schedule
                  if (!isFuture) {
                    // PAST/TODAY: Show Employee Shifts
                    const key = `${emp.id}-${dayKey}`;
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
                        key={idx}
                        className={`relative border-l border-gray-200 px-2 py-2 min-h-[80px] text-xs align-top dark:border-gray-800 ${
                          leaveOrHoliday
                            ? "bg-purple-50/30 dark:bg-purple-950/10"
                            : ""
                        }`}
                      >
                        {/* nút … luôn hiển thị ở góc trên phải */}
                        <button
                          type="button"
                          onClick={() => handleOpenCellModal(emp, day, shifts)}
                          className="absolute right-2 top-1 text-lg leading-none text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300"
                          title="View shifts / assign work schedule"
                        >
                          …
                        </button>

                        <div className="mt-4 space-y-1">
                          {/* Show leave/holiday badge */}
                          {leaveOrHoliday && (
                            <div
                              className={`rounded-md px-2 py-1.5 text-[11px] font-medium border ${
                                leaveOrHoliday.type === "holiday"
                                  ? getHolidayColor()
                                  : getLeaveColor()
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div
                                  className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                                  onClick={() =>
                                    handleOpenLeaveHolidayDetail(
                                      leaveOrHoliday.type,
                                      leaveOrHoliday.data
                                    )
                                  }
                                >
                                  {leaveOrHoliday.type === "holiday"
                                    ? "🎉"
                                    : "🏖️"}
                                  <span>{leaveOrHoliday.label}</span>
                                </div>
                                {leaveOrHoliday.type === "leave" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/leave-requests/${leaveOrHoliday.data.id}`
                                      );
                                    }}
                                    className="text-[10px] underline hover:no-underline"
                                  >
                                    View Detail
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Show shifts (already filtered, so should be empty if leave/holiday) */}
                          {visible.map((shift) => {
                            // Use status-based color for regular shifts, type-based for overtime
                            const shiftType = shift.type as ShiftType;
                            const badgeColor =
                              shift.type === "OVERTIME"
                                ? shiftTypeClasses[shiftType]
                                : getShiftStatusColor(
                                    shift.status || "SCHEDULED"
                                  );

                            return (
                              <div
                                key={shift.id}
                                onClick={() => {
                                  // Don't open shift detail for overtime requests
                                  if (!shift.isOvertimeRequest) {
                                    handleOpenShiftDetail(shift.id);
                                  }
                                }}
                                className={`rounded-md px-2 py-1 text-[11px] leading-tight ${
                                  !shift.isOvertimeRequest
                                    ? "cursor-pointer hover:opacity-90"
                                    : ""
                                } ${badgeColor}`}
                              >
                                <div className="truncate font-medium">
                                  {shift.title}
                                </div>
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
                    const {
                      schedule,
                      overrideInfo,
                      overtimeInfo,
                      actualShift,
                    } = getEffectiveScheduleForDate(
                      emp.scheduleAssignments,
                      dayKey,
                      activeWorkSchedules,
                      emp.id,
                      departmentShifts
                    );

                    // Check if current day is in schedule's work_days
                    const shouldShowSchedule =
                      schedule && schedule.work_days
                        ? isDayInWorkDays(day, schedule.work_days)
                        : !!schedule; // If no work_days specified, show schedule

                    // Debug logging
                    if (schedule) {
                      const dayOfWeek = getDayOfWeek(day);
                      console.log(
                        `[FUTURE] Employee ${emp.employeeCode}, Date ${dayKey} (day ${dayOfWeek}), Schedule: ${schedule.schedule_name}, work_days: [${schedule.work_days}], shouldShow: ${shouldShowSchedule}`
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`relative border-l border-gray-200 px-2 py-2 min-h-[80px] text-xs align-top dark:border-gray-800 ${
                          leaveOrHoliday
                            ? "bg-purple-50/30 dark:bg-purple-950/10"
                            : "bg-blue-50/20 dark:bg-blue-950/5"
                        }`}
                      >
                        {/* nút … */}
                        <button
                          type="button"
                          onClick={() => handleOpenCellModal(emp, day, [])}
                          className="absolute right-2 top-1 text-lg leading-none text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300"
                          title="Assign work schedule"
                        >
                          …
                        </button>

                        <div className="mt-4 space-y-1">
                          {/* Show leave/holiday if exists */}
                          {leaveOrHoliday && (
                            <div
                              className={`rounded-md px-2 py-1.5 text-[11px] font-medium border ${
                                leaveOrHoliday.type === "holiday"
                                  ? getHolidayColor()
                                  : getLeaveColor()
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div
                                  className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                                  onClick={() =>
                                    handleOpenLeaveHolidayDetail(
                                      leaveOrHoliday.type,
                                      leaveOrHoliday.data
                                    )
                                  }
                                >
                                  {leaveOrHoliday.type === "holiday"
                                    ? "🎉"
                                    : "🏖️"}
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
                                    <span>🔄</span>
                                    <span className="font-medium">
                                      Temporary change
                                    </span>
                                  </div>
                                  <div className="text-[9px] opacity-80 mt-0.5">
                                    {overrideInfo.reason}
                                  </div>
                                </div>
                              )}

                              {/* Work schedule */}
                              <div
                                className={`rounded-md px-2 py-1.5 text-[11px] border ${
                                  overrideInfo
                                    ? "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-300 dark:border-amber-800"
                                    : "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-800"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
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
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditWorkScheduleModal(schedule.id);
                                    }}
                                    className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium hover:opacity-80 ${
                                      overrideInfo
                                        ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100"
                                        : "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
                                    }`}
                                    title="Edit work schedule"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>

                              {/* Overtime indicator */}
                              {overtimeInfo && (
                                <div className="rounded-md bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-800 px-2 py-1.5 text-[11px]">
                                  <div className="flex items-center gap-1 font-semibold text-orange-900 dark:text-orange-200">
                                    <span>⏰</span>
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
                              {actualShift &&
                                overrideInfo?.type === "SCHEDULE_CHANGE" && (
                                  <div className="rounded-md bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 px-2 py-1.5 text-[11px]">
                                    <div className="flex items-center gap-1 font-semibold text-green-900 dark:text-green-200">
                                      <span>✓</span>
                                      <span>Actual Shift</span>
                                    </div>
                                    <div className="text-green-700 dark:text-green-300 font-medium">
                                      {actualShift.start_time?.substring(0, 5)}{" "}
                                      - {actualShift.end_time?.substring(0, 5)}
                                    </div>
                                    <div className="text-[9px] text-green-600 dark:text-green-400 mt-0.5">
                                      {actualShift.schedule_name ||
                                        "Scheduled shift"}
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
                })}
              </div>
            );
          })}
        </div>

        {/* Pagination controls - similar to OvertimeRequestTable */}
        {totalPages > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className={`px-3 py-1 rounded-md text-sm ${
                  page > 1
                    ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                }`}
              >
                Prev
              </button>

              {/* Page number buttons */}
              <div className="flex items-center gap-1">
                {getPageItems(totalPages, page).map((p, idx) =>
                  p === -1 ? (
                    <span
                      key={`e-${idx}`}
                      className="px-2 text-sm text-gray-500"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      disabled={p === page}
                      className={`px-3 py-1 rounded-md text-sm ${
                        p === page
                          ? "bg-brand-600 text-white dark:bg-brand-500"
                          : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                      }`}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className={`px-3 py-1 rounded-md text-sm ${
                  page < totalPages
                    ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Modal ĐĂNG KÝ CA HÀNG LOẠT */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={closeBulkModal}
        className="max-w-3xl m-4"
      >
        <div className="w-full p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
            Assign shifts
          </h4>

          {/* Date range */}
          <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                Start date
              </p>
              <DatePicker
                id="bulk-start-picker"
                mode="single"
                defaultDate={bulkEffectiveFrom || undefined}
                placeholder="Select start date"
                onChange={(_selectedDates: Date[], dateStr: string) =>
                  setBulkEffectiveFrom(dateStr)
                }
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                End date
              </p>
              <DatePicker
                id="bulk-end-picker"
                mode="single"
                defaultDate={bulkEffectiveTo || undefined}
                placeholder="Select end date"
                onChange={(_selectedDates: Date[], dateStr: string) =>
                  setBulkEffectiveTo(dateStr)
                }
              />
            </div>
          </div>

          {/* Chọn ca đăng ký */}
          <div className="mb-4">
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              Select work schedule
            </p>
            <Select
              options={workScheduleOptions}
              value={selectedSchedule}
              onChange={(opt) => setSelectedSchedule(opt)}
              placeholder="Select work schedule..."
              classNamePrefix="react-select"
              isClearable
            />
          </div>

          {/* Select employees */}
          {selectedSchedule && (
            <div className="mb-4">
              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                Select employees for{" "}
                <span className="font-medium">{selectedSchedule.label}</span>
              </p>
              {isLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading employees...
                </p>
              ) : (
                <Select
                  isMulti
                  options={employeeOptions}
                  value={employeeOptions.filter((opt) =>
                    selectedEmployeeIds.includes(opt.value)
                  )}
                  onChange={(opts) => {
                    const selected =
                      (opts as { value: number; label: string }[]) || [];

                    // Check if "Select All" was clicked
                    const hasSelectAll = selected.some(
                      (opt) => opt.value === -1
                    );
                    const previouslyHadSelectAll =
                      selectedEmployeeIds.includes(-1);

                    let ids: number[];

                    if (hasSelectAll && !previouslyHadSelectAll) {
                      // Select All was just clicked - select all employees
                      ids = employeeOptions
                        .filter((opt) => opt.value !== -1)
                        .map((opt) => opt.value);
                    } else if (!hasSelectAll && previouslyHadSelectAll) {
                      // Select All was deselected - clear all
                      ids = [];
                    } else if (hasSelectAll) {
                      // Select All is already selected, user clicked individual item
                      // Remove Select All and keep only the clicked items
                      ids = selected
                        .filter((opt) => opt.value !== -1)
                        .map((opt) => opt.value);
                    } else {
                      // Normal selection without Select All
                      ids = selected.map((opt) => opt.value);
                    }

                    setSelectedEmployeeIds(ids);
                  }}
                  placeholder="Select employees..."
                  classNamePrefix="react-select"
                  noOptionsMessage={() => "No employees found."}
                />
              )}
            </div>
          )}

          {/* Messages */}
          {bulkSuccessMsg && (
            <p className="mt-4 text-sm text-green-600 dark:text-green-400">
              {bulkSuccessMsg}
            </p>
          )}
          {bulkErrorMsg && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {bulkErrorMsg}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeBulkModal}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleBulkAssign}
              disabled={
                isAssigning ||
                !selectedSchedule ||
                selectedEmployeeIds.length === 0
              }
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {isAssigning ? "Assigning..." : "Assign"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal UNASSIGN WORK SCHEDULE */}
      <Modal
        isOpen={isUnassignModalOpen}
        onClose={closeUnassignModal}
        className="max-w-4xl m-4"
      >
        <div className="relative w-full max-w-4xl rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-9">
          <div className="px-2 pr-10">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Unassign Work Schedules
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Select employees and their work schedule assignments to remove.
            </p>
          </div>

          <div className="custom-scrollbar max-h-[500px] overflow-y-auto px-2 pb-3">
            {/* Step 1: Select employees */}
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Step 1: Select employees
              </p>
              <Select
                isMulti
                options={employeeOptions}
                value={employeeOptions.filter((opt) =>
                  selectedUnassignEmployeeIds.includes(opt.value)
                )}
                onChange={(opts) => {
                  const selected =
                    (opts as { value: number; label: string }[]) || [];

                  // Check if "Select All" was clicked
                  const hasSelectAll = selected.some((opt) => opt.value === -1);
                  const previouslyHadSelectAll =
                    selectedUnassignEmployeeIds.includes(-1);

                  let ids: number[];

                  if (hasSelectAll && !previouslyHadSelectAll) {
                    // Select All was just clicked - select all employees
                    ids = employeeOptions
                      .filter((opt) => opt.value !== -1)
                      .map((opt) => opt.value);
                  } else if (!hasSelectAll && previouslyHadSelectAll) {
                    // Select All was deselected - clear all
                    ids = [];
                  } else if (hasSelectAll) {
                    // Select All is already selected, user clicked individual item
                    // Remove Select All and keep only the clicked items
                    ids = selected
                      .filter((opt) => opt.value !== -1)
                      .map((opt) => opt.value);
                  } else {
                    // Normal selection without Select All
                    ids = selected.map((opt) => opt.value);
                  }

                  setSelectedUnassignEmployeeIds(ids);
                  setSelectedAssignmentIds([]); // Reset assignments when employees change
                }}
                placeholder="Select employees..."
                classNamePrefix="react-select"
                noOptionsMessage={() => "No employees found."}
                menuPosition="fixed"
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                  menu: (base) => ({ ...base, zIndex: 99999 }),
                }}
              />
            </div>

            {/* Step 2: Show assignments grouped by employee */}
            {selectedUnassignEmployeeIds.length > 0 && (
              <div className="mb-4 space-y-3">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Step 2: Select assignments to unassign
                </p>

                <div className="space-y-3">
                  {selectedUnassignEmployeeIds.map((empId) => {
                    const employee = employees.find((e) => e.id === empId);
                    if (!employee) return null;

                    // Filter assignments for this employee from availableAssignments (already filtered by ACTIVE status)
                    const employeeAssignments = availableAssignments.filter(
                      (assignment) => assignment.employee_id === empId
                    );

                    if (employeeAssignments.length === 0) return null;

                    return (
                      <details
                        key={empId}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        open
                      >
                        <summary className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-600 dark:to-indigo-700 flex items-center justify-center text-white font-semibold text-sm">
                              {employee.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                {employee.fullName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {employee.employeeCode} •{" "}
                                {employeeAssignments.length} assignment(s)
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">▼</span>
                        </summary>

                        <div className="p-3 space-y-2">
                          {employeeAssignments.map((assignment) => {
                            // SỬA 1: Dùng assignment_id
                            const isChecked = selectedAssignmentIds.includes(
                              assignment.assignment_id
                            );

                            return (
                              <div
                                // SỬA 2: Dùng assignment_id làm key
                                key={assignment.assignment_id}
                                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  // Toggle this specific assignment
                                  setSelectedAssignmentIds((prev) => {
                                    // SỬA 3: So sánh với assignment_id
                                    if (
                                      prev.includes(assignment.assignment_id)
                                    ) {
                                      // Remove this assignment
                                      return prev.filter(
                                        (id) => id !== assignment.assignment_id
                                      );
                                    } else {
                                      // Add this assignment
                                      return [
                                        ...prev,
                                        assignment.assignment_id,
                                      ];
                                    }
                                  });
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    // Handled by parent div onClick
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 pointer-events-none"
                                  readOnly
                                  aria-label={`Select ${assignment.work_schedule?.schedule_name}`}
                                />
                                <div className="flex-1 pointer-events-none">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-100">
                                      {assignment.work_schedule?.schedule_name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {/* SỬA 4: Hiển thị assignment_id */}
                                      ID: {assignment.assignment_id}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    {assignment.work_schedule?.start_time} -{" "}
                                    {assignment.work_schedule?.end_time}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {assignment.effective_from} →{" "}
                                    {assignment.effective_to}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>

                {/* Phần Select All / Clear All bên dưới */}
                {availableAssignments.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      // SỬA 5: Map assignment_id cho nút Select All
                      onClick={() =>
                        setSelectedAssignmentIds(
                          availableAssignments.map((a) => a.assignment_id)
                        )
                      }
                      className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Select All
                    </button>
                    <span className="text-xs text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAssignmentIds([])}
                      className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Progress message */}
            {unassignProgress && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {unassignProgress}
                </p>
              </div>
            )}

            {/* Success/Error messages */}
            {unassignSuccessMsg && (
              <p className="mt-3 text-sm text-green-600 dark:text-green-400">
                {unassignSuccessMsg}
              </p>
            )}
            {unassignErrorMsg && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {unassignErrorMsg}
              </p>
            )}
          </div>

          {/* Footer buttons - fixed at bottom */}
          <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
            <button
              type="button"
              onClick={closeUnassignModal}
              disabled={!!unassignProgress}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUnassign}
              disabled={
                selectedAssignmentIds.length === 0 || !!unassignProgress
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {unassignProgress
                ? "Processing..."
                : `Unassign (${selectedAssignmentIds.length})`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal xem toàn bộ ca trong 1 ô + Assign Work Schedule */}
      <Modal
        isOpen={!!cellModal && isOpen}
        onClose={closeCellModal}
        className="max-w-lg m-4"
      >
        <div className="w-full p-6">
          {cellModal && (
            <>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
                {cellModal.employee.fullName}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {cellModal.employee.employeeCode} •{" "}
                {cellModal.employee.departmentName}
                <br />
                {cellModal.date.toDateString()}
              </p>

              {/* Shifts on this day */}
              <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                Shifts on this day
              </h5>

              {cellModal.shifts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  No shifts for this day.
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {cellModal.shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={`rounded-md px-3 py-2 text-sm ${
                        shiftTypeClasses[shift.type]
                      }`}
                    >
                      <p className="font-medium">
                        {formatTimeRange(shift.start, shift.end)}
                      </p>
                      <p className="text-xs opacity-80">{shift.title}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Assign work schedule */}
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <h5 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Assign Work Schedule
                </h5>

                {isLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading work schedules...
                  </p>
                ) : workSchedules.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No work schedules available.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      title="Select work schedule"
                      aria-label="Select work schedule"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      value={selectedScheduleId ?? ""}
                      onChange={(e) =>
                        setSelectedScheduleId(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    >
                      <option value="">Select work schedule</option>
                      {workSchedules.map((ws: any) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.schedule_name} ({ws.start_time} - {ws.end_time})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedScheduleId || isAssigning}
                      onClick={handleAssignSchedule}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
                    >
                      {isAssigning ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={closeCellModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal chi tiết 1 shift */}
      <Modal
        isOpen={isShiftDetailOpen}
        onClose={handleCloseShiftDetail}
        className="max-w-lg m-4"
      >
        <div className="w-full p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
            Shift Detail {selectedShiftId ? `#${selectedShiftId}` : ""}
          </h4>

          {isShiftLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading shift detail...
            </p>
          )}

          {isShiftError && (
            <p className="text-sm text-red-500">Failed to load shift detail.</p>
          )}

          {shiftDetail && !isEditingShift && (
            <div className="space-y-2 text-sm text-gray-800 dark:text-gray-100">
              <p>
                <span className="font-medium">Employee Code:</span>{" "}
                {shiftDetail.employee_code}
              </p>
              <p>
                <span className="font-medium">Shift Date:</span>{" "}
                {shiftDetail.shift_date}
              </p>
              <p>
                <span className="font-medium">Scheduled:</span>{" "}
                {shiftDetail.scheduled_start_time} -{" "}
                {shiftDetail.scheduled_end_time}
              </p>
              <p>
                <span className="font-medium">Check-in:</span>{" "}
                {shiftDetail.check_in_time || "—"}
              </p>
              <p>
                <span className="font-medium">Check-out:</span>{" "}
                {shiftDetail.check_out_time || "—"}
              </p>
              <p>
                <span className="font-medium">Work hours:</span>{" "}
                {shiftDetail.work_hours}
              </p>
              <p>
                <span className="font-medium">Overtime hours:</span>{" "}
                {shiftDetail.overtime_hours}
              </p>
              <p>
                <span className="font-medium">Late minutes:</span>{" "}
                {shiftDetail.late_minutes}
              </p>
              <p>
                <span className="font-medium">Early leave minutes:</span>{" "}
                {shiftDetail.early_leave_minutes}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {shiftDetail.status}
              </p>
              {shiftDetail.notes && (
                <p>
                  <span className="font-medium">Notes:</span>{" "}
                  {shiftDetail.notes}
                </p>
              )}
            </div>
          )}

          {shiftDetail && isEditingShift && (
            <div className="space-y-4">
              {/* Read-only info */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 pb-4 border-b border-gray-200 dark:border-gray-700">
                <p>
                  <span className="font-medium">Employee Code:</span>{" "}
                  {shiftDetail.employee_code}
                </p>
                <p>
                  <span className="font-medium">Shift Date:</span>{" "}
                  {shiftDetail.shift_date}
                </p>
                <p>
                  <span className="font-medium">Scheduled:</span>{" "}
                  {shiftDetail.scheduled_start_time} -{" "}
                  {shiftDetail.scheduled_end_time}
                </p>
              </div>

              {/* Editable fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editShiftStatus}
                  onChange={(e) => {
                    setEditShiftStatus(e.target.value);
                    if (editShiftErrors.status) {
                      setEditShiftErrors({ ...editShiftErrors, status: "" });
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                    editShiftErrors.status
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  aria-label="Shift status"
                >
                  <option value="">Select status</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="HOLIDAY">HOLIDAY</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
                {editShiftErrors.status && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {editShiftErrors.status}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={editShiftNotes}
                  onChange={(e) => setEditShiftNotes(e.target.value)}
                  rows={3}
                  placeholder="Adjusted due to forgot check-in"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Edit Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editShiftReason}
                  onChange={(e) => {
                    setEditShiftReason(e.target.value);
                    if (editShiftErrors.edit_reason) {
                      setEditShiftErrors({ ...editShiftErrors, edit_reason: "" });
                    }
                  }}
                  rows={2}
                  placeholder="Employee forgot to check-in, HR corrected based on evidence"
                  className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                    editShiftErrors.edit_reason
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                />
                {editShiftErrors.edit_reason && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {editShiftErrors.edit_reason}
                  </p>
                )}
              </div>

              {/* Submit error */}
              {editShiftErrors.submit && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {editShiftErrors.submit}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            {!isEditingShift ? (
              <>
                <button
                  onClick={handleCloseShiftDetail}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Close
                </button>
                <button
                  onClick={handleEditShift}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Edit
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isEditingShiftLoading}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveShiftEdit}
                  disabled={isEditingShiftLoading || !editShiftStatus || !editShiftReason}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
                >
                  {isEditingShiftLoading ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal View Edit History */}
      <Modal
        isOpen={isEditHistoryModalOpen}
        onClose={closeEditHistoryModal}
        className="max-w-6xl m-4"
      >
        <div className="w-full p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            📝 Attendance Edit History
          </h4>

          {/* Employee Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Employee
            </label>
            <Select
              options={employees.map((emp) => ({
                value: emp.id,
                label: `${emp.employeeCode} - ${emp.fullName}`,
              }))}
              value={
                selectedHistoryEmployeeId
                  ? employees
                      .map((emp) => ({
                        value: emp.id,
                        label: `${emp.employeeCode} - ${emp.fullName}`,
                      }))
                      .find((opt) => opt.value === selectedHistoryEmployeeId)
                  : null
              }
              onChange={(opt) => setSelectedHistoryEmployeeId(opt?.value || null)}
              placeholder="Select an employee to view history..."
              classNamePrefix="react-select"
              isClearable
            />
          </div>

          {/* History Table */}
          <div className="custom-scrollbar max-h-[500px] overflow-y-auto">
            {!editHistoryData?.data || editHistoryData.data.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>
                  {selectedHistoryEmployeeId 
                    ? "No edit history found for this employee."
                    : "Select an employee to view their edit history."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Shift ID
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Field Changed
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Old Value
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        New Value
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Edited By
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Edited At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {editHistoryData.data.map((log: any) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {new Date(log.shift_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          #{log.shift_id}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                            {log.field_changed}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {log.old_value || <span className="text-gray-400 dark:text-gray-600 italic">null</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {log.new_value || <span className="text-gray-400 dark:text-gray-600 italic">null</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs">
                          <p className="truncate" title={log.edit_reason}>
                            {log.edit_reason}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="text-xs">
                            <div className="font-medium">{log.edited_by_user_name}</div>
                            <div className="text-gray-500 dark:text-gray-500">{log.edited_by_role}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                          {new Date(log.edited_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={closeEditHistoryModal}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal chi tiết Leave/Holiday */}
      <Modal
        isOpen={!!leaveHolidayModal}
        onClose={handleCloseLeaveHolidayDetail}
        className="max-w-lg m-4"
      >
        <div className="w-full p-6">
          {leaveHolidayModal && (
            <>
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                {leaveHolidayModal.type === "holiday"
                  ? "🎉 Holiday Detail"
                  : "🏖️ Leave Detail"}
              </h4>

              {leaveHolidayModal.type === "holiday" ? (
                <div className="space-y-3 text-sm text-gray-800 dark:text-gray-100">
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4 border border-purple-200 dark:border-purple-800">
                    <p className="mb-2">
                      <span className="font-medium text-purple-900 dark:text-purple-200">
                        Holiday Name:
                      </span>{" "}
                      <span className="text-purple-700 dark:text-purple-300">
                        {leaveHolidayModal.data.holiday_name}
                      </span>
                    </p>
                    <p className="mb-2">
                      <span className="font-medium text-purple-900 dark:text-purple-200">
                        Date:
                      </span>{" "}
                      <span className="text-purple-700 dark:text-purple-300">
                        {leaveHolidayModal.data.holiday_date}
                      </span>
                    </p>
                    {leaveHolidayModal.data.description && (
                      <p>
                        <span className="font-medium text-purple-900 dark:text-purple-200">
                          Description:
                        </span>{" "}
                        <span className="text-purple-700 dark:text-purple-300">
                          {leaveHolidayModal.data.description}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-gray-800 dark:text-gray-100">
                  <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-4 border border-orange-200 dark:border-orange-800">
                    <p className="mb-2">
                      <span className="font-medium text-orange-900 dark:text-orange-200">
                        Leave Type:
                      </span>{" "}
                      <span className="text-orange-700 dark:text-orange-300">
                        {leaveHolidayModal.data.leave_type_name || "N/A"}
                      </span>
                    </p>
                    <p className="mb-2">
                      <span className="font-medium text-orange-900 dark:text-orange-200">
                        Start Date:
                      </span>{" "}
                      <span className="text-orange-700 dark:text-orange-300">
                        {leaveHolidayModal.data.start_date}
                      </span>
                    </p>
                    <p className="mb-2">
                      <span className="font-medium text-orange-900 dark:text-orange-200">
                        End Date:
                      </span>{" "}
                      <span className="text-orange-700 dark:text-orange-300">
                        {leaveHolidayModal.data.end_date}
                      </span>
                    </p>
                    <p className="mb-2">
                      <span className="font-medium text-orange-900 dark:text-orange-200">
                        Status:
                      </span>{" "}
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          leaveHolidayModal.data.status === "APPROVED"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                        }`}
                      >
                        {leaveHolidayModal.data.status}
                      </span>
                    </p>
                    {leaveHolidayModal.data.reason && (
                      <p>
                        <span className="font-medium text-orange-900 dark:text-orange-200">
                          Reason:
                        </span>{" "}
                        <span className="text-orange-700 dark:text-orange-300">
                          {leaveHolidayModal.data.reason}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleCloseLeaveHolidayDetail}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal Edit Work Schedule */}
      <Modal
        isOpen={isEditWorkScheduleModalOpen}
        onClose={closeEditWorkScheduleModal}
        className="max-w-2xl m-4"
      >
        <div className="w-full p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            ✏️ Edit Work Schedule
          </h4>

          <div className="space-y-4">
            {/* Schedule Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editScheduleName}
                onChange={(e) => {
                  setEditScheduleName(e.target.value);
                  if (editScheduleErrors.schedule_name) {
                    setEditScheduleErrors({ ...editScheduleErrors, schedule_name: "" });
                  }
                }}
                placeholder="e.g., Standard Office Hours"
                className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                  editScheduleErrors.schedule_name
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              />
              {editScheduleErrors.schedule_name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {editScheduleErrors.schedule_name}
                </p>
              )}
            </div>

            {/* Schedule Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule Type
              </label>
              <select
                value={editScheduleType}
                onChange={(e) => setEditScheduleType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                aria-label="Schedule Type"
              >
                <option value="FIXED">Fixed</option>
                <option value="FLEXIBLE">Flexible</option>
                <option value="SHIFT">Shift-based</option>
              </select>
            </div>

            {/* Work Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Work Days <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editWorkDays}
                onChange={(e) => {
                  setEditWorkDays(e.target.value);
                  if (editScheduleErrors.work_days) {
                    setEditScheduleErrors({ ...editScheduleErrors, work_days: "" });
                  }
                }}
                placeholder="e.g., 1,2,3,4,5 (1=Mon, 7=Sun)"
                className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                  editScheduleErrors.work_days
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              />
              {editScheduleErrors.work_days && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {editScheduleErrors.work_days}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter comma-separated numbers (1=Monday, 2=Tuesday, ..., 7=Sunday)
              </p>
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  ref={startTimeRef}
                  type="text"
                  value={editStartTime}
                  onChange={(e) => {
                    setEditStartTime(e.target.value);
                    if (editScheduleErrors.start_time) {
                      setEditScheduleErrors({ ...editScheduleErrors, start_time: "" });
                    }
                  }}
                  placeholder="08:00"
                  className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                    editScheduleErrors.start_time
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  readOnly
                />
                {editScheduleErrors.start_time && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {editScheduleErrors.start_time}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  ref={endTimeRef}
                  type="text"
                  value={editEndTime}
                  onChange={(e) => {
                    setEditEndTime(e.target.value);
                    if (editScheduleErrors.end_time) {
                      setEditScheduleErrors({ ...editScheduleErrors, end_time: "" });
                    }
                  }}
                  placeholder="17:00"
                  className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                    editScheduleErrors.end_time
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  readOnly
                />
                {editScheduleErrors.end_time && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {editScheduleErrors.end_time}
                  </p>
                )}
              </div>
            </div>

            {/* Break Duration, Late Tolerance, Early Leave Tolerance */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Break (min)
                </label>
                <input
                  type="number"
                  value={editBreakDuration}
                  onChange={(e) => setEditBreakDuration(e.target.value)}
                  placeholder="60"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Late (min)
                </label>
                <input
                  type="number"
                  value={editLateTolerance}
                  onChange={(e) => setEditLateTolerance(e.target.value)}
                  placeholder="15"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Early (min)
                </label>
                <input
                  type="number"
                  value={editEarlyLeaveTolerance}
                  onChange={(e) => setEditEarlyLeaveTolerance(e.target.value)}
                  placeholder="15"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={editScheduleStatus}
                onChange={(e) => setEditScheduleStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                aria-label="Schedule Status"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Submit Error */}
            {editScheduleErrors.submit && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {editScheduleErrors.submit}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={closeEditWorkScheduleModal}
              disabled={isUpdatingSchedule}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWorkSchedule}
              disabled={isUpdatingSchedule}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              {isUpdatingSchedule ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EmployeeSchedule;
