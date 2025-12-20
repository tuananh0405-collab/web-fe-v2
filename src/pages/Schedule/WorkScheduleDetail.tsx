import React, { useEffect, useState, useRef, useMemo, FormEvent } from "react";
import { useParams } from "react-router";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAppSelector } from "../../redux/hook";
import {
  useGetWorkScheduleByIdQuery,
  useUpdateWorkScheduleMutation,
} from "../../redux/api/attendanceApiSlice";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

type UpdateScheduleForm = {
  schedule_name: string;
  schedule_type: string;
  work_days: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: string;
  late_tolerance_minutes: string;
  early_leave_tolerance_minutes: string;
  status: string;
};

type FormErrors = Partial<Record<keyof UpdateScheduleForm, string>>;

const formatWorkDays = (workDays: string): string => {
  if (!workDays) return "—";
  const dayNames: Record<string, string> = {
    "1": "Mon",
    "2": "Tue",
    "3": "Wed",
    "4": "Thu",
    "5": "Fri",
    "6": "Sat",
    "7": "Sun",
  };
  return workDays
    .split(",")
    .map((d) => dayNames[d.trim()] || d)
    .join(", ");
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
  const [hh = "0", mm = "0", ss = "0"] = (t || "").split(":");
  const h = Number(hh);
  const m = Number(mm);
  const s = Number(ss);
  if ([h, m, s].some((n) => Number.isNaN(n))) return NaN;
  return h * 3600 + m * 60 + s;
};

const validateTimeRange = (start: string, end: string) => {
  const startSec = timeToSeconds(start);
  const endSec = timeToSeconds(end);

  if (Number.isNaN(startSec) || Number.isNaN(endSec)) {
    return { ok: false, message: "Invalid time format. Expected HH:MM:SS." };
  }

  const diff = endSec - startSec;
  if (diff <= 0) {
    return { ok: false, message: "End time must be after start time (same day)." };
  }
  if (diff <= 3 * 3600) {
    return { ok: false, message: "End time - Start time must be > 3 hours." };
  }

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return { ok: true, message: `Work duration: ${h}h ${m}m (valid).` };
};

const validateLate = (lateMin: number) => {
  if (Number.isNaN(lateMin)) return { ok: false, message: "Late tolerance must be a number." };
  if (lateMin < 0) return { ok: false, message: "Late tolerance cannot be negative." };
  if (lateMin >= 60) return { ok: false, message: "Late tolerance must be < 60 minutes." };
  return { ok: true, message: "Late tolerance is valid (< 60 minutes)." };
};

const validateEarly = (earlyMin: number) => {
  if (Number.isNaN(earlyMin)) return { ok: false, message: "Early tolerance must be a number." };
  if (earlyMin < 0) return { ok: false, message: "Early tolerance cannot be negative." };
  if (earlyMin >= 60) return { ok: false, message: "Early tolerance must be < 60 minutes." };
  return { ok: true, message: "Early tolerance is valid (< 60 minutes)." };
};

const WorkScheduleDetail = () => {
  const token = useAppSelector((state) => state.auth.userState?.data?.access_token);
  const { id } = useParams<{ id: string }>();

  const {
    data: scheduleData,
    isLoading,
    isError,
    refetch,
  } = useGetWorkScheduleByIdQuery(
    { token: token!, id: Number(id!) },
    { skip: !token || !id }
  );

  const schedule = scheduleData?.data;

  const { isOpen, openModal, closeModal } = useModal();
  const [updateSchedule, { isLoading: isUpdating }] = useUpdateWorkScheduleMutation();

  const [form, setForm] = useState<UpdateScheduleForm | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Save result modal (giữ như cũ)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Live alert trong Edit Modal (sau mỗi thao tác)
  const [liveAlert, setLiveAlert] = useState<{
    variant: "success" | "warning" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const liveAlertTimerRef = useRef<number | null>(null);
  const showLiveAlert = (
    variant: "success" | "warning" | "error" | "info",
    title: string,
    message: string
  ) => {
    if (liveAlertTimerRef.current) window.clearTimeout(liveAlertTimerRef.current);
    setLiveAlert({ variant, title, message });

    // auto-hide nhẹ để không spam UI
    liveAlertTimerRef.current = window.setTimeout(() => {
      setLiveAlert(null);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (liveAlertTimerRef.current) window.clearTimeout(liveAlertTimerRef.current);
    };
  }, []);

  // Refs for flatpickr
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const startPickerRef = useRef<any>(null);
  const endPickerRef = useRef<any>(null);

  // Work days options (Monday = 1, Sunday = 7)
  const workDaysOptions = [
    { value: "1", text: "Monday" },
    { value: "2", text: "Tuesday" },
    { value: "3", text: "Wednesday" },
    { value: "4", text: "Thursday" },
    { value: "5", text: "Friday" },
    { value: "6", text: "Saturday" },
    { value: "7", text: "Sunday" },
  ];

  const selectedWorkDays = useMemo(() => {
    if (!form?.work_days || form.work_days.trim() === "") return [];
    return form.work_days.split(",").map((d) => d.trim()).filter((d) => d);
  }, [form?.work_days]);

  // Flag để biết thao tác nào vừa xảy ra (để show alert đúng chỗ)
  const lastActionRef = useRef<null | "time" | "work_days" | "late" | "early">(null);

  const toggleWorkDay = (dayValue: string) => {
    if (!form) return;
    lastActionRef.current = "work_days";

    const current = form.work_days
      ? form.work_days.split(",").map((d) => d.trim()).filter(Boolean)
      : [];

    const nextArr = current.includes(dayValue)
      ? current.filter((d) => d !== dayValue)
      : [...current, dayValue];

    nextArr.sort((a, b) => parseInt(a) - parseInt(b));
    setForm({ ...form, work_days: nextArr.join(",") });

    setErrors((prev) => ({ ...prev, work_days: "" }));
  };

  // Init flatpickr (chỉ init khi mở modal + có form)
  useEffect(() => {
    if (!isOpen || !form) return;
    if (startPickerRef.current || endPickerRef.current) return;

    startPickerRef.current = startTimeRef.current
      ? flatpickr(startTimeRef.current, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i:S",
          enableSeconds: true,
          time_24hr: true,
          defaultDate: form.start_time || "08:00:00",
          onChange: (_selectedDates, dateStr) => {
            lastActionRef.current = "time";
            const formatted = normalizeTime(dateStr);
            setForm((prev) => (prev ? { ...prev, start_time: formatted } : prev));
            setErrors((prev) => ({ ...prev, start_time: "", end_time: "" }));
          },
        })
      : null;

    endPickerRef.current = endTimeRef.current
      ? flatpickr(endTimeRef.current, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i:S",
          enableSeconds: true,
          time_24hr: true,
          defaultDate: form.end_time || "17:00:00",
          onChange: (_selectedDates, dateStr) => {
            lastActionRef.current = "time";
            const formatted = normalizeTime(dateStr);
            setForm((prev) => (prev ? { ...prev, end_time: formatted } : prev));
            setErrors((prev) => ({ ...prev, start_time: "", end_time: "" }));
          },
        })
      : null;

    return () => {
      startPickerRef.current?.destroy?.();
      endPickerRef.current?.destroy?.();
      startPickerRef.current = null;
      endPickerRef.current = null;
    };
  }, [isOpen, !!form]);

  // Sync picker values khi form set lần đầu (edit) hoặc thay đổi từ API
  useEffect(() => {
    if (!isOpen || !form) return;
    if (startPickerRef.current && form.start_time) {
      startPickerRef.current.setDate(form.start_time, false);
    }
  }, [isOpen, form?.start_time]);

  useEffect(() => {
    if (!isOpen || !form) return;
    if (endPickerRef.current && form.end_time) {
      endPickerRef.current.setDate(form.end_time, false);
    }
  }, [isOpen, form?.end_time]);

  // Khi mở modal: bind form từ schedule
  useEffect(() => {
    if (schedule && isOpen) {
      setForm({
        schedule_name: schedule.schedule_name || "",
        schedule_type: schedule.schedule_type || "FIXED",
        work_days: schedule.work_days || "",
        start_time: schedule.start_time || "08:00:00",
        end_time: schedule.end_time || "17:00:00",
        break_duration_minutes: String(schedule.break_duration_minutes ?? 0),
        late_tolerance_minutes: String(schedule.late_tolerance_minutes ?? 0),
        early_leave_tolerance_minutes: String(schedule.early_leave_tolerance_minutes ?? 0),
        status: schedule.status || "ACTIVE",
      });
      setErrors({});
      setLiveAlert(null);
      lastActionRef.current = null;
    }
  }, [schedule, isOpen]);

  // Live alert: time validation sau mỗi lần user đổi start/end
  useEffect(() => {
    if (!isOpen || !form) return;
    if (lastActionRef.current !== "time") return;

    const v = validateTimeRange(form.start_time, form.end_time);
    if (v.ok) showLiveAlert("success", "Valid time", v.message);
    else showLiveAlert("error", "Invalid time", v.message);

    lastActionRef.current = null;
  }, [isOpen, form?.start_time, form?.end_time]);

  // Live alert: late validation
  useEffect(() => {
    if (!isOpen || !form) return;
    if (lastActionRef.current !== "late") return;

    const late = Number(form.late_tolerance_minutes);
    const v = validateLate(late);
    if (v.ok) showLiveAlert("success", "Valid", v.message);
    else showLiveAlert("error", "Invalid", v.message);

    lastActionRef.current = null;
  }, [isOpen, form?.late_tolerance_minutes]);

  // Live alert: early validation
  useEffect(() => {
    if (!isOpen || !form) return;
    if (lastActionRef.current !== "early") return;

    const early = Number(form.early_leave_tolerance_minutes);
    const v = validateEarly(early);
    if (v.ok) showLiveAlert("success", "Valid", v.message);
    else showLiveAlert("error", "Invalid", v.message);

    lastActionRef.current = null;
  }, [isOpen, form?.early_leave_tolerance_minutes]);

  // Live alert: work days changed
  useEffect(() => {
    if (!isOpen || !form) return;
    if (lastActionRef.current !== "work_days") return;

    const selected = (form.work_days || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const selectedText = workDaysOptions
      .filter((d) => selected.includes(d.value))
      .map((d) => d.text);

    if (selectedText.length === 0) {
      showLiveAlert("warning", "Work days updated", "No days selected.");
    } else {
      showLiveAlert("info", "Work days updated", selectedText.join(", "));
    }

    lastActionRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, form?.work_days]);

  const validateForm = (f: UpdateScheduleForm): FormErrors => {
    const e: FormErrors = {};

    if (!f.schedule_name.trim()) e.schedule_name = "Schedule name is required";
    if (!f.work_days.trim()) e.work_days = "Work days are required";
    if (!f.start_time.trim()) e.start_time = "Start time is required";
    if (!f.end_time.trim()) e.end_time = "End time is required";

    // Time rule: end - start > 3h (same day)
    if (f.start_time.trim() && f.end_time.trim()) {
      const v = validateTimeRange(f.start_time.trim(), f.end_time.trim());
      if (!v.ok) e.end_time = v.message;
    }

    // Late < 60
    const late = Number(f.late_tolerance_minutes);
    const lateCheck = validateLate(late);
    if (!lateCheck.ok) e.late_tolerance_minutes = lateCheck.message;

    // Early < 60
    const early = Number(f.early_leave_tolerance_minutes);
    const earlyCheck = validateEarly(early);
    if (!earlyCheck.ok) e.early_leave_tolerance_minutes = earlyCheck.message;

    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "late_tolerance_minutes") lastActionRef.current = "late";
    if (name === "early_leave_tolerance_minutes") lastActionRef.current = "early";

    setForm((prev) => (!prev ? prev : { ...prev, [name]: value }));

    setErrors((prev) => ({
      ...prev,
      [name as keyof UpdateScheduleForm]: "",
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !id || !schedule || !form) return;

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      const firstMsg = Object.values(validationErrors).find(
        (m): m is string => typeof m === "string" && m.trim().length > 0
      );
      if (firstMsg) showLiveAlert("error", "Invalid", firstMsg);

      return;
    }

    try {
      await updateSchedule({
        token,
        id: Number(id),
        body: {
          schedule_name: form.schedule_name.trim(),
          schedule_type: form.schedule_type,
          work_days: form.work_days.trim(),
          start_time: form.start_time.trim(),
          end_time: form.end_time.trim(),
          break_duration_minutes: Number(form.break_duration_minutes) || 0,
          late_tolerance_minutes: Number(form.late_tolerance_minutes) || 0,
          early_leave_tolerance_minutes: Number(form.early_leave_tolerance_minutes) || 0,
          status: form.status,
        },
      }).unwrap();

      closeModal();
      refetch();
      setAlert({ type: "success", message: "Work schedule updated successfully" });
    } catch (err: any) {
      console.error("Update schedule failed", err);
      const message = err?.data?.message || err?.error || "Update schedule failed";
      setAlert({ type: "error", message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading schedule...</p>
      </div>
    );
  }

  if (isError || !schedule) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to load schedule details</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title={`Work Schedule - ${schedule.schedule_name}`} description="" />
      <PageBreadcrumb
        pageTitle=""
        showTitleLeft={false}
        items={[
          { label: "Work Schedules", to: "/work-schedule" },
          { label: schedule.schedule_name },
        ]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                <div className="w-20 h-20 flex items-center justify-center overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 bg-brand-50 dark:bg-brand-900/20">
                  <svg
                    className="w-10 h-10 text-brand-600 dark:text-brand-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="order-3 xl:order-2">
                  <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                    {schedule.schedule_name}
                  </h4>
                  <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                    <span
                      className={`text-sm font-medium ${
                        schedule.status === "ACTIVE"
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {schedule.status}
                    </span>
                    
                  </div>
                </div>
                <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                  <Button size="sm" onClick={openModal}>
                    Edit Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Information Card */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="w-full">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
                  Schedule Information
                </h4>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Schedule Name
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {schedule.schedule_name}
                    </p>
                  </div>

                  

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Work Days
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatWorkDays(schedule.work_days)}
                    </p>
                  </div>

                  

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Start Time
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {schedule.start_time}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      End Time
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {schedule.end_time}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Check-in Rule
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      Early / Late up to 1 hour
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Check-out Rule
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      Early up to 30 minutes / Late up to 1 hour
                    </p>
                  </div>

                  {schedule.created_at && (
                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Created At
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {new Date(schedule.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {schedule.updated_at && (
                    <div>
                      <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                        Last Updated
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {new Date(schedule.updated_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl m-4">
        <div className="w-full p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Edit Work Schedule
          </h4>

          {/* LIVE ALERT: sau mỗi thao tác */}
          {liveAlert && (
            <div className="mb-4">
              <Alert
                variant={liveAlert.variant}
                title={liveAlert.title}
                message={liveAlert.message}
                showLink={false}
              />
            </div>
          )}

          {form && (
            <form onSubmit={handleSave}>
              <div className="space-y-4">
                {/* Schedule Name */}
                <div>
                  <Label>
                    Schedule Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="schedule_name"
                    value={form.schedule_name}
                    onChange={handleChange}
                    placeholder="Standard Office Hours"
                  />
                  {errors.schedule_name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.schedule_name}
                    </p>
                  )}
                </div>

              

                {/* Work Days - 7 checkbox */}
                <div>
                  <Label>
                    Work Days <span className="text-red-500">*</span>
                  </Label>

                  <div
                    className={`rounded-lg ${
                      errors.work_days ? "border border-red-500 p-3" : ""
                    }`}
                  >
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
                  </div>

                  {errors.work_days && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.work_days}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select one or more days
                  </p>
                </div>

                {/* Start Time & End Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <input
                      ref={startTimeRef}
                      type="text"
                      name="start_time"
                      value={form.start_time}
                      placeholder="08:00:00"
                      className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                        errors.start_time
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-700"
                      }`}
                      readOnly
                    />
                    {errors.start_time && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errors.start_time}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>
                      End Time <span className="text-red-500">*</span>
                    </Label>
                    <input
                      ref={endTimeRef}
                      type="text"
                      name="end_time"
                      value={form.end_time}
                      placeholder="17:00:00"
                      className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
                        errors.end_time
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-700"
                      }`}
                      readOnly
                    />
                    {errors.end_time && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errors.end_time}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Rule: End - Start must be &gt; 3 hours
                    </p>
                  </div>
                </div>

                {/* Break Duration, Late Tolerance, Early Leave Tolerance */}
                <div className="grid grid-cols-3 gap-4">
                  

                  

                  
                </div>

                {/* Status */}
                
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isUpdating}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <Button size="sm" type="submit" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Alert Modal (save result) */}
      <Modal isOpen={!!alert} onClose={() => setAlert(null)} className="max-w-md m-4">
        <div className="w-full p-6">
          {alert && (
            <>
              <Alert
                variant={alert.type}
                title={alert.type === "success" ? "Success" : "Failed"}
                message={alert.message}
                showLink={false}
              />
              <div className="mt-4 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setAlert(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default WorkScheduleDetail;
