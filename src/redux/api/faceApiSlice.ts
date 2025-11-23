// src/redux/api/faceApiSlice.ts
import { FACE_URL } from "../features/constants";
import { apiSlice } from "./apiSlice";


// ===== TYPES =====
export interface FaceUser {
  UserId: number;
  HasFaceId: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface GetFaceUsersResponse {
  Success: boolean;
  Data: {
    TotalCount: number;
    Users: FaceUser[];
  };
  Message: string;
}

// ===== API SLICE =====
export const faceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/face/faceid/users
    getFaceUsers: builder.query<GetFaceUsersResponse, void>({
      query: () => ({
        url: `${FACE_URL}/faceid/users`,
        method: "GET",
      }),
    }),
  }),
});

// Hook dùng trong component
export const { useGetFaceUsersQuery } = faceApiSlice;
