import { useState, FormEvent } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { useAppSelector } from "../../../redux/hook";
import { useRemovePositionMutation } from "../../../redux/api/employeeApiSlice";

interface RemovePositionModalProps {
  employee: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function RemovePositionModal({
  employee,
  onClose,
  onSuccess,
  onError,
}: RemovePositionModalProps) {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const [reason, setReason] = useState("Position changed");

  const [removePosition, { isLoading }] = useRemovePositionMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      onError("Please provide a reason");
      return;
    }

    try {
      await removePosition({
        token: token!,
        id: employee.id,
        body: {
          removed_by: 1, // Should be current user id
          reason: reason.trim(),
        },
      }).unwrap();

      const employeeName = employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.employee_code || 'Employee';
      onSuccess(`${employeeName} removed from ${employee.position_name || 'position'}`);
      onClose();
    } catch (err: any) {
      onError(err?.data?.message || "Failed to remove from position");
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-md m-4">
      <div className="w-full p-6">
        <h4 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          Remove from Position
        </h4>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Remove <span className="font-medium">{employee.employee_code} - {employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()}</span> from{" "}
          <span className="font-medium">{employee.position_name}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label>Reason</Label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for removal"
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} variant="destructive">
              {isLoading ? "Removing..." : "Remove"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
