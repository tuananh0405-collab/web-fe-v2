// src/pages/attendance/EmployeeSchedule.tsx
import { useMemo, useState } from "react";
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
} from "../../redux/api/attendanceApiSlice";

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
    "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200",
  OVERTIME:
    "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-200",
  ABSENT:
    "bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-500/10 dark:text-pink-200",
  MEETING:
    "bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-200",
};

const MAX_VISIBLE_SHIFTS = 2;

type CellModalState = {
  employee: EmployeeRow;
  date: Date;
  shifts: UISimpleShift[];
} | null;

/* =======================
 * Component
 * ======================= */

const EmployeeSchedule = () => {
   const authState = useAppSelector((state) => state.auth.userState?.data);
  const token = authState?.access_token;
  const user = authState?.user;

  const role = user?.role;
  const managedDepartmentIds: number[] = user?.managed_department_ids ?? [];

  const isHrManager = role === "HR_MANAGER";
  const isDeptManager = role === "DEPARTMENT_MANAGER" && managedDepartmentIds.length > 0;
  const managedDeptId = isDeptManager ? managedDepartmentIds[0] : undefined;

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday());

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


  // ===== Call API work schedules (ACTIVE + FIXED) =====
  const {
    data: workSchedulesRes,
    isLoading: isLoadingSchedules,
  } = useGetWorkSchedulesQuery(
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
    // HR_MANAGER: dùng calendarRes
    if (calendarRes && calendarRes.data?.employees) {
      return calendarRes.data.employees.map((emp: CalendarEmployee) => ({
        id: emp.employee_id,
        fullName: emp.full_name,
        employeeCode: emp.employee_code,
        departmentName: emp.department_name,
        avatarUrl: undefined,
      }));
    }

    // DEPARTMENT_MANAGER: group từ deptShiftsRes
    if (deptShiftsRes && deptShiftsRes.data?.data) {
      const map = new Map<number, EmployeeRow>();

      deptShiftsRes.data.data.forEach((s: any) => {
        if (!map.has(s.employee_id)) {
          map.set(s.employee_id, {
            id: s.employee_id,
            fullName: s.full_name ?? s.employee_code, // fallback
            employeeCode: s.employee_code,
            departmentName: s.department_name ?? "",
            avatarUrl: undefined,
          });
        }
      });

      return Array.from(map.values());
    }

    return [];
  }, [calendarRes, deptShiftsRes]);


  // map API -> list UISimpleShift
   const allShifts: UISimpleShift[] = useMemo(() => {
    const list: UISimpleShift[] = [];

    // HR_MANAGER: từ calendarRes
    if (calendarRes && calendarRes.data?.employees) {
      calendarRes.data.employees.forEach((emp) => {
        emp.shifts.forEach((s) => {
          let uiType: ShiftType = "SHIFT";
          if (s.shift_type === "OVERTIME") uiType = "OVERTIME";

          list.push({
            id: s.shift_id,
            employeeId: emp.employee_id,
            title: s.schedule_name,
            start: combineDateTime(s.shift_date, s.start_time),
            end: combineDateTime(s.shift_date, s.end_time),
            type: uiType,
          });
        });
      });
      return list;
    }

    // DEPARTMENT_MANAGER: từ deptShiftsRes (flat list)
    if (deptShiftsRes && deptShiftsRes.data?.data) {
      deptShiftsRes.data.data.forEach((s: any) => {
        list.push({
          id: s.id,
          employeeId: s.employee_id,
          title: s.schedule_name ?? "Shift", // fallback
          start: combineDateTime(s.shift_date, s.scheduled_start_time),
          end: combineDateTime(s.shift_date, s.scheduled_end_time),
          type: "SHIFT",
        });
      });
    }

    return list;
  }, [calendarRes, deptShiftsRes]);


  // group theo employee + day
  const shiftsByEmployeeAndDay = useMemo(() => {
    const map: Record<string, UISimpleShift[]> = {};
    for (const shift of allShifts) {
      const dayKey = new Date(shift.start).toISOString().split("T")[0];
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

      // TODO: nếu cần cập nhật lại calendar, có thể refetch query ở đây
      closeCellModal();
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

  const handleOpenShiftDetail = (shiftId: number) => {
    setSelectedShiftId(shiftId);
    setIsShiftDetailOpen(true);
  };

  const handleCloseShiftDetail = () => {
    setIsShiftDetailOpen(false);
    setSelectedShiftId(null);
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

            <div className="flex items-center gap-3 mt-2">
              <div className="w-[180px]">
                <DatePicker
                  id="week-picker"
                  mode="single"
                  label={undefined}
                  defaultDate={toISODate(weekStart)}
                  placeholder="Select a date"
                  onChange={handleWeekChange}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {weekDays[0].toLocaleDateString()} -{" "}
                {weekDays[6].toLocaleDateString()}
              </span>
            </div>
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
                <div className="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
                  {day.getDate()}
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
                const dayKey = day.toISOString().split("T")[0];
                const key = `${emp.id}-${dayKey}`;
                const shifts = shiftsByEmployeeAndDay[key] || [];
                const visible = shifts.slice(0, MAX_VISIBLE_SHIFTS);
                const moreCount = shifts.length - visible.length;

                return (
                  <div
                    key={idx}
                    className="relative border-l border-gray-200 px-2 py-2 min-h-[80px] text-xs align-top dark:border-gray-800"
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
                      {visible.map((shift) => (
                        <div
                          key={shift.id}
                          onClick={() => handleOpenShiftDetail(shift.id)}
                          className={`rounded-md px-2 py-1 text-[11px] leading-tight cursor-pointer hover:opacity-90 ${
                            shiftTypeClasses[shift.type]
                          }`}
                        >
                          <div className="font-medium">
                            {formatTimeRange(shift.start, shift.end)}
                          </div>
                          <div className="truncate">{shift.title}</div>
                        </div>
                      ))}

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
      </div>

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
            <p className="text-sm text-red-500">
              Failed to load shift detail.
            </p>
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
    </>
  );
};

export default EmployeeSchedule;
