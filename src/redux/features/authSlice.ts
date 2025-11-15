import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { AUTH_URL } from "./constants";
import { useLogoutMutation } from "../api/authApiSlice";

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
  
});

export const { setCredentials, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
