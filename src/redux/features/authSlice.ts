import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { AUTH_URL } from "./constants";

// ------------------
// Kiểu dữ liệu
// ------------------
interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  userState: {
    data: {
      access_token: string;
      refresh_token: string;
      user?: UserData;
    };
  } | null;
}

// ------------------
// Trạng thái ban đầu
// ------------------
const initialState: AuthState = {
  userState: localStorage.getItem("userState")
    ? JSON.parse(localStorage.getItem("userState")!)
    : null,
};

// ------------------
// Async Thunk: logout gọi API thật
// ------------------
export const logoutAsync = createAsyncThunk(
  "auth/logoutAsync",
  async (_, thunkAPI) => {
    try {
      const state = (thunkAPI.getState() as { auth: AuthState }).auth;
      const token = state.userState?.data?.access_token;

      if (token) {
        await fetch(`${AUTH_URL.replace("/auth", "")}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    }

    // Dù lỗi hay thành công đều xóa localStorage
    localStorage.removeItem("userState");
    localStorage.removeItem("expirationTime");
    return null;
  }
);

// ------------------
// Slice
// ------------------
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthState["userState"]>) => {
      state.userState = action.payload;
      localStorage.setItem("userState", JSON.stringify(action.payload));
      const expirationTime =
        new Date().getTime() + 30 * 24 * 60 * 60 * 1000; // 30 ngày
      localStorage.setItem("expirationTime", expirationTime.toString());
    },

    // ✅ Thêm reducer mới để cập nhật token sau khi refresh
    updateTokens: (
      state,
      action: PayloadAction<{ access_token: string; refresh_token: string }>
    ) => {
      if (state.userState?.data) {
        state.userState.data.access_token = action.payload.access_token;
        state.userState.data.refresh_token = action.payload.refresh_token;
        localStorage.setItem("userState", JSON.stringify(state.userState));
      }
    },

    logout: (state) => {
      state.userState = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.userState = null;
    });
  },
});

export const { setCredentials, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
