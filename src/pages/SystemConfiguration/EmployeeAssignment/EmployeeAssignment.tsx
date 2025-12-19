import { useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import EmployeeAssignmentTable from "../EmployeeAssignment/EmployeeAssignmentTable";

const EmployeeAssignment = () => {
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
      <PageMeta title="Employee Assignment" description="" />

      <PageBreadcrumb
        pageTitle="Employee Assignment"
        showTitleLeft={false}
        items={[{ label: "Employee Assignment" }]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Manage Employee Department & Position
          </h3>
        </div>

        <div className="space-y-6">
          <EmployeeAssignmentTable
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </div>

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

export default EmployeeAssignment;
