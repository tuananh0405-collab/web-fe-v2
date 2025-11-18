import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { Link } from "react-router";
import { useAppSelector } from "../../redux/hook";
import { useGetEmployeesQuery } from "../../redux/api/employeeApiSlice";

const EmployeeTable = () => {
  // ✅ Lấy token (nếu API yêu cầu)
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  // ✅ State phân trang
  const [page, setPage] = useState(1);
  const limit = 10; // hoặc 5/20 tuỳ ý

  // ✅ Gọi API có phân trang
  const { data, isLoading, error } = useGetEmployeesQuery(
    { token: token!, page, limit },
    { skip: !token } // bỏ { skip } nếu API public
  );

  if (isLoading) return <p className="p-4 text-center">Loading employees...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load employees 😢</p>
    );

  // ✅ Lấy đúng dữ liệu theo response mới
  const employees = data?.data?.employees || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                User
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Email
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Date of Birth
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Department
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {employees.length === 0 ? (
              <TableRow>
                <TableCell  className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full" />
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {e.full_name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {e.gender || "-"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {e.email}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {e.date_of_birth || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {e.department_name || e.department_id || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <Link
                      to={`/employee-list/${e.id}`}
                      className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      View Profile
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Pagination giống UserAccountTable */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.total_pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={!pagination.has_prev}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className={`px-3 py-1 rounded-md text-sm ${
                pagination.has_prev
                  ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800"
              }`}
            >
              Prev
            </button>
            <button
              disabled={!pagination.has_next}
              onClick={() => setPage((prev) => prev + 1)}
              className={`px-3 py-1 rounded-md text-sm ${
                pagination.has_next
                  ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;
