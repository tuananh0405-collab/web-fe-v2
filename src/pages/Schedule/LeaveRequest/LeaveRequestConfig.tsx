import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import LeaveRequestTable from "./LeaveRequestTable";

const LeaveRequestConfig = () => {
  return (
    <>
      <PageMeta title="Leave Requests" description="" />

      <PageBreadcrumb
        pageTitle="Leave Requests"
        showTitleLeft={false}
        items={[{ label: "Leave Requests" }]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-5 flex items-center justify-between lg:mb-7">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            All Leave Requests
          </h3>
        </div>

        <div className="space-y-6">
          <LeaveRequestTable />
        </div>
      </div>
    </>
  );
};

export default LeaveRequestConfig;
