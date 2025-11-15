// src/redux/api/apiSlice.ts
import { BASE_URL } from "../features/constants";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../features/store";
import { logout, setCredentials } from "../features/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState)?.auth?.userState?.data?.access_token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

let refreshingPromise: Promise<string | null> | null = null;

const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refresh_token = state?.auth?.userState?.data?.refresh_token;
    if (!refresh_token) {
      api.dispatch(logout());
      return result;
    }

    if (!refreshingPromise) {
      refreshingPromise = baseQuery(
        { url: "/auth/refresh", method: "POST", body: { refresh_token } },
        api, extraOptions
      ).then((refreshResult: any) => {
        const access_token = refreshResult?.data?.data?.access_token;
        const new_refresh_token = refreshResult?.data?.data?.refresh_token ?? refresh_token;
        if (!access_token) {
          api.dispatch(logout());
          return null;
        }
        const currentUser = (api.getState() as RootState).auth.userState?.data?.user;
        api.dispatch(setCredentials({
          data: { access_token, refresh_token: new_refresh_token, user: currentUser }
        }));
        return access_token as string;
      }).finally(() => { refreshingPromise = null; });
    }

    const newAccess = await refreshingPromise;
    if (newAccess) {
      // Retry: KHÔNG gắn header thủ công ở endpoint để prepareHeaders dùng token mới
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "Accounts", "Departments", "Employees"],
  endpoints: () => ({}),
});
