import React from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Link } from "react-router";
import { useGetFaceUsersQuery } from "../../redux/api/faceApiSlice";

const FaceIDRequest = () => {
  // call API
  const { data, isLoading, error } = useGetFaceUsersQuery();

  // data trả về dạng:
  // {
  //   Success: true,
  //   Data: { TotalCount: number, Users: [{ UserId, HasFaceId, CreatedAt, UpdatedAt }] },
  //   Message: string
  // }
  const users = data?.Data?.Users ?? [];

  return (
    <>
      <PageMeta title="FaceID" description="" />
      <PageBreadcrumb
        pageTitle="FaceID"
        showTitleLeft={false}
        items={[{ label: "FaceID" }]}
      />

      <div className="space-y-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              {/* Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    User
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Has FaceID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Created At
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Updated At
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      Loading FaceID users...
                    </TableCell>
                  </TableRow>
                )}

                {error && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-5 py-6 text-center text-error-500"
                    >
                      Failed to load FaceID data
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && !error && users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      No users with FaceID found
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  !error &&
                  users.map((u) => (
                    <TableRow key={u.UserId}>
                      {/* Cột User: dùng avatar giả + UserId */}
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {u.UserId}
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              User #{u.UserId}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              ID from Face service
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {u.HasFaceId ? "Yes" : "No"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {u.CreatedAt
                          ? new Date(u.CreatedAt).toLocaleString()
                          : "-"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {u.UpdatedAt
                          ? new Date(u.UpdatedAt).toLocaleString()
                          : "-"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {/* sau này nếu có route detail thì truyền UserId vào */}
                        <Link
                          to="/"
                          className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                        >
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
};

export default FaceIDRequest;
