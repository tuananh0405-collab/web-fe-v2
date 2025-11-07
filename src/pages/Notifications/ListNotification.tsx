import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import TableNotification from "./TableNotification";
export default function ListNotification() {
  return (
    <>
      <PageMeta title="Notification" description="" />
      <PageBreadcrumb pageTitle="Notification List" />
      <div className="space-y-6">
        <ComponentCard title="Notification List">
          <TableNotification />
        </ComponentCard>
      </div>
    </>
  );
}
