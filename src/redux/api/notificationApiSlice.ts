import { apiSlice } from "./apiSlice";
import { NOTIFICATION_URL } from "../features/constants"; // Adjust this URL as needed

// --- Types ---
interface Notification {
  id: number;
  recipientId: number;
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  notificationType: string;
  priority: string;
  relatedEntityType: string;
  relatedEntityId: number;
  relatedData: {
    endDate: string;
    leaveType: string;
    startDate: string;
  };
  channels: Array<{ type: string; enabled: boolean }>;
  isRead: boolean;
  emailSent: boolean;
  pushSent: boolean;
  smsSent: boolean;
  metadata: { source: string; testMode: boolean };
  createdAt: string;
  expiresAt: string;
}

interface GetNotificationsResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    notifications: Notification[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
  };
  errorCode: string;
  timestamp: string;
  path: string;
}

// --- Endpoints ---
export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get user notifications
    getNotifications: builder.query<GetNotificationsResponse, { token: string; limit?: number; offset?: number; unreadOnly?: boolean }>({
      query: ({ token, limit = 20, offset = 0, unreadOnly = false }) => ({
        url: `${NOTIFICATION_URL}`,
        method: "GET",
        params: { limit, offset, unreadOnly },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      providesTags: ["Notifications"],
    }),
  }),
});

// --- Hooks ---
export const { useGetNotificationsQuery } = notificationApiSlice;
