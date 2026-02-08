"use client";

import * as React from "react";
import { apiClient } from "@/lib/api/axios-client";
import Modal from "../ui/modal";
import { useRouter } from "next/navigation";

type NewChatModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (created?: unknown) => void;
};

const NewChatModal = ({ open, onClose, onCreated }: NewChatModalProps) => {
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (!open) return;
    setValue("");
    setError(null);
  }, [open]);

  const submit = async () => {
    const receiver = value.trim();
    if (!receiver) {
      setError("Please enter a receiver id / email.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const { data } = await apiClient.post("/chat", { receiver });

      const chat = data?.data?.chat;
      onCreated?.(chat);
      // console.log(data?.data?.chat);
      onClose();
      router.push(`/chat/${chat._id}`);
      router.refresh();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "Failed to create chat. Try again.",
      );
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void submit();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New chat"
      description="Start a conversation by entering a receiver id or email."
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
      <label className="text-sm text-dim">Receiver</label>

      <div className="mt-2 input-wrap">
        <input
          className="input"
          placeholder="e.g. user_123 or name@email.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={pending}
          autoFocus
        />
      </div>

      {error ? (
        <p className="mt-2 text-sm text-danger-500">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-muted">
          Tip: use the same identifier your backend expects.
        </p>
      )}
    </Modal>
  );
};

export default NewChatModal;
