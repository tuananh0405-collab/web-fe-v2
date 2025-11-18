import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAccountTable from "./UserAccountTable";

const UserAccountConfig = () => {
  return (
    <>
      <PageMeta
        title="Manage User Account"
        description=""
      />
      <PageBreadcrumb
  pageTitle="Manage User Account"
  showTitleLeft={false}
  items={[
    { label: "Manage User Account" },
  ]}
/>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Details
        </h3>
        <div className="space-y-6">
         
          <UserAccountTable />
       
        </div>
      </div>
    </>
  );
}

export default UserAccountConfig
