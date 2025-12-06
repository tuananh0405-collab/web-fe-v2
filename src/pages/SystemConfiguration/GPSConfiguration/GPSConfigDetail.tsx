import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useAppSelector } from "../../../redux/hook";
import {
  useGetGPSConfigByIdQuery,
  useUpdateGPSConfigMutation,
  useToggleGPSConfigStatusMutation,
} from "../../../redux/api/gpsConfigApiSlice";
import Label from "../../../components/form/Label";
import useGoBack from "../../../hooks/useGoBack";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Input from "../../../components/form/input/InputField";

type GPSConfigForm = {
  config_name: string;
  description: string;
  shift_type: "REGULAR" | "OVERTIME" | "ALL";
  check_strategy: "DURATION_BASED" | "FIXED_COUNT";
  check_interval_hours: string;
  min_checks_per_shift: string;
  max_checks_per_shift: string;
  enable_random_timing: string;
  random_offset_minutes: string;
  min_shift_duration_hours: string;
  default_checks_count: string;
  priority: string;
  is_active: string;
  is_default: string;
};

type FormErrors = Partial<Record<keyof GPSConfigForm, string>>;

const GPSConfigDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isOpen, openModal, closeModal } = useModal();
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );
  const goBack = useGoBack();

  const { data, isLoading, error } = useGetGPSConfigByIdQuery(
    { token: token!, id: Number(id) },
    { skip: !token || !id }
  );

  const config = data?.data;

  const [form, setForm] = useState<GPSConfigForm | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (config) {
      setForm({
        config_name: config.config_name,
        description: config.description || "",
        shift_type: config.shift_type,
        check_strategy: config.check_strategy,
        check_interval_hours: config.check_interval_hours.toString(),
        min_checks_per_shift: config.min_checks_per_shift.toString(),
        max_checks_per_shift: config.max_checks_per_shift.toString(),
        enable_random_timing: config.enable_random_timing ? "true" : "false",
        random_offset_minutes: config.random_offset_minutes.toString(),
        min_shift_duration_hours: config.min_shift_duration_hours.toString(),
        default_checks_count: config.default_checks_count.toString(),
        priority: config.priority.toString(),
        is_active: config.is_active ? "true" : "false",
        is_default: config.is_default ? "true" : "false",
      });
    }
  }, [config]);

  const [updateConfig, { isLoading: isUpdating }] = useUpdateGPSConfigMutation();
  const [toggleStatus] = useToggleGPSConfigStatusMutation();

  const validateForm = (values: GPSConfigForm): FormErrors => {
    const newErrors: FormErrors = {};

    if (!values.config_name.trim()) {
      newErrors.config_name = "Configuration name is required";
    }

    const interval = Number(values.check_interval_hours);
    if (isNaN(interval) || interval <= 0) {
      newErrors.check_interval_hours = "Check interval must be greater than 0";
    }

    const minChecks = Number(values.min_checks_per_shift);
    const maxChecks = Number(values.max_checks_per_shift);
    if (isNaN(minChecks) || minChecks < 1) {
      newErrors.min_checks_per_shift = "Min checks must be at least 1";
    }
    if (isNaN(maxChecks) || maxChecks < minChecks) {
      newErrors.max_checks_per_shift = "Max checks must be >= min checks";
    }

    const priority = Number(values.priority);
    if (isNaN(priority) || priority < 1 || priority > 100) {
      newErrors.priority = "Priority must be between 1 and 100";
    }

    return newErrors;
  };

  if (isLoading || !form) return <div>Loading…</div>;
  if (error || !config) return <div>Error loading GPS configuration</div>;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof GPSConfigForm;

    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [fieldName]: value,
      };
    });

    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !id || !form) return;

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await updateConfig({
        token,
        id: Number(id),
        data: {
          config_name: form.config_name.trim(),
          description: form.description.trim() || undefined,
          shift_type: form.shift_type,
          check_strategy: form.check_strategy,
          check_interval_hours: Number(form.check_interval_hours),
          min_checks_per_shift: Number(form.min_checks_per_shift),
          max_checks_per_shift: Number(form.max_checks_per_shift),
          enable_random_timing: form.enable_random_timing === "true",
          random_offset_minutes: Number(form.random_offset_minutes),
          min_shift_duration_hours: Number(form.min_shift_duration_hours),
          default_checks_count: Number(form.default_checks_count),
          priority: Number(form.priority),
        },
      }).unwrap();

      setErrors({});
      closeModal();
    } catch (err) {
      console.error("Update GPS config failed", err);
    }
  };

  const handleToggleStatus = async () => {
    if (!token || !id) return;
    try {
      await toggleStatus({ token, id: Number(id) }).unwrap();
    } catch (err) {
      console.error("Toggle status failed", err);
    }
  };

  const formatShiftType = (type: string) => {
    return type.replace(/_/g, " ");
  };

  const formatStrategy = (strategy: string) => {
    return strategy.replace(/_/g, " ");
  };

  return (
    <>
      <PageMeta title={`GPS Config: ${config?.config_name || "Detail"}`} description="" />

      <PageBreadcrumb
        pageTitle={config.config_name}
        items={[
          { label: "GPS Configuration", to: "/gps-config" },
          { label: config.config_name },
        ]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          GPS Configuration Detail
        </h3>

        <div className="space-y-6">
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="mb-6">
                  <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                    {config.config_name}
                  </h4>
                  {config.is_default && (
                    <span className="inline-block mt-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Default Configuration
                    </span>
                  )}
                  {config.description && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {config.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Basic Configuration */}
                  <div className="space-y-4">
                    <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                      Basic Configuration
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Shift Type
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {formatShiftType(config.shift_type)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Check Strategy
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {formatStrategy(config.check_strategy)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Check Interval
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {config.check_interval_hours} hours
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Status
                        </p>
                        <button
                          onClick={handleToggleStatus}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            config.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {config.is_active ? "Active" : "Inactive"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Check Settings */}
                  <div className="space-y-4">
                    <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                      Check Settings
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Checks per Shift
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          Min: {config.min_checks_per_shift}, Max: {config.max_checks_per_shift}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Default Checks Count
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {config.default_checks_count}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Min Shift Duration
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {config.min_shift_duration_hours} hours
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Priority
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {config.priority}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Random Timing Settings */}
                  <div className="space-y-4 md:col-span-2">
                    <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                      Random Timing
                    </h5>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Enable Random Timing
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            config.enable_random_timing
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {config.enable_random_timing ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      {config.enable_random_timing && (
                        <div>
                          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                            Random Offset
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            ±{config.random_offset_minutes} minutes
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={openModal}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
              >
                Edit
              </button>
            </div>

            {/* MODAL EDIT */}
            <Modal
              isOpen={isOpen}
              onClose={closeModal}
              className="max-w-[900px] m-4"
            >
              <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                  <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Edit GPS Configuration
                  </h4>
                  <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                    Update GPS configuration settings below.
                  </p>
                </div>

                <form className="flex flex-col" onSubmit={handleSave}>
                  <div className="custom-scrollbar h-[500px] overflow-y-auto px-2 pb-3">
                    {/* Basic Configuration */}
                    <div className="mt-4">
                      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                        Basic Configuration
                      </h5>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                        <div className="col-span-2 lg:col-span-1">
                          <Label>Configuration Name *</Label>
                          <Input
                            type="text"
                            name="config_name"
                            value={form.config_name}
                            onChange={handleChange}
                            placeholder="Default Regular Shift"
                            error={!!errors.config_name}
                            hint={errors.config_name}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Priority *</Label>
                          <Input
                            type="number"
                            name="priority"
                            value={form.priority}
                            onChange={handleChange}
                            min="1"
                            max="100"
                            error={!!errors.priority}
                            hint={errors.priority}
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Description</Label>
                          <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
                            placeholder="Describe this configuration..."
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Shift Type *</Label>
                          <select
                            name="shift_type"
                            value={form.shift_type}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
                          >
                            <option value="REGULAR">Regular</option>
                            <option value="OVERTIME">Overtime</option>
                            <option value="ALL">All</option>
                          </select>
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Check Strategy *</Label>
                          <select
                            name="check_strategy"
                            value={form.check_strategy}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
                          >
                            <option value="DURATION_BASED">Duration Based</option>
                            <option value="FIXED_COUNT">Fixed Count</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Check Settings */}
                    <div className="mt-6">
                      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                        Check Settings
                      </h5>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                        <div>
                          <Label>Check Interval (hours) *</Label>
                          <Input
                            type="number"
                            name="check_interval_hours"
                            value={form.check_interval_hours}
                            onChange={handleChange}
                            step="0.5"
                            min="0.5"
                            error={!!errors.check_interval_hours}
                            hint={errors.check_interval_hours}
                          />
                        </div>

                        <div>
                          <Label>Min Shift Duration (hours) *</Label>
                          <Input
                            type="number"
                            name="min_shift_duration_hours"
                            value={form.min_shift_duration_hours}
                            onChange={handleChange}
                            step="0.5"
                            min="1"
                          />
                        </div>

                        <div>
                          <Label>Min Checks per Shift *</Label>
                          <Input
                            type="number"
                            name="min_checks_per_shift"
                            value={form.min_checks_per_shift}
                            onChange={handleChange}
                            min="1"
                            error={!!errors.min_checks_per_shift}
                            hint={errors.min_checks_per_shift}
                          />
                        </div>

                        <div>
                          <Label>Max Checks per Shift *</Label>
                          <Input
                            type="number"
                            name="max_checks_per_shift"
                            value={form.max_checks_per_shift}
                            onChange={handleChange}
                            min="1"
                            error={!!errors.max_checks_per_shift}
                            hint={errors.max_checks_per_shift}
                          />
                        </div>

                        <div>
                          <Label>Default Checks Count *</Label>
                          <Input
                            type="number"
                            name="default_checks_count"
                            value={form.default_checks_count}
                            onChange={handleChange}
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Random Timing */}
                    <div className="mt-6">
                      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                        Random Timing Settings
                      </h5>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                        <div>
                          <Label>Enable Random Timing</Label>
                          <select
                            name="enable_random_timing"
                            value={form.enable_random_timing}
                            onChange={handleChange}
                            className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        </div>

                        {form.enable_random_timing === "true" && (
                          <div>
                            <Label>Random Offset (minutes)</Label>
                            <Input
                              type="number"
                              name="random_offset_minutes"
                              value={form.random_offset_minutes}
                              onChange={handleChange}
                              min="0"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="mt-6 flex items-center justify-end gap-4 border-t border-gray-200 px-2 pt-6 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="rounded-full bg-brand-500 px-6 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
                    >
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </>
  );
};

export default GPSConfigDetail;
