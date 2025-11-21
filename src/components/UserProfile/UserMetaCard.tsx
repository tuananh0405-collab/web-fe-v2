import { useAppSelector } from "../../redux/hook";
import { useUpdateAccountStatusMutation } from "../../redux/api/authApiSlice";
import { useState } from "react";

interface UserMetaCardProps {
  user: {
    full_name: string;
    email: string;
    position_name: string;
    employee_code: string;
    department_name: string;
    status: string;
    id: string;
  };
}
export default function UserMetaCard({ user }: UserMetaCardProps) {
   const token = useAppSelector((state) => state.auth.userState?.data?.access_token);
  const [updateStatus] = useUpdateAccountStatusMutation();
  const [status, setStatus] = useState(user.status);

 const handleToggleStatus = async () => {
  if (!token) return;

  const newStatus = status === "ACTIVE" ? "LOCKED" : "ACTIVE";
  const reason =
    newStatus === "LOCKED" ? "Vi phạm tiêu chuẩn" : "Khôi phục tài khoản";

  if (newStatus === "LOCKED") {
    const confirmLock = window.confirm(
      `Bạn có chắc chắn muốn khóa tài khoản ${user.full_name}?`
    );
    if (!confirmLock) return;
  }

  try {
    const res = await updateStatus({ id: user.id, token, status: newStatus, reason }).unwrap();
    setStatus(res.data.status);
    alert(`✅ ${res.message}`);
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Không thể cập nhật trạng thái!");
  }
};

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src="/images/user/user.png" alt="user" />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user.full_name}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
           
                 <p
                  className={`text-sm font-medium ${
                    status === "ACTIVE"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  } cursor-pointer hover:underline`}
                  onClick={handleToggleStatus}
                  title="Click để thay đổi trạng thái"
                >
                  {status}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.employee_code}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
