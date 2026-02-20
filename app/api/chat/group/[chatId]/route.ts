import { proxy } from "@/utils/api/proxi";

export const PATCH = async (
  req: Request,
  { params }: { params: { chatId: string } },
) => {
  const body = await req.json().catch(() => ({}));

  const { chatId } = await params;
  return proxy("PATCH", `/chat/group/${chatId}`, body);
};
