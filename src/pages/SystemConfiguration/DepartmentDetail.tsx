import React, { useEffect, useState, FormEvent } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { useParams } from "react-router";
import { useAppSelector } from "../../redux/hook";
import {
  useGetDepartmentByIdQuery,
  useUpdateDepartmentMutation,
} from "../../redux/api/employeeApiSlice";

type DepartmentForm = {
  department_code: string;
  department_name: string;
  description: string;
  parent_department_id: number | null;
  manager_id: number | null;
  office_address: string;
  office_latitude: string;
  office_longitude: string;
  office_radius_meters: number | null;
};

const DepartmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isOpen, openModal, closeModal } = useModal();

  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  // GET detail
  const { data, isLoading, isError } = useGetDepartmentByIdQuery(
    { token: token!, id: id! },
    { skip: !token }
  );

  const dept = data?.data;

  // STATE cho form edit
  const [form, setForm] = useState<DepartmentForm | null>(null);

  // Khi dept thay đổi (load xong), gán vào form
  useEffect(() => {
    if (dept) {
      setForm({
        department_code: dept.department_code,
        department_name: dept.department_name,
        description: dept.description ?? "",
        parent_department_id: dept.parent_department_id,
        manager_id: dept.manager_id,
        office_address: dept.office_address ?? "",
        office_latitude: dept.office_latitude ?? "",
        office_longitude: dept.office_longitude ?? "",
        office_radius_meters: dept.office_radius_meters,
      });
    }
  }, [dept]);

  const [updateDepartment, { isLoading: isUpdating }] =
    useUpdateDepartmentMutation();

  if (isLoading || !form) return <div>Loading…</div>;
  if (isError || !dept) return <div>Error</div>;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (!prev) return prev;

      // field số
      if (name === "office_radius_meters" || name === "parent_department_id" || name === "manager_id") {
        return {
          ...prev,
          [name]: value === "" ? null : Number(value),
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !id || !form) return;

    try {
      await updateDepartment({
        token,
        id: Number(id),
        body: {
          department_code: form.department_code,
          department_name: form.department_name,
          description: form.description,
          parent_department_id: form.parent_department_id,
          manager_id: form.manager_id,
          office_address: form.office_address,
          office_latitude: form.office_latitude,
          office_longitude: form.office_longitude,
          office_radius_meters: form.office_radius_meters,
        },
      }).unwrap();

      closeModal();
    } catch (err) {
      console.error("Update department failed", err);
    }
  };

  return (
    <>
      <PageMeta title="Department Detail" description="" />
      <PageBreadcrumb
  pageTitle={dept.department_code} // tiêu đề to ở trên
  items={[
    { label: "Manage Department", to: "/department-config" },
    { label: dept.department_code },
  ]}
/>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Department Detail
        </h3>

        <div className="space-y-6">
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
                  Department {dept.department_code}
                </h4>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Name
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {dept.department_name}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Description
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {dept.description}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Level
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {dept.level}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Office Address
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {dept.office_address}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {dept.status}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={openModal}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
              >
                {/* icon giữ nguyên */}
                Edit
              </button>
            </div>

            {/* MODAL EDIT */}
            <Modal
              isOpen={isOpen}
              onClose={closeModal}
              className="max-w-[700px] m-4"
            >
              <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                <div className="px-2 pr-14">
                  <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Edit Department
                  </h4>
                  <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                    Update department information below.
                  </p>
                </div>

                <form className="flex flex-col" onSubmit={handleSave}>
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
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Department Name</Label>
                          <Input
                            type="text"
                            name="department_name"
                            value={form.department_name}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Description</Label>
                          <Input
                            type="text"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Office Address</Label>
                          <Input
                            type="text"
                            name="office_address"
                            value={form.office_address}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Office Latitude</Label>
                          <Input
                            type="text"
                            name="office_latitude"
                            value={form.office_latitude}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Office Longitude</Label>
                          <Input
                            type="text"
                            name="office_longitude"
                            value={form.office_longitude}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                          <Label>Office Radius (meters)</Label>
                          <Input
                            type="number"
                            name="office_radius_meters"
                            value={form.office_radius_meters ?? ""}
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
        </div>
      </div>
    </>
  );
};

export default DepartmentDetail;
