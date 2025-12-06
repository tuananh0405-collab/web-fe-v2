import { useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import GPSConfigTable from "./GPSConfigTable";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import { useModal } from "../../../hooks/useModal";
import Alert from "../../../components/ui/alert/Alert";
import AddGPSConfigModal from "./AddGPSConfigModal";

const GPSCheckConfig = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const [alert, setAlert] = useState<
    null | { type: "success" | "error"; message: string }
  >(null);

  const handleSuccess = (message: string) => {
    setAlert({ type: "success", message });
    closeModal();
  };

  const handleError = (message: string) => {
    setAlert({ type: "error", message });
  };

  return (
    <>
      <PageMeta title="GPS Check Configuration" description="" />

      <PageBreadcrumb
        pageTitle="GPS Check Configuration"
        showTitleLeft={false}
        items={[{ label: "System Configuration" }, { label: "GPS Check" }]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              GPS Check Configurations
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage GPS check configurations for employee attendance tracking
            </p>
          </div>

          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Configuration
          </button>
        </div>

        <div className="space-y-6">
          <GPSConfigTable />
        </div>
      </div>

      {/* MODAL CREATE */}
      <AddGPSConfigModal
        isOpen={isOpen}
        onClose={closeModal}
        onSuccess={handleSuccess}
        onError={handleError}
      />

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
    </>
  );
};

export default GPSCheckConfig;
