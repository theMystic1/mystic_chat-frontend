import { proxy } from "@/utils/api/proxi";

export const POST = async (
  req: Request,
  { params }: { params: { chatId: string } },
) => {
  const body = await req.json().catch((e) => console.error(e));
  const { chatId } = await params;

  console.log("chatId", chatId);

  return proxy("POST", `/chat/messages/${chatId}/send`, body);
};
