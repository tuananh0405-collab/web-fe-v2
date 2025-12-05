// src/pages/Schedule/components/WeekNavigationHeader.tsx
import React from "react";
import { formatWeekRange, dayLabels } from "../utils";

interface WeekNavigationHeaderProps {
  weekDays: Date[];
  onPreviousWeek: () => void;
  onThisWeek: () => void;
  onNextWeek: () => void;
  onOpenBulkModal: () => void;
  onOpenUnassignModal: () => void;
  onOpenEditHistoryModal: () => void;
}

export const WeekNavigationHeader: React.FC<WeekNavigationHeaderProps> = ({
  weekDays,
  onPreviousWeek,
  onThisWeek,
  onNextWeek,
  onOpenBulkModal,
  onOpenUnassignModal,
  onOpenEditHistoryModal,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Weekly Schedule
        </h2>

        <div className="flex items-center gap-3 mt-2 w-full">
          {/* left: arrows + quick actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreviousWeek}
              title="Previous week"
              className="rounded-md border border-gray-200/80 bg-white px-3 py-1 text-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={onThisWeek}
              title="This week"
              className="rounded-md px-3 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-200"
            >
              This week
            </button>

            <button
              type="button"
              onClick={onNextWeek}
              title="Next week"
              className="rounded-md border border-gray-200/80 bg-white px-3 py-1 text-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
            >
              ›
            </button>
          </div>

          {/* center: human-friendly week range */}
          <div className="ml-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="font-medium text-gray-800 dark:text-white/90">
              {formatWeekRange(weekDays[0], weekDays[6])}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {dayLabels[0]} — {dayLabels[6]}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpenEditHistoryModal}
          className="inline-flex items-center justify-center rounded-full border border-purple-500 px-4 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-200 dark:hover:bg-purple-500/10"
        >
          View Edit History
        </button>
        <button
          type="button"
          onClick={onOpenUnassignModal}
          className="inline-flex items-center justify-center rounded-full border border-red-500 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-200 dark:hover:bg-red-500/10"
        >
          Unassign
        </button>
        <button
          type="button"
          onClick={onOpenBulkModal}
          className="inline-flex items-center justify-center rounded-full border border-brand-500 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-200 dark:hover:bg-brand-500/10"
        >
          Assign
        </button>
      </div>
    </div>
  );
};
