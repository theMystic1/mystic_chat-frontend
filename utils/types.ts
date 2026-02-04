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
