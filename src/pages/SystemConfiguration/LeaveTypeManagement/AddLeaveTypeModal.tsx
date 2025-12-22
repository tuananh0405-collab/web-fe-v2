import { useState, FormEvent, ChangeEvent } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { useAppSelector } from "../../../redux/hook";
import {
    useCreateLeaveTypeMutation,
    ProrationBasis,
} from "../../../redux/api/leaveApiSlice";

type CreateLeaveTypeForm = {
    leave_type_code: string;
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
};

const initialForm: CreateLeaveTypeForm = {
    leave_type_code: "",
    leave_type_name: "",
    description: "",
    is_paid: "true",
    requires_approval: "true",
    requires_document: "false",
    deducts_from_balance: "true",
    max_days_per_year: "",
    max_consecutive_days: "",
    min_notice_days: "1",
    exclude_holidays: "true",
    exclude_weekends: "true",
    allow_carry_over: "false",
    max_carry_over_days: "",
    carry_over_expiry_months: "12",
    is_prorated: "false",
    proration_basis: ProrationBasis.MONTHLY,
    is_accrued: "false",
    accrual_rate: "",
    accrual_start_month: "1",
    color_hex: "#3B82F6",
    icon: "",
    sort_order: "1",
};

type FormErrors = Partial<Record<keyof CreateLeaveTypeForm, string>>;

interface AddLeaveTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

const AddLeaveTypeModal = ({
    isOpen,
    onClose,
    onSuccess,
    onError,
}: AddLeaveTypeModalProps) => {
    const [form, setForm] = useState<CreateLeaveTypeForm>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});

    const token = useAppSelector(
        (state) => state.auth.userState?.data?.access_token
    );

    const [createLeaveType, { isLoading: isCreating }] =
        useCreateLeaveTypeMutation();

    // ---- VALIDATION ----
    const validateForm = (values: CreateLeaveTypeForm): FormErrors => {
        const newErrors: FormErrors = {};

        if (!values.leave_type_code.trim()) {
            newErrors.leave_type_code = "Leave type code is required";
        } else if (!/^[A-Z0-9_-]+$/.test(values.leave_type_code)) {
            newErrors.leave_type_code = "Code must contain only uppercase letters, numbers, hyphens, and underscores";
        }

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

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        const fieldName = name as keyof CreateLeaveTypeForm;

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
            await createLeaveType({
                token,
                body: {
                    leave_type_code: form.leave_type_code.trim(),
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
                },
            }).unwrap();

            // Reset form and close modal
            setForm(initialForm);
            setErrors({});
            onClose();
            onSuccess("Leave type created successfully");
        } catch (err: any) {
            console.error("Create leave type failed", err);
            const backendMessage =
                (err && (err.data?.message || err.error)) ||
                "Failed to create leave type";
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
                        Create Leave Type
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Fill in the information below to create a new leave type.
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
                                    <Label>Leave Type Code *</Label>
                                    <Input
                                        type="text"
                                        name="leave_type_code"
                                        value={form.leave_type_code}
                                        onChange={handleChange}
                                        placeholder="ANNUAL-LEAVE"
                                        error={!!errors.leave_type_code}
                                        hint={errors.leave_type_code}
                                    />
                                </div>

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
                                            onChange={(e) => setForm(prev => ({ ...prev, color_hex: e.target.value }))}
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
                        {/* <div className="mt-7">
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
                        </div> */}

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

                        {/* Carry Over Settings */}
                        {/* <div className="mt-7">
                            <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                                Carry Over Settings
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
                            </div>
                        </div> */}

                        {/* Proration & Accrual */}
                        {/* <div className="mt-7">
                            <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                                Proration & Accrual
                            </h5>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
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
                        </div> */}
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
                            {isCreating ? "Creating..." : "Create Leave Type"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddLeaveTypeModal;
