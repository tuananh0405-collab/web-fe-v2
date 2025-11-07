import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/features/store";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

// ✅ Bảo vệ route theo vai trò (role)
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const user = useSelector((state: RootState) => state.auth.userState?.data?.user);

  if (!user) {
    // ❌ chưa đăng nhập → chuyển hướng đến trang đăng nhập
    return <Navigate to="/signin" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // ❌ không đủ quyền → chặn truy cập
    return <Navigate to="/not-found" replace />;
  }

  // ✅ Hợp lệ → hiển thị nội dung bên trong
  return <Outlet />;
}
