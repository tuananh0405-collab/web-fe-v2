import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useAppSelector } from "../../redux/hook";
import {
  useCreateEmployeeMutation,
  useGetDepartmentsQuery,
  useGetPositionsQuery,
  useGetEmployeesQuery,
} from "../../redux/api/employeeApiSlice";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

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
  role: string;
};

const initialForm: CreateEmployeeForm = {
  employee_code: "",
  first_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  email: "",
  phone_number: "",
  department_id: "",
  position_id: "",
  manager_id: "",
  hire_date: "",
  employment_type: "FULL_TIME",
  role: "EMPLOYEE",
};

type FormErrors = Partial<Record<keyof CreateEmployeeForm, string>>;

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AddEmployeeModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AddEmployeeModalProps) => {
  const [form, setForm] = useState<CreateEmployeeForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const dateOfBirthRef = useRef<HTMLInputElement>(null);
  const hireDateRef = useRef<HTMLInputElement>(null);

  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [createEmployee, { isLoading: isCreating }] =
    useCreateEmployeeMutation();

  const { data: employees } = useGetEmployeesQuery({
    token: token!,
    limit: 100,
  });

  const { data: departments } = useGetDepartmentsQuery({
    token: token!,
    limit: 100,
  });

  const { data: positions } = useGetPositionsQuery({
    token: token!,
    limit: 100,
  });

  // Filter positions based on selected department
  const filteredPositions = positions?.data?.positions.filter(
    (pos: any) => !form.department_id || pos.department_id === Number(form.department_id)
  ) || [];

  // Initialize flatpickr for date fields
  useEffect(() => {
    if (!isOpen) return;
const eighteenYearsAgo = new Date();
eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    const dobPicker = dateOfBirthRef.current
      ? flatpickr(dateOfBirthRef.current, {
          dateFormat: "Y-m-d",
          maxDate: eighteenYearsAgo,
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
  }, [isOpen]);

  // ---- VALIDATION ----
const isAtLeast18 = (dobStr: string) => {
  // dobStr: "YYYY-MM-DD"
  const [y, m, d] = dobStr.split("-").map(Number);
  if (!y || !m || !d) return false;

  const dob = new Date(y, m - 1, d);
  if (Number.isNaN(dob.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasHadBirthdayThisYear) age -= 1;
  return age >= 18;
};

const validateForm = (values: CreateEmployeeForm): FormErrors => {
  const newErrors: FormErrors = {};

  // employee_code
  if (!values.employee_code.trim()) {
    newErrors.employee_code = "Employee code is required";
  } else {
    const existingCodes =
      employees?.data?.employees.map((emp) =>
        emp.employee_code.toLowerCase()
      ) || [];
    if (existingCodes.includes(values.employee_code.trim().toLowerCase())) {
      newErrors.employee_code = "This employee code already exists";
    }
  }

  // first_name
  if (!values.first_name.trim()) newErrors.first_name = "First name is required";

  // last_name
  if (!values.last_name.trim()) newErrors.last_name = "Last name is required";

  // date_of_birth + >=18
  if (!values.date_of_birth) {
    newErrors.date_of_birth = "Date of birth is required";
  } else if (!isAtLeast18(values.date_of_birth)) {
    newErrors.date_of_birth = "Employee must be at least 18 years old";
  }

  // gender
  if (!values.gender) newErrors.gender = "Please select a gender";

  // email
  if (!values.email.trim()) {
    newErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    newErrors.email = "Invalid email format";
  }

  // phone_number: OPTIONAL ✅
  // if (values.phone_number && values.phone_number.trim() && !/^\d{9,15}$/.test(values.phone_number.trim())) {
  //   newErrors.phone_number = "Invalid phone number";
  // }

  // department_id
  if (!values.department_id) newErrors.department_id = "Please select a department";

  // position_id
  if (!values.position_id) newErrors.position_id = "Please select a position";

  // hire_date
  if (!values.hire_date) newErrors.hire_date = "Hire date is required";

  // employment_type (nếu muốn bắt buộc)
  if (!values.employment_type) newErrors.employment_type = "Employment type is required";

  return newErrors;
};


  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof CreateEmployeeForm;

    // Nếu thay đổi department, reset position_id
    if (name === "department_id") {
      setForm((prev) => ({
        ...prev,
        [fieldName]: value,
        position_id: "", // Reset position khi đổi department
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    }

    // clear lỗi của field đó
    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("🔥 handleSubmit CALLED!");
    console.log("Token exists?", !!token);
    
    if (!token) {
      console.log("❌ No token, returning early");
      return;
    }

    console.log("📝 Running validation...");
    const validationErrors = validateForm(form);
    console.log("Validation errors:", validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      console.log("❌ Validation failed, setting errors");
      setErrors(validationErrors);
      return;
    }
    
    console.log("✅ Validation passed!");

    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form values:", form);
    console.log("Department ID from form:", form.department_id, typeof form.department_id);
    console.log("Department ID converted to number:", Number(form.department_id));
    
    // Find the selected department to verify
    const selectedDept = departments?.data?.departments.find((d: any) => d.id === Number(form.department_id));
    console.log("Selected department object:", selectedDept);

    const payload: any = {
      employee_code: form.employee_code.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      department_id: Number(form.department_id),
      position_id: Number(form.position_id),
      hire_date: form.hire_date,
      employment_type: form.employment_type,
      suggested_role: form.role,
    };
    
    // Only include manager_id if provided
    if (form.manager_id) {
      payload.manager_id = Number(form.manager_id);
    }
    
    console.log("Payload to be sent:", payload);

    try {
      const result = await createEmployee({
        token,
        body: payload,
      }).unwrap();
      
      console.log("API Response:", result);

      // Reset form và đóng modal
      setForm(initialForm);
      setErrors({});
      onClose();
      onSuccess("Create employee successfully");
    } catch (err: any) {
      console.error("Create employee failed", err);
      const backendMessage =
        (err && (err.data?.message || err.error)) || "Create employee failed";
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
            Create Employee
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Fill in the information below to create a new employee.
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
                  <Label>Employee Code <span className="text-red-500">*</span></Label>
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
                  <Label>First Name <span className="text-red-500">*</span></Label>
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
                  <Label>Last Name <span className="text-red-500">*</span></Label>
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
                  <Label>Date of Birth <span className="text-red-500">*</span></Label>
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
                  <Label>Gender <span className="text-red-500">*</span></Label>
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
                  <Label>Email <span className="text-red-500">*</span></Label>
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
                  <Label>Department <span className="text-red-500">*</span></Label>
                  <select 
                    name="department_id"
                    value={form.department_id}
                    onChange={(e) => {
                      console.log("Department selected - value:", e.target.value);
                      handleChange(e);
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Department</option>
                    {departments?.data?.departments.map((dept: any) => {
                      // console.log("Department option:", dept.id, dept.department_name);
                      return (
                        <option key={dept.id} value={dept.id}>
                          {dept.department_name} - {dept.department_code}
                        </option>
                      );
                    })}
                  </select>
                  {errors.department_id && (
                    <p className="mt-1 text-xs text-error-500">
                      {errors.department_id}
                    </p>
                  )}
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Position <span className="text-red-500">*</span></Label>
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

                {/* <div className="col-span-2 lg:col-span-1">
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
                </div> */}

                <div className="col-span-2 lg:col-span-1">
                  <Label>Hire Date <span className="text-red-500">*</span></Label>
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
                  <Label>Employment Type <span className="text-red-500">*</span></Label>
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

                <div className="col-span-2 lg:col-span-1">
                  <Label>Role</Label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="DEPARTMENT_MANAGER">Department Manager</option>
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
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddEmployeeModal;
