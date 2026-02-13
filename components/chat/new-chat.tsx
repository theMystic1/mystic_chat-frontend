"use client";

import { apiClient } from "@/lib/api/axios-client";
import Modal from "../ui/modal";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useChats } from "@/hooks/useChats";
import MultiSelectDropdown from "../ui/multi-select";
import toast from "react-hot-toast";
import { UserType } from "@/utils/types";

type NewChatModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (created?: unknown) => void;
  type?: "new" | "add-to-group";
  defaulMembers?: UserType[];
};

const NewChatModal = ({
  open,
  onClose,
  onCreated,
  type = "new",
  defaulMembers = [],
}: NewChatModalProps) => {
  const router = useRouter();
  const [formState, setFormState] = useState({
    value: "",
    pending: false,
    error: null as string | null,
    groupName: "",
    isGroup: false,
    memberIds:
      type === "add-to-group"
        ? defaulMembers.map((m) => m._id as string)
        : ([] as string[]),
    memberNames: defaulMembers.map(
      (m) => m.displayName || m.userName || "New User",
    ) as string[],
  });

  const { chatId } = useParams();
  const { otherUsers } = useChats();

  const isNew = type === "new";

  // console.log(otherUsers);

  const { value, pending, error, isGroup, memberIds, groupName, memberNames } =
    formState;

  const handleChange = (
    field:
      | "value"
      | "pending"
      | "error"
      | "groupName"
      | "isGroup"
      | "memberIds",
    newValue: string | boolean | string[] | null,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  useEffect(() => {
    if (!open) return;
    handleChange("value", "");
    handleChange("error", null);
  }, [open]);

  const submit = async () => {
    const receiver = value.trim();
    if (!isGroup && !receiver) {
      handleChange("error", "Please enter a receiver id / email.");
      return;
    }

    handleChange("pending", true);
    handleChange("error", null);

    try {
      let data = null as any;

      if (type === "add-to-group") {
        const uniqueIds = new Set(memberIds);

        data = await apiClient.patch(`/chat/members/${chatId}`, {
          ...(memberIds.length > 0 && { memberIds: Array.from(uniqueIds) }),
          ...(value && { memberEmail: value }),
        });
      } else if (isGroup) {
        data = await apiClient.post("/chat/group", {
          groupName,
          ...(memberIds.length > 0 && { memberIds }),
          ...(value && { memberEmail: value }),
        });
      } else {
        data = await apiClient.post("/chat", { receiver });
      }

      toast.success(isGroup ? "Group chat created!" : "Chat created!");
      const chat = data?.data?.data?.chat || data?.data?.chat;
      onCreated?.(chat);
      // console.log(chat);
      onClose();
      router.push(`/chat/${chat._id}`);
      router.refresh();
    } catch (e: any) {
      handleChange(
        "error",
        e?.response?.data?.message ??
          e?.message ??
          "Failed to create chat. Try again.",
      );

      toast.error(
        e?.response?.data?.message ??
          e?.message ??
          "Failed to create chat. Try again.",
      );
      console.error("ERROR creating chat", e);
    } finally {
      handleChange("pending", false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void submit();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? "New chat" : "Add to group"}
      description={
        // isNew
        //   ? "Start a conversation by entering a receiver id or email."
        //   : "Add new members to the group by entering"
        //
        type === "add-to-group"
          ? "Add new members to the group"
          : isGroup
            ? "Create a new group chat"
            : "Start a conversation by entering a receiver id or email."
      }
      maxWidthClassName="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            className="btn btn-primary"
            disabled={pending}
          >
            {pending ? "Creating..." : "Create chat"}
          </button>
        </div>
      }
    >
      {isNew && (
        <div className="mb-5">
          <h1 className="font-bold bg-linear-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text text-2xl">
            Toggle chat type
          </h1>
          <div className="flex items-center gap-2">
            <p>Single chat</p>
            <button
              className="h-4 w-8 rounded-full bg-aurora-400/20 cursor-pointer"
              onClick={() => handleChange("isGroup", !formState.isGroup)}
            >
              <div
                className={`h-4 w-4 rounded-full bg-linear-to-r from-purple-500 to-pink-500 animate-pulse ${formState.isGroup ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
            <p>Group chat</p>
          </div>
        </div>
      )}

      {isGroup || !isNew ? (
        <>
          {isNew && (
            <>
              <label className="text-sm text-dim">Group name</label>
              <div className="mt-2 input-wrap mb-5">
                <input
                  className="input"
                  placeholder="e.g. power rangers"
                  value={groupName}
                  onChange={(e) => handleChange("groupName", e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={pending}
                  autoFocus
                />
              </div>
            </>
          )}

          {/* <label className="text-sm text-dim">Add members</label> */}
          {/* <div className="mt-2 input-wrap mb-5"> */}
          <MultiSelectDropdown
            label="Select members"
            placeholder="Select members"
            options={otherUsers.map((u: any) => ({
              value: u._id,
              label: u.displayName || u.userName || "New User",
            }))}
            value={memberIds}
            onChange={(ids) => handleChange("memberIds", ids)}
          />
          {/* <select
              // multiple
              value={memberIds}
              onChange={(e) => {
                const options = Array.from(e.currentTarget.options);
                const selectedIds = options
                  .filter((o) => o.selected)
                  .map((o) => o.value);
                handleChange("memberIds", selectedIds);
              }}
              className="input"
            >
              {otherUsers.map((u: any) => (
                <option key={u._id} value={u._id}>
                  {u.displayName || u.userName || "New User"}
                </option>
              ))}
            </select> */}
          {/* </div> */}
        </>
      ) : null}
      <label className="text-sm text-dim">Receiver</label>

      <div className="mt-2 input-wrap">
        <input
          className="input"
          placeholder="e.g. user_123 or name@email.com"
          value={value}
          onChange={(e) => handleChange("value", e.target.value)}
          onKeyDown={onKeyDown}
          disabled={pending}
          autoFocus={!isGroup}
        />
      </div>

      {error ? (
        <p className="mt-2 text-sm text-danger-500">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-muted">
          Tip: use the email or userName.
        </p>
      )}
    </Modal>
  );
};

export default NewChatModal;
