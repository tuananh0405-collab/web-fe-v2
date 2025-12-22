import { useState, FormEvent, ChangeEvent, useEffect, useRef, useMemo } from "react";
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
import { Department, useGetDepartmentsQuery } from "../../../redux/api/employeeApiSlice";

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

const AddHolidayModal = ({ isOpen, onClose, onSuccess, onError }: AddHolidayModalProps) => {
  const [form, setForm] = useState<CreateHolidayForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const holidayDateRef = useRef<HTMLInputElement>(null);

  const token = useAppSelector((state) => state.auth.userState?.data?.access_token);

  // ----------------------------
  // Departments dropdown states
  // ----------------------------
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [deptSearch, setDeptSearch] = useState("");

  // Pagination for departments
  const [page, setPage] = useState(1);
  const limit = 100;

  // filter state (bạn có thể giữ hoặc bỏ)
  const [status] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");
  const [search] = useState("");
  const [sortBy] = useState<
    | "created_at"
    | "department_code"
    | "department_name"
    | "description"
    | "id"
    | "level"
    | "manager_id"
    | "parent_department_id"
    | "parent_department_name"
    | "status"
    | "updated_at"
    | "office_address"
  >("created_at");
  const [sortOrder] = useState<"ASC" | "DESC">("DESC");

  const shouldLoadDepartments =
    isOpen && form.applies_to === HolidayAppliesTo.DEPARTMENT && !!token;

  // Query departments (1 page at a time). We will auto-increment page to fetch all pages.
  const {
    data: deptRes,
    isLoading: deptLoading,
    isFetching: deptFetching,
    error: deptError,
  } = useGetDepartmentsQuery(
    {
      token: token!,
      page,
      limit,
      status: status === "ALL" ? undefined : status,
      search: search || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
    { skip: !shouldLoadDepartments }
  );

  // Reset department fetching when opening modal or switching applies_to
  useEffect(() => {
    if (!shouldLoadDepartments) return;

    setDepartments([]);
    setPage(1);
    setDeptSearch("");
    setDeptDropdownOpen(false);

    // NOTE: nếu bạn muốn giữ selection khi reopen modal thì bỏ dòng dưới
    setSelectedDepartmentIds([]);
  }, [shouldLoadDepartments]);

  // Append departments from each page + auto-fetch next page based on response pagination
  useEffect(() => {
    if (!shouldLoadDepartments) return;
    if (!deptRes) return;

    const items: Department[] = deptRes?.data?.departments ?? [];
    const pagination = deptRes?.data?.pagination;
    const totalPages: number | undefined = pagination?.total_pages;

    // append unique by id
    setDepartments((prev) => {
      const map = new Map<number, Department>();
      prev.forEach((d) => map.set(d.id, d));
      items.forEach((d) => map.set(d.id, d));
      return Array.from(map.values());
    });

    // auto next page
    if (totalPages && page < totalPages) {
      setPage((p) => p + 1);
    }
  }, [deptRes, shouldLoadDepartments, page]);

  // Sync selectedDepartmentIds -> form.department_ids (string)
  useEffect(() => {
    setForm((prev) => ({ ...prev, department_ids: selectedDepartmentIds.join(",") }));
    if (selectedDepartmentIds.length > 0) {
      setErrors((prev) => ({ ...prev, department_ids: "" }));
    }
  }, [selectedDepartmentIds]);

  const filteredDepartments = useMemo(() => {
    const q = deptSearch.trim().toLowerCase();
    if (!q) return departments;

    return departments.filter((d: any) => {
      const name = (d.department_name ?? d.name ?? "").toString().toLowerCase();
      const code = (d.department_code ?? "").toString().toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [departments, deptSearch]);

  // ----------------------------
  // Create holiday mutation
  // ----------------------------
  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();

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
              setForm((prev) => ({ 
                ...prev, 
                holiday_date: formattedDate,
                year: year.toString() // Auto-fill year from holiday_date
              }));
              setErrors((prev) => ({ ...prev, holiday_date: "", year: "" }));
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

    if (!values.holiday_name.trim()) newErrors.holiday_name = "Holiday name is required";
    if (!values.holiday_date) newErrors.holiday_date = "Holiday date is required";

    const year = Number(values.year);
    if (isNaN(year) || year < 1900 || year > 2100) newErrors.year = "Year must be between 1900 and 2100";

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

    if (values.applies_to === HolidayAppliesTo.DEPARTMENT && selectedDepartmentIds.length === 0) {
      newErrors.department_ids = "Please select at least one department";
    }

    if (values.applies_to === HolidayAppliesTo.LOCATION && !values.location_ids.trim()) {
      newErrors.location_ids = "Location IDs are required when applies to location";
    }

    return newErrors;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof CreateHolidayForm;

    setForm((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
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

      setForm(initialForm);
      setErrors({});
      onClose();
      onSuccess("Holiday created successfully");
    } catch (err: any) {
      console.error("Create holiday failed", err);
      const backendMessage = (err && (err.data?.message || err.error)) || "Failed to create holiday";
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
                      errors.holiday_date ? "border-error-500" : "border-gray-300 dark:border-gray-700"
                    } bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`}
                  />
                  {errors.holiday_date && <p className="mt-1 text-xs text-error-500">{errors.holiday_date}</p>}
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

                {/* Year field - hidden, auto-filled from holiday_date */}
                <input type="hidden" name="year" value={form.year} />

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
                  </select>
                </div>

                {form.applies_to === HolidayAppliesTo.DEPARTMENT && (
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Departments *</Label>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDeptDropdownOpen((v) => !v)}
                        className={`h-11 w-full rounded-lg border px-3 text-left text-sm ${
                          errors.department_ids ? "border-error-500" : "border-gray-300 dark:border-gray-700"
                        } bg-white dark:bg-gray-900 dark:text-gray-100`}
                      >
                        {selectedDepartmentIds.length > 0
                          ? `${selectedDepartmentIds.length} department(s) selected`
                          : (deptLoading || deptFetching) && departments.length === 0
                            ? "Loading departments..."
                            : deptError
                              ? "Failed to load departments"
                              : "Select departments"}
                      </button>

                      {deptDropdownOpen && (
                        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                          <div className="p-2">
                            <input
                              value={deptSearch}
                              onChange={(e) => setDeptSearch(e.target.value)}
                              placeholder="Search department..."
                              className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm dark:border-gray-700 dark:text-gray-100"
                            />
                          </div>

                          <div className="max-h-64 overflow-auto px-2 pb-2">
                            {filteredDepartments.map((d: any) => {
                              const checked = selectedDepartmentIds.includes(d.id);
                              const label =
                                (d.department_name ?? d.name ?? `Department #${d.id}`) as string;
                              const code = (d.department_code ?? "") as string;

                              return (
                                <label
                                  key={d.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setSelectedDepartmentIds((prev) =>
                                        checked ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                                      );
                                    }}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-800 dark:text-gray-100">
                                      {label}
                                    </span>
                                    {code ? (
                                      <span className="text-xs text-gray-400">{code}</span>
                                    ) : null}
                                  </div>

                                  <span className="ml-auto text-xs text-gray-400">#{d.id}</span>
                                </label>
                              );
                            })}

                            {!deptLoading && !deptFetching && filteredDepartments.length === 0 && (
                              <p className="px-2 py-3 text-xs text-gray-500">No departments found.</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-200 p-2 dark:border-gray-700">
                            <button
                              type="button"
                              onClick={() => setSelectedDepartmentIds([])}
                              className="text-sm text-gray-600 hover:underline dark:text-gray-300"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeptDropdownOpen(false)}
                              className="text-sm font-medium text-brand-600 hover:underline"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {errors.department_ids ? (
                      <p className="mt-1 text-xs text-error-500">{errors.department_ids}</p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {selectedDepartmentIds.length > 0
                          ? `Selected IDs: ${selectedDepartmentIds.join(",")}`
                          : "Pick departments from the list"}
                      </p>
                    )}
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
