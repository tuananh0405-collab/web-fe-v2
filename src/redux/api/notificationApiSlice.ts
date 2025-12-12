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

interface MarkAsReadResponse {
  status: string;
  statusCode: number;
  message: string;
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
    
    // Mark single notification as read
    markNotificationAsRead: builder.mutation<MarkAsReadResponse, { token: string; id: number }>({
      query: ({ token, id }) => ({
        url: `${NOTIFICATION_URL}/${id}/read`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["Notifications"],
    }),
    
    // Mark all notifications as read
    markAllNotificationsAsRead: builder.mutation<MarkAsReadResponse, { token: string }>({
      query: ({ token }) => ({
        url: `${NOTIFICATION_URL}/read-all`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

// --- Hooks ---
export const { 
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = notificationApiSlice;
