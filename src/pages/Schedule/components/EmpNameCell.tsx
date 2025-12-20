import { useGetEmployeeByIdQuery } from "../../../redux/api/employeeApiSlice";

function EmpNameCell({
  token,
  empId,
}: {
  token: string;
  empId: number;
}) {
  const { name, isFetching, isError } = useGetEmployeeByIdQuery(
    { token, id: empId },
    {
      skip: !token || !empId,
      selectFromResult: ({ data, isFetching, isError }) => ({
        name: data?.data?.full_name, // theo response bạn chụp: { data: { leave_type_name: ... } }
        isFetching,
        isError,
      }),
    }
  );

  if (isFetching) return <span className="text-gray-400">Loading...</span>;
  if (isError) return <span className="text-red-500">Unknown</span>;

  return <span className="text-gray-800 dark:text-white/90">{name ?? `#${empId}`}</span>;
}

export default EmpNameCell;