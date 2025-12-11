import React, { useEffect, useState, useRef, useMemo, FormEvent } from "react";
import { useParams, useNavigate } from "react-router";
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
import MultiSelect from "../../components/form/MultiSelect";

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

const WorkScheduleDetail = () => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
  const [updateSchedule, { isLoading: isUpdating }] =
    useUpdateWorkScheduleMutation();

  const [form, setForm] = useState<UpdateScheduleForm | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Refs for flatpickr
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

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

  // Convert work_days string to array for MultiSelect
  const selectedWorkDays = useMemo(() => {
    if (!form?.work_days || form.work_days.trim() === "") return [];
    return form.work_days.split(",").map((d) => d.trim()).filter((d) => d);
  }, [form?.work_days]);

  // Handle work days change from MultiSelect
  const handleWorkDaysChange = (selected: string[]) => {
    if (!form) return;
    const sorted = selected.sort((a, b) => parseInt(a) - parseInt(b));
    setForm((prev) =>
      prev
        ? {
            ...prev,
            work_days: sorted.join(","),
          }
        : prev
    );
    setErrors((prev) => ({ ...prev, work_days: "" }));
  };

  // Initialize flatpickr time pickers
  useEffect(() => {
    if (!isOpen || !form) return;

    const startTimePicker = startTimeRef.current
      ? flatpickr(startTimeRef.current, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i:S",
          enableSeconds: true,
          time_24hr: true,
          defaultDate: form.start_time || "08:00:00",
          onChange: (_selectedDates, dateStr) => {
            const parts = dateStr.split(":");
            const formattedTime =
              parts.length === 3
                ? `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`
                : dateStr;
            setForm((prev) =>
              prev ? { ...prev, start_time: formattedTime } : prev
            );
            setErrors((prev) => ({ ...prev, start_time: "" }));
          },
        })
      : null;

    const endTimePicker = endTimeRef.current
      ? flatpickr(endTimeRef.current, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i:S",
          enableSeconds: true,
          time_24hr: true,
          defaultDate: form.end_time || "17:00:00",
          onChange: (_selectedDates, dateStr) => {
            const parts = dateStr.split(":");
            const formattedTime =
              parts.length === 3
                ? `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`
                : dateStr;
            setForm((prev) =>
              prev ? { ...prev, end_time: formattedTime } : prev
            );
            setErrors((prev) => ({ ...prev, end_time: "" }));
          },
        })
      : null;

    if (startTimePicker && form.start_time) {
      startTimePicker.setDate(form.start_time, false);
    }
    if (endTimePicker && form.end_time) {
      endTimePicker.setDate(form.end_time, false);
    }

    return () => {
      startTimePicker?.destroy();
      endTimePicker?.destroy();
    };
  }, [isOpen, form]);

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
        early_leave_tolerance_minutes: String(
          schedule.early_leave_tolerance_minutes ?? 0
        ),
        status: schedule.status || "ACTIVE",
      });
      setErrors({});
    }
  }, [schedule, isOpen]);

  const validateForm = (form: UpdateScheduleForm): FormErrors => {
    const errors: FormErrors = {};

    if (!form.schedule_name.trim()) {
      errors.schedule_name = "Schedule name is required";
    }
    if (!form.work_days.trim()) {
      errors.work_days = "Work days are required";
    }
    if (!form.start_time.trim()) {
      errors.start_time = "Start time is required";
    }
    if (!form.end_time.trim()) {
      errors.end_time = "End time is required";
    }

    return errors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            [name]: value,
          }
    );
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
          early_leave_tolerance_minutes:
            Number(form.early_leave_tolerance_minutes) || 0,
          status: form.status,
        },
      }).unwrap();

      closeModal();
      refetch();
      setAlert({
        type: "success",
        message: "Work schedule updated successfully",
      });
    } catch (err: any) {
      console.error("Update schedule failed", err);
      const message =
        err?.data?.message || err?.error || "Update schedule failed";
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
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {schedule.schedule_type}
                    </p>
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
                      Schedule Type
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {schedule.schedule_type}
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
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        schedule.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      }`}
                    >
                      {schedule.status}
                    </span>
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
                      Break Duration
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {schedule.break_duration_minutes} minutes
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Late Tolerance
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {schedule.late_tolerance_minutes} minutes
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Early Leave Tolerance
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {schedule.early_leave_tolerance_minutes} minutes
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

                {/* Schedule Type */}
                <div>
                  <Label>Schedule Type</Label>
                  <select
                    name="schedule_type"
                    value={form.schedule_type}
                    onChange={handleChange}
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
                  <Label>
                    Work Days <span className="text-red-500">*</span>
                  </Label>
                  <div
                    className={
                      errors.work_days ? "border border-red-500 rounded-lg" : ""
                    }
                  >
                    <MultiSelect
                      label=""
                      options={workDaysOptions}
                      value={selectedWorkDays}
                      onChange={handleWorkDaysChange}
                      placeholder="Select work days"
                    />
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
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                  </div>
                </div>

                {/* Break Duration, Late Tolerance, Early Leave Tolerance */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Break (min)</Label>
                    <Input
                      type="number"
                      name="break_duration_minutes"
                      value={form.break_duration_minutes}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>

                  <div>
                    <Label>Late (min)</Label>
                    <Input
                      type="number"
                      name="late_tolerance_minutes"
                      value={form.late_tolerance_minutes}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>

                  <div>
                    <Label>Early (min)</Label>
                    <Input
                      type="number"
                      name="early_leave_tolerance_minutes"
                      value={form.early_leave_tolerance_minutes}
                      onChange={handleChange}
                      min={0}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label>Status</Label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    aria-label="Schedule Status"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
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

      {/* Alert Modal */}
      <Modal
        isOpen={!!alert}
        onClose={() => setAlert(null)}
        className="max-w-md m-4"
      >
        <div className="w-full p-6">
          {alert && (
            <>
              <Alert
                variant={alert.type}
                title={alert.type === "success" ? "Success" : "Failed"}
                message={alert.message}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAlert(null)}
                >
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
