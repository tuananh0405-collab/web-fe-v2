import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation, useMarkAllNotificationsAsReadMutation } from "../../redux/api/notificationApiSlice";
import { useAppSelector } from "../../redux/hook";
import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";

export default function ListNotification() {
  const token = useAppSelector((state) => state.auth.userState?.data?.access_token);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const itemsPerPage = 20;

  const { data, isLoading, error } = useGetNotificationsQuery({
    token: token!,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    unreadOnly: false,
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsAsReadMutation();

  const notifications = data?.data?.notifications || [];
  const total = data?.data?.total || 0;
  const unreadCount = data?.data?.unreadCount || 0;
  const totalPages = Math.ceil(total / itemsPerPage);

  const handleNotificationClick = async (notification: any) => {
    setSelectedNotification(notification);
    setIsDetailModalOpen(true);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await markAsRead({ token: token!, id: notification.id }).unwrap();
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({ token: token! }).unwrap();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (isLoading) return <p>Loading notifications...</p>;
  if (error) return <p>Error loading notifications</p>;

  return (
    <>
      <PageMeta title="Notification" description="" />
      <div className="space-y-6">
        {/* Header with unread count and mark all button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notifications ({unreadCount} unread)
          </h2>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              {isMarkingAll ? "Marking..." : "Mark All as Read"}
            </Button>
          )}
        </div>

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
                {notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-5 py-4 text-center text-gray-500">
                      No notifications found
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification: any) => (
                    <TableRow 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors ${
                        !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <TableCell className={`px-5 py-4 text-start ${!notification.isRead ? "font-semibold" : ""}`}>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                          {notification.title}
                        </div>
                      </TableCell>
                      <TableCell className={`px-5 py-4 text-start ${!notification.isRead ? "font-semibold" : ""}`}>
                        <div className="truncate max-w-md">{notification.message}</div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          notification.priority === "HIGH" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                          notification.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                          "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {notification.priority}
                        </span>
                      </TableCell>
                      <TableCell className={`px-5 py-4 text-start ${!notification.isRead ? "font-semibold" : ""}`}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-white/[0.05]">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} notifications
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/[0.1]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      >
        {selectedNotification && (
          <div className="space-y-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Notification Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{selectedNotification.title}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{selectedNotification.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <span className={`px-2 py-1 rounded text-xs font-medium inline-block ${
                  selectedNotification.priority === "HIGH" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                  selectedNotification.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                }`}>
                  {selectedNotification.priority}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedNotification.notificationType}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sent At
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedNotification.createdAt).toLocaleString()}</p>
            </div>

            {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Information
                </label>
                <div className="bg-gray-50 dark:bg-white/[0.05] rounded p-3 text-sm">
                  <pre className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {JSON.stringify(selectedNotification.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-gray-200 dark:bg-white/[0.1] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/[0.15] px-4 py-2 rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
