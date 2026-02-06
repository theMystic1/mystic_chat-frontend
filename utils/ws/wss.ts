"use client";

export type ChatDTO = {
  id: string;
  type: "dm" | "group";
  members: string[];
  createdAt?: string;
};

export type MessageDTO = {
  id: string;
  chatId: string;
  senderId: string;
  type: "text" | "image" | "file" | "system";
  text?: string;
  createdAt?: string;
  attachments?: { kind: "image" | "file"; url: string }[];
};

export type ServerEvent =
  | { type: "welcome"; data: string }
  | { type: "auth_ok"; data: { userId: string } }
  | { type: "auth_error"; data: string }
  | { type: "joined_chat"; data: { chatId: string } }
  | { type: "join_denied"; data: { chatId: string; reason: string } }
  | { type: "left_chat"; data: { chatId: string } }
  | { type: "chat_created"; data: ChatDTO }
  | { type: "message_sent"; data: MessageDTO }
  | {
      type: "message_delivered";
      data: { chatId: string; messageId: string; deliveredTo: string };
    }
  | {
      type: "messages_delivered";
      data: { chatId: string; messageIds: string; deliveredTo: string };
    }
  | {
      type: "messages_read";
      data: { chatId: string; messageIds: string; deliveredTo: string };
    }
  | {
      type: "message_read";
      data: {
        chatId: string;
        messageId: string;
        readBy: string;
        readAt: string;
      };
    }
  | { type: "typing_start"; data: { chatId: string; userId: string } }
  | { type: "typing_stop"; data: { chatId: string; userId: string } };

export type ClientEvent =
  | { type: "auth"; token: string }
  | { type: "join_chat"; chatId: string }
  | { type: "leave_chat"; chatId: string }
  | { type: "ack_delivered"; chatId: string; messageId: string }
  | { type: "ack_read"; chatId: string; messageId: string }
  | { type: "typing_start"; chatId: string }
  | { type: "typing_stop"; chatId: string }
  | { type: "ack_delivered_all"; chatId: string }
  | { type: "ack_read_all"; chatId: string };

type Listener = (evt: ServerEvent) => void;

const WS_READY = () => typeof window !== "undefined";

type WsState = {
  connected: boolean;
  authed: boolean;
  token: string | null;
  userId: string | null;
  joinedChats: string[];
};

export class WsClient {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private url: string;

  // state
  private authed = false;
  private token: string | null = null;
  private userId: string | null = null;
  private pendingJoins = new Set<string>();

  constructor(url: string) {
    this.url = url;
  }

  // ---------- public API ----------
  public on = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  /** ✅ use this from React code instead of touching private send() */
  public emitClient = (payload: ClientEvent) => {
    this.send(payload);
  };

  public connect = (token: string) => {
    if (!WS_READY()) return;

    this.token = token;

    // avoid duplicate connections
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      // re-auth if needed
      if (!this.authed) this.send({ type: "auth", token });
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.authed = false;
      this.userId = null;
      this.send({ type: "auth", token });
    };

    this.ws.onmessage = (m) => {
      try {
        const evt = JSON.parse(m.data) as ServerEvent;
        this.emitServer(evt);

        if (evt.type === "auth_ok") {
          this.authed = true;
          this.userId = evt.data.userId;

          // replay joins
          for (const chatId of this.pendingJoins) {
            this.send({ type: "join_chat", chatId });
          }
        }

        if (evt.type === "auth_error") {
          this.authed = false;
          this.userId = null;
        }
      } catch {
        // ignore bad payloads
      }
    };

    this.ws.onclose = () => {
      this.authed = false;
      this.userId = null;

      // simple reconnect with backoff
      setTimeout(() => {
        if (this.token) this.connect(this.token);
      }, 800);
    };

    this.ws.onerror = () => {
      // let onclose handle reconnect
    };
  };

  public disconnect = () => {
    this.token = null;
    this.authed = false;
    this.userId = null;
    this.pendingJoins.clear();
    this.ws?.close();
    this.ws = null;
  };

  public joinChat = (chatId: string) => {
    this.pendingJoins.add(chatId);
    if (this.authed) this.send({ type: "join_chat", chatId });
  };

  public leaveChat = (chatId: string) => {
    this.pendingJoins.delete(chatId);
    if (this.authed) this.send({ type: "leave_chat", chatId });
  };

  // Convenience helpers (optional)
  public ackDelivered = (chatId: string, messageId: string) => {
    this.emitClient({ type: "ack_delivered", chatId, messageId });
  };

  public ackRead = (chatId: string, messageId: string) => {
    this.emitClient({ type: "ack_read", chatId, messageId });
  };

  public typingStart = (chatId: string) => {
    this.emitClient({ type: "typing_start", chatId });
  };

  public typingStop = (chatId: string) => {
    this.emitClient({ type: "typing_stop", chatId });
  };

  // WsClient.ts
  ackDeliveredAll = (chatId: string) => {
    this.send({ type: "ack_delivered_all", chatId });
  };

  ackReadAll = (chatId: string) => {
    this.send({ type: "ack_read_all", chatId });
  };

  public getState = (): WsState => {
    const connected = this.ws?.readyState === WebSocket.OPEN;
    return {
      connected,
      authed: this.authed,
      token: this.token,
      userId: this.userId,
      joinedChats: Array.from(this.pendingJoins),
    };
  };

  public getJoinedChats = () => Array.from(this.pendingJoins);

  // ---------- internal ----------
  private emitServer = (evt: ServerEvent) => {
    for (const fn of this.listeners) fn(evt);
  };

  private send = (payload: ClientEvent) => {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  };
}
