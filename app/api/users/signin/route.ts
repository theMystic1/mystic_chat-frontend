import { proxy } from "@/utils/api/proxi";

export const POST = async (req: Request) =>
  proxy("POST", "/users/signin", await req.json());
