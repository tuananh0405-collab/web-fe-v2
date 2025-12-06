// src/redux/api/gpsConfigApiSlice.ts
import { apiSlice } from "./apiSlice";

const GPS_CONFIG_URL = "/attendance/gps-check-config";

export interface GPSCheckConfig {
  id: number;
  config_name: string;
  description: string;
  shift_type: "REGULAR" | "OVERTIME" | "ALL";
  check_strategy: "DURATION_BASED" | "FIXED_COUNT";
  check_interval_hours: number;
  min_checks_per_shift: number;
  max_checks_per_shift: number;
  enable_random_timing: boolean;
  random_offset_minutes: number;
  min_shift_duration_hours: number;
  default_checks_count: number;
  is_active: boolean;
  is_default: boolean;
  priority: number;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface GetGPSConfigsResponse {
  status: string;
  statusCode: number;
  message: string;
  data: GPSCheckConfig[];
  errorCode: string;
  timestamp: string;
  path: string;
}

export interface GetGPSConfigsArgs {
  token: string;
  activeOnly?: boolean;
}

export const gpsConfigApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGPSConfigs: builder.query<GetGPSConfigsResponse, GetGPSConfigsArgs>({
      query: ({ token, activeOnly = true }) => ({
        url: `${GPS_CONFIG_URL}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: activeOnly ? { activeOnly: true } : {},
      }),
      providesTags: ["GPSConfigs"],
    }),

    getGPSConfigById: builder.query<
      { status: string; data: GPSCheckConfig },
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${GPS_CONFIG_URL}/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: (_result, _error, arg) => [{ type: "GPSConfigs", id: arg.id }],
    }),

    createGPSConfig: builder.mutation<
      { status: string; data: GPSCheckConfig },
      { token: string; data: Partial<GPSCheckConfig> }
    >({
      query: ({ token, data }) => ({
        url: GPS_CONFIG_URL,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      }),
      invalidatesTags: ["GPSConfigs"],
    }),

    updateGPSConfig: builder.mutation<
      { status: string; data: GPSCheckConfig },
      { token: string; id: number; data: Partial<GPSCheckConfig> }
    >({
      query: ({ token, id, data }) => ({
        url: `${GPS_CONFIG_URL}/${id}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      }),
      invalidatesTags: (_result, _error, arg) => [
        "GPSConfigs",
        { type: "GPSConfigs", id: arg.id },
      ],
    }),

    deleteGPSConfig: builder.mutation<
      { status: string; message: string },
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${GPS_CONFIG_URL}/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["GPSConfigs"],
    }),

    toggleGPSConfigStatus: builder.mutation<
      { status: string; data: GPSCheckConfig },
      { token: string; id: number }
    >({
      query: ({ token, id }) => ({
        url: `${GPS_CONFIG_URL}/${id}/toggle-status`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: (_result, _error, arg) => [
        "GPSConfigs",
        { type: "GPSConfigs", id: arg.id },
      ],
    }),
  }),
});

export const {
  useGetGPSConfigsQuery,
  useGetGPSConfigByIdQuery,
  useCreateGPSConfigMutation,
  useUpdateGPSConfigMutation,
  useDeleteGPSConfigMutation,
  useToggleGPSConfigStatusMutation,
} = gpsConfigApiSlice;
