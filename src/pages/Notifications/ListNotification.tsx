import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { useGetNotificationsQuery } from "../../redux/api/notificationApiSlice";
import { useAppSelector } from "../../redux/hook";
import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export default function ListNotification() {
  const token = useAppSelector((state) => state.auth.userState?.data?.access_token);

  const { data, isLoading, error } = useGetNotificationsQuery({
    token: token!,
    limit: 20,
    offset: 0,
    unreadOnly: false, // Fetch only unread notifications
  });

  if (isLoading) return <p>Loading notifications...</p>;
  if (error) return <p>Error loading notifications</p>;

  return (
    <>
      <PageMeta title="Notification" description="" />
      <PageBreadcrumb pageTitle="Notification List" />
      <div className="space-y-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Title
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Message
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Recipient
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Priority
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Sent At
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {data?.data.notifications.length === 0 ? (
                  <TableRow>
                    <TableCell  className="px-5 py-4 text-center text-gray-500">
                      No notifications found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="px-5 py-4 text-start">
                        {notification.title}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {notification.message}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {notification.recipientName}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {notification.priority}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {new Date(notification.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
