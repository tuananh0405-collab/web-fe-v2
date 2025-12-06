// src/pages/Schedule/components/ScheduleTableHeader.tsx
import React from "react";
import { dayLabels } from "../utils";

interface ScheduleTableHeaderProps {
  weekDays: Date[];
}

export const ScheduleTableHeader: React.FC<ScheduleTableHeaderProps> = ({
  weekDays,
}) => {
  return (
    <div className="grid grid-cols-[260px_repeat(7,_minmax(120px,1fr))] bg-gray-50 dark:bg-gray-900/40">
      <div className="border-b border-gray-200 dark:border-gray-800" />
      {weekDays.map((day, idx) => (
        <div
          key={idx}
          className="border-b border-l border-gray-200 px-4 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400"
        >
          <div>{dayLabels[idx]}</div>
          <div className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
            {day.getMonth() + 1}/{day.getDate()}/{day.getFullYear()}
          </div>
        </div>
      ))}
    </div>
  );
};
