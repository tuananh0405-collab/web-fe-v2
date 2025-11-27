import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import OvertimeRequestTable from "./OvertimeRequestTable";

const OvertimeRequestConfig = () => {
  return (
    <>
      <PageMeta title="Overtime Requests" description="" />

      <PageBreadcrumb
        pageTitle="Overtime Requests"
        showTitleLeft={false}
        items={[{ label: "Overtime Requests" }]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            All Overtime Requests
          </h3>
        </div>

        <div className="space-y-6">
          <OvertimeRequestTable />
        </div>
      </div>
    </>
  );
};

export default OvertimeRequestConfig;
