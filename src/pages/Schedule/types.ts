// src/pages/Schedule/types.ts

export interface EmployeeRow {
  id: number;
  fullName: string;
  employeeCode: string;
  departmentName: string;
  email: string;
  scheduleAssignments: any[];
  shifts: any[];
  leaves: any[];
}

export type ShiftType = "SHIFT" | "OVERTIME" | "ABSENT" | "MEETING";

export interface UISimpleShift {
  id: number; // shift_id từ API
  employeeId: number;
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  type: ShiftType;
  date: string;
  status?: string; // shift status: SCHEDULED, COMPLETED, ABSENT, IN_PROGRESS
  isOvertimeRequest?: boolean; // true if this is an overtime request, not a shift
}

export type CellModalState = {
  employee: EmployeeRow;
  date: Date;
  shifts: UISimpleShift[];
} | null;

export type LeaveHolidayModalState = {
  type: "holiday" | "leave";
  data: any;
} | null;

export interface EffectiveScheduleResult {
  schedule: any | null;
  overrideInfo: { type: string; reason: string } | null;
  overtimeInfo: { start_time: string; end_time: string; reason: string } | null;
  actualShift: any | null;
}
