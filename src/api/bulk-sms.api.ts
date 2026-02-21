/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosInstance } from "axios";

export interface BulkSmsRequest {
  message: string;
  recipientIds: {
    builderIds: number[];
    customerIds: number[];
  };
  phoneNumbers?: string[];
  filters?: {
    builders?: {
      userType?: string;
      county?: string;
      searchTerm?: string;
    };
    customers?: {
      accountType?: string;
      county?: string;
      searchTerm?: string;
    };
  };
  metadata?: {
    totalRecipients?: number;
    sentAt?: string;
    recipientType?: string;
  };
}

export interface BulkSmsResponse {
  success: boolean;
  smsId: string;
  message: string;
  totalRecipients: number;
  sentAt: string;
  status: "sent" | "pending" | "failed" | "partial";
  failedRecipients?: Array<{
    id: number;
    reason: string;
  }>;
}

export interface Recipient {
  id?: number;
  name: string;
  phoneNumber: string;
  type: "builder" | "customer" | "manual";
  email?: string;
  status: "sent" | "failed" | "pending";
  failureReason?: string;
}

export interface SmsHistoryEntry {
  id: string;
  message: string;
  messagePreview: string;
  recipients: number;
  builderCount: number;
  customerCount: number;
  date: string;
  sentAt: string;
  status: "sent" | "pending" | "failed" | "partial";
  type: "builders" | "customers" | "mixed";
  filters?: any;
  recipientsList?: Recipient[]; // Optional - backend may not provide this
  metadata?: {
    characterCount: number;
    smsCount: number;
    failedCount: number;
  };
}

export interface DetailedSmsHistory extends SmsHistoryEntry {
  recipientsList: Recipient[];
}

/**
 * Send bulk SMS to selected builders and/or customers
 * @param axiosInstance - Axios instance with authentication
 * @param request - BulkSmsRequest object with message and recipient IDs
 * @returns Promise<BulkSmsResponse>
 */
export const sendBulkSms = async (
  axiosInstance: AxiosInstance,
  request: BulkSmsRequest
): Promise<BulkSmsResponse> => {
  const response = await axiosInstance.post<BulkSmsResponse>(
    "/api/bulk-sms/send",
    request
  );
  return response.data;
};

/**
 * Send a single SMS to a specific phone number
 * @param axiosInstance - Axios instance with authentication
 * @param phoneNumber - Phone number to send SMS to
 * @param message - SMS message content
 * @returns Promise<BulkSmsResponse>
 */
export const sendSingleSms = async (
  axiosInstance: AxiosInstance,
  phoneNumber: string,
  message: string
): Promise<BulkSmsResponse> => {
  const response = await axiosInstance.post<BulkSmsResponse>(
    "/api/bulk-sms/send-single",
    null,
    {
      params: {
        phoneNumber,
        message,
      },
    }
  );
  return response.data;
};

/**
 * Get SMS history - all previously sent bulk SMS
 * Handles both wrapped responses ({ success,message,data }) and direct arrays.
 * @param axiosInstance - Axios instance with authentication
 * @returns Promise<SmsHistoryEntry[]>
 */
export const getSmsHistory = async (
  axiosInstance: AxiosInstance
): Promise<SmsHistoryEntry[]> => {
  const response = await axiosInstance.get("/api/bulk-sms/history");
  // backend may return { success, message, data } or an array directly
  const payload = response.data?.data ?? response.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

/**
 * Get specific SMS history entry by ID
 * @param axiosInstance - Axios instance with authentication
 * @param smsId - SMS history entry ID
 * @returns Promise<SmsHistoryEntry>
 */
export const getSmsHistoryById = async (
  axiosInstance: AxiosInstance,
  smsId: string
): Promise<SmsHistoryEntry> => {
  const response = await axiosInstance.get(`/api/bulk-sms/history/${smsId}`);
  const payload = response.data?.data ?? response.data ?? null;
  if (!payload) throw new Error('SMS history item not found');
  return payload as SmsHistoryEntry;
};