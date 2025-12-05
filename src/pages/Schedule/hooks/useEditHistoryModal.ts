// src/pages/Schedule/hooks/useEditHistoryModal.ts
import { useState } from "react";

export const useEditHistoryModal = () => {
  const [isEditHistoryModalOpen, setIsEditHistoryModalOpen] = useState(false);
  const [selectedHistoryEmployeeId, setSelectedHistoryEmployeeId] = useState<number | null>(null);

  const openEditHistoryModal = () => {
    setSelectedHistoryEmployeeId(null);
    setIsEditHistoryModalOpen(true);
  };

  const closeEditHistoryModal = () => {
    setIsEditHistoryModalOpen(false);
    setSelectedHistoryEmployeeId(null);
  };

  return {
    isEditHistoryModalOpen,
    selectedHistoryEmployeeId,
    setSelectedHistoryEmployeeId,
    openEditHistoryModal,
    closeEditHistoryModal,
  };
};
