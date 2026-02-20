import ChatPane from "@/components/chat/single-chat";
import { createServerApi } from "@/lib/api/axios-server";
// import axios from "axios";
// import { redirect } from "next/navigation";

const ChatByIdPage = async ({ params }: { params: { chatId: string } }) => {
  const chatParams = await params;

  return <ChatPane chatId={chatParams.chatId} />;
};
export default ChatByIdPage;
