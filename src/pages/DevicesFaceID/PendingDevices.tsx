import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CurrentDevices from "./CurrentDevices";
import { Link } from "react-router";

const PendingDevices = () => {
 return (
    <>
      <PageMeta title="Pending Device Request" description="" />
      <PageBreadcrumb pageTitle="Pending Device Request" />
      <button
        onClick={() => {}}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
      >
        <Link
          to="/device-request"
          className=" hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
        >
          See current devices
        </Link>
      </button>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Details
        </h3>
        <div className="space-y-6">
          <CurrentDevices />
        </div>
      </div>
    </>
  );
}

export default PendingDevices
