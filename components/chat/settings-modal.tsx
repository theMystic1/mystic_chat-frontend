"use client";

import * as React from "react";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Logout } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { setThemeCookie, ThemeValue } from "@/utils/action";
import { getInitials } from "@/utils/helpers";
import { apiClient } from "@/lib/api/axios-client";
import { useUser } from "@/contexts/user-cintext";
import type { Chat, UserType } from "@/utils/types";

type UserLike = {
  _id?: string;
  displayName?: string;
  userName?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
  lastSeenAt?: string;
};

type Mode = "me" | "user_view" | "group_view";
type ThemeMode = "light" | "dark" | "system";

type Props = {
  open: boolean;
  onClose: () => void;

  mode?: Mode;

  targetUser?: UserType | null;

  curChat?: Chat | null;
  otherUsers?: UserType[];
  onLogout?: () => void;

  themeValue?: ThemeMode;
};

const clamp = (v: string, n: number) =>
  typeof v === "string" ? v.slice(0, n) : "";

const WhatsAppSettingsModal = ({
  open,
  onClose,
  mode = "me",
  targetUser = null,
  curChat = null,
  otherUsers = [],
  onLogout,
  themeValue = "system",
}: Props) => {
  const router = useRouter();
  const { user: me, setUser } = useUser();

  const isMe = mode === "me";
  const isGroup = mode === "group_view";

  const viewingUser: UserLike | null = isMe ? (me as any) : targetUser;

  // --- edit mode per field (WhatsApp style) ---
  const [edit, setEdit] = React.useState({
    name: false,
    username: false,
    bio: false,
    phone: false,
  });

  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    displayName: "",
    userName: "",
    bio: "",
    phone: "",
  });

  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  // hydrate whenever modal opens / target changes
  React.useEffect(() => {
    if (!open) return;

    setSaving(false);
    setEdit({ name: false, username: false, bio: false, phone: false });

    if (isGroup) {
      setForm((p) => ({
        ...p,
        displayName: curChat?.groupName ?? "",
        userName: "",
        bio: "",
        phone: "",
      }));
    } else {
      setForm({
        displayName: viewingUser?.displayName ?? "",
        userName: viewingUser?.userName ?? "",
        bio: viewingUser?.bio ?? "",
        phone: viewingUser?.phone ?? "",
      });
    }

    setAvatarFile(null);
    setAvatarPreview(null);
  }, [open, isGroup, curChat?.groupName, viewingUser?._id]);

  React.useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const closeIfBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggle = (key: keyof typeof edit) => {
    if (!isMe) return; // read-only
    setEdit((p) => ({ ...p, [key]: !p[key] }));
  };

  const currentAvatarSrc =
    avatarPreview ||
    (isGroup ? undefined : viewingUser?.avatarUrl) ||
    undefined;

  const titleText =
    mode === "group_view"
      ? "Group info"
      : mode === "user_view"
        ? "Contact info"
        : "Profile";

  // detect changes (only used in me mode)
  const hasChanges = React.useMemo(() => {
    if (!isMe || !me) return false;

    const changed =
      (form.displayName ?? "") !== (me.displayName ?? "") ||
      (form.userName ?? "") !== (me.userName ?? "") ||
      (form.bio ?? "") !== (me.bio ?? "") ||
      (form.phone ?? "") !== ((me as any).phone ?? "") ||
      !!avatarFile;

    return changed;
  }, [isMe, me, form, avatarFile]);

  const saveMyProfile = async () => {
    if (!isMe || !me) return;

    const noChanges =
      form.displayName.trim() === (me.displayName ?? "").trim() &&
      form.userName.trim() === (me.userName ?? "").trim() &&
      form.bio.trim() === (me.bio ?? "").trim() &&
      form.phone.trim() === (((me as any).phone ?? "") as string).trim() &&
      !avatarFile;

    if (noChanges) {
      setEdit({ name: false, username: false, bio: false, phone: false });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        displayName: clamp(form.displayName.trim(), 60),
        userName: clamp(form.userName.trim().replace(/\s+/g, ""), 30),
        bio: clamp(form.bio, 139).trim(),
        phone: clamp(form.phone.trim(), 30),
      };

      const { data } = await apiClient.patch("/users/me", payload);

      const updatedUser =
        data?.data?.user || data?.data?.data || data?.user || data;

      setUser(updatedUser);
      setEdit({ name: false, username: false, bio: false, phone: false });
      setAvatarFile(null);
      setAvatarPreview(null);

      toast.success("Profile updated");
      router.refresh();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3"
      onMouseDown={closeIfBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl">
        {/* top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-elevated px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost px-2 py-2"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </button>
            <p className="text-sm font-semibold">{titleText}</p>
          </div>

          {isMe ? (
            <div>
              <button
                className="btn btn-primary px-3 py-2 text-xs"
                onClick={saveMyProfile}
                disabled={!hasChanges || saving}
                title={!hasChanges ? "No changes" : "Save"}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="max-h-[78vh] overflow-y-auto no-scrollbar">
          {/* header block */}
          <div className="px-5 py-5">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <AvatarImg
                  currentAvatarSrc={currentAvatarSrc}
                  user={viewingUser ?? undefined}
                  isGroup={isGroup}
                  groupChatName={curChat?.groupName ?? ""}
                />

                {/* Only allow changing avatar for "me" */}
                {isMe ? (
                  <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-brand-gradient text-black shadow-lg">
                    <PhotoCameraIcon fontSize="small" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                ) : null}
              </div>

              <p className="text-sm font-semibold">
                {isGroup
                  ? (curChat?.groupName ?? "New Group")
                  : viewingUser?.displayName ||
                    viewingUser?.userName ||
                    "New User"}
              </p>

              {!isGroup ? (
                <p className="text-xs text-muted">{viewingUser?.email ?? ""}</p>
              ) : null}

              {isMe ? (
                <div className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <InfoOutlinedIcon fontSize="small" />
                    <p className="text-xs text-muted">
                      Email can’t be changed. You can update your name,
                      username, bio, phone, and photo.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* content */}
          <div className="px-5 pb-6">
            {isGroup ? (
              <>
                <SectionTitle title="Group info" />

                {/* Group name (read-only for now; you can wire edit later) */}
                <ReadOnlyRow label="Name" value={curChat?.groupName ?? ""} />

                <SectionTitle title="Members" />
                <div className="mb-3 rounded-2xl border border-white/10 bg-elevated px-4 py-3">
                  {otherUsers?.map((usr) => {
                    const isYou = String(usr?._id) === String(me?._id);
                    const label = isYou
                      ? "You"
                      : usr?.displayName || usr?.userName || "New User";

                    return (
                      <div
                        key={usr?._id}
                        className="flex items-center gap-4 py-2"
                      >
                        {usr?.avatarUrl ? (
                          <AvatarImg
                            currentAvatarSrc={usr.avatarUrl}
                            user={usr as any}
                            isGroup={false}
                            groupChatName=""
                            size="md"
                          />
                        ) : (
                          <AvatarFallback userName={label} size="md" />
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm text-ink-100">
                            {label}
                          </p>
                          {usr?.email ? (
                            <p className="truncate text-[11px] text-muted">
                              {usr.email}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : mode === "user_view" ? (
              <>
                <SectionTitle title="Contact info" />
                <ReadOnlyRow
                  label="Name"
                  value={viewingUser?.displayName ?? "—"}
                />
                <ReadOnlyRow
                  label="Username"
                  value={viewingUser?.userName ?? "—"}
                />
                <ReadOnlyRow label="Bio" value={viewingUser?.bio ?? "—"} />
                <ReadOnlyRow label="Email" value={viewingUser?.email ?? "—"} />
                {viewingUser?.phone ? (
                  <ReadOnlyRow label="Phone" value={viewingUser.phone} />
                ) : null}
              </>
            ) : (
              <>
                <SectionTitle title="Your info" />

                <FieldCard
                  label="Name"
                  helper="This is not your username."
                  value={form.displayName}
                  viewValue={me?.displayName ?? ""}
                  editing={edit.name}
                  disabled={saving}
                  readOnly={!isMe}
                  onToggle={() => toggle("name")}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, displayName: clamp(v, 60) }))
                  }
                />

                <FieldCard
                  label="Username"
                  helper="People can find you by this."
                  value={form.userName}
                  viewValue={me?.userName ?? ""}
                  editing={edit.username}
                  disabled={saving}
                  readOnly={!isMe}
                  onToggle={() => toggle("username")}
                  onChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      userName: clamp(v.replace(/\s+/g, ""), 30),
                    }))
                  }
                />

                <FieldCard
                  label="Bio"
                  helper="Up to 139 characters."
                  value={form.bio}
                  viewValue={me?.bio ?? ""}
                  editing={edit.bio}
                  disabled={saving}
                  readOnly={!isMe}
                  multiline
                  maxLen={139}
                  onToggle={() => toggle("bio")}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, bio: clamp(v, 139) }))
                  }
                />

                <FieldCard
                  label="Phone"
                  helper="Optional."
                  value={form.phone}
                  viewValue={(me as any)?.phone ?? ""}
                  editing={edit.phone}
                  disabled={saving}
                  readOnly={!isMe}
                  onToggle={() => toggle("phone")}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, phone: clamp(v, 30) }))
                  }
                />

                {/* Theme block (pluckable) */}
                <div className="mb-3">
                  <ThemePickerRow value={themeValue} />
                </div>

                <SectionTitle title="Account" />
                <ReadOnlyRow label="Email" value={me?.email ?? ""} />

                <ReadOnlyRow
                  label="Logout"
                  value="Sign out of MystChats"
                  logout={onLogout}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettingsModal;

/* --------------------------- small UI pieces --------------------------- */

export const SectionTitle = ({ title }: { title: string }) => {
  return <p className="mb-2 text-xs font-semibold text-muted">{title}</p>;
};

export const ReadOnlyRow = ({
  label,
  value,
  logout,
}: {
  label: string;
  value: string;
  logout?: () => void;
}) => {
  return (
    <div className="mb-3 rounded-2xl border border-white/10 bg-elevated px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-muted">{label}</p>
          <p className="truncate text-sm text-ink-100">{value || "—"}</p>
        </div>

        {logout ? (
          <button
            className="btn btn-ghost px-2 py-2 flex items-center gap-2"
            onClick={logout}
            aria-label="Logout"
          >
            <Logout fontSize="small" /> <span>Logout</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export const FieldCard = (props: {
  label: string;
  helper?: string;
  value: string;
  viewValue: string;
  editing: boolean;
  disabled?: boolean;
  multiline?: boolean;
  maxLen?: number;
  readOnly?: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
}) => {
  const {
    label,
    helper,
    value,
    viewValue,
    editing,
    disabled,
    multiline,
    maxLen,
    readOnly,
    onToggle,
    onChange,
  } = props;

  return (
    <div className="mb-3 rounded-2xl border border-white/10 bg-elevated px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-[80%] flex-1">
          <p className="text-[11px] text-muted">{label}</p>

          {!editing || readOnly ? (
            <p className="mt-0.5 wrap-break-word text-sm text-ink-100">
              {viewValue || "—"}
            </p>
          ) : multiline ? (
            <div className="mt-2">
              <textarea
                className="w-full rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                rows={3}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
              />
              {typeof maxLen === "number" ? (
                <p className="mt-1 text-[11px] text-muted">
                  {value.length}/{maxLen}
                </p>
              ) : null}
            </div>
          ) : (
            <input
              className="mt-2 w-full rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            />
          )}

          {helper ? (
            <p className="mt-1 text-[11px] text-muted">{helper}</p>
          ) : null}
        </div>

        {!readOnly ? (
          <button
            className="btn btn-ghost px-2 py-2"
            onClick={onToggle}
            disabled={disabled}
            aria-label={editing ? "Close edit" : "Edit"}
          >
            {editing ? (
              <CheckIcon fontSize="small" />
            ) : (
              <EditIcon fontSize="small" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export const ThemePickerRow = ({ value = "system" }: { value?: ThemeMode }) => {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function onSelect(theme: ThemeValue) {
    startTransition(async () => {
      await setThemeCookie(theme);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-elevated px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Theme</p>
          <p className="mt-0.5 text-xs text-muted">
            Choose how MystChat looks on this device.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSelect(t)}
              className={[
                "btn px-3 py-2 text-xs",
                value === t ? "btn-primary" : "btn-ghost",
              ].join(" ")}
              aria-pressed={value === t}
              disabled={pending}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AvatarImg = ({
  currentAvatarSrc,
  user,
  isGroup,
  groupChatName,
  size = "xl",
}: {
  currentAvatarSrc?: string;
  user?: UserLike;
  isGroup?: boolean;
  groupChatName?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) => {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8"
      : size === "md"
        ? "h-12 w-12"
        : size === "lg"
          ? "h-16 w-16"
          : "h-24 w-24";

  const textSize =
    size === "sm"
      ? "text-xs"
      : size === "md"
        ? "text-sm"
        : size === "lg"
          ? "text-base"
          : "text-lg";

  return (
    <div
      className={`${sizeClass} overflow-hidden rounded-full border border-white/10 bg-elevated`}
    >
      {currentAvatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentAvatarSrc}
          alt="Avatar"
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`grid h-full w-full place-items-center ${textSize} font-semibold text-ink-100`}
        >
          {getInitials(
            isGroup
              ? groupChatName || "New Group"
              : user?.displayName || user?.userName || "New User",
          )}
        </div>
      )}
    </div>
  );
};

export const AvatarFallback = ({
  userName,
  size = "xl",
}: {
  userName: string;
  size?: "sm" | "md" | "lg" | "xl";
}) => {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8"
      : size === "md"
        ? "h-12 w-12"
        : size === "lg"
          ? "h-16 w-16"
          : "h-24 w-24";

  const textSize =
    size === "sm"
      ? "text-xs"
      : size === "md"
        ? "text-sm"
        : size === "lg"
          ? "text-base"
          : "text-lg";

  return (
    <div
      className={`${sizeClass} rounded-full bg-elevated border border-white/10 grid place-items-center font-semibold text-ink-100 ${textSize}`}
    >
      {getInitials(userName)}
    </div>
  );
};
