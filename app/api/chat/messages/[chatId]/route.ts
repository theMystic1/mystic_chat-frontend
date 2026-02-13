import { proxy } from "@/utils/api/proxi";

export const GET = async (
  req: Request,
  { params }: { params: { chatId: string } },
) => {
  const body = await req.json().catch((e) => console.error(e));
  const { chatId } = await params;

  // console.log("chatId", chatId);

  return proxy("GET", `/chat/messages/${chatId}`, body);
};
