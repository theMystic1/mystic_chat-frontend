"use client";

import * as React from "react";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { setThemeCookie, ThemeValue } from "@/utils/action";
import { useRouter } from "next/navigation";
import { UserType } from "@/utils/types";
import { getInitials } from "@/utils/helpers";

type UserLike = {
  _id?: string;
  displayName?: string;
  userName?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  phone?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  user: UserLike | null;
  /** call your API here; must NOT allow email changes */
  onSave: (payload: {
    displayName?: string;
    userName?: string;
    bio?: string;
    phone?: string;
    avatarFile?: File | null;
  }) => Promise<void>;
};

const clamp = (v: string, n: number) => v.slice(0, n);

const WhatsAppSettingsModal = ({ open, onClose, user, onSave }: Props) => {
  const [saving, setSaving] = React.useState(false);

  // edit mode per field (WhatsApp style)
  const [edit, setEdit] = React.useState({
    name: false,
    username: false,
    bio: false,
    phone: false,
  });

  const [form, setForm] = React.useState({
    displayName: "",
    userName: "",
    bio: "",
    phone: "",
  });

  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  // hydrate whenever modal opens/user changes
  React.useEffect(() => {
    if (!open) return;

    setEdit({ name: false, username: false, bio: false, phone: false });
    setForm({
      displayName: user?.displayName ?? "",
      userName: user?.userName ?? "",
      bio: user?.bio ?? "",
      phone: user?.phone ?? "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
  }, [open, user?._id]);

  React.useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const currentAvatarSrc = avatarPreview || user?.avatarUrl || undefined;

  const closeIfBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggle = (key: keyof typeof edit) =>
    setEdit((p) => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await onSave({
        displayName: form.displayName.trim(),
        userName: form.userName.trim(),
        bio: clamp(form.bio, 139).trim(),
        phone: form.phone.trim(),
        avatarFile,
      });

      setEdit({ name: false, username: false, bio: false, phone: false });
      setAvatarFile(null);
      setAvatarPreview(null);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = React.useMemo(() => {
    if (!user) return false;
    const changed =
      (form.displayName ?? "") !== (user.displayName ?? "") ||
      (form.userName ?? "") !== (user.userName ?? "") ||
      (form.bio ?? "") !== (user.bio ?? "") ||
      (form.phone ?? "") !== (user.phone ?? "") ||
      !!avatarFile;

    return changed;
  }, [user, form, avatarFile]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3"
      onMouseDown={closeIfBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl">
        {/* WhatsApp-ish top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-elevated px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost px-2 py-2"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </button>
            <p className="text-sm font-semibold">Profile</p>
          </div>

          <div>
            <button
              className="btn btn-primary px-3 py-2 text-xs"
              onClick={save}
              disabled={!hasChanges || saving}
              title={!hasChanges ? "No changes" : "Save"}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto no-scrollbar">
          {/* Header block (avatar + name like WhatsApp) */}
          <div className="px-5 py-5">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <AvatarImg currentAvatarSrc={currentAvatarSrc} user={user!} />

                <label className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-brand-gradient text-black shadow-lg">
                  <PhotoCameraIcon fontSize="small" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setAvatarFile(f);
                    }}
                  />
                </label>
              </div>

              <p className="text-sm font-semibold">
                {user?.displayName || user?.userName || "New User"}
              </p>
              <p className="text-xs text-muted">{user?.email}</p>

              <div className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-start gap-2">
                  <InfoOutlinedIcon fontSize="small" />
                  <p className="text-xs text-muted">
                    Email can’t be changed. You can update your name, username,
                    bio, phone, and photo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fields list (WhatsApp style cards) */}
          <div className="px-5 pb-6">
            <SectionTitle title="Your info" />
            <FieldCard
              label="Name"
              helper="This is not your username."
              value={form.displayName}
              viewValue={user?.displayName ?? ""}
              editing={edit.name}
              disabled={saving}
              onToggle={() => toggle("name")}
              onChange={(v) =>
                setForm((p) => ({ ...p, displayName: clamp(v, 60) }))
              }
            />
            <FieldCard
              label="Username"
              helper="People can find you by this."
              value={form.userName}
              viewValue={user?.userName ?? ""}
              editing={edit.username}
              disabled={saving}
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
              viewValue={user?.bio ?? ""}
              editing={edit.bio}
              disabled={saving}
              multiline
              maxLen={139}
              onToggle={() => toggle("bio")}
              onChange={(v) => setForm((p) => ({ ...p, bio: clamp(v, 139) }))}
            />
            <ThemePickerRow />
            <SectionTitle title="Account" />
            <ReadOnlyRow label="Email" value={user?.email ?? ""} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SectionTitle = ({ title }: { title: string }) => {
  return <p className="mb-2 text-xs font-semibold text-muted">{title}</p>;
};

export const ReadOnlyRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className="mb-3 rounded-2xl border border-white/10 bg-elevated px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="">
          <p className="text-[11px] text-muted">{label}</p>
          <p className="truncate text-sm text-ink-100">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
};

const FieldCard = (props: {
  label: string;
  helper?: string;
  value: string;
  viewValue: string;
  editing: boolean;
  disabled?: boolean;
  multiline?: boolean;
  maxLen?: number;
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
    onToggle,
    onChange,
  } = props;

  return (
    <div className="mb-3 rounded-2xl border border-white/10 bg-elevated px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-[80%] flex-1">
          <p className="text-[11px] text-muted">{label}</p>

          {!editing ? (
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
      </div>
    </div>
  );
};
export default WhatsAppSettingsModal;

type ThemeMode = "light" | "dark" | "system";

const ThemePickerRow = ({
  value,
  onChange,
}: {
  value?: ThemeMode;
  onChange?: (mode: ThemeMode) => void;
}) => {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();
  // const [theme, setTheme] = React.useState(Cookies.get("theme"));

  function onSelect(theme: ThemeValue) {
    startTransition(async () => {
      await setThemeCookie(theme);
      router.refresh(); // re-renders layout with updated cookie -> updates data-theme
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-elevated p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Theme</p>
          <p className="mt-0.5 text-xs text-muted">
            Choose how MystChat looks on this device.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect("light")}
            className={[
              "btn px-3 py-2 text-xs",
              value === "light" ? "btn-primary" : "btn-ghost",
            ].join(" ")}
            aria-pressed={value === "light"}
            disabled={pending}
          >
            Light
          </button>

          <button
            type="button"
            onClick={() => onSelect("dark")}
            className={[
              "btn px-3 py-2 text-xs",
              value === "dark" ? "btn-primary" : "btn-ghost",
            ].join(" ")}
            aria-pressed={value === "dark"}
            disabled={pending}
          >
            Dark
          </button>

          <button
            type="button"
            onClick={() => onSelect("system")}
            className={[
              "btn px-3 py-2 text-xs",
              value === "system" ? "btn-primary" : "btn-ghost",
            ].join(" ")}
            aria-pressed={value === "system"}
            disabled={pending}
          >
            System
          </button>
        </div>
      </div>
    </div>
  );
};

export const AvatarImg = ({
  currentAvatarSrc,
  user,
}: {
  currentAvatarSrc: any;
  user: UserLike;
}) => {
  return (
    <div className="h-24 w-24 overflow-hidden rounded-full border border-white/10 bg-elevated">
      {currentAvatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentAvatarSrc}
          alt="Avatar"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-lg font-semibold text-ink-100">
          {getInitials(user?.displayName || user?.userName || "New User")}
        </div>
      )}
    </div>
  );
};
