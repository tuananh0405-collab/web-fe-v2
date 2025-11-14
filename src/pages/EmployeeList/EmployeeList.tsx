import React, { useState, FormEvent, ChangeEvent } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import EmployeeTable from "./EmployeeTable";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useModal } from "../../hooks/useModal";
import { useAppSelector } from "../../redux/hook";
import { useCreateEmployeeMutation } from "../../redux/api/employeeApiSlice";

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
  gender: "",
  email: "",
  phone_number: "",
  department_id: "",
  position_id: "",
  manager_id: "",
  hire_date: "",
  employment_type: "",
};

const EmployeeList = () => {
  const { isOpen, openModal, closeModal } = useModal();

  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [createEmployee, { isLoading: isCreating }] =
    useCreateEmployeeMutation();

  const [form, setForm] = useState<CreateEmployeeForm>(initialForm);

  const handleOpen = () => {
    setForm(initialForm);
    openModal();
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await createEmployee({
        token,
        body: {
          employee_code: form.employee_code,
          first_name: form.first_name,
          last_name: form.last_name,
          date_of_birth: form.date_of_birth, // "1990-01-01"
          gender: form.gender,
          email: form.email,
          phone_number: form.phone_number,
          department_id: Number(form.department_id),
          position_id: Number(form.position_id),
          manager_id:
            form.manager_id === "" ? 0 : Number(form.manager_id), // tuỳ backend có cho null không
          hire_date: form.hire_date, // "2025-10-07"
          employment_type: form.employment_type, // "FULL_TIME" | ...
        },
      }).unwrap();

      closeModal();
      // invalidatesTags: ["Employees"] trong slice sẽ tự refetch EmployeeTable
    } catch (err) {
      console.error("Create employee failed", err);
    }
  };

  return (
    <>
      <PageMeta title="Employee List" description="" />
      <PageBreadcrumb pageTitle="Employee List" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Employees
          </h3>

          <button
            onClick={handleOpen}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Create new Employee
          </button>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Employee List">
            <EmployeeTable />
          </ComponentCard>
        </div>
      </div>

      {/* MODAL CREATE EMPLOYEE */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
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
                    <Label>Employee Code</Label>
                    <Input
                      type="text"
                      name="employee_code"
                      value={form.employee_code}
                      onChange={handleChange}
                      placeholder="EMP0011"
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
                      placeholder="MALE / FEMALE"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="aa@company.com"
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
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Department ID</Label>
                    <Input
                      type="number"
                      name="department_id"
                      value={form.department_id}
                      onChange={handleChange}
                      placeholder="1"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Position ID</Label>
                    <Input
                      type="number"
                      name="position_id"
                      value={form.position_id}
                      onChange={handleChange}
                      placeholder="1"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Manager ID</Label>
                    <Input
                      type="number"
                      name="manager_id"
                      value={form.manager_id}
                      onChange={handleChange}
                      placeholder="1"
                    />
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
                      placeholder="FULL_TIME"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 px-2 lg:justify-end">
              <Button
                
                size="sm"
                variant="outline"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button  size="sm" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Employee"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default EmployeeList;
