import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { useAppSelector } from "../../../redux/hook";
import {
  useCreateHolidayMutation,
  HolidayType,
  HolidayAppliesTo,
} from "../../../redux/api/holidayApiSlice";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

type CreateHolidayForm = {
  holiday_name: string;
  holiday_date: string;
  holiday_type: HolidayType;
  applies_to: HolidayAppliesTo;
  department_ids: string;
  location_ids: string;
  is_recurring: string;
  recurring_month: string;
  recurring_day: string;
  recurring_rule: string;
  is_mandatory: string;
  is_paid: string;
  can_work_for_ot: string;
  description: string;
  year: string;
};

const currentYear = new Date().getFullYear();

const initialForm: CreateHolidayForm = {
  holiday_name: "",
  holiday_date: "",
  holiday_type: HolidayType.PUBLIC_HOLIDAY,
  applies_to: HolidayAppliesTo.ALL,
  department_ids: "",
  location_ids: "",
  is_recurring: "false",
  recurring_month: "",
  recurring_day: "",
  recurring_rule: "",
  is_mandatory: "true",
  is_paid: "true",
  can_work_for_ot: "false",
  description: "",
  year: currentYear.toString(),
};

type FormErrors = Partial<Record<keyof CreateHolidayForm, string>>;

interface AddHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AddHolidayModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AddHolidayModalProps) => {
  const [form, setForm] = useState<CreateHolidayForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const holidayDateRef = useRef<HTMLInputElement>(null);

  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [createHoliday, { isLoading: isCreating }] =
    useCreateHolidayMutation();

  // Initialize flatpickr for holiday date field
  useEffect(() => {
    if (!isOpen) return;

    const holidayPicker = holidayDateRef.current
      ? flatpickr(holidayDateRef.current, {
          dateFormat: "Y-m-d",
          onChange: (selectedDates) => {
            if (selectedDates[0]) {
              const year = selectedDates[0].getFullYear();
              const month = String(selectedDates[0].getMonth() + 1).padStart(2, "0");
              const day = String(selectedDates[0].getDate()).padStart(2, "0");
              const formattedDate = `${year}-${month}-${day}`;
              setForm((prev) => ({ ...prev, holiday_date: formattedDate }));
              setErrors((prev) => ({ ...prev, holiday_date: "" }));
            }
          },
        })
      : null;

    return () => {
      holidayPicker?.destroy();
    };
  }, [isOpen]);

  // ---- VALIDATION ----
  const validateForm = (values: CreateHolidayForm): FormErrors => {
    const newErrors: FormErrors = {};

    if (!values.holiday_name.trim()) {
      newErrors.holiday_name = "Holiday name is required";
    }

    if (!values.holiday_date) {
      newErrors.holiday_date = "Holiday date is required";
    }

    const year = Number(values.year);
    if (isNaN(year) || year < 1900 || year > 2100) {
      newErrors.year = "Year must be between 1900 and 2100";
    }

    if (values.is_recurring === "true") {
      const month = Number(values.recurring_month);
      if (values.recurring_month && (isNaN(month) || month < 1 || month > 12)) {
        newErrors.recurring_month = "Month must be between 1 and 12";
      }

      const day = Number(values.recurring_day);
      if (values.recurring_day && (isNaN(day) || day < 1 || day > 31)) {
        newErrors.recurring_day = "Day must be between 1 and 31";
      }
    }

    if (values.applies_to === HolidayAppliesTo.DEPARTMENT && !values.department_ids.trim()) {
      newErrors.department_ids = "Department IDs are required when applies to department";
    }

    if (values.applies_to === HolidayAppliesTo.LOCATION && !values.location_ids.trim()) {
      newErrors.location_ids = "Location IDs are required when applies to location";
    }

    return newErrors;
  };

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof CreateHolidayForm;

    setForm((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // clear error for this field
    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await createHoliday({
        token,
        body: {
          holiday_name: form.holiday_name.trim(),
          holiday_date: form.holiday_date,
          holiday_type: form.holiday_type,
          applies_to: form.applies_to,
          department_ids: form.department_ids.trim() || undefined,
          location_ids: form.location_ids.trim() || undefined,
          is_recurring: form.is_recurring === "true",
          recurring_month: form.recurring_month ? Number(form.recurring_month) : undefined,
          recurring_day: form.recurring_day ? Number(form.recurring_day) : undefined,
          recurring_rule: form.recurring_rule.trim() || undefined,
          is_mandatory: form.is_mandatory === "true",
          is_paid: form.is_paid === "true",
          can_work_for_ot: form.can_work_for_ot === "true",
          description: form.description.trim() || undefined,
          year: Number(form.year),
        },
      }).unwrap();

      // Reset form and close modal
      setForm(initialForm);
      setErrors({});
      onClose();
      onSuccess("Holiday created successfully");
    } catch (err: any) {
      console.error("Create holiday failed", err);
      const backendMessage =
        (err && (err.data?.message || err.error)) ||
        "Failed to create holiday";
      onError(backendMessage);
    }
  };

  const handleClose = () => {
    setForm(initialForm);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[900px] m-4">
      <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Create Holiday
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Fill in the information below to create a new holiday.
          </p>
        </div>

        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="custom-scrollbar h-[500px] overflow-y-auto px-2 pb-3">
            {/* Basic Information */}
            <div className="mt-4">
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Basic Information
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Holiday Name *</Label>
                  <Input
                    type="text"
                    name="holiday_name"
                    value={form.holiday_name}
                    onChange={handleChange}
                    placeholder="Lunar New Year"
                    error={!!errors.holiday_name}
                    hint={errors.holiday_name}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Holiday Date *</Label>
                  <input
                    ref={holidayDateRef}
                    type="text"
                    name="holiday_date"
                    value={form.holiday_date}
                    onChange={handleChange}
                    placeholder="Select date"
                    className={`h-11 w-full rounded-lg border ${
                      errors.holiday_date
                        ? "border-error-500"
                        : "border-gray-300 dark:border-gray-700"
                    } bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`}
                  />
                  {errors.holiday_date && (
                    <p className="mt-1 text-xs text-error-500">
                      {errors.holiday_date}
                    </p>
                  )}
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Holiday Type *</Label>
                  <select
                    name="holiday_type"
                    value={form.holiday_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value={HolidayType.PUBLIC_HOLIDAY}>Public Holiday</option>
                    <option value={HolidayType.COMPANY_HOLIDAY}>Company Holiday</option>
                    <option value={HolidayType.REGIONAL_HOLIDAY}>Regional Holiday</option>
                    <option value={HolidayType.RELIGIOUS_HOLIDAY}>Religious Holiday</option>
                  </select>
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Year *</Label>
                  <Input
                    type="number"
                    name="year"
                    value={form.year}
                    onChange={handleChange}
                    placeholder={currentYear.toString()}
                    error={!!errors.year}
                    hint={errors.year}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Description (optional)</Label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="National holiday celebrating Lunar New Year"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Application Scope */}
            <div className="mt-7">
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Application Scope
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Applies To *</Label>
                  <select
                    name="applies_to"
                    value={form.applies_to}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value={HolidayAppliesTo.ALL}>All</option>
                    <option value={HolidayAppliesTo.DEPARTMENT}>Department</option>
                    <option value={HolidayAppliesTo.LOCATION}>Location</option>
                  </select>
                </div>

                {form.applies_to === HolidayAppliesTo.DEPARTMENT && (
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Department IDs *</Label>
                    <Input
                      type="text"
                      name="department_ids"
                      value={form.department_ids}
                      onChange={handleChange}
                      placeholder="1,2,3"
                      error={!!errors.department_ids}
                      hint={errors.department_ids || "Comma-separated IDs"}
                    />
                  </div>
                )}

                {form.applies_to === HolidayAppliesTo.LOCATION && (
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Location IDs *</Label>
                    <Input
                      type="text"
                      name="location_ids"
                      value={form.location_ids}
                      onChange={handleChange}
                      placeholder="1,2"
                      error={!!errors.location_ids}
                      hint={errors.location_ids || "Comma-separated IDs"}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Holiday Settings */}
            <div className="mt-7">
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Holiday Settings
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Is Paid</Label>
                  <select
                    name="is_paid"
                    value={form.is_paid}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Is Mandatory</Label>
                  <select
                    name="is_mandatory"
                    value={form.is_mandatory}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Can Work for OT</Label>
                  <select
                    name="can_work_for_ot"
                    value={form.can_work_for_ot}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recurring Settings */}
            <div className="mt-7">
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                Recurring Settings
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Is Recurring</Label>
                  <select
                    name="is_recurring"
                    value={form.is_recurring}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {form.is_recurring === "true" && (
                  <>
                    <div className="col-span-2 lg:col-span-1">
                      <Label>Recurring Month (1-12)</Label>
                      <Input
                        type="number"
                        name="recurring_month"
                        value={form.recurring_month}
                        onChange={handleChange}
                        placeholder="1"
                        min="1"
                        max="12"
                        error={!!errors.recurring_month}
                        hint={errors.recurring_month}
                      />
                    </div>

                    <div className="col-span-2 lg:col-span-1">
                      <Label>Recurring Day (1-31)</Label>
                      <Input
                        type="number"
                        name="recurring_day"
                        value={form.recurring_day}
                        onChange={handleChange}
                        placeholder="1"
                        min="1"
                        max="31"
                        error={!!errors.recurring_day}
                        hint={errors.recurring_day}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Recurring Rule (optional)</Label>
                      <Input
                        type="text"
                        name="recurring_rule"
                        value={form.recurring_rule}
                        onChange={handleChange}
                        placeholder="e.g., lunar calendar rule"
                      />
                    </div>
                  </>
                )}
              </div>
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
            <Button size="sm" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Holiday"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddHolidayModal;
