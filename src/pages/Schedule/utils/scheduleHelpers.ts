// src/pages/Schedule/utils/scheduleHelpers.ts

/**
 * Combines a date string (YYYY-MM-DD) with a time string (HH:MM:SS) into a Date object
 * @param dateStr - Date in format YYYY-MM-DD
 * @param timeStr - Time in format HH:MM:SS or HH:MM
 * @returns Combined Date object
 */
export const combineDateTime = (dateStr: string, timeStr: string): Date => {
  if (!dateStr || !timeStr) {
    return new Date();
  }
  return new Date(`${dateStr}T${timeStr}`);
};

/**
 * Checks if a given date falls within a date range (inclusive)
 * @param dateStr - Date to check in format YYYY-MM-DD
 * @param startDate - Start of range in format YYYY-MM-DD
 * @param endDate - End of range in format YYYY-MM-DD
 * @returns true if date is within range
 */
export const isDateInRange = (
  dateStr: string,
  startDate: string,
  endDate: string
): boolean => {
  if (!dateStr || !startDate || !endDate) {
    return false;
  }
  const date = new Date(dateStr);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return date >= start && date <= end;
};

/**
 * Formats a Date object to YYYY-MM-DD string
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Gets the Monday of the week for a given date
 * @param date - Input date
 * @returns Monday of that week
 */
export const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

/**
 * Gets an array of 7 dates starting from Monday
 * @param monday - Starting Monday date
 * @returns Array of 7 consecutive dates
 */
export const getWeekDays = (monday: Date): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
};

/**
 * Formats time string from HH:MM:SS to HH:MM
 * @param timeStr - Time in format HH:MM:SS
 * @returns Time in format HH:MM
 */
export const formatTime = (timeStr: string): string => {
  if (!timeStr) return "";
  return timeStr.substring(0, 5);
};

/**
 * Gets day name from date
 * @param date - Input date
 * @returns Day name (e.g., "Monday")
 */
export const getDayName = (date: Date): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
};

/**
 * Checks if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Checks if date is today
 * @param date - Date to check
 * @returns true if date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};
