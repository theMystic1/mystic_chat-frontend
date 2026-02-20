import { proxy } from "@/utils/api/proxi";

export const GET = async (
  req: Request,
  { params }: { params: { chatId: string } },
) => {
  const { chatId } = await params;

  return proxy("GET", `/chat/members/${chatId}`);
};

export const PATCH = async (
  req: Request,
  { params }: { params: { chatId: string } },
) => {
  const body = await req.json().catch(() => ({}));

  const { chatId } = await params;
  return proxy("PATCH", `/chat/members/${chatId}`, body);
};
