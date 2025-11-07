import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";
const AttendenceReport = () => {
  return (
    <>
      <PageMeta
        title="Attendence Report"
        description=""
      />
      <PageBreadcrumb pageTitle="Attendence Report" />
      <div className="space-y-6">
        <ComponentCard title="Attendence Report">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}

export default AttendenceReport
