import { BASE_URL } from "../features/constants";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../features/store";
import { logout, setCredentials } from "../features/authSlice";

// ⚙️ Tạo baseQuery có gắn token vào header
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState)?.auth?.userState?.data?.access_token;
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

// ⚙️ Thêm lớp "wrapper" để tự động refresh khi gặp 401
const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    console.warn("Access token expired — trying to refresh...");

    const refresh_token = (api.getState() as RootState)?.auth?.userState?.data?.refresh_token;

    if (refresh_token) {
      // Gọi API refresh token
      const refreshResult = await baseQuery(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refresh_token },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        // ✅ Cập nhật lại access_token và refresh_token mới vào Redux
        const { access_token, refresh_token: new_refresh_token } = refreshResult.data as {
          access_token: string;
          refresh_token: string;
        };

        const currentUser = (api.getState() as RootState).auth.userState?.data?.user;
        const newUserState = {
          data: {
            access_token,
            refresh_token: new_refresh_token,
            user: currentUser,
          },
        };

        api.dispatch(setCredentials(newUserState));

        // ✅ Retry lại request ban đầu với token mới
        result = await baseQuery(args, api, extraOptions);
      } else {
        console.error("Refresh token failed — logging out.");
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

// ✅ Tạo API Slice chính
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "Accounts","Departments","Employees"],
  endpoints: () => ({}),
});
