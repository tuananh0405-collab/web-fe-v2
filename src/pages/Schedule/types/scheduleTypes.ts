// src/pages/Schedule/types/scheduleTypes.ts

export interface LeaveHolidayInfo {
  type: "holiday" | "leave";
  label: string;
  color: string; // color_hex from leave type or fixed color for holiday
  data: any;
}
