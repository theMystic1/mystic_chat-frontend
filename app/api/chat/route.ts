import { proxy } from "@/utils/api/proxi";

export const GET = async () => proxy("GET", "/chat");
export const POST = async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  console.log("body", body);

  return proxy("POST", "/chat", body);
};
