// src/pages/work-schedule/WorkScheduleModal.tsx
import { useEffect, useState, FormEvent, ChangeEvent, useRef, useMemo } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import MultiSelect from "../../components/form/MultiSelect";
import { useAppSelector } from "../../redux/hook";
import {
  useGetWorkScheduleByIdQuery,
  useUpdateWorkScheduleMutation,
  useCreateWorkScheduleMutation,
} from "../../redux/api/attendanceApiSlice";

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
  work_days: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: string;
  late_tolerance_minutes: string;
  early_leave_tolerance_minutes: string;
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
    if (!form.work_days || form.work_days.trim() === "") return [];
    return form.work_days.split(",").map(d => d.trim()).filter(d => d);
  }, [form.work_days]);

  // Khi mở modal + đang edit, load data
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && !isUninitialized) {
      refetchDetail();
    } else if (!isEdit) {
      // create mode
      setForm(emptyForm);
    }
  }, [isOpen, isEdit, isUninitialized, refetchDetail]);

  // Bind data từ API → form
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
  }, [detailData, isEdit]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle work days change from MultiSelect
  const handleWorkDaysChange = (selected: string[]) => {
    // Sort by day number to maintain order (1,2,3,4,5,6,7)
    const sorted = selected.sort((a, b) => parseInt(a) - parseInt(b));
    setForm((prev) => ({
      ...prev,
      work_days: sorted.join(","),
    }));
  };

  // Initialize flatpickr time pickers
  useEffect(() => {
    if (!isOpen) return;

    const startTimePicker = startTimeRef.current
      ? flatpickr(startTimeRef.current, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i:S",
          enableSeconds: true,
          time_24hr: true,
          defaultDate: form.start_time || "08:00:00",
          onChange: (_selectedDates, dateStr) => {
            // Ensure format is always HH:MM:SS
            const parts = dateStr.split(':');
            const formattedTime = parts.length === 3 
              ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`
              : dateStr;
            setForm((prev) => ({ ...prev, start_time: formattedTime }));
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
            // Ensure format is always HH:MM:SS
            const parts = dateStr.split(':');
            const formattedTime = parts.length === 3 
              ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`
              : dateStr;
            setForm((prev) => ({ ...prev, end_time: formattedTime }));
          },
        })
      : null;

    // Update flatpickr values when form data changes
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
  }, [isOpen, form.start_time, form.end_time]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const payloadCommon = {
      schedule_name: form.schedule_name.trim(),
      schedule_type: form.schedule_type,
      work_days: form.work_days.trim(),
      start_time: form.start_time.trim(),
      end_time: form.end_time.trim(),
      break_duration_minutes: Number(form.break_duration_minutes) || 0,
      late_tolerance_minutes: Number(form.late_tolerance_minutes) || 0,
      early_leave_tolerance_minutes:
        Number(form.early_leave_tolerance_minutes) || 0,
    };

    try {
      if (isEdit && scheduleId != null) {
        await updateSchedule({
          token,
          id: scheduleId,
          body: {
            ...payloadCommon,
            status: form.status,
          },
        }).unwrap();

        onSuccess("Work schedule updated successfully");
      } else {
        await createSchedule({
          token,
          body: payloadCommon,
        }).unwrap();
        onSuccess("Work schedule created successfully");
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.data?.message ||
        (isEdit ? "Failed to update work schedule" : "Failed to create work schedule");
      onError(msg);
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
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

                {/* <div className="col-span-2 lg:col-span-1">
                  <Label>Type</Label>
                  <select
                    name="schedule_type"
                    value={form.schedule_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    aria-label="Schedule Type"
                  >
                    <option value="FIXED">FIXED</option>
                    <option value="FLEXIBLE">FLEXIBLE</option>
                  </select>
                </div> */}

                <div className="col-span-2 lg:col-span-2">
                  <Label>Work Days</Label>
                  <MultiSelect
                    label=""
                    options={workDaysOptions}
                    value={selectedWorkDays}
                    onChange={handleWorkDaysChange}
                    placeholder="Select work days"
                  />
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
                    onChange={handleChange}
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
                    onChange={handleChange}
                    placeholder="17:00:00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    readOnly
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Break Duration (minutes)</Label>
                  <Input
                    type="number"
                    name="break_duration_minutes"
                    value={form.break_duration_minutes}
                    onChange={handleChange}
                    min={0}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Late Tolerance (minutes)</Label>
                  <Input
                    type="number"
                    name="late_tolerance_minutes"
                    value={form.late_tolerance_minutes}
                    onChange={handleChange}
                    min={0}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Early Leave Tolerance (minutes)</Label>
                  <Input
                    type="number"
                    name="early_leave_tolerance_minutes"
                    value={form.early_leave_tolerance_minutes}
                    onChange={handleChange}
                    min={0}
                  />
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
