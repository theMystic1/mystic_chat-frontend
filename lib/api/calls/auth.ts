import { apiClient } from "@/lib/api/axios-client";
import { METype } from "@/utils/types";

const base = "/users";

export const fetchMe = async () => {
  const { data } = await apiClient.get(`${base}/me`);
  return data;
};

export const updateMe = async (userData: METype) => {
  const { data } = await apiClient.patch(`${base}/me`, userData);
  return data;
};

export const signin = async (email: string) => {
  const { data } = await apiClient.post(`${base}/signin`, { email });
  return data;
};
export const resendToken = async (email: string) => {
  const { data } = await apiClient.post(`${base}/resendToken`, { email });
  return data;
};

export const verifyEmail = async (email: string, token: string) => {
  const { data } = await apiClient.post(`${base}/verify`, { email, token });
  return data;
};
