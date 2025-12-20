import { useGetLeaveTypeByIdQuery } from "../../../redux/api/leaveApiSlice";

function LeaveTypeNameCell({
  token,
  leaveTypeId,
}: {
  token: string;
  leaveTypeId: number;
}) {
  const { name, isFetching, isError } = useGetLeaveTypeByIdQuery(
    { token, id: leaveTypeId },
    {
      skip: !token || !leaveTypeId,
      selectFromResult: ({ data, isFetching, isError }) => ({
        name: data?.data?.leave_type_name, // theo response bạn chụp: { data: { leave_type_name: ... } }
        isFetching,
        isError,
      }),
    }
  );

  if (isFetching) return <span className="text-gray-400">Loading...</span>;
  if (isError) return <span className="text-red-500">Unknown</span>;

  return <span className="text-gray-800 dark:text-white/90">{name ?? `#${leaveTypeId}`}</span>;
}

export default LeaveTypeNameCell;