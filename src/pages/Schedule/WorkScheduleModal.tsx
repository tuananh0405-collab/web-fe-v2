// src/pages/work-schedule/WorkScheduleModal.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  FormEvent,
  ChangeEvent,
} from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

import { useAppSelector } from "../../redux/hook";
import {
  useGetWorkScheduleByIdQuery,
  useUpdateWorkScheduleMutation,
  useCreateWorkScheduleMutation,
} from "../../redux/api/attendanceApiSlice";
import { Clock, LogIn, LogOut } from "lucide-react";

const ruleGroups = {
  checkout: [
    { key: "Early check-out", value: "Up to 30 minutes", icon: LogOut },
    { key: "Late check-out", value: "Up to 1 hour", icon: LogOut },
  ],
  checkin: [
    { key: "Early check-in", value: "Up to 1 hour", icon: LogIn },
    { key: "Late check-in", value: "Up to 1 hour", icon: LogIn },
  ],
};
interface WorkScheduleModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  scheduleId: number | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

type WorkScheduleForm = {
  schedule_name: string;
  schedule_type: string;
  work_days: string; // "1,2,3,4,5"
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  break_duration_minutes: string;
  late_tolerance_minutes: string; // < 60
  early_leave_tolerance_minutes: string; // < 60
  status: string;
};

const emptyForm: WorkScheduleForm = {
  schedule_name: "",
  schedule_type: "FIXED",
  work_days: "1,2,3,4,5",
  start_time: "08:00:00",
  end_time: "17:00:00",
  break_duration_minutes: "60",
  late_tolerance_minutes: "15",
  early_leave_tolerance_minutes: "15",
  status: "ACTIVE",
};

type AlertState = {
  open: boolean;
  variant: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
};

const normalizeTime = (dateStr: string) => {
  const parts = (dateStr || "").split(":").filter(Boolean);
  if (parts.length === 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
  }
  if (parts.length === 3) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(
      2,
      "0"
    )}:${parts[2].padStart(2, "0")}`;
  }
  return dateStr;
};

const timeToSeconds = (t: string) => {
  const parts = (t || "").split(":");
  if (parts.length < 2) return NaN;

  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  const ss = Number(parts[2] ?? "0");

  if ([hh, mm, ss].some((n) => Number.isNaN(n))) return NaN;
  return hh * 3600 + mm * 60 + ss;
};

const validateTimeRange = (start: string, end: string) => {
  const startSec = timeToSeconds(start);
  const endSec = timeToSeconds(end);

  if (Number.isNaN(startSec) || Number.isNaN(endSec)) {
    return { ok: false, message: "Invalid time format. Expected HH:MM:SS." };
  }

  const diff = endSec - startSec;

  if (diff <= 0) {
    return {
      ok: false,
      message: "End time must be after start time (same day).",
    };
  }
  if (diff <= 3 * 3600) {
    return { ok: false, message: "End time - Start time must be > 3 hours." };
  }

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return { ok: true, message: `Work duration: ${h}h ${m}m (valid).` };
};

const validateLate = (lateMin: number) => {
  if (lateMin < 0)
    return { ok: false, message: "Late tolerance cannot be negative." };
  if (lateMin >= 60)
    return { ok: false, message: "Late tolerance must be < 60 minutes." };
  return { ok: true, message: "Late tolerance is valid (< 60 minutes)." };
};

const validateEarly = (earlyMin: number) => {
  if (earlyMin < 0)
    return { ok: false, message: "Early leave tolerance cannot be negative." };
  if (earlyMin >= 60)
    return {
      ok: false,
      message: "Early leave tolerance must be < 60 minutes.",
    };
  return {
    ok: true,
    message: "Early leave tolerance is valid (< 60 minutes).",
  };
};

const WorkScheduleModal = ({
  isOpen,
  mode,
  scheduleId,
  onClose,
  onSuccess,
  onError,
}: WorkScheduleModalProps) => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const isEdit = mode === "edit" && scheduleId !== null;

  const {
    data: detailData,
    isFetching: isLoadingDetail,
    refetch: refetchDetail,
    isUninitialized,
  } = useGetWorkScheduleByIdQuery(
    { token: token!, id: scheduleId! },
    { skip: !token || !isEdit }
  );

  const [updateSchedule, { isLoading: isUpdating }] =
    useUpdateWorkScheduleMutation();
  const [createSchedule, { isLoading: isCreating }] =
    useCreateWorkScheduleMutation();

  const [form, setForm] = useState<WorkScheduleForm>(emptyForm);

  // Alert state
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    variant: "info",
    title: "",
    message: "",
  });

  const alertTimerRef = useRef<number | null>(null);
  const showAlert = (
    variant: AlertState["variant"],
    title: string,
    message: string
  ) => {
    if (alertTimerRef.current) window.clearTimeout(alertTimerRef.current);

    setAlertState({ open: true, variant, title, message });

    // auto hide
    alertTimerRef.current = window.setTimeout(() => {
      setAlertState((prev) => ({ ...prev, open: false }));
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) window.clearTimeout(alertTimerRef.current);
    };
  }, []);

  // Track last user action to avoid alert firing on initial load/bind data
  const lastActionRef = useRef<null | "time" | "work_days" | "late" | "early">(
    null
  );

  // Refs for flatpickr
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const startFpRef = useRef<any>(null);
  const endFpRef = useRef<any>(null);

  // Work days options (Monday = 1, Sunday = 7)
  const workDaysOptions = [
    { value: "1", text: "Thứ 2 (Monday)" },
    { value: "2", text: "Thứ 3 (Tuesday)" },
    { value: "3", text: "Thứ 4 (Wednesday)" },
    { value: "4", text: "Thứ 5 (Thursday)" },
    { value: "5", text: "Thứ 6 (Friday)" },
    { value: "6", text: "Thứ 7 (Saturday)" },
    { value: "7", text: "Chủ nhật (Sunday)" },
  ];

  const selectedWorkDays = useMemo(() => {
    if (!form.work_days || form.work_days.trim() === "") return [];
    return form.work_days
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
  }, [form.work_days]);

  // Open modal: load data
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && !isUninitialized) {
      refetchDetail();
    } else if (!isEdit) {
      setForm(emptyForm);
      setAlertState((prev) => ({ ...prev, open: false }));
      lastActionRef.current = null;
    }
  }, [isOpen, isEdit, isUninitialized, refetchDetail]);

  // Bind API data -> form
  useEffect(() => {
    if (!detailData?.data || !isEdit) return;

    const ws = detailData.data;
    setForm({
      schedule_name: ws.schedule_name || "",
      schedule_type: ws.schedule_type || "FIXED",
      work_days: ws.work_days || "",
      start_time: ws.start_time || "",
      end_time: ws.end_time || "",
      break_duration_minutes: String(ws.break_duration_minutes ?? 0),
      late_tolerance_minutes: String(ws.late_tolerance_minutes ?? 0),
      early_leave_tolerance_minutes: String(
        ws.early_leave_tolerance_minutes ?? 0
      ),
      status: ws.status || "ACTIVE",
    });

    // IMPORTANT: do not fire user-action alerts on bind
    lastActionRef.current = null;
    setAlertState((prev) => ({ ...prev, open: false }));
  }, [detailData, isEdit]);

  // Initialize flatpickr once per open
  useEffect(() => {
    if (!isOpen) return;

    if (startTimeRef.current && !startFpRef.current) {
      startFpRef.current = flatpickr(startTimeRef.current, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i:S",
        enableSeconds: true,
        time_24hr: true,
        defaultDate: form.start_time || "08:00:00",
        onChange: (_selectedDates, dateStr) => {
          lastActionRef.current = "time";
          const formattedTime = normalizeTime(dateStr);
          setForm((prev) => ({ ...prev, start_time: formattedTime }));
        },
      });
    }

    if (endTimeRef.current && !endFpRef.current) {
      endFpRef.current = flatpickr(endTimeRef.current, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i:S",
        enableSeconds: true,
        time_24hr: true,
        defaultDate: form.end_time || "17:00:00",
        onChange: (_selectedDates, dateStr) => {
          lastActionRef.current = "time";
          const formattedTime = normalizeTime(dateStr);
          setForm((prev) => ({ ...prev, end_time: formattedTime }));
        },
      });
    }

    return () => {
      startFpRef.current?.destroy?.();
      endFpRef.current?.destroy?.();
      startFpRef.current = null;
      endFpRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sync flatpickr when form changes (e.g., after API bind)
  useEffect(() => {
    if (!isOpen) return;
    if (startFpRef.current && form.start_time) {
      startFpRef.current.setDate(form.start_time, false);
    }
  }, [isOpen, form.start_time]);

  useEffect(() => {
    if (!isOpen) return;
    if (endFpRef.current && form.end_time) {
      endFpRef.current.setDate(form.end_time, false);
    }
  }, [isOpen, form.end_time]);

  // ALERT: validate time after user changes start/end
  useEffect(() => {
    if (!isOpen) return;
    if (lastActionRef.current !== "time") return;

    const v = validateTimeRange(form.start_time, form.end_time);
    if (v.ok) showAlert("success", "Valid time", v.message);
    else showAlert("error", "Invalid time", v.message);

    lastActionRef.current = null;
  }, [isOpen, form.start_time, form.end_time]);

  // ALERT: validate late after user changes late
  useEffect(() => {
    if (!isOpen) return;
    if (lastActionRef.current !== "late") return;

    const late = Number(form.late_tolerance_minutes) || 0;
    const v = validateLate(late);
    if (v.ok) showAlert("success", "Valid", v.message);
    else showAlert("error", "Invalid", v.message);

    lastActionRef.current = null;
  }, [isOpen, form.late_tolerance_minutes]);

  // ALERT: validate early after user changes early
  useEffect(() => {
    if (!isOpen) return;
    if (lastActionRef.current !== "early") return;

    const early = Number(form.early_leave_tolerance_minutes) || 0;
    const v = validateEarly(early);
    if (v.ok) showAlert("success", "Valid", v.message);
    else showAlert("error", "Invalid", v.message);

    lastActionRef.current = null;
  }, [isOpen, form.early_leave_tolerance_minutes]);

  // ALERT: work days updated after user toggles checkbox
  useEffect(() => {
    if (!isOpen) return;
    if (lastActionRef.current !== "work_days") return;

    const selectedTexts = workDaysOptions
      .filter((d) =>
        (form.work_days || "")
          .split(",")
          .map((x) => x.trim())
          .includes(d.value)
      )
      .map((d) => d.text);

    showAlert(
      "info",
      "Work days updated",
      selectedTexts.length ? selectedTexts.join(", ") : "No days selected."
    );

    lastActionRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, form.work_days]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "late_tolerance_minutes") lastActionRef.current = "late";
    if (name === "early_leave_tolerance_minutes")
      lastActionRef.current = "early";

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleWorkDay = (dayValue: string) => {
    lastActionRef.current = "work_days";

    setForm((prev) => {
      const current = prev.work_days
        ? prev.work_days
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : [];

      const nextArr = current.includes(dayValue)
        ? current.filter((d) => d !== dayValue)
        : [...current, dayValue];

      nextArr.sort((a, b) => parseInt(a) - parseInt(b));

      return { ...prev, work_days: nextArr.join(",") };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Final validation before submit
    const timeCheck = validateTimeRange(form.start_time, form.end_time);
    if (!timeCheck.ok) {
      showAlert("error", "Cannot submit", timeCheck.message);
      onError(timeCheck.message);
      return;
    }

    const late = Number(form.late_tolerance_minutes) || 0;
    const early = Number(form.early_leave_tolerance_minutes) || 0;

    const lateCheck = validateLate(late);
    if (!lateCheck.ok) {
      showAlert("error", "Cannot submit", lateCheck.message);
      onError(lateCheck.message);
      return;
    }

    const earlyCheck = validateEarly(early);
    if (!earlyCheck.ok) {
      showAlert("error", "Cannot submit", earlyCheck.message);
      onError(earlyCheck.message);
      return;
    }

    const payloadCommon = {
      schedule_name: form.schedule_name.trim(),
      schedule_type: form.schedule_type,
      work_days: form.work_days.trim(),
      start_time: form.start_time.trim(),
      end_time: form.end_time.trim(),
      break_duration_minutes: Number(form.break_duration_minutes) || 0,
      late_tolerance_minutes: late,
      early_leave_tolerance_minutes: early,
    };

    try {
      if (isEdit && scheduleId != null) {
        await updateSchedule({
          token,
          id: scheduleId,
          body: { ...payloadCommon, status: form.status },
        }).unwrap();
        onSuccess("Work schedule updated successfully");
      } else {
        await createSchedule({ token, body: payloadCommon }).unwrap();
        onSuccess("Work schedule created successfully");
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.data?.message ||
        (isEdit
          ? "Failed to update work schedule"
          : "Failed to create work schedule");
      showAlert("error", "API Error", msg);
      onError(msg);
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setAlertState((prev) => ({ ...prev, open: false }));
    lastActionRef.current = null;
    onClose();
  };

  const title =
    mode === "create"
      ? "Create Work Schedule"
      : `Work Schedule Detail${scheduleId ? ` #${scheduleId}` : ""}`;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[640px] m-4">
      <div className="no-scrollbar relative w-full max-w-[640px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-9">
        <div className="px-2 pr-10">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {mode === "create"
              ? "Define a new work schedule for employees."
              : "View and update this work schedule. Deactivation is done from the list."}
          </p>
        </div>

        {/* ALERT UI */}
        {alertState.open && (
          <div className="px-2 pb-4">
            <Alert
              variant={alertState.variant}
              title={alertState.title}
              message={alertState.message}
              showLink={false}
            />
          </div>
        )}

        {isEdit && isLoadingDetail ? (
          <p className="px-2 pb-4 text-sm text-gray-500 dark:text-gray-400">
            Loading schedule detail...
          </p>
        ) : (
          <form className="flex flex-col" onSubmit={handleSubmit}>
            <div className="custom-scrollbar max-h-[430px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2">
                  <Label>Name</Label>
                  <Input
                    name="schedule_name"
                    value={form.schedule_name}
                    onChange={handleChange}
                    placeholder="Standard Office Hours"
                  />
                </div>

                {/* Work Days - 7 checkboxes */}
                <div className="col-span-2">
                  <Label>Work Days</Label>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {workDaysOptions.map((day) => {
                      const checked = selectedWorkDays.includes(day.value);

                      return (
                        <label
                          key={day.value}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50
                                     dark:border-gray-700 dark:hover:bg-white/[0.03]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleWorkDay(day.value)}
                            className="h-4 w-4"
                          />
                          <span className="text-gray-700 dark:text-gray-200">
                            {day.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select one or more days
                  </p>
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Start Time</Label>
                  <input
                    ref={startTimeRef}
                    type="text"
                    name="start_time"
                    value={form.start_time}
                    placeholder="08:00:00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    readOnly
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>End Time</Label>
                  <input
                    ref={endTimeRef}
                    type="text"
                    name="end_time"
                    value={form.end_time}
                    placeholder="17:00:00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    readOnly
                  />
                </div>

                 <div className="col-span-2 lg:col-span-1">
                  <Label>Early check-in (minutes)</Label>
                  <Input
                    type="number"
                    name="late_tolerance_minutes"
                    value="30"
                    onChange={handleChange}
                    min={0}
                    disabled
                  />
                </div>
                 <div className="col-span-2 lg:col-span-1">
                  <Label>Late check-in (minutes)</Label>
                  <Input
                    type="number"
                    name="late_tolerance_minutes"
                    value="30"
                    onChange={handleChange}
                    min={0}
                    disabled
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Early check-out (minutes)</Label>
                  <Input
                    type="number"
                    name="late_tolerance_minutes"
                    value="30"
                    onChange={handleChange}
                    min={0}
                    disabled
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Late check-out (minutes)</Label>
                  <Input
                    type="number"
                    name="early_leave_tolerance_minutes"
                    value="60"
                    onChange={handleChange}
                    min={0}
                    disabled
                  />
                  {/* <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Must be &lt; 60
                  </p> */}
                </div>

                {isEdit && (
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Status</Label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      aria-label="Schedule Status"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                Cancel
              </button>

              <Button size="sm" disabled={isUpdating || isCreating}>
                {isEdit
                  ? isUpdating
                    ? "Updating..."
                    : "Update Schedule"
                  : isCreating
                  ? "Creating..."
                  : "Create Schedule"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default WorkScheduleModal;
