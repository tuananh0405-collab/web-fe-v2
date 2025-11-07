import { Link } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useAppSelector } from "../../redux/hook";
import { useGetAccountsQuery } from "../../redux/api/authApiSlice";
import { useState } from "react";
interface Order {
  id: number;
  user: {
    image: string;
    name: string;
    email: string;
    gender: string;
    dob: string;
  };
  department: string;
}

// Define the table data using the interface
const tableData: Order[] = [
  {
    id: 1,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Tran Duy Anh",
      email: "duyanh@gmail.com",
      gender: "male",
      dob: "01/01/2000",
    },
    department: "NOdejs",
  },
];

export default function UserAccountTable() {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data, isLoading, error } = useGetAccountsQuery(
    { token: token!, page, limit },
    { skip: !token }
  );

  if (isLoading) return <p className="p-4 text-center">Loading accounts...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">Failed to load accounts 😢</p>
    );

  const accounts = data?.data?.accounts || [];
  const pagination = data?.data?.pagination;

  return (
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
                Employee Code
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Email
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Full Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Role
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Department
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Position
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {accounts.map((acc) => (
              <TableRow key={acc.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      {/* <img
                        width={40}
                        height={40}
                        src={order.user.image}
                        alt={order.user.name}
                      /> */}
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {acc.employee_code}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {acc.status}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {acc.email}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {acc.full_name}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {acc.role}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {acc.department_name || "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {acc.department_name || "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Link
                    to={`/user-account-config/${acc.id}`}
                    className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    View Profile
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* ✅ Pagination Section */}
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
}
