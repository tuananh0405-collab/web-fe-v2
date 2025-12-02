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
    // DELETE /faceid/{userId}
    deleteFaceUser: builder.mutation<any, number>({
      query: (userId) => ({
        url: `${FACE_URL}/faceid/${userId}`,
        method: "DELETE",
      }),
      // invalidate tags if you want automatic refetching elsewhere
    }),
  }),
});

// Hook dùng trong component
export const { useGetFaceUsersQuery, useDeleteFaceUserMutation } = faceApiSlice;
