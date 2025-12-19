import { useState, FormEvent } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { useAppSelector } from "../../../redux/hook";
import {
  useGetDepartmentsQuery,
  useAssignDepartmentMutation,
} from "../../../redux/api/employeeApiSlice";

interface AssignDepartmentModalProps {
  employee: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AssignDepartmentModal({
  employee,
  onClose,
  onSuccess,
  onError,
}: AssignDepartmentModalProps) {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [departmentId, setDepartmentId] = useState("");

  const { data: departments } = useGetDepartmentsQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const [assignDepartment, { isLoading }] = useAssignDepartmentMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!departmentId) {
      onError("Please select a department");
      return;
    }

    try {
      await assignDepartment({
        token: token!,
        id: employee.id,
        body: {
          department_id: Number(departmentId),
          assigned_by: 1, // Should be current user id
        },
      }).unwrap();

      const employeeName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.employee_code || 'Employee';
      onSuccess(`Department assigned successfully to ${employeeName}`);
      onClose();
    } catch (err: any) {
      onError(err?.data?.message || "Failed to assign department");
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-md m-4">
      <div className="w-full p-6">
        <h4 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          Assign Department
        </h4>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Assign <span className="font-medium">{employee.employee_code} - {employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()}</span> to a department
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label>Department</Label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select Department</option>
              {departments?.data?.departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_name} - {dept.department_code}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
