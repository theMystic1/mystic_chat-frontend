import axios from "axios";

export type ApiError = {
  status?: number;
  message: string;
  data?: unknown;
};

export const toApiError = (e: unknown): ApiError => {
  if (!axios.isAxiosError(e)) return { message: "Unexpected error" };

  const status = e.response?.status;
  const data = e.response?.data;

  const message =
    (data as any)?.message ??
    (data as any)?.error ??
    e.message ??
    "Request failed";

  return { status, message, data };
};
