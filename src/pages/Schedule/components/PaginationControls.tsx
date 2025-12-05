// src/pages/Schedule/components/PaginationControls.tsx
import React from "react";
import { getPageItems } from "../utils";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  if (totalPages === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          className={`px-3 py-1 rounded-md text-sm ${
            page > 1
              ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              : "bg-gray-100 text-gray-400 dark:bg-gray-800"
          }`}
        >
          Prev
        </button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1">
          {getPageItems(totalPages, page).map((p, idx) =>
            p === -1 ? (
              <span
                key={`e-${idx}`}
                className="px-2 text-sm text-gray-500"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                disabled={p === page}
                className={`px-3 py-1 rounded-md text-sm ${
                  p === page
                    ? "bg-brand-600 text-white dark:bg-brand-500"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                }`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`px-3 py-1 rounded-md text-sm ${
            page < totalPages
              ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              : "bg-gray-100 text-gray-400 dark:bg-gray-800"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};
