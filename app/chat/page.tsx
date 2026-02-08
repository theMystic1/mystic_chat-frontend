import ChatSidebar from "@/components/chat/chat-sidebar";
import { createServerApi } from "@/lib/api/axios-server";

const ChatIndexPage = async () => {
  const server = await createServerApi();
  const { data } = await server.get("/chat");

  // console.log(data);

  return (
    <div className="min-h-screen ">
      {/* Mobile: show chat list */}
      <div className="lg:hidden h-full min-h-0 bg-surface">
        <ChatSidebar />
      </div>

      {/* Desktop: empty state */}
      <div className="hidden lg:flex h-full items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-lg font-semibold">Select a chat</p>
          <p className="text-sm text-muted mt-2">
            Choose a conversation from the left to start messaging.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatIndexPage;
