import { useParams } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import UserInfoCard from "../../../components/UserProfile/UserInfoCard";
import UserMetaCard from "../../../components/UserProfile/UserMetaCard";
import { useAppSelector } from "../../../redux/hook";
import { useGetAccountByIdQuery } from "../../../redux/api/authApiSlice";
import { 
  useGetEmployeeByIdQuery,
  useGetDepartmentByIdQuery,
  useGetPositionByIdQuery,
} from "../../../redux/api/employeeApiSlice";


export default function UserAccountDetail() {
     const { id } = useParams<{ id: string }>();
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const { data, isLoading, error } = useGetAccountByIdQuery(
    { token: token!, id: id! },
    { skip: !token || !id }
  );

  // Get employee data if employee_id exists
  const { data: employeeData } = useGetEmployeeByIdQuery(
    { token: token!, id: data?.data?.employee_id! },
    { skip: !token || !data?.data?.employee_id }
  );

  // Get department data if employee has department_id
  const { data: departmentData } = useGetDepartmentByIdQuery(
    { token: token!, id: employeeData?.data?.department_id! },
    { skip: !token || !employeeData?.data?.department_id }
  );

  // Get position data if employee has position_id
  const { data: positionData } = useGetPositionByIdQuery(
    { token: token!, id: employeeData?.data?.position_id! },
    { skip: !token || !employeeData?.data?.position_id }
  );

  if (isLoading)
    return <p className="p-4 text-center">Loading user profile...</p>;
  if (error)
    return (
      <p className="p-4 text-center text-red-500">
        Failed to load user profile 😢
      </p>
    );

  const user = data?.data;
  const employee = employeeData?.data;
  const department = departmentData?.data;
  const position = positionData?.data;
  
  // Merge employee, department, and position data into user
  const enrichedUser = user && employee ? {
    ...user,
    department_name: department?.department_name || user.department_name,
    position_name: position?.position_name || user.position_name,
  } : user;
  
  const code = enrichedUser?.employee_code || "No code";


  return (
    <>
      <PageMeta
        title="Profile"
        description=""
      />
<PageBreadcrumb
  showTitleLeft={false}
  items={[
    { label: "Manage User Account", to: "/user-account-config" },
    { label: code },
  ]}
/>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        {enrichedUser ? (
          <div className="space-y-6">
            <UserMetaCard user={enrichedUser} />
            <UserInfoCard user={enrichedUser} />
          </div>
        ) : (
          <p className="text-gray-500">No user data found.</p>
        )}
      </div>
    </>
  );
}
