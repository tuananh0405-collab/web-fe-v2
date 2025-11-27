import { apiSlice } from "./apiSlice";
import { HOLIDAY_URL } from "../features/constants";

// --- Types ---
export interface Pagination {
  has_next: boolean;
  has_prev: boolean;
  limit: number;
  page: number;
  total: number;
  total_pages: number;
}

export enum HolidayType {
  PUBLIC_HOLIDAY = "PUBLIC_HOLIDAY",
  COMPANY_HOLIDAY = "COMPANY_HOLIDAY",
  REGIONAL_HOLIDAY = "REGIONAL_HOLIDAY",
  RELIGIOUS_HOLIDAY = "RELIGIOUS_HOLIDAY",
}

export enum HolidayAppliesTo {
  ALL = "ALL",
  DEPARTMENT = "DEPARTMENT",
  LOCATION = "LOCATION",
}

export enum HolidayStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface Holiday {
  id: number;
  holiday_name: string;
  holiday_date: string;
  holiday_type: HolidayType | string;
  applies_to: HolidayAppliesTo | string;
  department_ids?: string | null;
  location_ids?: string | null;
  is_recurring: boolean;
  recurring_month?: number | null;
  recurring_day?: number | null;
  recurring_rule?: string | null;
  is_mandatory: boolean;
  is_paid: boolean;
  can_work_for_ot: boolean;
  description?: string | null;
  year: number;
  status: HolidayStatus | string;
  created_at: string;
  updated_at: string;
}

export interface GetHolidaysResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    holidays: Holiday[];
    pagination?: Pagination;
  };
  timestamp: string;
  path: string;
}

export interface GetHolidayByIdResponse {
  status: string;
  statusCode: number;
  message: string;
  data: Holiday;
  timestamp: string;
  path: string;
}

export interface GetHolidayCalendarResponse {
  status: string;
  statusCode: number;
  message: string;
  data: Holiday[];
  timestamp: string;
  path: string;
}

export interface CreateHolidayRequest {
  holiday_name: string;
  holiday_date: string;
  holiday_type: HolidayType;
  applies_to: HolidayAppliesTo;
  department_ids?: string;
  location_ids?: string;
  is_recurring: boolean;
  recurring_month?: number;
  recurring_day?: number;
  recurring_rule?: string;
  is_mandatory: boolean;
  is_paid: boolean;
  can_work_for_ot: boolean;
  description?: string;
  year: number;
}

export interface UpdateHolidayRequest {
  holiday_name?: string;
  holiday_date?: string;
  holiday_type?: HolidayType;
  applies_to?: HolidayAppliesTo;
  department_ids?: string;
  location_ids?: string;
  is_recurring?: boolean;
  recurring_month?: number;
  recurring_day?: number;
  recurring_rule?: string;
  is_mandatory?: boolean;
  is_paid?: boolean;
  can_work_for_ot?: boolean;
  description?: string;
  year?: number;
  status?: HolidayStatus;
}

export interface BulkCreateHolidayItem {
  holiday_name: string;
  holiday_date: string;
  holiday_type: HolidayType;
  description?: string;
}

export interface BulkCreateHolidaysRequest {
  holidays: BulkCreateHolidayItem[];
  year: number;
  applies_to: HolidayAppliesTo;
  is_paid: boolean;
  is_mandatory: boolean;
}

// --- API Slice ---
export const holidayApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/leave/holidays - Get all holidays with optional filters
    getHolidays: builder.query<
      GetHolidaysResponse,
      {
        token: string;
        year?: number;
        holiday_type?: HolidayType;
        status?: HolidayStatus;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ token, year, holiday_type, status, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        if (year) params.append("year", year.toString());
        if (holiday_type) params.append("holiday_type", holiday_type);
        if (status) params.append("status", status);
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        return {
          url: `${HOLIDAY_URL}?${params.toString()}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      },
      providesTags: (result) =>
        result?.data?.holidays
          ? [
              ...result.data.holidays.map(({ id }) => ({
                type: "Holiday" as const,
                id,
              })),
              { type: "Holiday", id: "LIST" },
            ]
          : [{ type: "Holiday", id: "LIST" }],
    }),

    // GET /api/v1/leave/holidays/calendar/{year} - Get holiday calendar by year
    getHolidayCalendar: builder.query<
      GetHolidayCalendarResponse,
      { token: string; year: number }
    >({
      query: ({ token, year }) => ({
        url: `${HOLIDAY_URL}/calendar/${year}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: (result, error, { year }) => [
        { type: "Holiday", id: `CALENDAR_${year}` },
      ],
    }),

    // GET /api/v1/leave/holidays/{id} - Get holiday by ID
    getHolidayById: builder.query<
      GetHolidayByIdResponse,
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${HOLIDAY_URL}/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: (result, error, { id }) => [{ type: "Holiday", id }],
    }),

    // POST /api/v1/leave/holidays - Create a new holiday
    createHoliday: builder.mutation<
      GetHolidayByIdResponse,
      { token: string; body: CreateHolidayRequest }
    >({
      query: ({ token, body }) => ({
        url: HOLIDAY_URL,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      }),
      invalidatesTags: [{ type: "Holiday", id: "LIST" }],
    }),

    // PUT /api/v1/leave/holidays/{id} - Update holiday
    updateHoliday: builder.mutation<
      GetHolidayByIdResponse,
      { token: string; id: number; body: UpdateHolidayRequest }
    >({
      query: ({ token, id, body }) => ({
        url: `${HOLIDAY_URL}/${id}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Holiday", id },
        { type: "Holiday", id: "LIST" },
      ],
    }),

    // DELETE /api/v1/leave/holidays/{id} - Delete holiday
    deleteHoliday: builder.mutation<void, { token: string; id: number }>({
      query: ({ token, id }) => ({
        url: `${HOLIDAY_URL}/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Holiday", id },
        { type: "Holiday", id: "LIST" },
      ],
    }),

    // POST /api/v1/leave/holidays/bulk-create - Bulk create holidays
    bulkCreateHolidays: builder.mutation<
      GetHolidaysResponse,
      { token: string; body: BulkCreateHolidaysRequest }
    >({
      query: ({ token, body }) => ({
        url: `${HOLIDAY_URL}/bulk-create`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      }),
      invalidatesTags: [{ type: "Holiday", id: "LIST" }],
    }),
  }),
});

export const {
  useGetHolidaysQuery,
  useGetHolidayCalendarQuery,
  useGetHolidayByIdQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useBulkCreateHolidaysMutation,
} = holidayApiSlice;
