// src/pages/Schedule/hooks/useWeekNavigation.ts
import { useState, useCallback } from "react";
import { getMonday } from "../utils";

/**
 * Custom hook to manage week navigation state and actions.
 * 
 * This hook encapsulates:
 * - Week start date state
 * - Navigation functions (previous, next, this week)
 * 
 * @returns {Object} Week navigation state and functions
 */
export const useWeekNavigation = () => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday());

  const goToPreviousWeek = useCallback(() => {
    setWeekStart((ws) => {
      const d = new Date(ws);
      d.setDate(d.getDate() - 7);
      return getMonday(d);
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStart((ws) => {
      const d = new Date(ws);
      d.setDate(d.getDate() + 7);
      return getMonday(d);
    });
  }, []);

  const goToThisWeek = useCallback(() => {
    setWeekStart(getMonday());
  }, []);

  return {
    weekStart,
    setWeekStart,
    goToPreviousWeek,
    goToNextWeek,
    goToThisWeek,
  };
};
