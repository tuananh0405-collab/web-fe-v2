import { useParams } from "react-router";
import PageBreadCrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { useAppSelector } from "../../../redux/hook";
import { useGetLeaveTypeByIdQuery } from "../../../redux/api/leaveApiSlice";

const LeaveTypeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const { data, isLoading, error } = useGetLeaveTypeByIdQuery(
    { token: token!, id: Number(id) },
    { skip: !token || !id }
  );

  if (isLoading)
    return <p className="p-4 text-center">Loading leave type details...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">
        Failed to load leave type details 😢
      </p>
    );

  const leaveType = data?.data;

  return (
    <>
      <PageMeta title={`Leave Type: ${leaveType?.leave_type_name || "Detail"}`} />
      <div className="flex h-full flex-col gap-6">
        <PageBreadCrumb
          pageName={leaveType?.leave_type_name || "Leave Type Detail"}
        />

        {leaveType && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="mb-6 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: leaveType.color_hex }}
              >
                {leaveType.icon ? (
                  <span className="text-white text-2xl">{leaveType.icon}</span>
                ) : (
                  <span className="text-white text-lg font-bold">
                    {leaveType.leave_type_code.substring(0, 2)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                  {leaveType.leave_type_name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {leaveType.leave_type_code}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white border-b pb-2">
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Description</label>
                    <p className="text-gray-800 dark:text-white">
                      {leaveType.description || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                    <p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          leaveType.status === "ACTIVE"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {leaveType.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Type</label>
                    <p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          leaveType.is_paid
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                        }`}
                      >
                        {leaveType.is_paid ? "Paid" : "Unpaid"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Sort Order</label>
                    <p className="text-gray-800 dark:text-white">{leaveType.sort_order}</p>
                  </div>
                </div>
              </div>

              {/* Leave Limits */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white border-b pb-2">
                  Leave Limits
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Max Days Per Year
                    </label>
                    <p className="text-gray-800 dark:text-white">
                      {leaveType.max_days_per_year ?? "Unlimited"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Max Consecutive Days
                    </label>
                    <p className="text-gray-800 dark:text-white">
                      {leaveType.max_consecutive_days ?? "Unlimited"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      Minimum Notice Days
                    </label>
                    <p className="text-gray-800 dark:text-white">
                      {leaveType.min_notice_days} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white border-b pb-2">
                  Settings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveType.requires_approval}
                      disabled
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Requires Approval
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveType.requires_document}
                      disabled
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Requires Document
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveType.deducts_from_balance}
                      disabled
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Deducts From Balance
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveType.exclude_holidays}
                      disabled
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Exclude Holidays
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveType.exclude_weekends}
                      disabled
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Exclude Weekends
                    </label>
                  </div>
                </div>
              </div>

              {/* Carry Over & Accrual */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white border-b pb-2">
                  Carry Over & Accrual
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveType.allow_carry_over}
                      disabled
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Allow Carry Over
                    </label>
                  </div>
                  {leaveType.allow_carry_over && (
                    <>
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Max Carry Over Days
                        </label>
                        <p className="text-gray-800 dark:text-white">
                          {leaveType.max_carry_over_days ?? "Unlimited"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Carry Over Expiry (Months)
                        </label>
                        <p className="text-gray-800 dark:text-white">
                          {leaveType.carry_over_expiry_months} months
                        </p>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveType.is_prorated}
                      disabled
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Is Prorated
                    </label>
                  </div>
                  {leaveType.is_prorated && (
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Proration Basis
                      </label>
                      <p className="text-gray-800 dark:text-white">
                        {leaveType.proration_basis}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={leaveType.is_accrued}
                      disabled
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">
                      Is Accrued
                    </label>
                  </div>
                  {leaveType.is_accrued && (
                    <>
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Accrual Rate
                        </label>
                        <p className="text-gray-800 dark:text-white">
                          {leaveType.accrual_rate ?? "-"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Accrual Start Month
                        </label>
                        <p className="text-gray-800 dark:text-white">
                          {leaveType.accrual_start_month}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Created At</label>
                  <p className="text-gray-800 dark:text-white">
                    {new Date(leaveType.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Updated At</label>
                  <p className="text-gray-800 dark:text-white">
                    {new Date(leaveType.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LeaveTypeDetail;
