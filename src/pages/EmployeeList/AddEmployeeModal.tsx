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
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: string;
  email: string;
  phone_number: string;
  department_id: string;
  position_id: string;
  manager_id: string;
  hire_date: string; // YYYY-MM-DD
  employment_type: string;
  role: string;
};

const initialForm: CreateEmployeeForm = {
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

  // (kept as in original file)
  useGetEmployeesQuery({ token: token!, limit: 100 }, { skip: !token });

  const { data: departments } = useGetDepartmentsQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const { data: positions } = useGetPositionsQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  // Role checks
  const isHRRole = form.role === "HR_MANAGER";
  const isDepartmentManagerRole = form.role === "DEPARTMENT_MANAGER";
  const isEmployeeRole = form.role === "EMPLOYEE";
  const isManagerRole = isHRRole || isDepartmentManagerRole;

  // Filter departments: 
  // - DEPARTMENT_MANAGER: only show departments without manager and id != 28
  // - EMPLOYEE: only show departments with manager_id (already has manager)
  const filteredDepartments = isDepartmentManagerRole
    ? (departments?.data?.departments || []).filter(
        (dept: any) => ((!dept.manager_id || dept.manager_id === null) && dept.id !== 28)
      )
    : isEmployeeRole
    ? (departments?.data?.departments || []).filter(
        (dept: any) => dept.manager_id && dept.manager_id !== null
      )
    : (departments?.data?.departments || []);

  // Filter positions based on selected department and role
  const filteredPositions =
    positions?.data?.positions.filter((pos: any) => {
      // Must match department
      if (!form.department_id || pos.department_id !== Number(form.department_id)) {
        return false;
      }
      // For EMPLOYEE role, only show positions with suggested_role = EMPLOYEE
      if (isEmployeeRole) {
        return pos.suggested_role === "EMPLOYEE";
      }
      return true;
    }) || [];

  // Auto-find position for manager roles
  const autoSelectedPosition = isManagerRole && form.department_id
    ? filteredPositions.find((pos: any) => pos.suggested_role === form.role)
    : null;

  // Auto-fill for HR_MANAGER role
  useEffect(() => {
    if (isHRRole) {
      setForm((prev) => ({
        ...prev,
        department_id: "28",
        position_id: "49",
      }));
      setErrors((prev) => ({ ...prev, department_id: "", position_id: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHRRole]);

  // Auto-set position when department or role changes for DEPARTMENT_MANAGER
  useEffect(() => {
    if (isDepartmentManagerRole && form.department_id) {
      if (autoSelectedPosition) {
        setForm((prev) => ({
          ...prev,
          position_id: String(autoSelectedPosition.id),
        }));
        setErrors((prev) => ({ ...prev, department_id: "", position_id: "" }));
      } else {
        setForm((prev) => ({
          ...prev,
          position_id: "",
        }));
        // Set error immediately when no position found for manager role
        setErrors((prev) => ({
          ...prev,
          department_id: `No position found with suggested role ${form.role} in selected department`,
        }));
      }
    } else if (!isManagerRole) {
      // Clear department error if not manager role
      setErrors((prev) => ({ ...prev, department_id: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.department_id, form.role, isDepartmentManagerRole, isManagerRole]);

  // ---- DATE HELPERS ----
  const parseYMD = (ymd: string) => {
    const [y, m, d] = (ymd || "").split("-").map(Number);
    if (!y || !m || !d) return null;

    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return null;

    // normalize (avoid timezone edge cases)
    dt.setHours(12, 0, 0, 0);
    return dt;
  };

  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  // ✅ Hire date must be within [today - 1 month, today]
  const isHireDateWithinLastMonth = (hireDateStr: string) => {
    const hire = parseYMD(hireDateStr);
    if (!hire) return false;

    const today = startOfDay(new Date());

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
    oneMonthAgo.setHours(0, 0, 0, 0);

    const hireDay = startOfDay(hire);

    return hireDay >= oneMonthAgo && hireDay <= today;
  };

  // ✅ Age at hire date (Hire Date - DOB >= 18 years)
  const isAtLeast18OnHireDate = (dobStr: string, hireStr: string) => {
    const dob = parseYMD(dobStr);
    const hire = parseYMD(hireStr);
    if (!dob || !hire) return false;

    // compare by calendar day
    const dobDay = startOfDay(dob);
    const hireDay = startOfDay(hire);

    let age = hireDay.getFullYear() - dobDay.getFullYear();
    const hasHadBirthdayByHire =
      hireDay.getMonth() > dobDay.getMonth() ||
      (hireDay.getMonth() === dobDay.getMonth() &&
        hireDay.getDate() >= dobDay.getDate());

    if (!hasHadBirthdayByHire) age -= 1;
    return age >= 18;
  };

  // ---- VALIDATION ----
  const validateForm = (values: CreateEmployeeForm): FormErrors => {
    const newErrors: FormErrors = {};

    if (!values.first_name.trim()) newErrors.first_name = "First name is required";
    if (!values.last_name.trim()) newErrors.last_name = "Last name is required";

    // DOB required + valid + not in future
    if (!values.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required";
    } else {
      const dob = parseYMD(values.date_of_birth);
      if (!dob) {
        newErrors.date_of_birth = "Invalid date of birth";
      } else {
        const today = startOfDay(new Date());
        if (startOfDay(dob) > today) {
          newErrors.date_of_birth = "Date of birth cannot be in the future";
        }
      }
    }

    if (!values.gender) newErrors.gender = "Please select a gender";

    if (!values.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      newErrors.email = "Invalid email format";

    // phone optional
    if (
      values.phone_number &&
      values.phone_number.trim() &&
      !/^\d{9,15}$/.test(values.phone_number.trim())
    ) {
      newErrors.phone_number = "Invalid phone number";
    }

    // Department and position are now optional (can be assigned later)
    // if (!values.department_id) newErrors.department_id = "Please select a department";
    // if (!values.position_id) {
    //   const isManager = values.role === "HR_MANAGER" || values.role === "DEPARTMENT_MANAGER";
    //   if (isManager && values.department_id) {
    //     newErrors.department_id = `No position found with suggested role ${values.role} in selected department`;
    //   } else if (!isManager) {
    //     newErrors.position_id = "Please select a position";
    //   }
    // }

    // Hire date required + valid + within last month
    if (!values.hire_date) {
      newErrors.hire_date = "Hire date is required";
    } else if (!parseYMD(values.hire_date)) {
      newErrors.hire_date = "Invalid hire date";
    } else if (!isHireDateWithinLastMonth(values.hire_date)) {
      newErrors.hire_date =
        "Hire date must be within the last 1 month (and not in the future)";
    }

    // Age rule (only if both dates valid)
    if (
      values.date_of_birth &&
      values.hire_date &&
      parseYMD(values.date_of_birth) &&
      parseYMD(values.hire_date)
    ) {
      if (!isAtLeast18OnHireDate(values.date_of_birth, values.hire_date)) {
        newErrors.date_of_birth =
          "Employee must be at least 18 years old on hire date.";
      }
    }

    if (!values.employment_type)
      newErrors.employment_type = "Employment type is required";

    return newErrors;
  };

  // Initialize flatpickr for date fields
  useEffect(() => {
    if (!isOpen) return;

    const today = startOfDay(new Date());
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const dobPicker = dateOfBirthRef.current
      ? flatpickr(dateOfBirthRef.current, {
          dateFormat: "Y-m-d",
          maxDate: today, // ✅ DOB cannot be in future
          onChange: (selectedDates) => {
            if (selectedDates[0]) {
              const d = selectedDates[0];
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
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
          minDate: oneMonthAgo, // ✅ within last month
          maxDate: today,       // ✅ not in future
          onChange: (selectedDates) => {
            if (selectedDates[0]) {
              const d = selectedDates[0];
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof CreateEmployeeForm;

    if (name === "role") {
      // Reset department_id and position_id when role changes
      setForm((prev) => ({
        ...prev,
        [fieldName]: value,
        department_id: "",
        position_id: "",
      }));
      setErrors((prev) => ({ ...prev, role: "", department_id: "", position_id: "" }));
    } else if (name === "department_id") {
      setForm((prev) => ({
        ...prev,
        [fieldName]: value,
        position_id: "",
      }));
      setErrors((prev) => ({ ...prev, department_id: "", position_id: "" }));
    } else {
      setForm((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: any = {
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

    if (form.manager_id) payload.manager_id = Number(form.manager_id);

    try {
      await createEmployee({ token, body: payload }).unwrap();

      setForm(initialForm);
      setErrors({});
      onClose();
      onSuccess("Create employee successfully");
    } catch (err: any) {
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
                  <Label>
                    First Name <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    Last Name <span className="text-red-500">*</span>
                  </Label>
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

                <div className="col-span-2 lg:col-span-1">
                  <Label>
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    Gender <span className="text-red-500">*</span>
                  </Label>
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
                    <p className="mt-1 text-xs text-error-500">{errors.gender}</p>
                  )}
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>
                    Email <span className="text-red-500">*</span>
                  </Label>
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

                {!isHRRole && (
                  <div className="col-span-2 lg:col-span-1">
                    <Label>
                      Department
                    </Label>
                    <select
                      name="department_id"
                      value={form.department_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Department</option>
                      {filteredDepartments.map((dept: any) => (
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

                {!isHRRole && !isDepartmentManagerRole && (
                  <div className="col-span-2 lg:col-span-1">
                    <Label>
                      Position
                    </Label>
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

                <div className="col-span-2 lg:col-span-1">
                  <Label>
                    Hire Date <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>
                    Employment Type <span className="text-red-500">*</span>
                  </Label>
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
                  {errors.employment_type && (
                    <p className="mt-1 text-xs text-error-500">
                      {errors.employment_type}
                    </p>
                  )}
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
