export type FormData = {
  userName: string;
  displayName: string;
  avatarUrl: string; // preview URL (object URL) OR eventual CDN URL after upload
  bio: string;
};

export type StepKey = keyof FormData;

export type Step =
  | {
      key: "userName" | "displayName";
      title: string;
      subtitle?: string;
      placeholder: string;
      required?: boolean;
      type: "text";
      helper?: string;
    }
  | {
      key: "avatarUrl";
      title: string;
      subtitle?: string;
      required?: boolean;
      type: "image";
      helper?: string;
    }
  | {
      key: "bio";
      title: string;
      subtitle?: string;
      placeholder: string;
      required?: boolean;
      type: "textarea";
      helper?: string;
    };

export type METype = {
  isNewUser: boolean;
  userName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
};

export type ObjectIdString = string; // Mongo ObjectId serialized

export type MessageType = "text" | "image" | "file" | "system"; // extend as your backend supports

export type ChatMessage = {
  _id: ObjectIdString;
  chatId: ObjectIdString;
  senderId: ObjectIdString;
  type: MessageType;
  text?: string;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
  // add any other fields your backend includes: attachments, meta, etc.
};

export type ChatType = "dm" | "group";

export type Chat = {
  _id: ObjectIdString;
  type: ChatType;

  members: UserType[]; // usually length 2 for dm, >= 3 for group
  dmKey?: string; // present for dm, optional for group

  isMuted: boolean;
  isSpam: boolean;

  lastMessageId?: ChatMessage | null; // populated object OR id OR null
  lastReadAt: string | null; // ISO string or null
  lastReadMessageId: ObjectIdString | null;

  unreadCount: number;

  createdAt: string; // ISO
  updatedAt: string; // ISO
  __v?: number;
};

export type UserType = {
  _id: string;
  userName?: string;
  email: string;
  avatarUrl: string;
  isNewUser: boolean;
  createdAt: string;
  updatedAt: string;
  signinAt: string;
  bio?: string;
  displayName?: string;
  lastSeenAt?: Date;
};

type MessageStatus = "sent" | "delivered" | "read" | "failed" | "queued";

type Reaction = {
  emoji: string;
  userId: ObjectIdString;
  createdAt?: string; // optional if your backend includes it
};

export type Attachment = {
  url: string;
  type: "image" | "file" | "video" | "audio";
  name?: string;
  size?: number;
  mime?: string;
};

export type MessageRes = {
  _id: ObjectIdString;
  chatId: ObjectIdString;
  senderId: ObjectIdString;

  type: MessageType;
  text?: string;

  attachments: Attachment[]; // currently empty arrays
  replyToMessageId: ObjectIdString | null;

  deliveredTo: string[];
  readBy: string[];

  editedAt: string | null;
  deletedAt: string | null;
  deletedBy: ObjectIdString | null;
  deletedFor: ObjectIdString[];

  status: MessageStatus;

  reactions: Reaction[];

  createdAt: string; // ISO
  updatedAt: string; // ISO
  __v: number;

  // optimistic
  localStatus?: string;
  clientId?: string;
  deliveryStatus?: string;
};

export type ChatWithMessagesResponse = {
  chat: Chat;
  messages: MessageRes[];
};
export type LocalStatus = "sending" | "sent" | "failed";

export type DeliveryStatus = "sending" | "sent" | "delivered" | "read";

export type LocalMessage = MessageRes & {
  clientId?: string;
  localStatus?: "sending" | "sent" | "failed"; // keep if you want
  deliveryStatus?: DeliveryStatus; // ✅ add this
};
