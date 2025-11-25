import { useState, FormEvent, ChangeEvent } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { useAppSelector } from "../../../redux/hook";
import {
    useCreateEmployeeMutation,
    useGetDepartmentsQuery,
    useGetPositionsQuery,
    useGetManagersQuery,
} from "../../../redux/api/employeeApiSlice";

type CreateEmployeeForm = {
    employee_code: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    email: string;
    phone_number: string;
    department_id: string;
    position_id: string;
    manager_id: string;
    hire_date: string;
    employment_type: string;
};

const initialForm: CreateEmployeeForm = {
    employee_code: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "MALE",
    email: "",
    phone_number: "",
    department_id: "",
    position_id: "",
    manager_id: "",
    hire_date: "",
    employment_type: "FULL_TIME",
};

type FormErrors = Partial<Record<keyof CreateEmployeeForm, string>>;

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
    const [form, setForm] = useState<CreateEmployeeForm>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});

    const token = useAppSelector(
        (state) => state.auth.userState?.data?.access_token
    );

    const [createEmployee, { isLoading: isCreating }] =
        useCreateEmployeeMutation();

    const { data: departments } = useGetDepartmentsQuery({
        token: token!,
        limit: 100,
    });

    const { data: positions } = useGetPositionsQuery({
        token: token!,
        limit: 100,
    });

    const { data: managers } = useGetManagersQuery({
        token: token!,
    });

    // ---- VALIDATION ----
    const validateForm = (values: CreateEmployeeForm): FormErrors => {
        const newErrors: FormErrors = {};

        if (!values.employee_code.trim()) {
            newErrors.employee_code = "Employee code is required";
        }
        if (!values.first_name.trim()) {
            newErrors.first_name = "First name is required";
        }
        if (!values.last_name.trim()) {
            newErrors.last_name = "Last name is required";
        }
        if (!values.date_of_birth) {
            newErrors.date_of_birth = "Date of birth is required";
        }
        if (!values.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            newErrors.email = "Invalid email format";
        }
        if (!values.phone_number.trim()) {
            newErrors.phone_number = "Phone number is required";
        }
        if (!values.department_id) {
            newErrors.department_id = "Please select a department";
        }
        if (!values.position_id) {
            newErrors.position_id = "Please select a position";
        }
        if (!values.manager_id) {
            newErrors.manager_id = "Please select a manager";
        }
        if (!values.hire_date) {
            newErrors.hire_date = "Hire date is required";
        }

        return newErrors;
    };

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        const fieldName = name as keyof CreateEmployeeForm;

        setForm((prev) => ({
            ...prev,
            [fieldName]: value,
        }));

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
            await createEmployee({
                token,
                body: {
                    employee_code: form.employee_code.trim(),
                    first_name: form.first_name.trim(),
                    last_name: form.last_name.trim(),
                    date_of_birth: form.date_of_birth,
                    gender: form.gender,
                    email: form.email.trim(),
                    phone_number: form.phone_number.trim(),
                    department_id: Number(form.department_id),
                    position_id: Number(form.position_id),
                    manager_id: Number(form.manager_id),
                    hire_date: form.hire_date,
                    employment_type: form.employment_type,
                },
            }).unwrap();

            // Reset form và đóng modal
            setForm(initialForm);
            setErrors({});
            onClose();
            onSuccess("Create employee successfully");
        } catch (err: any) {
            console.error("Create employee failed", err);
            const backendMessage =
                (err && (err.data?.message || err.error)) ||
                "Create employee failed";
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
                                Employee Information
                            </h5>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
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
                                    <Input
                                        type="date"
                                        name="date_of_birth"
                                        value={form.date_of_birth}
                                        onChange={handleChange}
                                        error={!!errors.date_of_birth}
                                        hint={errors.date_of_birth}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Gender</Label>
                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                    >
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="a@company.com"
                                        error={!!errors.email}
                                        hint={errors.email}
                                    />
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
                                    {errors.department_id && (
                                        <p className="mt-1 text-xs text-error-500">
                                            {errors.department_id}
                                        </p>
                                    )}
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Position</Label>
                                    <select
                                        name="position_id"
                                        value={form.position_id}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
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

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Manager</Label>
                                    <select
                                        name="manager_id"
                                        value={form.manager_id}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                    >
                                        <option value="">Select Manager</option>
                                        {managers?.data?.managers.map((manager: any) => (
                                            <option key={manager.id} value={manager.id}>
                                                {manager.full_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.manager_id && (
                                        <p className="mt-1 text-xs text-error-500">
                                            {errors.manager_id}
                                        </p>
                                    )}
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Hire Date</Label>
                                    <Input
                                        type="date"
                                        name="hire_date"
                                        value={form.hire_date}
                                        onChange={handleChange}
                                        error={!!errors.hire_date}
                                        hint={errors.hire_date}
                                    />
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
                                        <option value="INTERN">Intern</option>
                                    </select>
                                </div>
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
