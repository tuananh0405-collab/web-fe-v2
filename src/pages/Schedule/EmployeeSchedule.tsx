// src/pages/Schedule/EmployeeSchedule.tsx
import { useMemo, useState } from "react";
import Select from "react-select";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import DatePicker from "../../components/form/date-picker";
import { useGetEmployeeShiftByIdQuery } from "../../redux/api/shiftApiSlice";
import {
  useGetWorkSchedulesQuery,
  useAssignWorkScheduleMutation,
} from "../../redux/api/attendanceApiSlice";
import { useNavigate } from "react-router";
import { useAppSelector } from "../../redux/hook";

// Custom hooks
import { useEmployeeScheduleData } from "./hooks/useEmployeeScheduleData";
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
  avatarUrl?: string;
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

// kết hợp "2025-11-27" + "22:00:00" -> ISO string
function normalizeTime(timeStr?: string | null): string {
  if (!timeStr) return "00:00:00";

  const parts = timeStr.split(":");

  const h = (parts[0] ?? "0").padStart(2, "0");
  const m = (parts[1] ?? "0").padStart(2, "0");
  const s = (parts[2] ?? "0").padStart(2, "0");

  return `${h}:${m}:${s}`;
}

function combineDateTime(dateStr: string, timeStr: string) {
  const t = normalizeTime(timeStr);
  const dt = new Date(`${dateStr}T${t}`);

  if (Number.isNaN(dt.getTime())) {
    const fallback = new Date(`${dateStr}T00:00:00`);
    return fallback.toISOString();
  }

  return dt.toISOString();
}

function formatTimeRange(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  
  // Format to HH:MM (24-hour format)
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
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
const getLeaveColor = () => "bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/10 dark:text-purple-200";
const getHolidayColor = () => "bg-gray-200 text-gray-800 border border-gray-400 dark:bg-gray-500/10 dark:text-gray-200";

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

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday());
  // Pagination state - độc lập với week navigation
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(10);

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

  // Week days calculation
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const from_date = formatDate(weekDays[0]);
  const to_date = formatDate(weekDays[6]);

  // ===== Fetch all employee data with custom hook =====
  const {
    employees,
    pagination,
    overtime,
    holidays,
    leaveTypes,
    isLoading,
    isError,
    refetch,
  } = useEmployeeScheduleData({
    currentPage,
    employeesPerPage,
    fromDate: from_date,
    toDate: to_date,
  });

  // ===== Leave/Holiday logic with custom hook =====
  const { isEmployeeOnLeaveOrHoliday, getLeaveOrHolidayInfo } = useLeaveHoliday({
    holidays,
    employees,
    leaveTypes,
  });

  // ===== Process shifts with custom hook =====
  const { shiftsByEmployeeAndDay } = useShiftsProcessing({
    employees,
    overtime,
    weekDays,
    isEmployeeOnLeaveOrHoliday,
  });

  // ===== Get work schedules for assignment =====
  const { data: workSchedulesRes, isLoading: isLoadingSchedules } =
    useGetWorkSchedulesQuery(
      {
        token: token!,
        status: "ACTIVE",
        schedule_type: "FIXED",
        limit: 100,
        offset: 0,
      },
      { skip: !token }
    );

  const workSchedules = workSchedulesRes?.data?.data ?? [];

  const [assignWorkSchedule, { isLoading: isAssigning }] =
    useAssignWorkScheduleMutation();

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
    return [
      { value: -1, label: "Select All" },
      ...options,
    ];
  }, [employees]);
  const openBulkModal = () => {
    // default theo tuần đang xem
    // default Start date: tomorrow
    const t = new Date();
    t.setDate(t.getDate() + 1);
    setBulkEffectiveFrom(formatDate(t));
    setBulkEffectiveTo(to_date);
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

  // ===== Modal for Leave/Holiday Detail =====
  const [leaveHolidayModal, setLeaveHolidayModal] =
    useState<LeaveHolidayModalState>(null);

  const handleOpenShiftDetail = (shiftId: number) => {
    setSelectedShiftId(shiftId);
    setIsShiftDetailOpen(true);
  };

  const handleCloseShiftDetail = () => {
    setIsShiftDetailOpen(false);
    setSelectedShiftId(null);
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

          {/* NEW: nút Đăng ký ca */}
          <button
            type="button"
            onClick={openBulkModal}
            className="inline-flex items-center justify-center rounded-full border border-brand-500 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-200 dark:hover:bg-brand-500/10"
          >
            Assign
          </button>
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
                  {emp.avatarUrl ? (
                    <img
                      src={emp.avatarUrl}
                      alt={emp.fullName}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-sm">{emp.fullName.charAt(0).toUpperCase()}</span>
                  )}
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
                        leaveOrHoliday ? "bg-purple-50/30 dark:bg-purple-950/10" : ""
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
                            leaveOrHoliday.type === "holiday" ? getHolidayColor() : getLeaveColor()
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
                              {leaveOrHoliday.type === "holiday" ? "🎉" : "🏖️"}
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
                        const badgeColor = shift.type === "OVERTIME" 
                          ? shiftTypeClasses[shiftType]
                          : getShiftStatusColor(shift.status || "SCHEDULED");
                        
                        return (
                          <div
                            key={shift.id}
                            onClick={() => {
                              // Don't open shift detail for overtime requests
                              if (!shift.isOvertimeRequest) {
                                handleOpenShiftDetail(shift.id);
                              }
                            }}
                            className={`rounded-md px-2 py-1 text-[11px] leading-tight ${!shift.isOvertimeRequest ? 'cursor-pointer hover:opacity-90' : ''} ${badgeColor}`}
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
                  // FUTURE: Show Work Schedule
                  const activeSchedule = emp.scheduleAssignments?.find((assignment: any) => {
                    const effectiveFrom = new Date(assignment.effective_from);
                    const effectiveTo = new Date(assignment.effective_to);
                    const currentDay = new Date(dayKey);
                    return currentDay >= effectiveFrom && currentDay <= effectiveTo;
                  });
                  
                  const schedule = activeSchedule?.work_schedule;
                  
                  return (
                    <div
                      key={idx}
                      className={`relative border-l border-gray-200 px-2 py-2 min-h-[80px] text-xs align-top dark:border-gray-800 ${
                        leaveOrHoliday ? "bg-purple-50/30 dark:bg-purple-950/10" : "bg-blue-50/20 dark:bg-blue-950/5"
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
                              leaveOrHoliday.type === "holiday" ? getHolidayColor() : getLeaveColor()
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
                                {leaveOrHoliday.type === "holiday" ? "🎉" : "🏖️"}
                                <span>{leaveOrHoliday.label}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show work schedule */}
                        {schedule && !leaveOrHoliday && (
                          <div className="rounded-md bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-300 dark:border-blue-800 px-2 py-1.5 text-[11px]">
                            <div className="font-semibold text-blue-900 dark:text-blue-200 truncate" title={schedule.schedule_name}>
                              {schedule.schedule_name}
                            </div>
                            <div className="text-blue-700 dark:text-blue-300 font-medium">
                              {schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)}
                            </div>
                          </div>
                        )}

                        {!schedule && !leaveOrHoliday && (
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

        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!pagination.hasNext}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * employeesPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * employeesPerPage, pagination.total)}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span> employees
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                      page === currentPage
                        ? "z-10 border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-200"
                        : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
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
                Select employees for <span className="font-medium">{selectedSchedule.label}</span>
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
                    const selected = (opts as { value: number; label: string }[]) || [];
                    
                    // Check if "Select All" was clicked
                    const hasSelectAll = selected.some(opt => opt.value === -1);
                    const previouslyHadSelectAll = selectedEmployeeIds.includes(-1);
                    
                    let ids: number[];
                    
                    if (hasSelectAll && !previouslyHadSelectAll) {
                      // Select All was just clicked - select all employees
                      ids = employeeOptions
                        .filter(opt => opt.value !== -1)
                        .map(opt => opt.value);
                    } else if (!hasSelectAll && previouslyHadSelectAll) {
                      // Select All was deselected - clear all
                      ids = [];
                    } else if (hasSelectAll) {
                      // Select All is already selected, user clicked individual item
                      // Remove Select All and keep only the clicked items
                      ids = selected
                        .filter(opt => opt.value !== -1)
                        .map(opt => opt.value);
                    } else {
                      // Normal selection without Select All
                      ids = selected.map(opt => opt.value);
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

                {isLoadingSchedules ? (
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

          {shiftDetail && (
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

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleCloseShiftDetail}
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
    </>
  );
};

export default EmployeeSchedule;
