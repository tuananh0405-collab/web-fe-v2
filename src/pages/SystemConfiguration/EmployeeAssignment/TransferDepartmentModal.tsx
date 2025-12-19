import { useState, FormEvent } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { useAppSelector } from "../../../redux/hook";
import {
  useGetDepartmentsQuery,
  useTransferDepartmentMutation,
} from "../../../redux/api/employeeApiSlice";

interface TransferDepartmentModalProps {
  employee: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function TransferDepartmentModal({
  employee,
  onClose,
  onSuccess,
  onError,
}: TransferDepartmentModalProps) {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [toDepartmentId, setToDepartmentId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: departments } = useGetDepartmentsQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const [transferDepartment, { isLoading }] = useTransferDepartmentMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!toDepartmentId) {
      onError("Please select a department");
      return;
    }

    if (Number(toDepartmentId) === employee.department_id) {
      onError("Please select a different department");
      return;
    }

    try {
      await transferDepartment({
        token: token!,
        id: employee.id,
        body: {
          to_department_id: Number(toDepartmentId),
          transferred_by: 1, // Should be current user id
          effective_date: effectiveDate,
        },
      }).unwrap();

      const employeeName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.employee_code || 'Employee';
      onSuccess(`${employeeName} transferred successfully`);
      onClose();
    } catch (err: any) {
      onError(err?.data?.message || "Failed to transfer department");
    }
  };

  // Filter out current department
  const availableDepartments = departments?.data?.departments.filter(
    (dept: any) => dept.id !== employee.department_id
  ) || [];

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-md m-4">
      <div className="w-full p-6">
        <h4 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          Transfer Department
        </h4>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Transfer <span className="font-medium">{employee.employee_code} - {employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()}</span> from{" "}
          <span className="font-medium">{employee.department_name}</span> to another department
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label>New Department</Label>
            <select
              value={toDepartmentId}
              onChange={(e) => setToDepartmentId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select Department</option>
              {availableDepartments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_name} - {dept.department_code}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <Label>Effective Date</Label>
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Transferring..." : "Transfer"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
