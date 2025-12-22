import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useParams } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { useAppSelector } from "../../../redux/hook";
import {
  useGetHolidayByIdQuery,
  useUpdateHolidayMutation,
  HolidayType,
  HolidayAppliesTo,
  HolidayStatus,
} from "../../../redux/api/holidayApiSlice";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";

type HolidayForm = {
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
  status: HolidayStatus;
};

type FormErrors = Partial<Record<keyof HolidayForm, string>>;

const HolidayDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isOpen, openModal, closeModal } = useModal();

  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const { data, isLoading, error } = useGetHolidayByIdQuery(
    { token: token!, id: Number(id) },
    { skip: !token || !id }
  );

  const holiday = data?.data;

  // STATE for edit form
  const [form, setForm] = useState<HolidayForm | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // When holiday changes (loaded), assign to form
  useEffect(() => {
    if (holiday) {
      setForm({
        holiday_name: holiday.holiday_name,
        holiday_date: holiday.holiday_date.split('T')[0], // Format date for input
        holiday_type: holiday.holiday_type as HolidayType,
        applies_to: holiday.applies_to as HolidayAppliesTo,
        department_ids: holiday.department_ids ?? "",
        location_ids: holiday.location_ids ?? "",
        is_recurring: holiday.is_recurring ? "true" : "false",
        recurring_month: holiday.recurring_month?.toString() ?? "",
        recurring_day: holiday.recurring_day?.toString() ?? "",
        recurring_rule: holiday.recurring_rule ?? "",
        is_mandatory: holiday.is_mandatory ? "true" : "false",
        is_paid: holiday.is_paid ? "true" : "false",
        can_work_for_ot: holiday.can_work_for_ot ? "true" : "false",
        description: holiday.description ?? "",
        year: holiday.year.toString(),
        status: holiday.status as HolidayStatus,
      });
    }
  }, [holiday]);

  const [updateHoliday, { isLoading: isUpdating }] = useUpdateHolidayMutation();

  // ---- VALIDATION ----
  const validateForm = (values: HolidayForm): FormErrors => {
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

  if (isLoading || !form) return <div>Loading…</div>;
  if (error || !holiday) return <div>Error loading holiday</div>;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof HolidayForm;

    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [fieldName]: value,
      };
    });

    // Clear error for this field
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
      await updateHoliday({
        token,
        id: Number(id),
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
          status: form.status,
        },
      }).unwrap();

      setErrors({});
      closeModal();
    } catch (err) {
      console.error("Update holiday failed", err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format holiday type for display
  const formatHolidayType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
      <PageMeta title={`Holiday: ${holiday?.holiday_name || "Detail"}`} description="" />
      
      <PageBreadcrumb
        showTitleLeft={false}
        items={[
          { label: "Holidays", to: "/holiday-config" },
          { label: holiday.holiday_name },
        ]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Holiday Detail
        </h3>

        <div className="space-y-6">
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="mb-6">
                  <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                    {holiday.holiday_name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(holiday.holiday_date)}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                      Basic Information
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Holiday Type
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {formatHolidayType(holiday.holiday_type)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Year
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {holiday.year}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Status
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            holiday.status === "ACTIVE"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {holiday.status}
                        </span>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Description
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {holiday.description || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Application & Settings */}
                  <div className="space-y-4">
                    <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                      Application & Settings
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Applies To
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {holiday.applies_to}
                        </p>
                      </div>
                      {holiday.department_ids && (
                        <div>
                          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                            Department IDs
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {holiday.department_ids}
                          </p>
                        </div>
                      )}
                      {holiday.location_ids && (
                        <div>
                          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                            Location IDs
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {holiday.location_ids}
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
                    Edit Holiday
                  </h4>
                  <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                    Update holiday information below.
                  </p>
                </div>

                <form className="flex flex-col" onSubmit={handleSave}>
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
                          <Input
                            type="date"
                            name="holiday_date"
                            value={form.holiday_date}
                            onChange={handleChange}
                            error={!!errors.holiday_date}
                            hint={errors.holiday_date}
                          />
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
                            placeholder="2025"
                            error={!!errors.year}
                            hint={errors.year}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Status</Label>
                          <select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
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
                    {/* <div className="mt-7">
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
                    </div> */}

                    {/* Recurring Settings */}
                    {/* <div className="mt-7">
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
                    </div> */}
                  </div>

                  <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <Button size="sm" disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
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

export default HolidayDetail;
