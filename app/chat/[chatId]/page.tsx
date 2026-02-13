import ChatPane from "@/components/chat/single-chat";
import { createServerApi } from "@/lib/api/axios-server";
// import axios from "axios";
// import { redirect } from "next/navigation";

const ChatByIdPage = async ({ params }: { params: { chatId: string } }) => {
  const chatParams = await params;

  // // console.log(chatParams);
  // const server = await createServerApi();
  // let chatData;
  // try {
  //   const { data } = await server.get(`/chat/messages/${chatParams?.chatId}`);
  //   chatData = data?.data;
  // } catch (error) {
  //   console.error(error);
  // }

  // // console.log(chatData);

  return <ChatPane chatId={chatParams.chatId} />;
};
export default ChatByIdPage;
