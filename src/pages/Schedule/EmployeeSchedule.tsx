// src/pages/attendance/EmployeeSchedule.tsx
import { useMemo, useState, useEffect } from "react"; // <-- thêm useEffect
import Select from "react-select"; // <-- NEW
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import DatePicker from "../../components/form/date-picker";
import { useAppSelector } from "../../redux/hook";
import {
  useGetEmployeeShiftCalendarQuery,
  useGetEmployeeShiftByIdQuery,
  CalendarEmployee,
  useGetDepartmentEmployeeShiftsQuery,
} from "../../redux/api/shiftApiSlice";
import {
  useGetWorkSchedulesQuery,
  useAssignWorkScheduleMutation,
  useGetOvertimeRequestsQuery,
  OvertimeStatus,
} from "../../redux/api/attendanceApiSlice";
import { useGetEmployeesQuery } from "../../redux/api/employeeApiSlice";
import {
  useGetLeaveRecordsQuery,
  LeaveRecordStatus,
  useGetLeaveTypesQuery,
} from "../../redux/api/leaveApiSlice";
import { useGetHolidaysQuery } from "../../redux/api/holidayApiSlice";
import { useNavigate } from "react-router";

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
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };
  return `${start.toLocaleTimeString([], options)} - ${end.toLocaleTimeString(
    [],
    options
  )}`;
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
      return "bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-200";
    case "ABSENT":
      return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200";
    case "SCHEDULED":
    default:
      return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-200";
  }
};

const MAX_VISIBLE_SHIFTS = 2;

type CellModalState = {
  employee: EmployeeRow;
  date: Date;
  shifts: UISimpleShift[];
} | null;
type BulkScheduleRow = {
  workScheduleId: number;
  selectedEmployeeIds: number[];
};
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

  const role = user?.role;
  const managedDepartmentIds: number[] = user?.managed_department_ids ?? [];

  const isHrManager = role === "HR_MANAGER";
  const isDeptManager =
    role === "DEPARTMENT_MANAGER" && managedDepartmentIds.length > 0;
  const managedDeptId = isDeptManager ? managedDepartmentIds[0] : undefined;

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday());
  // ===== Bulk assign modal (Đăng ký ca) =====
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkEffectiveFrom, setBulkEffectiveFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default to tomorrow
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(10); // 10 employees per page

  // range ngày cho tuần hiện tại
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const from_date = formatDate(weekDays[0]);
  const to_date = formatDate(weekDays[6]);

  // ===== Call API calendar (HR xem tất cả) =====
  const {
    data: calendarRes,
    isLoading: isCalendarLoading,
    isError: isCalendarError,
  } = useGetEmployeeShiftCalendarQuery(
    {
      token: token!,
      from_date,
      to_date,
    },
    { skip: !token || !isHrManager }
  );

  // ===== Call API department shifts (Dept Manager chỉ xem phòng mình) =====
  const {
    data: deptShiftsRes,
    isLoading: isDeptLoading,
    isError: isDeptError,
  } = useGetDepartmentEmployeeShiftsQuery(
    {
      token: token!,
      departmentId: managedDeptId ?? 0,
      from_date,
      to_date,
    },
    { skip: !token || !isDeptManager || !managedDeptId }
  );

  // ===== Fetch Leave Records (APPROVED) =====
  const { data: leaveRecords } = useGetLeaveRecordsQuery(
    {
      token: token!,
      limit: 100,
      status: LeaveRecordStatus.APPROVED,
      start_date: from_date,
      end_date: to_date,
    },
    { skip: !token }
  );

  // ===== Fetch Holidays =====
  const { data: holidays } = useGetHolidaysQuery(
    {
      token: token!,
      limit: 100,
    },
    { skip: !token }
  );

  // ===== Fetch Leave Types =====
  const { data: leaveTypes } = useGetLeaveTypesQuery(
    {
      token: token!,
      limit: 100,
    },
    { skip: !token }
  );

  // ===== Fetch Overtime Requests (APPROVED) =====
  const { data: overtimeRequests } = useGetOvertimeRequestsQuery(
    {
      token: token!,
      status: OvertimeStatus.APPROVED,
      limit: 100,
      offset: 0,
    },
    { skip: !token }
  );

  // ===== Helper: Check if employee has leave/holiday on date =====
  const isEmployeeOnLeaveOrHoliday = (employeeId: number, dateStr: string) => {
    // Check holidays
    const holiday = holidays?.data?.holidays?.find((h: any) => h.holiday_date === dateStr);
    if (holiday) return true;

    // Check leave records
    const leave = leaveRecords?.data?.leave_records?.find((l: any) => {
      if (l.employee_id !== employeeId) return false;
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });

    return !!leave;
  };

  // ===== Helper: Get leave/holiday info for display =====
  const getLeaveOrHolidayInfo = (employeeId: number, dateStr: string) => {
    // Check holidays first (higher priority)
    const holiday = holidays?.data?.holidays?.find((h: any) => h.holiday_date === dateStr);
    if (holiday) {
      return {
        type: "holiday" as const,
        label: `Holiday: ${holiday.holiday_name}`,
        color:
          "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300",
        data: holiday,
      };
    }

    // Check leave records
    const leave = leaveRecords?.data?.leave_records?.find((l: any) => {
      if (l.employee_id !== employeeId) return false;
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });

    if (leave) {
      // Find leave type name
      const leaveType = leaveTypes?.data?.leave_types?.find(
        (lt: any) => lt.id === leave.leave_type_id
      );
      const leaveTypeName = leaveType?.leave_type_name || "Leave";

      return {
        type: "leave" as const,
        label: leaveTypeName,
        color:
          "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300",
        data: leave,
      };
    }

    return null;
  };

  // Employees dùng cho modal Đăng ký ca
  const { data: employeesRes, isLoading: isLoadingEmployees } =
    useGetEmployeesQuery(
      {
        token: token!,
        page: currentPage,
        limit: employeesPerPage,
        // Department manager => chỉ nhân viên trong phòng ban quản lý
        department_id:
          role === "DEPARTMENT_MANAGER" && managedDeptId
            ? managedDeptId
            : undefined,
      },
      { skip: !token }
    );

  // ===== Call API work schedules (ACTIVE + FIXED) =====
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

  // map API -> UI employee rows
  const employees: EmployeeRow[] = useMemo(() => {
    // Luôn dùng danh sách employees từ API pagination
    const list = employeesRes?.data?.employees ?? [];
    return list.map((emp: any) => ({
      id: emp.id,
      fullName: emp.full_name,
      employeeCode: emp.employee_code,
      departmentName: emp.department_name,
      avatarUrl: undefined,
    }));
  }, [employeesRes]);

  // Pagination info
  const totalEmployees = employeesRes?.data?.pagination?.total ?? 0;
  const totalPages = employeesRes?.data?.pagination?.total_pages ?? 1;
  const hasNextPage = employeesRes?.data?.pagination?.has_next ?? false;
  const hasPrevPage = employeesRes?.data?.pagination?.has_prev ?? false;

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
    const list = employeesRes?.data?.employees ?? [];
    const options = list.map((emp: any) => ({
      value: emp.id,
      label: `${emp.employee_code} - ${emp.full_name}`,
    }));
    
    // Add "Select All" option at the beginning
    return [
      { value: -1, label: "Select All" },
      ...options,
    ];
  }, [employeesRes]);

  // Reset selected employees when schedule changes
  useEffect(() => {
    setSelectedEmployeeIds([]);
  }, [selectedSchedule]);
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
      
      // Reload page after 1 second to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Bulk assign failed", err);
      setBulkSuccessMsg(null);
      setBulkErrorMsg(err?.data?.message || "Assign failed, please try again.");
    }
  };

  // map API -> list UISimpleShift
  const allShifts: UISimpleShift[] = useMemo(() => {
    const list: UISimpleShift[] = [];

    if (calendarRes && calendarRes.data?.employees) {
      calendarRes.data.employees.forEach((emp) => {
        emp.shifts.forEach((s) => {
          // ❌ Skip shift nếu employee có leave/holiday ngày đó
          if (isEmployeeOnLeaveOrHoliday(emp.employee_id, s.shift_date)) {
            return;
          }

          let uiType: ShiftType = "SHIFT";
          if (s.shift_type === "OVERTIME") uiType = "OVERTIME";

          list.push({
            id: s.shift_id,
            employeeId: emp.employee_id,
            title: s.schedule_name,
            start: combineDateTime(s.shift_date, s.start_time),
            end: combineDateTime(s.shift_date, s.end_time),
            type: uiType,
            date: s.shift_date, // 👈 dùng ngày gốc
            status: s.status || "SCHEDULED",
          });
        });
      });
    }

    // Dept manager
    if (deptShiftsRes && deptShiftsRes.data?.data) {
      deptShiftsRes.data.data.forEach((s: any) => {
        // ❌ Skip shift nếu employee có leave/holiday ngày đó
        if (isEmployeeOnLeaveOrHoliday(s.employee_id, s.shift_date)) {
          return;
        }

        list.push({
          id: s.id,
          employeeId: s.employee_id,
          title: s.schedule_name ?? "Shift",
          start: combineDateTime(s.shift_date, s.scheduled_start_time),
          end: combineDateTime(s.shift_date, s.scheduled_end_time),
          type: "SHIFT",
          date: s.shift_date, // 👈 dùng ngày gốc
          status: s.status || "SCHEDULED",
        });
      });
    }

    // Add APPROVED overtime requests
    if (overtimeRequests && overtimeRequests.data?.data) {
      overtimeRequests.data.data.forEach((ot: any) => {
        // Skip if employee has leave/holiday on that date
        if (isEmployeeOnLeaveOrHoliday(ot.employee_id, ot.overtime_date)) {
          return;
        }

        // Only show overtime within the current week range
        const otDate = new Date(ot.overtime_date);
        const weekStartDate = new Date(weekDays[0]);
        const weekEndDate = new Date(weekDays[6]);
        
        if (otDate >= weekStartDate && otDate <= weekEndDate) {
          list.push({
            id: ot.id,
            employeeId: ot.employee_id,
            title: `OT: ${ot.reason || 'Overtime'}`,
            start: combineDateTime(ot.overtime_date, ot.start_time),
            end: combineDateTime(ot.overtime_date, ot.end_time),
            type: "OVERTIME",
            date: ot.overtime_date,
            isOvertimeRequest: true,
          });
        }
      });
    }

    return list;
  }, [calendarRes, deptShiftsRes, overtimeRequests, isEmployeeOnLeaveOrHoliday, weekDays]);

  // group theo employee + day
  const shiftsByEmployeeAndDay = useMemo(() => {
    const map: Record<string, UISimpleShift[]> = {};
    for (const shift of allShifts) {
      const dayKey = shift.date; // 👈 'YYYY-MM-DD'
      const key = `${shift.employeeId}-${dayKey}`;
      if (!map[key]) map[key] = [];
      map[key].push(shift);
    }
    return map;
  }, [allShifts]);

  // ===== Week navigation & date picker =====
  const handleWeekChange = (selectedDates: Date[], dateStr: string) => {
    const picked = selectedDates?.[0];
    if (!picked && !dateStr) return;
    const d = picked ?? new Date(dateStr + "T00:00:00");
    setWeekStart(getMonday(d));
  };

  const toISODate = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate())
      .toISOString()
      .split("T")[0];

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

      // Reload page to show updated data
      closeCellModal();
      setTimeout(() => {
        window.location.reload();
      }, 500);
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

  const isShiftsLoading = isCalendarLoading || isDeptLoading;
  const isShiftsError = isCalendarError || isDeptError;

  if (!token) {
    return (
      <p className="p-4 text-center text-red-500">
        Missing access token. Please login again.
      </p>
    );
  }

  if (isShiftsLoading) {
    return (
      <div className="p-4 text-center">
        <PageMeta title="Employee Schedule" description="" />
        Loading weekly schedule...
      </div>
    );
  }

  if (isShiftsError) {
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
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="grid grid-cols-[260px_repeat(7,_minmax(120px,1fr))] border-t border-gray-200 dark:border-gray-800"
            >
              {/* info employee */}
              <div className="flex items-center gap-3 px-4 py-4 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
                <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  {emp.avatarUrl ? (
                    <img
                      src={emp.avatarUrl}
                      alt={emp.fullName}
                      className="object-cover w-full h-full"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {emp.fullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {emp.employeeCode}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {emp.departmentName}
                  </p>
                </div>
              </div>

              {/* cells của tuần */}
              {weekDays.map((day, idx) => {
                // const dayKey = day.toISOString().split("T")[0];
                const dayKey = formatDate(day);
                const key = `${emp.id}-${dayKey}`;
                const shifts = shiftsByEmployeeAndDay[key] || [];
                const visible = shifts.slice(0, MAX_VISIBLE_SHIFTS);
                const moreCount = shifts.length - visible.length;

                // Get leave/holiday info
                const leaveOrHoliday = getLeaveOrHolidayInfo(emp.id, dayKey);

                return (
                  <div
                    key={idx}
                    className={`relative border-l border-gray-200 px-2 py-2 min-h-[80px] text-xs align-top dark:border-gray-800 ${
                      leaveOrHoliday ? "bg-gray-50/50 dark:bg-gray-900/30" : ""
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
                          className={`rounded-md px-2 py-1.5 text-[11px] font-medium border ${leaveOrHoliday.color}`}
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
                        const badgeColor = shift.type === "OVERTIME" 
                          ? shiftTypeClasses[shift.type]
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
                            <div className="font-medium">
                              {formatTimeRange(shift.start, shift.end)}
                            </div>
                            <div className="truncate">{shift.title}</div>
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
              })}
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrevPage}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!hasNextPage}
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
                  {Math.min(currentPage * employeesPerPage, totalEmployees)}
                </span>{" "}
                of <span className="font-medium">{totalEmployees}</span> employees
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrevPage}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  disabled={!hasNextPage}
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
              {isLoadingEmployees ? (
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
