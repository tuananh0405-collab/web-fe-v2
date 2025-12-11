import { useState } from "react";
import { useAppSelector } from "../../../redux/hook";
import {
  useGetGPSConfigsQuery,
  useToggleGPSConfigStatusMutation,
  useDeleteGPSConfigMutation,
  GPSCheckConfig,
} from "../../../redux/api/gpsConfigApiSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Link } from "react-router";
import { Trash2 } from "lucide-react";
import { Modal } from "../../../components/ui/modal";

const GPSConfigTable = () => {
  const token = useAppSelector(
    (state) => state.auth.userState?.data?.access_token
  );

  const { data, isLoading, error } = useGetGPSConfigsQuery(
    { token: token!, activeOnly: false },
    { skip: !token }
  );

  const [toggleStatus] = useToggleGPSConfigStatusMutation();
  const [deleteConfig, { isLoading: isDeleting }] = useDeleteGPSConfigMutation();

  const configs = data?.data || [];
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<GPSCheckConfig | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleToggleStatus = async (id: number) => {
    if (!token) return;
    try {
      await toggleStatus({ token, id }).unwrap();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const openDeleteModal = (config: GPSCheckConfig) => {
    setConfigToDelete(config);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setConfigToDelete(null);
  };

  const confirmDelete = async () => {
    if (!configToDelete || !token) return;
    setDeletingId(configToDelete.id);
    try {
      await deleteConfig({ token, id: configToDelete.id }).unwrap();
      closeDeleteModal();
    } catch (err) {
      console.error("Failed to delete config:", err);
      alert("Failed to delete GPS configuration");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <p className="p-4 text-center">Loading GPS configurations...</p>;
  }

  if (error) {
    return (
      <p className="p-4 text-center text-red-500">
        Failed to load GPS configurations 😢
      </p>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow>
            <TableCell
              isHeader
              className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Config Name
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Shift Type
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Strategy
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Interval (hrs)
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Min Checks
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Random Timing
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Priority
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Status
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHeader>

        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {configs.length === 0 ? (
            <TableRow>
              <TableCell
                className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                colSpan={9}
              >
                No GPS configurations found.
              </TableCell>
            </TableRow>
          ) : (
            configs.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="px-5 py-4 text-start">
                  <div>
                    <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {config.config_name}
                    </p>
                    {config.is_default && (
                      <span className="inline-block mt-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Default
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-5 py-4 text-start">
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {config.shift_type}
                  </span>
                </TableCell>

                <TableCell className="px-5 py-4 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  {config.check_strategy.replace("_", " ")}
                </TableCell>

                <TableCell className="px-5 py-4 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  {config.check_interval_hours}
                </TableCell>

                <TableCell className="px-5 py-4 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  {config.min_checks_per_shift}
                </TableCell>

                <TableCell className="px-5 py-4 text-center">
                  {config.enable_random_timing ? (
                    <span className="inline-flex items-center gap-1 text-theme-sm text-green-600 dark:text-green-400">
                      <svg
                        className="size-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      ±{config.random_offset_minutes}m
                    </span>
                  ) : (
                    <span className="text-theme-sm text-gray-400">—</span>
                  )}
                </TableCell>

                <TableCell className="px-5 py-4 text-center text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  {config.priority}
                </TableCell>

                <TableCell className="px-5 py-4 text-center">
                  <button
                    onClick={() => handleToggleStatus(config.id)}
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      config.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {config.is_active ? "Active" : "Inactive"}
                  </button>
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <div className="flex items-center gap-3 justify-center">
                    <Link
                      to={`/setting-config/${config.id}`}
                      className="underline hover:no-underline hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      View Detail
                    </Link>

                    {!config.is_default && (
                      <button
                        type="button"
                        title="Delete GPS configuration"
                        onClick={() => openDeleteModal(config)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        {deletingId === config.id ? (
                          <span className="text-xs">Deleting...</span>
                        ) : (
                          <Trash2 className="h-4 w-4 inline" />
                        )}
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Confirm Deletion
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete the GPS configuration "{configToDelete?.config_name}"?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeDeleteModal}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GPSConfigTable;
