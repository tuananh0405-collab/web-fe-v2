import {
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
} from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import {
  useGetDepartmentsQuery,
  useGetPositionsQuery,
  useAssignDepartmentMutation,
  useAssignPositionMutation,
} from "../../redux/api/employeeApiSlice";
import { useAppSelector } from "../../redux/hook";
import { useUpdateAccountByIdMutation } from "../../redux/api/authApiSlice";
import Alert from "../ui/alert/Alert";

interface UserInfoCardProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    department_name: string;
    position_name: string;
    status: string;
    department_id: string;
    position_id: string;
    employee_id: string;
    employee_code: string;
  };
}

interface FormState {
  full_name: string;
  role: string;
  email: string;
  department_id: string;
  position_id: string;
  status: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function UserInfoCard({ user }: UserInfoCardProps) {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );
  const loggedInEmployeeId = useAppSelector(
    (state) => state.auth.userState?.data?.user?.employee_id
  );

  const { isOpen, openModal, closeModal } = useModal();

  const [page] = useState(1);
  const limit = 10;

  // State lưu dữ liệu user hiện tại (để hiển thị)
  const [currentUser, setCurrentUser] = useState(user);

  // Sync khi prop user thay đổi
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Lấy danh sách phòng ban & vị trí
  const {
    data: departments,
    isLoading: isLoadingDepartments,
  } = useGetDepartmentsQuery(
    { token: token!, page, limit },
    { skip: !token }
  );

  const {
    data: positions,
    isLoading: isLoadingPositions,
  } = useGetPositionsQuery(
    { token: token!, page: 1, limit: 100 },
    { skip: !token }
  );

  const [updateAccountById] = useUpdateAccountByIdMutation();
  const [assignDepartment] = useAssignDepartmentMutation();
  const [assignPosition] = useAssignPositionMutation();

  const [formData, setFormData] = useState<FormState>({
    full_name: currentUser.full_name,
    role: currentUser.role,
    email: currentUser.email,
    department_id: currentUser.department_id,
    position_id: currentUser.position_id,
    status: currentUser.status,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const [alert, setAlert] = useState<
    null | { type: "success" | "error"; message: string }
  >(null);

  // ---- VALIDATION ----
  const validate = (values: FormState): FormErrors => {
    const newErrors: FormErrors = {};

    if (!values.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!values.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!values.role) {
      newErrors.role = "Role is required";
    }

    if (!values.department_id) {
      newErrors.department_id = "Department is required";
    }

    if (!values.position_id) {
      newErrors.position_id = "Position is required";
    }

    if (!values.status) {
      newErrors.status = "Status is required";
    }

    return newErrors;
  };

  // Handle form changes
  const handleChange = (
    e: ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormState;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear lỗi của field đang đổi
    setErrors((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  // Handle form submission
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const selectedDepartment = departments?.data?.departments.find(
        (d: any) => String(d.id) === String(formData.department_id)
      );
      const selectedPosition = positions?.data?.positions.find(
        (p: any) => String(p.id) === String(formData.position_id)
      );

      const employeeId = Number(currentUser.employee_id) || null;
      const newDeptId = Number(formData.department_id);
      const newPosId = Number(formData.position_id);

      // 1. Update account info (email, full_name, role, status, *name* của dept/position)
      await updateAccountById({
        id: user.id,
        body: {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          status: formData.status,
          department_name:
            selectedDepartment?.department_name ?? currentUser.department_name,
          position_name:
            selectedPosition?.position_name ?? currentUser.position_name,
          employee_code: currentUser.employee_code,
        },
      }).unwrap();

      // 2. Assign Department nếu đổi phòng ban
      if (
        employeeId &&
        newDeptId &&
        String(formData.department_id) !== String(currentUser.department_id)
      ) {
        await assignDepartment({
          token,
          id: employeeId,
          body: {
            department_id: newDeptId,
            assigned_by: Number(loggedInEmployeeId) || employeeId,
          },
        }).unwrap();
      }

      // 3. Assign Position nếu đổi vị trí
      if (
        employeeId &&
        newPosId &&
        String(formData.position_id) !== String(currentUser.position_id)
      ) {
        await assignPosition({
          token,
          id: employeeId,
          body: {
            position_id: newPosId,
            assigned_by: Number(loggedInEmployeeId) || employeeId,
          },
        }).unwrap();
      }

      // ✅ Cập nhật lại state local cho UI
      setCurrentUser({
        ...currentUser,
        full_name: formData.full_name,
        role: formData.role,
        email: formData.email,
        status: formData.status,
        department_id: formData.department_id,
        position_id: formData.position_id,
        department_name:
          selectedDepartment?.department_name ?? currentUser.department_name,
        position_name:
          selectedPosition?.position_name ?? currentUser.position_name,
      });

      closeModal();
      setAlert({
        type: "success",
        message: "Update user successfully",
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      setAlert({
        type: "error",
        message:
          error?.data?.message || "Update user failed, please try again",
      });
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Full Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {currentUser.full_name}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Role
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {currentUser.role}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {currentUser.email}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Department
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {currentUser.department_name}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Position
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {currentUser.position_name}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      {/* MODAL EDIT */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update user's profile information below.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleSave}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      error={!!errors.full_name}
                      hint={errors.full_name}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Role</Label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select role</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="HR_MANAGER">HR_MANAGER</option>
                      <option value="DEPARTMENT_MANAGER">
                        DEPARTMENT_MANAGER
                      </option>
                      <option value="EMPLOYEE">EMPLOYEE</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-xs text-error-500">
                        {errors.role}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      hint={errors.email}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Department</Label>
                    <select
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select department</option>
                      {isLoadingDepartments ? (
                        <option>Loading...</option>
                      ) : (
                        departments?.data?.departments.map(
                          (department: any) => (
                            <option key={department.id} value={department.id}>
                              {department.department_name}
                            </option>
                          )
                        )
                      )}
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
                      value={formData.position_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select position</option>
                      {isLoadingPositions ? (
                        <option>Loading...</option>
                      ) : (
                        positions?.data?.positions.map((position: any) => (
                          <option key={position.id} value={position.id}>
                            {position.position_name}
                          </option>
                        ))
                      )}
                    </select>
                    {errors.position_id && (
                      <p className="mt-1 text-xs text-error-500">
                        {errors.position_id}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Status</Label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select status</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                    {errors.status && (
                      <p className="mt-1 text-xs text-error-500">
                        {errors.status}
                      </p>
                    )}
                  </div>
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

              <Button size="sm">Save Changes</Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL ALERT */}
      <Modal
        isOpen={!!alert}
        onClose={() => setAlert(null)}
        className="max-w-md m-4"
      >
        <div className="w-full p-6">
          {alert && (
            <>
              <Alert
                variant={alert.type}
                title={alert.type === "success" ? "Success" : "Failed"}
                message={alert.message}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAlert(null)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
