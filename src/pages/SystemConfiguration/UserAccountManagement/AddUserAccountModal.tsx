import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { useAppSelector } from "../../../redux/hook";
import { useRegisterMutation } from "../../../redux/api/authApiSlice";
import {
    useGetDepartmentsQuery,
    useGetPositionsQuery,
    useGetEmployeesQuery,
    useCreateEmployeeMutation,
} from "../../../redux/api/employeeApiSlice";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

type CreateUserAccountForm = {
    email: string;
    full_name: string;
    password: string;
    suggested_role: "ADMIN" | "HR_MANAGER" | "DEPARTMENT_MANAGER" | "EMPLOYEE";
    department_name?: string;
    department_id?: string;
    employee_id?: string;
    employee_code?: string;
    position_id?: string;
    position_name?: string;
    // Additional fields for EMPLOYEE role (create new employee)
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: string;
    phone_number?: string;
    hire_date?: string;
    employment_type?: string;
};

const initialForm: CreateUserAccountForm = {
    email: "",
    full_name: "",
    password: "",
    suggested_role: "ADMIN",
    department_name: "",
    department_id: "",
    employee_id: "",
    employee_code: "",
    position_id: "",
    position_name: "",
    // Employee fields
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    phone_number: "",
    hire_date: "",
    employment_type: "FULL_TIME",
};

type FormErrors = Partial<Record<keyof CreateUserAccountForm, string>>;

interface AddUserAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

const AddUserAccountModal = ({
    isOpen,
    onClose,
    onSuccess,
    onError,
}: AddUserAccountModalProps) => {
    const [form, setForm] = useState<CreateUserAccountForm>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});

    const dateOfBirthRef = useRef<HTMLInputElement>(null);
    const hireDateRef = useRef<HTMLInputElement>(null);

    const token = useAppSelector(
        (state) => state.auth.userState?.data?.access_token
    );

    const [registerUser, { isLoading: isCreatingAccount }] = useRegisterMutation();
    const [createEmployee, { isLoading: isCreatingEmployee }] = useCreateEmployeeMutation();

    const isCreating = isCreatingAccount || isCreatingEmployee;

    const { data: departments } = useGetDepartmentsQuery({
        token: token!,
        limit: 100,
    });

    const { data: positions } = useGetPositionsQuery({
        token: token!,
        limit: 100,
    });

    const { data: employees } = useGetEmployeesQuery({
        token: token!,
        limit: 1000,
    });

    // Filter positions based on selected department (for EMPLOYEE role)
    const filteredPositions = positions?.data?.positions.filter(
        (pos: any) => !form.department_id || pos.department_id === Number(form.department_id)
    ) || [];

    // Initialize flatpickr for date fields
    useEffect(() => {
        if (!isOpen || form.suggested_role !== "EMPLOYEE") return;

        const dobPicker = dateOfBirthRef.current
            ? flatpickr(dateOfBirthRef.current, {
                dateFormat: "Y-m-d",
                maxDate: "today",
                onChange: (selectedDates) => {
                    if (selectedDates[0]) {
                        const year = selectedDates[0].getFullYear();
                        const month = String(selectedDates[0].getMonth() + 1).padStart(2, "0");
                        const day = String(selectedDates[0].getDate()).padStart(2, "0");
                        const formattedDate = `${year}-${month}-${day}`;
                        setForm((prev) => ({ ...prev, date_of_birth: formattedDate }));
                        setErrors((prev) => ({ ...prev, date_of_birth: "" }));
                    }
                },
            })
            : null;

        const hirePicker = hireDateRef.current
            ? flatpickr(hireDateRef.current, {
                dateFormat: "Y-m-d",
                onChange: (selectedDates) => {
                    if (selectedDates[0]) {
                        const year = selectedDates[0].getFullYear();
                        const month = String(selectedDates[0].getMonth() + 1).padStart(2, "0");
                        const day = String(selectedDates[0].getDate()).padStart(2, "0");
                        const formattedDate = `${year}-${month}-${day}`;
                        setForm((prev) => ({ ...prev, hire_date: formattedDate }));
                        setErrors((prev) => ({ ...prev, hire_date: "" }));
                    }
                },
            })
            : null;

        return () => {
            dobPicker?.destroy();
            hirePicker?.destroy();
        };
    }, [isOpen, form.suggested_role]);

    // ---- VALIDATION ----
    const validateForm = (values: CreateUserAccountForm): FormErrors => {
        const newErrors: FormErrors = {};

        if (!values.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            newErrors.email = "Invalid email format";
        }

        // For EMPLOYEE role (create new employee), validate employee fields
        if (values.suggested_role === "EMPLOYEE") {
            if (!values.employee_code?.trim()) {
                newErrors.employee_code = "Employee code is required";
            } else {
                // Check format: EMPxxxxxx (EMP + exactly 6 digits)
                const employeeCodePattern = /^EMP\d{6}$/;
                if (!employeeCodePattern.test(values.employee_code.trim())) {
                    newErrors.employee_code = "Employee code must be in format EMPxxxxxx (e.g., EMP000001)";
                } else {
                    // Check if employee code already exists
                    const existingCodes = employees?.data?.employees.map(
                        (emp) => emp.employee_code.toLowerCase()
                    ) || [];
                    if (existingCodes.includes(values.employee_code.trim().toLowerCase())) {
                        newErrors.employee_code = "This employee code already exists";
                    }
                }
            }
            if (!values.first_name?.trim()) {
                newErrors.first_name = "First name is required";
            }
            if (!values.last_name?.trim()) {
                newErrors.last_name = "Last name is required";
            }
            if (!values.date_of_birth) {
                newErrors.date_of_birth = "Date of birth is required";
            }
            if (!values.gender) {
                newErrors.gender = "Please select a gender";
            }
            if (!values.phone_number?.trim()) {
                newErrors.phone_number = "Phone number is required";
            }
            if (!values.department_id) {
                newErrors.department_id = "Department is required";
            }
            if (!values.position_id) {
                newErrors.position_id = "Position is required";
            }
            if (!values.hire_date) {
                newErrors.hire_date = "Hire date is required";
            }
        } else {
            // For non-EMPLOYEE roles (create account), validate account fields
            if (!values.full_name?.trim()) {
                newErrors.full_name = "Full name is required";
            }

            if (!values.password?.trim()) {
                newErrors.password = "Password is required";
            } else if (values.password.length < 8) {
                newErrors.password = "Password must be at least 8 characters";
            }

            // Validation based on role - only DEPARTMENT_MANAGER requires department
            if (values.suggested_role === "DEPARTMENT_MANAGER") {
                if (!values.department_name?.trim() && !values.department_id) {
                    newErrors.department_name = "Department is required for this role";
                }
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
        const fieldName = name as keyof CreateUserAccountForm;

        // If changing department (for EMPLOYEE role), reset position_id
        if (name === "department_id" && form.suggested_role === "EMPLOYEE") {
            setForm((prev) => ({
                ...prev,
                [fieldName]: value,
                position_id: "", // Reset position when changing department
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                [fieldName]: value,
            }));
        }

        // Auto-fill department name when department is selected (for non-EMPLOYEE roles)
        if (name === "department_id" && value && form.suggested_role !== "EMPLOYEE") {
            const selectedDept = departments?.data?.departments.find(
                (dept: any) => dept.id === Number(value)
            );
            if (selectedDept) {
                setForm((prev) => ({
                    ...prev,
                    department_id: value,
                    department_name: selectedDept.department_name,
                }));
            }
        }

        // Auto-fill position name when position is selected (for non-EMPLOYEE roles)
        if (name === "position_id" && value && form.suggested_role !== "EMPLOYEE") {
            const selectedPos = positions?.data?.positions.find(
                (pos: any) => pos.id === Number(value)
            );
            if (selectedPos) {
                setForm((prev) => ({
                    ...prev,
                    position_id: value,
                    position_name: selectedPos.position_name,
                }));
            }
        }

        // clear lỗi của field đó
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
            // For EMPLOYEE role: Create new employee using employee API
            if (form.suggested_role === "EMPLOYEE") {
                const employeePayload: any = {
                    employee_code: form.employee_code!.trim(),
                    first_name: form.first_name!.trim(),
                    last_name: form.last_name!.trim(),
                    date_of_birth: form.date_of_birth!,
                    gender: form.gender!,
                    email: form.email.trim(),
                    phone_number: form.phone_number!.trim(),
                    department_id: Number(form.department_id),
                    position_id: Number(form.position_id),
                    hire_date: form.hire_date!,
                    employment_type: form.employment_type || "FULL_TIME",
                };

                await createEmployee({
                    token,
                    body: employeePayload,
                }).unwrap();

                // Reset form và đóng modal
                setForm(initialForm);
                setErrors({});
                onClose();
                onSuccess("Create employee successfully");
            } else {
                // For other roles: Create account using register API
                const accountBody: any = {
                    email: form.email.trim(),
                    full_name: form.full_name!.trim(),
                    password: form.password!,
                    suggested_role: form.suggested_role,
                };

                // Only DEPARTMENT_MANAGER needs department info
                if (form.suggested_role === "DEPARTMENT_MANAGER") {
                    if (form.department_id) {
                        accountBody.department_id = Number(form.department_id);
                    }
                    if (form.department_name) {
                        accountBody.department_name = form.department_name;
                    }
                }

                await registerUser({
                    token,
                    body: accountBody,
                }).unwrap();

                // Reset form và đóng modal
                setForm(initialForm);
                setErrors({});
                onClose();
                onSuccess("Create user account successfully");
            }
        } catch (err: any) {
            console.error("Create failed", err);
            const backendMessage =
                (err && (err.data?.message || err.error)) ||
                (form.suggested_role === "EMPLOYEE" ? "Create employee failed" : "Create user account failed");
            onError(backendMessage);
        }
    };

    const handleClose = () => {
        setForm(initialForm);
        setErrors({});
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[700px] m-4">
            <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                        Create User Account
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Fill in the information below to create a new user account.
                    </p>
                </div>

                <form className="flex flex-col" onSubmit={handleSubmit}>
                    <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                        <div className="mt-7">
                            <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                                Account Information
                            </h5>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                {/* Common field: Email - always shown */}
                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="user@company.com"
                                        error={!!errors.email}
                                        hint={errors.email}
                                    />
                                </div>

                                {/* For non-EMPLOYEE roles: Full Name field */}
                                {form.suggested_role !== "EMPLOYEE" && (
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label>Full Name</Label>
                                        <Input
                                            type="text"
                                            name="full_name"
                                            value={form.full_name}
                                            onChange={handleChange}
                                            placeholder="Nguyễn Văn A"
                                            error={!!errors.full_name}
                                            hint={errors.full_name}
                                        />
                                    </div>
                                )}

                                {/* For non-EMPLOYEE roles: Password field */}
                                {form.suggested_role !== "EMPLOYEE" && (
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label>Password</Label>
                                        <Input
                                            type="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Min 8 characters"
                                            error={!!errors.password}
                                            hint={errors.password}
                                        />
                                    </div>
                                )}

                                {/* Role selector - always shown */}
                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Role</Label>
                                    <select
                                        name="suggested_role"
                                        value={form.suggested_role}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="HR_MANAGER">HR Manager</option>
                                        <option value="DEPARTMENT_MANAGER">Department Manager</option>
                                        <option value="EMPLOYEE">Employee</option>
                                    </select>
                                </div>

                                {/* === EMPLOYEE ROLE FIELDS === */}
                                {form.suggested_role === "EMPLOYEE" && (
                                    <>
                                        <div className="col-span-2 lg:col-span-1">
                                            <Label>Employee Code</Label>
                                            <Input
                                                type="text"
                                                name="employee_code"
                                                value={form.employee_code}
                                                onChange={handleChange}
                                                placeholder="EMP001"
                                                error={!!errors.employee_code}
                                                hint={errors.employee_code}
                                            />
                                        </div>

                                        <div className="col-span-2 lg:col-span-1">
                                            <Label>First Name</Label>
                                            <Input
                                                type="text"
                                                name="first_name"
                                                value={form.first_name}
                                                onChange={handleChange}
                                                placeholder="Nguyễn"
                                                error={!!errors.first_name}
                                                hint={errors.first_name}
                                            />
                                        </div>

                                        <div className="col-span-2 lg:col-span-1">
                                            <Label>Last Name</Label>
                                            <Input
                                                type="text"
                                                name="last_name"
                                                value={form.last_name}
                                                onChange={handleChange}
                                                placeholder="Văn A"
                                                error={!!errors.last_name}
                                                hint={errors.last_name}
                                            />
                                        </div>

                                        <div className="col-span-2 lg:col-span-1">
                                            <Label>Date of Birth</Label>
                                            <input
                                                ref={dateOfBirthRef}
                                                type="text"
                                                name="date_of_birth"
                                                value={form.date_of_birth}
                                                onChange={handleChange}
                                                placeholder="Select date"
                                                className={`h-11 w-full rounded-lg border ${
                                                    errors.date_of_birth
                                                        ? "border-error-500"
                                                        : "border-gray-300 dark:border-gray-700"
                                                } bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`}
                                            />
                                            {errors.date_of_birth && (
                                                <p className="mt-1 text-xs text-error-500">
                                                    {errors.date_of_birth}
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-span-2 lg:col-span-1">
                                            <Label>Gender</Label>
                                            <select
                                                name="gender"
                                                value={form.gender}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                            </select>
                                            {errors.gender && (
                                                <p className="mt-1 text-xs text-error-500">
                                                    {errors.gender}
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-span-2 lg:col-span-1">
                                            <Label>Phone Number</Label>
                                            <Input
                                                type="text"
                                                name="phone_number"
                                                value={form.phone_number}
                                                onChange={handleChange}
                                                placeholder="0123456789"
                                                error={!!errors.phone_number}
                                                hint={errors.phone_number}
                                            />
                                        </div>

                                        <div className="col-span-2 lg:col-span-1">
                                            <Label>Hire Date</Label>
                                            <input
                                                ref={hireDateRef}
                                                type="text"
                                                name="hire_date"
                                                value={form.hire_date}
                                                onChange={handleChange}
                                                placeholder="Select date"
                                                className={`h-11 w-full rounded-lg border ${
                                                    errors.hire_date
                                                        ? "border-error-500"
                                                        : "border-gray-300 dark:border-gray-700"
                                                } bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`}
                                            />
                                            {errors.hire_date && (
                                                <p className="mt-1 text-xs text-error-500">
                                                    {errors.hire_date}
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-span-2 lg:col-span-1">
                                            <Label>Employment Type</Label>
                                            <select
                                                name="employment_type"
                                                value={form.employment_type}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                            >
                                                <option value="FULL_TIME">Full Time</option>
                                                <option value="PART_TIME">Part Time</option>
                                                <option value="CONTRACT">Contract</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* Department field for EMPLOYEE role */}
                                {form.suggested_role === "EMPLOYEE" && (
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label>Department</Label>
                                        <select
                                            name="department_id"
                                            value={form.department_id}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                        >
                                            <option value="">Select Department</option>
                                            {departments?.data?.departments.map((dept: any) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.department_name} - {dept.department_code}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.department_id && (
                                            <p className="mt-1 text-xs text-error-500">
                                                {errors.department_id}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Position field for EMPLOYEE role */}
                                {form.suggested_role === "EMPLOYEE" && (
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label>Position</Label>
                                        <select
                                            name="position_id"
                                            value={form.position_id}
                                            onChange={handleChange}
                                            disabled={!form.department_id}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800"
                                        >
                                            <option value="">
                                                {!form.department_id 
                                                    ? "Please select department first" 
                                                    : filteredPositions.length === 0 
                                                    ? "No positions available for this department"
                                                    : "Select Position"}
                                            </option>
                                            {filteredPositions.map((pos: any) => (
                                                <option key={pos.id} value={pos.id}>
                                                    {pos.position_name} ({pos.position_code})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.position_id && (
                                            <p className="mt-1 text-xs text-error-500">
                                                {errors.position_id}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Department for DEPARTMENT_MANAGER only */}
                                {form.suggested_role === "DEPARTMENT_MANAGER" && (
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label>Department</Label>
                                        <select
                                            name="department_id"
                                            value={form.department_id}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                        >
                                            <option value="">Select Department</option>
                                            {departments?.data?.departments.map((dept: any) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.department_name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.department_name && (
                                            <p className="mt-1 text-xs text-error-500">
                                                {errors.department_name}
                                            </p>
                                        )}
                                    </div>
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
                            {isCreating ? "Creating..." : "Create User Account"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddUserAccountModal;
