import { useState, FormEvent } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";
import { useAppSelector } from "../../../redux/hook";
import {
  useGetPositionsQuery,
  useAssignPositionMutation,
} from "../../../redux/api/employeeApiSlice";

interface AssignPositionModalProps {
  employee: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AssignPositionModal({
  employee,
  onClose,
  onSuccess,
  onError,
}: AssignPositionModalProps) {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [positionId, setPositionId] = useState("");

  const { data: positions } = useGetPositionsQuery(
    { token: token!, limit: 100 },
    { skip: !token }
  );

  const [assignPosition, { isLoading }] = useAssignPositionMutation();

  // Filter positions by employee's department
  const filteredPositions = positions?.data?.positions.filter(
    (pos: any) => pos.department_id === employee.department_id
  ) || [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!positionId) {
      onError("Please select a position");
      return;
    }

    try {
      await assignPosition({
        token: token!,
        id: employee.id,
        body: {
          position_id: Number(positionId),
          assigned_by: 1, // Should be current user id
        },
      }).unwrap();

      const employeeName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.employee_code || 'Employee';
      onSuccess(`Position assigned successfully to ${employeeName}`);
      onClose();
    } catch (err: any) {
      onError(err?.data?.message || "Failed to assign position");
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-md m-4">
      <div className="w-full p-6">
        <h4 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          Assign Position
        </h4>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Assign <span className="font-medium">{employee.employee_code} - {employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()}</span> to a position in {employee.department_name}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label>Position</Label>
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select Position</option>
              {filteredPositions.map((pos: any) => (
                <option key={pos.id} value={pos.id}>
                  {pos.position_name} - {pos.position_code}
                </option>
              ))}
            </select>
            {filteredPositions.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                No positions available for this department
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || filteredPositions.length === 0}>
              {isLoading ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
