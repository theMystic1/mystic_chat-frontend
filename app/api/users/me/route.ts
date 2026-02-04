import { proxy } from "@/utils/api/proxi";

export const GET = async () => proxy("GET", "/users/me");
export const PATCH = async (req: Request) =>
  proxy("PATCH", "/users/me", await req.json());
