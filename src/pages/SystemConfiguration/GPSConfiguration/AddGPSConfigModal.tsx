import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import { useAppSelector } from "../../../redux/hook";
import { useCreateGPSConfigMutation } from "../../../redux/api/gpsConfigApiSlice";
import Label from "../../../components/form/Label";

interface AddGPSConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AddGPSConfigModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AddGPSConfigModalProps) => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [createConfig, { isLoading }] = useCreateGPSConfigMutation();

  const [formData, setFormData] = useState({
    config_name: "Default Regular Shift",
    description: "Default configuration for regular shifts",
    shift_type: "REGULAR" as "REGULAR" | "OVERTIME" | "ALL",
    check_strategy: "DURATION_BASED" as "DURATION_BASED" | "FIXED_COUNT",
    check_interval_hours: 2.5,
    min_checks_per_shift: 2,
    enable_random_timing: true,
    random_offset_minutes: 15,
    min_shift_duration_hours: 4,
    default_checks_count: 3,
    priority: 100,
    is_active: true,
    is_default: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      onError("Missing access token");
      return;
    }

    try {
      await createConfig({ token, data: formData }).unwrap();
      onSuccess("Setting configuration created successfully!");
      onClose();
      setFormData({
        config_name: "Default Regular Shift",
        description: "Default configuration for regular shifts",
        shift_type: "REGULAR",
        check_strategy: "DURATION_BASED",
        check_interval_hours: 2.5,
        min_checks_per_shift: 2,
        enable_random_timing: true,
        random_offset_minutes: 15,
        min_shift_duration_hours: 4,
        default_checks_count: 3,
        priority: 100,
        is_active: true,
        is_default: false,
      });
    } catch (err: any) {
      onError(err?.data?.message || "Failed to create GPS configuration");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl m-4">
      <div className="w-full p-6">
        <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Create Setting Configuration
        </h4>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="config_name">Configuration Name *</Label>
            <input
              type="text"
              id="config_name"
              name="config_name"
              value={formData.config_name}
              onChange={handleChange}
              required
              className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              placeholder="e.g., Default Regular Shift"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              placeholder="Describe this configuration..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="shift_type">Shift Type *</Label>
              <select
                id="shift_type"
                name="shift_type"
                value={formData.shift_type}
                onChange={handleChange}
                required
                className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              >
                <option value="REGULAR">Regular</option>
                <option value="OVERTIME">Overtime</option>
                <option value="ALL">All</option>
              </select>
            </div>

            <div>
              <Label htmlFor="check_strategy">Check Strategy *</Label>
              <select
                id="check_strategy"
                name="check_strategy"
                value={formData.check_strategy}
                onChange={handleChange}
                required
                className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              >
                <option value="DURATION_BASED">Duration Based</option>
                <option value="FIXED_COUNT">Fixed Count</option>
              </select>
            </div>

            <div>
              <Label htmlFor="check_interval_hours">Check Interval (hours) *</Label>
              <input
                type="number"
                id="check_interval_hours"
                name="check_interval_hours"
                value={formData.check_interval_hours}
                onChange={handleChange}
                step="0.5"
                min="0.5"
                required
                className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="min_checks_per_shift">Checks per Shift *</Label>
              <input
                type="number"
                id="min_checks_per_shift"
                name="min_checks_per_shift"
                value={formData.min_checks_per_shift}
                onChange={handleChange}
                min="1"
                required
                className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="random_offset_minutes">Random Offset (minutes)</Label>
              <input
                type="number"
                id="random_offset_minutes"
                name="random_offset_minutes"
                value={formData.random_offset_minutes}
                onChange={handleChange}
                min="0"
                className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="min_shift_duration_hours">
                Min Shift Duration (hours) *
              </Label>
              <input
                type="number"
                id="min_shift_duration_hours"
                name="min_shift_duration_hours"
                value={formData.min_shift_duration_hours}
                onChange={handleChange}
                min="1"
                step="0.5"
                required
                className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="default_checks_count">Default Checks Count *</Label>
              <input
                type="number"
                id="default_checks_count"
                name="default_checks_count"
                value={formData.default_checks_count}
                onChange={handleChange}
                min="1"
                required
                className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <input
                type="number"
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                min="1"
                max="100"
                required
                className="h-11 w-full rounded-lg border px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable_random_timing"
                name="enable_random_timing"
                checked={formData.enable_random_timing}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label
                htmlFor="enable_random_timing"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Enable Random Timing
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label
                htmlFor="is_active"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Active
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                name="is_default"
                checked={formData.is_default}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label
                htmlFor="is_default"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Set as Default
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Configuration"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddGPSConfigModal;
