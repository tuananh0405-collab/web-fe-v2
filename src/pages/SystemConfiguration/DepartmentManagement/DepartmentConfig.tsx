import { useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import DepartmenTable from "./DepartmenTable";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useModal } from "../../../hooks/useModal";
import Alert from "../../../components/ui/alert/Alert";
import AddDepartmentModal from "./AddDepartmentModal";

const DepartmentConfig = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [alert, setAlert] = useState<
    null | { type: "success" | "error"; message: string }
  >(null);

  const handleSuccess = (message: string) => {
    setAlert({ type: "success", message });
  };

  const handleError = (message: string) => {
    setAlert({ type: "error", message });
  };

  return (
    <>
      <PageMeta title="Manage Department" description="" />

      <PageBreadcrumb
        pageTitle="Manage Department"
        showTitleLeft={false}
        items={[{ label: "Manage Department" }]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {/* Title nếu cần */}
          </h3>

          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Create new Department
          </button>
        </div>

        <div className="space-y-6">
          <DepartmenTable />
        </div>
      </div>

      {/* MODAL CREATE */}
      <AddDepartmentModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* MODAL ALERT: hiện ở giữa màn hình và che mờ background */}
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
    </>
  );
};

export default DepartmentConfig;
