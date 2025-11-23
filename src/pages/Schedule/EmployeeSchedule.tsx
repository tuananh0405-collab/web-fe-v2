import { useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import DatePicker from "../../components/form/date-picker";

// ==== Types ====
interface Employee {
  id: number;
  fullName: string;
  employeeCode: string;
  departmentName: string;
  avatarUrl?: string;
}

type ShiftType = "SHIFT" | "OVERTIME" | "ABSENT" | "MEETING";

interface Shift {
  id: number;
  employeeId: number;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  type: ShiftType;
}

// ==== Dummy data (sau này thay bằng API) ====
const employees: Employee[] = [
  {
    id: 1,
    fullName: "Nguyễn Văn A",
    employeeCode: "EMP-001",
    departmentName: "IT Department",
    avatarUrl: "/images/user/user-13.png",
  },
  {
    id: 2,
    fullName: "Trần Thị B",
    employeeCode: "EMP-002",
    departmentName: "HR Department",
    avatarUrl: "/images/user/user-14.png",
  },
  {
    id: 3,
    fullName: "Phạm Văn C",
    employeeCode: "EMP-003",
    departmentName: "Sales Department",
    avatarUrl: "/images/user/user-15.png",
  },
];

const mockShifts: Shift[] = [
  // Nhân viên 1 – Afternoon shift thứ 2 → thứ 6
  ...[0, 1, 2, 3, 4].map((offset) => ({
    id: 100 + offset,
    employeeId: 1,
    title: "Afternoon Shift",
    start: getDateWithTime(offset, 14, 0),
    end: getDateWithTime(offset, 17, 0),
    type: "SHIFT" as ShiftType,
  })),
  // Nhân viên 2 – 1 ca afternoon + 1 overtime
  {
    id: 200,
    employeeId: 2,
    title: "Afternoon Shift",
    start: getDateWithTime(1, 14, 0),
    end: getDateWithTime(1, 17, 0),
    type: "SHIFT",
  },
  {
    id: 201,
    employeeId: 2,
    title: "Overtime",
    start: getDateWithTime(1, 17, 0),
    end: getDateWithTime(1, 21, 0),
    type: "OVERTIME",
  },
  // Nhân viên 3 – Absent thứ 4, Meeting thứ 6
  {
    id: 300,
    employeeId: 3,
    title: "Absent",
    start: getDateWithTime(2, 0, 0),
    end: getDateWithTime(2, 23, 59),
    type: "ABSENT",
  },
  {
    id: 301,
    employeeId: 3,
    title: "Design Conference",
    start: getDateWithTime(4, 9, 0),
    end: getDateWithTime(4, 17, 0),
    type: "MEETING",
  },
];

// ==== Helper: trả về ISO string cho ngày trong tuần hiện tại + offset ====
function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0 (CN) - 6 (T7)
  const diff = (day === 0 ? -6 : 1) - day; // về thứ 2
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDateWithTime(dayOffset: number, hour: number, minute: number) {
  const baseMonday = getMonday();
  const date = new Date(baseMonday);
  date.setDate(baseMonday.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
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
  employee: Employee;
  date: Date;
  shifts: Shift[];
} | null;

// ==== Component chính ====
const EmployeeSchedule = () => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday());
  const handleWeekChange = (_selectedDates: Date[], dateStr: string) => {
    if (!dateStr) return;
    const d = new Date(dateStr + "T00:00:00");
    setWeekStart(getMonday(d));
  };

  const [cellModal, setCellModal] = useState<CellModalState>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // Tính các ngày trong tuần hiện tại
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // Filter shifts thuộc tuần hiện tại
  const shiftsThisWeek = useMemo(() => {
    return mockShifts.filter((shift) => {
      const start = new Date(shift.start);
      const endOfWeek = new Date(weekStart);
      endOfWeek.setDate(weekStart.getDate() + 7);
      return start >= weekStart && start < endOfWeek;
    });
  }, [weekStart]);

  // Group shifts theo employee + day
  const shiftsByEmployeeAndDay = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const shift of shiftsThisWeek) {
      const dayKey = new Date(shift.start).toISOString().split("T")[0];
      const key = `${shift.employeeId}-${dayKey}`;
      if (!map[key]) map[key] = [];
      map[key].push(shift);
    }
    return map;
  }, [shiftsThisWeek]);

  const handlePrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });
  };
  const handleToday = () => {
    setWeekStart(getMonday(new Date()));
  };

  const handleOpenCellModal = (
    employee: Employee,
    date: Date,
    shifts: Shift[]
  ) => {
    setCellModal({ employee, date, shifts });
    openModal();
  };

  const closeCellModal = () => {
    setCellModal(null);
    closeModal();
  };

  const toISODate = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate())
      .toISOString()
      .split("T")[0];

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
      {/* DatePicker chọn ngày, mình sẽ convert thành tuần */}
      <div className="w-[180px]">
        <DatePicker
          id="week-picker"
          label={undefined}                // không cần label vì đã có "Weekly Schedule"
          mode="single"
          defaultDate={toISODate(weekStart)} // flatpickr nhận string "YYYY-MM-DD" OK
          placeholder="Select a date"
          onChange={handleWeekChange}
        />
      </div>

      {/* Range hiển thị tuần */}
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {weekDays[0].toLocaleDateString()} -{" "}
        {weekDays[6].toLocaleDateString()}
      </span>
    </div>
  </div>

  <div className="flex items-center gap-2">
    <button
      onClick={handlePrevWeek}
      className="px-3 py-1 text-sm border rounded-lg border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      Prev
    </button>
    <button
      onClick={handleToday}
      className="px-3 py-1 text-sm border rounded-lg border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      Today
    </button>
    <button
      onClick={handleNextWeek}
      className="px-3 py-1 text-sm border rounded-lg border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      Next
    </button>
  </div>
</div>


        {/* Grid: 1 cột employees + 7 cột ngày */}
        <div className="border border-gray-200 rounded-xl overflow-hidden dark:border-gray-800">
          <div className="grid grid-cols-[260px_repeat(7,_minmax(120px,1fr))] bg-gray-50 dark:bg-gray-900/40">
            {/* ô trống header trái */}
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
              {/* Cột employee info */}
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

              {/* Các ô trong tuần cho employee này */}
              {weekDays.map((day, idx) => {
                const dayKey = day.toISOString().split("T")[0];
                const key = `${emp.id}-${dayKey}`;
                const shifts = shiftsByEmployeeAndDay[key] || [];
                const visible = shifts.slice(0, MAX_VISIBLE_SHIFTS);
                const moreCount = shifts.length - visible.length;

                return (
                  <div
                    key={idx}
                    className="border-l border-gray-200 px-2 py-2 min-h-[80px] align-top text-left text-xs dark:border-gray-800"
                  >
                    {visible.map((shift) => (
                      <div
                        key={shift.id}
                        className={`mb-1 rounded-md px-2 py-1 text-[11px] leading-tight ${
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
                      <button
                        onClick={() => handleOpenCellModal(emp, day, shifts)}
                        className="mt-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        +{moreCount} more...
                      </button>
                    )}

                    {/* Nếu chưa có ca nào, cho phép click để mở modal (sau này thêm chức năng add) */}
                    {shifts.length === 0 && (
                      <button
                        onClick={() => handleOpenCellModal(emp, day, shifts)}
                        className="text-[11px] text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500"
                      >
                        …
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal xem toàn bộ ca trong 1 ô */}
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

              {cellModal.shifts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No shifts for this day.
                </p>
              ) : (
                <div className="space-y-2">
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
    </>
  );
};

export default EmployeeSchedule;
