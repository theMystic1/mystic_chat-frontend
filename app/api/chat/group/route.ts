import { proxy } from "@/utils/api/proxi";

export const POST = async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  console.log("body", body);

  return proxy("POST", "/chat/group", body);
};
