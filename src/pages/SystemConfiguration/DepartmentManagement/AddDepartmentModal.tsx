import { useState, FormEvent, ChangeEvent } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { useAppSelector } from "../../../redux/hook";
import {
    useCreateDepartmentMutation,
    useGetManagersQuery,
} from "../../../redux/api/employeeApiSlice";

type CreateDepartmentForm = {
    department_code: string;
    department_name: string;
    description: string;
    parent_department_id: string;
    manager_id: string;
    office_address: string;
    office_latitude: string;
    office_longitude: string;
    office_radius_meters: string;
};

const initialForm: CreateDepartmentForm = {
    department_code: "",
    department_name: "",
    description: "",
    parent_department_id: "",
    manager_id: "",
    office_address: "",
    office_latitude: "",
    office_longitude: "",
    office_radius_meters: "",
};

type FormErrors = Partial<Record<keyof CreateDepartmentForm, string>>;

interface AddDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

const AddDepartmentModal = ({
    isOpen,
    onClose,
    onSuccess,
    onError,
}: AddDepartmentModalProps) => {
    const [form, setForm] = useState<CreateDepartmentForm>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});

    const token = useAppSelector(
        (state) => state.auth.userState?.data?.access_token
    );

    const [createDepartment, { isLoading: isCreating }] =
        useCreateDepartmentMutation();

    const { data: managers } = useGetManagersQuery({
        token: token!,
    });

    // ---- VALIDATION ----
    const validateForm = (values: CreateDepartmentForm): FormErrors => {
        const newErrors: FormErrors = {};

        if (!values.department_code.trim()) {
            newErrors.department_code = "Department code is required";
        }
        if (!values.department_name.trim()) {
            newErrors.department_name = "Department name is required";
        }
        if (!values.office_address.trim()) {
            newErrors.office_address = "Office address is required";
        }

        if (values.office_latitude && isNaN(Number(values.office_latitude))) {
            newErrors.office_latitude = "Latitude must be a number";
        }
        if (values.office_longitude && isNaN(Number(values.office_longitude))) {
            newErrors.office_longitude = "Longitude must be a number";
        }
        if (
            values.office_radius_meters &&
            (isNaN(Number(values.office_radius_meters)) ||
                Number(values.office_radius_meters) <= 0)
        ) {
            newErrors.office_radius_meters =
                "Office radius must be a positive number";
        }

        return newErrors;
    };

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        const fieldName = name as keyof CreateDepartmentForm;

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
            await createDepartment({
                token,
                body: {
                    department_code: form.department_code.trim(),
                    department_name: form.department_name.trim(),
                    description: form.description || null,
                    parent_department_id:
                        form.parent_department_id === ""
                            ? null
                            : Number(form.parent_department_id),
                    manager_id:
                        form.manager_id === "" ? null : Number(form.manager_id),
                    office_address: form.office_address.trim() || null,
                    office_latitude:
                        form.office_latitude === ""
                            ? null
                            : Number(form.office_latitude),
                    office_longitude:
                        form.office_longitude === ""
                            ? null
                            : Number(form.office_longitude),
                    office_radius_meters:
                        form.office_radius_meters === ""
                            ? null
                            : Number(form.office_radius_meters),
                },
            }).unwrap();

            // Reset form và đóng modal
            setForm(initialForm);
            setErrors({});
            onClose();
            onSuccess("Create department successfully");
        } catch (err: any) {
            console.error("Create department failed", err);
            const backendMessage =
                (err && (err.data?.message || err.error)) ||
                "Create department failed";
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
                        Create Department
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                        Fill in the information below to create a new department.
                    </p>
                </div>

                <form className="flex flex-col" onSubmit={handleSubmit}>
                    <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                        <div className="mt-7">
                            <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                                Department Information
                            </h5>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Department Code</Label>
                                    <Input
                                        type="text"
                                        name="department_code"
                                        value={form.department_code}
                                        onChange={handleChange}
                                        placeholder="IT-002"
                                        error={!!errors.department_code}
                                        hint={errors.department_code}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Department Name</Label>
                                    <Input
                                        type="text"
                                        name="department_name"
                                        value={form.department_name}
                                        onChange={handleChange}
                                        placeholder="Information Technology"
                                        error={!!errors.department_name}
                                        hint={errors.department_name}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <Label>Description</Label>
                                    <Input
                                        type="text"
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="IT Department handles all technology related matters"
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Parent Department ID</Label>
                                    <Input
                                        type="number"
                                        name="parent_department_id"
                                        value={form.parent_department_id}
                                        onChange={handleChange}
                                        placeholder="(optional)"
                                    />
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

                                <div className="col-span-2">
                                    <Label>Office Address</Label>
                                    <Input
                                        type="text"
                                        name="office_address"
                                        value={form.office_address}
                                        onChange={handleChange}
                                        placeholder="Floor 4, Building B"
                                        error={!!errors.office_address}
                                        hint={errors.office_address}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Office Latitude</Label>
                                    <Input
                                        type="number"
                                        name="office_latitude"
                                        value={form.office_latitude}
                                        onChange={handleChange}
                                        placeholder="10.123456"
                                        error={!!errors.office_latitude}
                                        hint={errors.office_latitude}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Office Longitude</Label>
                                    <Input
                                        type="number"
                                        name="office_longitude"
                                        value={form.office_longitude}
                                        onChange={handleChange}
                                        placeholder="106.789012"
                                        error={!!errors.office_longitude}
                                        hint={errors.office_longitude}
                                    />
                                </div>

                                <div className="col-span-2 lg:col-span-1">
                                    <Label>Office Radius (meters)</Label>
                                    <Input
                                        type="number"
                                        name="office_radius_meters"
                                        value={form.office_radius_meters}
                                        onChange={handleChange}
                                        placeholder="100"
                                        error={!!errors.office_radius_meters}
                                        hint={errors.office_radius_meters}
                                    />
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
                            {isCreating ? "Creating..." : "Create Department"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddDepartmentModal;
