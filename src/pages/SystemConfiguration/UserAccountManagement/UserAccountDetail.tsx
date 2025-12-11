import { useParams } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import UserContractCard from "../../../components/UserProfile/UserContractCard";
import UserInfoCard from "../../../components/UserProfile/UserInfoCard";
import UserMetaCard from "../../../components/UserProfile/UserMetaCard";
import { useAppSelector } from "../../../redux/hook";
import { useGetAccountByIdQuery } from "../../../redux/api/authApiSlice";


export default function UserAccountDetail() {
     const { id } = useParams<{ id: string }>();
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const { data, isLoading, error } = useGetAccountByIdQuery(
    { token: token!, id: id! },
    { skip: !token || !id }
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
  const code = user?.employee_code || "No code";


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
        {user ? (
          <div className="space-y-6">
            <UserMetaCard user={user} />
            <UserInfoCard user={user} />
            <UserContractCard  />
          </div>
        ) : (
          <p className="text-gray-500">No user data found.</p>
        )}
      </div>
    </>
  );
}
