import React, { useEffect, useState, FormEvent, ChangeEvent } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAppSelector } from "../../redux/hook";
import { useParams } from "react-router";
import {
  useGetDepartmentByIdQuery,
  useGetDepartmentsQuery,
  useGetEmployeeByIdQuery,
  useGetManagersQuery,
  useGetPositionByIdQuery,
  useGetPositionsQuery,
  useUpdateEmployeeMutation,
} from "../../redux/api/employeeApiSlice";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import UserContractCard from "../../components/UserProfile/UserContractCard";

type UpdateEmployeeForm = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone_number: string;
  personal_email: string;
  department_id: string;
  position_id: string;
  manager_id: string;
  hire_date: string;
  employment_type: string;
  status: string;
};

const EmployeeDetail = () => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );
  const { id } = useParams<{ id: string }>();

  const {
    data: employee,
    isLoading,
    isError,
  } = useGetEmployeeByIdQuery(
    { token: token!, id: id! },
    { skip: !token || !id }
  );
  console.log('====================================');
  console.log(employee);
  console.log('====================================');
const departmentId = employee?.data?.department_id;
const positionId = employee?.data?.position_id;

const { data: department } = useGetDepartmentByIdQuery(
  { token: token!, id: departmentId as number },
  { skip: !token || !departmentId }
);

const { data: position } = useGetPositionByIdQuery(
  { token: token!, id: positionId as number },
  { skip: !token || !positionId }
);
const { data: positionsRes, isLoading: isLoadingPositions } =
  useGetPositionsQuery(
    { token: token!, page: 1, limit: 100 },
    { skip: !token }
  );

const positions = positionsRes?.data?.positions ?? [];
const { data: managers, isLoading: isLoadingManagers } = useGetManagersQuery({ token: token! });


  const [page, setPage] = useState(1);
  const limit = 10; // hoặc 5/20 tuỳ ý

  const { data, isLoading: isLoadingDepartments, error } = useGetDepartmentsQuery(
    { token: token!, page, limit },
    { skip: !token }
  );

  const departments = data?.data?.departments ?? [];

  const { isOpen, openModal, closeModal } = useModal();
  const [updateEmployee, { isLoading: isUpdating }] =
    useUpdateEmployeeMutation();

  const [form, setForm] = useState<UpdateEmployeeForm | null>(null);

  useEffect(() => {
    if (employee) {
      setForm({
        first_name: employee.data.first_name,
        last_name: employee.data.last_name,
        date_of_birth: employee.data.date_of_birth,
        gender: employee.data.gender,
        email: employee.data.email,
        phone_number: employee.data.phone_number ?? "",
        personal_email: employee.data.personal_email ?? "",
        department_id: String(employee.data.department_id),
        position_id: String(employee.data.position_id),
        manager_id: employee.data.manager_id ? String(employee.data.manager_id) : "",
        hire_date: employee.data.hire_date,
        employment_type: employee.data.employment_type,
        status: employee.data.status,
      });
    }
  }, [employee]);

  if (isLoading || !employee || !form)
    return <p className="p-4 text-center">Loading user profile...</p>;
  if (isError)
    return (
      <p className="p-4 text-center text-red-500">
        Failed to load user profile 😢
      </p>
    );

  const status = employee.status;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            [name]: value,
          }
    );
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !id || !employee || !form) return;
    try {
      await updateEmployee({
        token,
        id,
        body: {
          // các field editable từ form
          first_name: form.first_name,
          last_name: form.last_name,
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          email: form.email,
          phone_number: form.phone_number || null,
          personal_email: form.personal_email || null,
          department_id: Number(form.department_id),
          position_id: Number(form.position_id),
          manager_id: form.manager_id ? Number(form.manager_id) : null,
          hire_date: form.hire_date,
          employment_type: form.employment_type,
          status: form.status,

          // các field còn lại lấy từ bản hiện tại của employee
          national_id: employee.data.national_id,
          address: employee.data.address || {},
          termination_date: employee.data.termination_date,
          termination_reason: employee.data.termination_reason,
          emergency_contact: employee.data.emergency_contact || {},
          // onboarding_status: employee.data.onboarding_status,
          profile_completion_percentage:
            employee.data.profile_completion_percentage,
          external_refs: employee.data.external_refs || {},
        },
      }).unwrap();

      closeModal();
    } catch (err) {
      console.error("Update employee failed", err);
    }
  };

  return (
    <>
      <PageMeta title="Profile" description="" />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          {/* MetaCard */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                  <img src="/images/user/owner.jpg" alt="user" />
                </div>
                <div className="order-3 xl:order-2">
                  <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                    {employee.data.full_name}
                  </h4>
                  <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                    <p
                      className={`text-sm font-medium ${
                        employee.data.status === "ACTIVE"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      } cursor-pointer hover:underline`}
                      title="Click để thay đổi trạng thái"
                    >
                      {employee.data.status}
                    </p>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {employee.data.employment_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Employee code: {employee.data.employee_code}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* InfoCard */}
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
                      {employee.data.full_name}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Email Address
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {employee.data.email}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Phone Number
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {employee.data.phone_number || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Gender
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {employee.data.gender}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Date of Birth
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {employee.data.date_of_birth}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Hire Date
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {employee.data.hire_date}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Department ID
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                       {department?.data?.department_name ?? employee.data.department_id}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Position ID
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                     {position?.data?.position_name ?? employee.data.position_id}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Manager ID
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {managers?.data?.managers.find(manager => manager.id === employee.data.manager_id)?.full_name ?? '—'}

                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {employee.data.status}
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

            {/* Modal edit */}
            <Modal
              isOpen={isOpen}
              onClose={closeModal}
              className="max-w-[700px] m-4"
            >
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
                          <Label>First Name</Label>
                          <Input
                            type="text"
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Last Name</Label>
                          <Input
                            type="text"
                            name="last_name"
                            value={form.last_name}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Date of Birth</Label>
                          <Input
                            type="date"
                            name="date_of_birth"
                            value={form.date_of_birth}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Gender</Label>
                          <Input
                            type="text"
                            name="gender"
                            value={form.gender}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Email Address</Label>
                          <Input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Phone Number</Label>
                          <Input
                            type="text"
                            name="phone_number"
                            value={form.phone_number}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Personal Email</Label>
                          <Input
                            type="email"
                            name="personal_email"
                            value={form.personal_email}
                            onChange={handleChange}
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
    <option value="">Chọn phòng ban</option>
    {departments.map((d) => (
      <option key={d.id} value={d.id}>
        {d.department_name}
      </option>
    ))}
  </select>
</div>

                        <div className="col-span-2 lg:col-span-1">
  <Label>Position</Label>
  <select
    name="position_id"
    value={form.position_id}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
  >
    <option value="">Chọn chức vụ</option>
    {positions.map((p) => (
      <option key={p.id} value={p.id}>
        {p.position_name}
      </option>
    ))}
  </select>
</div>


                        {/* <div className="col-span-2 lg:col-span-1">
                          <Label>Manager ID</Label>
                          <Input
                            type="number"
                            name="manager_id"
                            value={form.manager_id}
                            onChange={handleChange}
                          />
                        </div> */}
                        <div className="col-span-2 lg:col-span-1">
  <Label>Manager</Label>
  <select
    name="manager_id"
    value={form.manager_id}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
  >
    <option value="">Chọn quản lý</option>
    {managers?.data?.managers.map((manager) => (
      <option key={manager.id} value={manager.id}>
        {manager.full_name}
      </option>
    ))}
  </select>
</div>


                        <div className="col-span-2 lg:col-span-1">
                          <Label>Hire Date</Label>
                          <Input
                            type="date"
                            name="hire_date"
                            value={form.hire_date}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Employment Type</Label>
                          <Input
                            type="text"
                            name="employment_type"
                            value={form.employment_type}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Status</Label>
                          <Input
                            type="text"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <Button
                      
                      size="sm"
                      variant="outline"
                      onClick={closeModal}
                    >
                      Cancel
                    </Button>
                    <Button  size="sm" disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </div>
            </Modal>
          </div>

          {/* ContractCard */}
          <UserContractCard />
        </div>
      </div>
    </>
  );
};

export default EmployeeDetail;
