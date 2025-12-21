import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/features/store";

// Component để redirect từ trang chủ dựa vào authentication và role
export default function RootRedirect() {
  const user = useSelector((state: RootState) => state.auth.userState?.data?.user);

  // Nếu chưa đăng nhập → redirect đến signin
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Redirect dựa vào role của user
  switch (user.role) {
    case "ADMIN":
      return <Navigate to="/department-config" replace />;
    case "HR_MANAGER":
      return <Navigate to="/attendence-report" replace />;
    case "DEPARTMENT_MANAGER":
      return <Navigate to="/employee-schedule" replace />;
    default:
      return <Navigate to="/signin" replace />;
  }
}
