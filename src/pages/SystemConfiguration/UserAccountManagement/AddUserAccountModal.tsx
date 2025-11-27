import { useState, FormEvent, ChangeEvent } from "react";
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
} from "../../../redux/api/employeeApiSlice";

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
};

const initialForm: CreateUserAccountForm = {
    email: "",
    full_name: "",
    password: "",
    suggested_role: "EMPLOYEE",
    department_name: "",
    department_id: "",
    employee_id: "",
    employee_code: "",
    position_id: "",
    position_name: "",
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

    const token = useAppSelector(
        (state) => state.auth.userState?.data?.access_token
    );

    const [registerUser, { isLoading: isCreating }] = useRegisterMutation();

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

    // ---- VALIDATION ----
    const validateForm = (values: CreateUserAccountForm): FormErrors => {
        const newErrors: FormErrors = {};

        if (!values.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!values.full_name.trim()) {
            newErrors.full_name = "Full name is required";
        }

        if (!values.password.trim()) {
            newErrors.password = "Password is required";
        } else if (values.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        // Validation based on role
        if (values.suggested_role === "HR_MANAGER" || values.suggested_role === "DEPARTMENT_MANAGER") {
            if (!values.department_name?.trim() && !values.department_id) {
                newErrors.department_name = "Department is required for this role";
            }
        }

        if (values.suggested_role === "EMPLOYEE") {
            if (!values.employee_id) {
                newErrors.employee_id = "Employee is required for EMPLOYEE role";
            }
            if (!values.department_id) {
                newErrors.department_id = "Department is required for EMPLOYEE role";
            }
            if (!values.position_id) {
                newErrors.position_id = "Position is required for EMPLOYEE role";
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

        setForm((prev) => ({
            ...prev,
            [fieldName]: value,
        }));

        // Auto-fill employee data when employee is selected
        if (name === "employee_id" && value) {
            const selectedEmployee = employees?.data?.employees.find(
                (emp: any) => emp.id === Number(value)
            );
            if (selectedEmployee) {
                setForm((prev) => ({
                    ...prev,
                    employee_id: value,
                    employee_code: selectedEmployee.employee_code,
                    department_id: String(selectedEmployee.department_id),
                    department_name: selectedEmployee.department_name,
                    position_id: String(selectedEmployee.position_id),
                    position_name: selectedEmployee.position_name,
                }));
            }
        }

        // Auto-fill department name when department is selected
        if (name === "department_id" && value) {
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

        // Auto-fill position name when position is selected
        if (name === "position_id" && value) {
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
            // Build request body based on role
            const body: any = {
                email: form.email.trim(),
                full_name: form.full_name.trim(),
                password: form.password,
                suggested_role: form.suggested_role,
            };

            if (form.suggested_role === "HR_MANAGER" || form.suggested_role === "DEPARTMENT_MANAGER") {
                if (form.department_id) {
                    body.department_id = Number(form.department_id);
                }
                if (form.department_name) {
                    body.department_name = form.department_name;
                }
            }

            if (form.suggested_role === "EMPLOYEE") {
                body.employee_id = Number(form.employee_id);
                body.employee_code = form.employee_code;
                body.department_id = Number(form.department_id);
                body.department_name = form.department_name;
                body.position_id = Number(form.position_id);
                body.position_name = form.position_name;
            }

            await registerUser({
                token,
                body,
            }).unwrap();

            // Reset form và đóng modal
            setForm(initialForm);
            setErrors({});
            onClose();
            onSuccess("Create user account successfully");
        } catch (err: any) {
            console.error("Create user account failed", err);
            const backendMessage =
                (err && (err.data?.message || err.error)) ||
                "Create user account failed";
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

                                {/* Show employee selector for EMPLOYEE role */}
                                {form.suggested_role === "EMPLOYEE" && (
                                    <div className="col-span-2">
                                        <Label>Link to Employee</Label>
                                        <select
                                            name="employee_id"
                                            value={form.employee_id}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                        >
                                            <option value="">Select Employee</option>
                                            {employees?.data?.employees.map((emp: any) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.employee_code} - {emp.first_name} {emp.last_name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.employee_id && (
                                            <p className="mt-1 text-xs text-error-500">
                                                {errors.employee_id}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Show department for HR_MANAGER, DEPARTMENT_MANAGER, and EMPLOYEE */}
                                {(form.suggested_role === "HR_MANAGER" ||
                                    form.suggested_role === "DEPARTMENT_MANAGER" ||
                                    form.suggested_role === "EMPLOYEE") && (
                                        <div className="col-span-2 lg:col-span-1">
                                            <Label>Department</Label>
                                            <select
                                                name="department_id"
                                                value={form.department_id}
                                                onChange={handleChange}
                                                disabled={form.suggested_role === "EMPLOYEE"}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 disabled:opacity-50"
                                            >
                                                <option value="">Select Department</option>
                                                {departments?.data?.departments.map((dept: any) => (
                                                    <option key={dept.id} value={dept.id}>
                                                        {dept.department_name}
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

                                {/* Show position for EMPLOYEE */}
                                {form.suggested_role === "EMPLOYEE" && (
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label>Position</Label>
                                        <select
                                            name="position_id"
                                            value={form.position_id}
                                            onChange={handleChange}
                                            disabled={true}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 disabled:opacity-50"
                                        >
                                            <option value="">Select Position</option>
                                            {positions?.data?.positions.map((pos: any) => (
                                                <option key={pos.id} value={pos.id}>
                                                    {pos.position_name}
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

                                {/* Show employee code for EMPLOYEE (read-only) */}
                                {form.suggested_role === "EMPLOYEE" && form.employee_code && (
                                    <div className="col-span-2 lg:col-span-1">
                                        <Label>Employee Code</Label>
                                        <Input
                                            type="text"
                                            name="employee_code"
                                            value={form.employee_code}
                                            disabled
                                            className="opacity-50"
                                        />
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
