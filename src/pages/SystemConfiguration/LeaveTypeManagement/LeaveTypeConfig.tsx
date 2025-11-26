import PageBreadCrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import LeaveTypeTable from "./LeaveTypeTable";

const LeaveTypeConfig = () => {
  return (
    <>
      <PageMeta title="Leave Type Configuration" />
      <div className="flex h-full flex-col gap-6">
        <PageBreadCrumb pageName="Leave Type Configuration" />
        <LeaveTypeTable />
      </div>
    </>
  );
};

export default LeaveTypeConfig;
