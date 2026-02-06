// lib/api/axios-server.ts
import axios from "axios";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/utils/tokens";

export const createServerApi = async () => {
  const baseURL = process.env.API_BASE_URL; // MUST be server env (no NEXT_PUBLIC required)
  if (!baseURL) {
    throw new Error(
      "API_BASE_URL is not set (server). Set it in .env.local and restart.",
    );
  }

  const cookieServer = await cookies();

  const token = cookieServer.get(ACCESS_COOKIE)?.value;

  return axios.create({
    baseURL,
    timeout: 30_000,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
