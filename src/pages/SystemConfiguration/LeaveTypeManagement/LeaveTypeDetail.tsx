import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useParams } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { useAppSelector } from "../../../redux/hook";
import { useGetLeaveTypeByIdQuery, useUpdateLeaveTypeMutation, ProrationBasis, LeaveTypeStatus } from "../../../redux/api/leaveApiSlice";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";

type LeaveTypeForm = {
  leave_type_name: string;
  description: string;
  is_paid: string;
  requires_approval: string;
  requires_document: string;
  deducts_from_balance: string;
  max_days_per_year: string;
  max_consecutive_days: string;
  min_notice_days: string;
  exclude_holidays: string;
  exclude_weekends: string;
  allow_carry_over: string;
  max_carry_over_days: string;
  carry_over_expiry_months: string;
  is_prorated: string;
  proration_basis: ProrationBasis;
  is_accrued: string;
  accrual_rate: string;
  accrual_start_month: string;
  color_hex: string;
  icon: string;
  sort_order: string;
  status: LeaveTypeStatus;
};

type FormErrors = Partial<Record<keyof LeaveTypeForm, string>>;

const LeaveTypeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isOpen, openModal, closeModal } = useModal();

  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const { data, isLoading, error } = useGetLeaveTypeByIdQuery(
    { token: token!, id: Number(id) },
    { skip: !token || !id }
  );

  const leaveType = data?.data;

  // STATE for edit form
  const [form, setForm] = useState<LeaveTypeForm | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // When leaveType changes (loaded), assign to form
  useEffect(() => {
    if (leaveType) {
      setForm({
        leave_type_name: leaveType.leave_type_name,
        description: leaveType.description ?? "",
        is_paid: leaveType.is_paid ? "true" : "false",
        requires_approval: leaveType.requires_approval ? "true" : "false",
        requires_document: leaveType.requires_document ? "true" : "false",
        deducts_from_balance: leaveType.deducts_from_balance ? "true" : "false",
        max_days_per_year: leaveType.max_days_per_year?.toString() ?? "",
        max_consecutive_days: leaveType.max_consecutive_days?.toString() ?? "",
        min_notice_days: leaveType.min_notice_days.toString(),
        exclude_holidays: leaveType.exclude_holidays ? "true" : "false",
        exclude_weekends: leaveType.exclude_weekends ? "true" : "false",
        allow_carry_over: leaveType.allow_carry_over ? "true" : "false",
        max_carry_over_days: leaveType.max_carry_over_days?.toString() ?? "",
        carry_over_expiry_months: leaveType.carry_over_expiry_months.toString(),
        is_prorated: leaveType.is_prorated ? "true" : "false",
        proration_basis: leaveType.proration_basis as ProrationBasis,
        is_accrued: leaveType.is_accrued ? "true" : "false",
        accrual_rate: leaveType.accrual_rate?.toString() ?? "",
        accrual_start_month: leaveType.accrual_start_month.toString(),
        color_hex: leaveType.color_hex,
        icon: leaveType.icon ?? "",
        sort_order: leaveType.sort_order.toString(),
        status: leaveType.status as LeaveTypeStatus,
      });
    }
  }, [leaveType]);

  const [updateLeaveType, { isLoading: isUpdating }] = useUpdateLeaveTypeMutation();

  // ---- VALIDATION ----
  const validateForm = (values: LeaveTypeForm): FormErrors => {
    const newErrors: FormErrors = {};

    if (!values.leave_type_name.trim()) {
      newErrors.leave_type_name = "Leave type name is required";
    }

    if (!values.color_hex.trim()) {
      newErrors.color_hex = "Color is required";
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(values.color_hex)) {
      newErrors.color_hex = "Color must be a valid hex code (e.g., #3B82F6)";
    }

    const minNotice = Number(values.min_notice_days);
    if (isNaN(minNotice) || minNotice < 0) {
      newErrors.min_notice_days = "Min notice days must be 0 or greater";
    }

    const sortOrder = Number(values.sort_order);
    if (isNaN(sortOrder) || sortOrder < 0) {
      newErrors.sort_order = "Sort order must be 0 or greater";
    }

    if (values.max_days_per_year && (isNaN(Number(values.max_days_per_year)) || Number(values.max_days_per_year) <= 0)) {
      newErrors.max_days_per_year = "Max days per year must be a positive number";
    }

    if (values.max_consecutive_days && (isNaN(Number(values.max_consecutive_days)) || Number(values.max_consecutive_days) <= 0)) {
      newErrors.max_consecutive_days = "Max consecutive days must be a positive number";
    }

    if (values.allow_carry_over === "true") {
      if (values.max_carry_over_days && (isNaN(Number(values.max_carry_over_days)) || Number(values.max_carry_over_days) <= 0)) {
        newErrors.max_carry_over_days = "Max carry over days must be a positive number";
      }
      const expiryMonths = Number(values.carry_over_expiry_months);
      if (isNaN(expiryMonths) || expiryMonths < 0) {
        newErrors.carry_over_expiry_months = "Carry over expiry months must be 0 or greater";
      }
    }

    if (values.is_accrued === "true") {
      if (values.accrual_rate && (isNaN(Number(values.accrual_rate)) || Number(values.accrual_rate) <= 0)) {
        newErrors.accrual_rate = "Accrual rate must be a positive number";
      }
      const accrualMonth = Number(values.accrual_start_month);
      if (isNaN(accrualMonth) || accrualMonth < 1 || accrualMonth > 12) {
        newErrors.accrual_start_month = "Accrual start month must be between 1 and 12";
      }
    }

    return newErrors;
  };

  if (isLoading || !form) return <div>Loading…</div>;
  if (error || !leaveType) return <div>Error loading leave type</div>;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof LeaveTypeForm;

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
      await updateLeaveType({
        token,
        id: Number(id),
        body: {
          leave_type_name: form.leave_type_name.trim(),
          description: form.description.trim() || undefined,
          is_paid: form.is_paid === "true",
          requires_approval: form.requires_approval === "true",
          requires_document: form.requires_document === "true",
          deducts_from_balance: form.deducts_from_balance === "true",
          max_days_per_year: form.max_days_per_year ? Number(form.max_days_per_year) : undefined,
          max_consecutive_days: form.max_consecutive_days ? Number(form.max_consecutive_days) : undefined,
          min_notice_days: Number(form.min_notice_days),
          exclude_holidays: form.exclude_holidays === "true",
          exclude_weekends: form.exclude_weekends === "true",
          allow_carry_over: form.allow_carry_over === "true",
          max_carry_over_days: form.max_carry_over_days ? Number(form.max_carry_over_days) : undefined,
          carry_over_expiry_months: Number(form.carry_over_expiry_months),
          is_prorated: form.is_prorated === "true",
          proration_basis: form.proration_basis,
          is_accrued: form.is_accrued === "true",
          accrual_rate: form.accrual_rate ? Number(form.accrual_rate) : undefined,
          accrual_start_month: Number(form.accrual_start_month),
          color_hex: form.color_hex.trim(),
          icon: form.icon.trim() || undefined,
          sort_order: Number(form.sort_order),
          status: form.status,
        },
      }).unwrap();

      setErrors({});
      closeModal();
    } catch (err) {
      console.error("Update leave type failed", err);
    }
  };

  return (
    <>
      <PageMeta title={`Leave Type: ${leaveType?.leave_type_name || "Detail"}`} description="" />
      
      <PageBreadcrumb
        pageTitle={leaveType.leave_type_code}
        items={[
          { label: "Leave Types", to: "/leave-type-config" },
          { label: leaveType.leave_type_code },
        ]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Leave Type Detail
        </h3>

        <div className="space-y-6">
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: leaveType.color_hex }}
                  >
                    {leaveType.icon ? (
                      <span className="text-white text-2xl">{leaveType.icon}</span>
                    ) : (
                      <span className="text-white text-lg font-bold">
                        {leaveType.leave_type_code.substring(0, 2)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {leaveType.leave_type_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {leaveType.leave_type_code}
                    </p>
                  </div>
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
                          Description
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {leaveType.description || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Status
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            leaveType.status === "ACTIVE"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {leaveType.status}
                        </span>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Type
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            leaveType.is_paid
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                          }`}
                        >
                          {leaveType.is_paid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Sort Order
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {leaveType.sort_order}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Color
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: leaveType.color_hex }}
                          />
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {leaveType.color_hex}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leave Limits */}
                  <div className="space-y-4">
                    <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                      Leave Limits
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Max Days Per Year
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {leaveType.max_days_per_year ?? "Unlimited"}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Max Consecutive Days
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {leaveType.max_consecutive_days ?? "Unlimited"}
                        </p>
                      </div>
                      <div>
                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                          Minimum Notice Days
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {leaveType.min_notice_days} days
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                      Settings
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={leaveType.requires_approval}
                          disabled
                          className="rounded"
                        />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Requires Approval
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={leaveType.requires_document}
                          disabled
                          className="rounded"
                        />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Requires Document
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={leaveType.deducts_from_balance}
                          disabled
                          className="rounded"
                        />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Deducts From Balance
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={leaveType.exclude_holidays}
                          disabled
                          className="rounded"
                        />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Exclude Holidays
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={leaveType.exclude_weekends}
                          disabled
                          className="rounded"
                        />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Exclude Weekends
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Carry Over & Accrual */}
                  <div className="space-y-4">
                    <h5 className="text-base font-medium text-gray-800 dark:text-white/90 border-b pb-2 dark:border-gray-700">
                      Carry Over & Accrual
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={leaveType.allow_carry_over}
                          disabled
                          className="rounded"
                        />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Allow Carry Over
                        </p>
                      </div>
                      {leaveType.allow_carry_over && (
                        <>
                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Max Carry Over Days
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {leaveType.max_carry_over_days ?? "Unlimited"}
                            </p>
                          </div>
                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Carry Over Expiry (Months)
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {leaveType.carry_over_expiry_months} months
                            </p>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={leaveType.is_prorated}
                          disabled
                          className="rounded"
                        />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Is Prorated
                        </p>
                      </div>
                      {leaveType.is_prorated && (
                        <div>
                          <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                            Proration Basis
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {leaveType.proration_basis}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={leaveType.is_accrued}
                          disabled
                          className="rounded"
                        />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Is Accrued
                        </p>
                      </div>
                      {leaveType.is_accrued && (
                        <>
                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Accrual Rate
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {leaveType.accrual_rate ?? "-"}
                            </p>
                          </div>
                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Accrual Start Month
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {leaveType.accrual_start_month}
                            </p>
                          </div>
                        </>
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
                    Edit Leave Type
                  </h4>
                  <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                    Update leave type information below.
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
                          <Label>Leave Type Name *</Label>
                          <Input
                            type="text"
                            name="leave_type_name"
                            value={form.leave_type_name}
                            onChange={handleChange}
                            placeholder="Annual Leave"
                            error={!!errors.leave_type_name}
                            hint={errors.leave_type_name}
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
                          <Label>Description</Label>
                          <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Annual paid leave for employees"
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Color Hex *</Label>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              name="color_hex"
                              value={form.color_hex}
                              onChange={handleChange}
                              placeholder="#3B82F6"
                              error={!!errors.color_hex}
                              hint={errors.color_hex}
                            />
                            <input
                              type="color"
                              value={form.color_hex}
                              onChange={(e) => setForm(prev => prev ? { ...prev, color_hex: e.target.value } : null)}
                              className="w-16 h-10 rounded-lg border border-gray-300 dark:border-gray-700"
                            />
                          </div>
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Icon (optional)</Label>
                          <Input
                            type="text"
                            name="icon"
                            value={form.icon}
                            onChange={handleChange}
                            placeholder="calendar"
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Sort Order *</Label>
                          <Input
                            type="number"
                            name="sort_order"
                            value={form.sort_order}
                            onChange={handleChange}
                            placeholder="1"
                            error={!!errors.sort_order}
                            hint={errors.sort_order}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Leave Settings */}
                    <div className="mt-7">
                      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                        Leave Settings
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
                          <Label>Requires Approval</Label>
                          <select
                            name="requires_approval"
                            value={form.requires_approval}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Requires Document</Label>
                          <select
                            name="requires_document"
                            value={form.requires_document}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Deducts From Balance</Label>
                          <select
                            name="deducts_from_balance"
                            value={form.deducts_from_balance}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Exclude Holidays</Label>
                          <select
                            name="exclude_holidays"
                            value={form.exclude_holidays}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Exclude Weekends</Label>
                          <select
                            name="exclude_weekends"
                            value={form.exclude_weekends}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Leave Limits */}
                    <div className="mt-7">
                      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                        Leave Limits
                      </h5>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                        <div className="col-span-2 lg:col-span-1">
                          <Label>Max Days Per Year (optional)</Label>
                          <Input
                            type="number"
                            name="max_days_per_year"
                            value={form.max_days_per_year}
                            onChange={handleChange}
                            placeholder="12"
                            error={!!errors.max_days_per_year}
                            hint={errors.max_days_per_year}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Max Consecutive Days (optional)</Label>
                          <Input
                            type="number"
                            name="max_consecutive_days"
                            value={form.max_consecutive_days}
                            onChange={handleChange}
                            placeholder="5"
                            error={!!errors.max_consecutive_days}
                            hint={errors.max_consecutive_days}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Min Notice Days *</Label>
                          <Input
                            type="number"
                            name="min_notice_days"
                            value={form.min_notice_days}
                            onChange={handleChange}
                            placeholder="1"
                            error={!!errors.min_notice_days}
                            hint={errors.min_notice_days}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Carry Over & Accrual */}
                    <div className="mt-7">
                      <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                        Carry Over & Accrual
                      </h5>

                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                        <div className="col-span-2 lg:col-span-1">
                          <Label>Allow Carry Over</Label>
                          <select
                            name="allow_carry_over"
                            value={form.allow_carry_over}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>

                        {form.allow_carry_over === "true" && (
                          <>
                            <div className="col-span-2 lg:col-span-1">
                              <Label>Max Carry Over Days (optional)</Label>
                              <Input
                                type="number"
                                name="max_carry_over_days"
                                value={form.max_carry_over_days}
                                onChange={handleChange}
                                placeholder="5"
                                error={!!errors.max_carry_over_days}
                                hint={errors.max_carry_over_days}
                              />
                            </div>

                            <div className="col-span-2 lg:col-span-1">
                              <Label>Carry Over Expiry Months *</Label>
                              <Input
                                type="number"
                                name="carry_over_expiry_months"
                                value={form.carry_over_expiry_months}
                                onChange={handleChange}
                                placeholder="12"
                                error={!!errors.carry_over_expiry_months}
                                hint={errors.carry_over_expiry_months}
                              />
                            </div>
                          </>
                        )}

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Is Prorated</Label>
                          <select
                            name="is_prorated"
                            value={form.is_prorated}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>

                        {form.is_prorated === "true" && (
                          <div className="col-span-2 lg:col-span-1">
                            <Label>Proration Basis</Label>
                            <select
                              name="proration_basis"
                              value={form.proration_basis}
                              onChange={handleChange}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            >
                              <option value={ProrationBasis.MONTHLY}>Monthly</option>
                              <option value={ProrationBasis.DAILY}>Daily</option>
                              <option value={ProrationBasis.YEARLY}>Yearly</option>
                            </select>
                          </div>
                        )}

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Is Accrued</Label>
                          <select
                            name="is_accrued"
                            value={form.is_accrued}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>

                        {form.is_accrued === "true" && (
                          <>
                            <div className="col-span-2 lg:col-span-1">
                              <Label>Accrual Rate (optional)</Label>
                              <Input
                                type="number"
                                name="accrual_rate"
                                value={form.accrual_rate}
                                onChange={handleChange}
                                placeholder="1.25"
                                step="0.01"
                                error={!!errors.accrual_rate}
                                hint={errors.accrual_rate}
                              />
                            </div>

                            <div className="col-span-2 lg:col-span-1">
                              <Label>Accrual Start Month (1-12) *</Label>
                              <Input
                                type="number"
                                name="accrual_start_month"
                                value={form.accrual_start_month}
                                onChange={handleChange}
                                placeholder="1"
                                min="1"
                                max="12"
                                error={!!errors.accrual_start_month}
                                hint={errors.accrual_start_month}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
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

export default LeaveTypeDetail;
