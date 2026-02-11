"use client";

import { useState } from "react";
import { ProfileModalShell } from "./profile-shell";
import { AvatarImg, ReadOnlyRow, SectionTitle } from "./settings-modal";

export const OtherUserModal = ({
  open,
  onClose,
  title,
  rightAction,
  children,
  widthClass,
  otherUser,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  rightAction?: React.ReactNode;
  children?: React.ReactNode;
  widthClass?: string;
  otherUser?: any;
}) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const currentAvatarSrc = avatarPreview || otherUser?.avatarUrl || undefined;

  // console.log(otherUser);

  return (
    <ProfileModalShell
      open={open}
      onClose={onClose}
      title={title}
      rightAction={rightAction}
      widthClass={widthClass}
    >
      <div className="flex flex-col gap-3">
        <SectionTitle title="Info" />

        <div className="flex items-center justify-center">
          <AvatarImg currentAvatarSrc={currentAvatarSrc} user={otherUser!} />
        </div>
        <ReadOnlyRow
          label="Display Name"
          value={otherUser?.displayName ?? "New User"}
        />
        <ReadOnlyRow
          label="User Name"
          value={otherUser?.userName ?? "New User"}
        />
        <ReadOnlyRow label="Bio" value={otherUser?.bio ?? "No bio available"} />
      </div>
    </ProfileModalShell>
  );
};
