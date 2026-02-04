import { getAccessToken } from "@/utils/tokens";
import axios, { type AxiosInstance } from "axios";

export const createServerApi = async () => {
  const token = await getAccessToken();

  // console.log("token", token);

  return axios.create({
    baseURL: process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 30_000,
    headers: token ? { Authorization: `Bearer ${token.trim()}` } : {},
  });
};
