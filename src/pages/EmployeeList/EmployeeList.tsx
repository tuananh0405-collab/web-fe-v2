import React, { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import EmployeeTable from "./EmployeeTable";
import AddEmployeeModal from "./AddEmployeeModal";
import { useModal } from "../../hooks/useModal";

const EmployeeList = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  return (
    <>
      <PageMeta title="Employee List" description="" />
      <PageBreadcrumb
        pageTitle="Employee List"
        showTitleLeft={false}
        items={[{ label: "Employee List" }]}
      />

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Employees
          </h3>

          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Create new Employee
          </button>
        </div>

        <div className="space-y-6">
          <EmployeeTable />
        </div>
      </div>

      <AddEmployeeModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </>
  );
};

export default EmployeeList;
