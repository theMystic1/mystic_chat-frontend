"use client";

import * as React from "react";
import { Close, Image as ImageIcon, Mic, Stop } from "@mui/icons-material";

type VoiceDraft = {
  blob: Blob;
  meta: { durationMs: number; mimeType: string };
};

type Props = {
  disabled?: boolean;

  imgFile: File | null;
  setImgFile: (f: File | null) => void;

  voiceDraft: VoiceDraft | null;
  setVoiceDraft: (v: VoiceDraft | null) => void;
};

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function ComposerMediaActions({
  disabled,
  imgFile,
  setImgFile,
  voiceDraft,
  setVoiceDraft,
}: Props) {
  // -------------------
  // Image picker
  // -------------------
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [imgPreview, setImgPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!imgFile) {
      setImgPreview(null);
      return;
    }
    const url = URL.createObjectURL(imgFile);
    setImgPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imgFile]);

  const pickImage = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // -------------------
  // Voice recorder
  // -------------------
  const [recState, setRecState] = React.useState<"idle" | "recording">("idle");
  const [recErr, setRecErr] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const startAtRef = React.useRef<number>(0);

  const startRecording = async () => {
    if (disabled) return;
    setRecErr(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ];

      const mimeType =
        preferredTypes.find((t) =>
          (window as any).MediaRecorder?.isTypeSupported?.(t),
        ) || "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      startAtRef.current = Date.now();

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());

        const durationMs = Math.max(0, Date.now() - startAtRef.current);

        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });

        setVoiceDraft({
          blob,
          meta: { durationMs, mimeType: blob.type || "audio/webm" },
        });

        setRecState("idle");
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setRecState("recording");
    } catch (e: any) {
      setRecErr(e?.message || "Microphone permission denied.");
      setRecState("idle");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (mr.state === "recording") mr.stop();
  };

  return (
    <div className="flex items-center gap-1">
      {/* hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setImgFile(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        className="btn btn-ghost p-1.5 text-xs"
        onClick={pickImage}
        disabled={disabled}
        title="Attach image"
      >
        <ImageIcon fontSize="small" />
      </button>

      {recState !== "recording" ? (
        <button
          type="button"
          className="btn btn-ghost p-1.5 text-xs"
          onClick={startRecording}
          disabled={disabled}
          title="Record voice note"
        >
          <Mic fontSize="small" />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-ghost p-1.5 text-xs text-red-500"
          onClick={stopRecording}
          disabled={disabled}
          title="Stop recording"
        >
          <Stop fontSize="small" />
        </button>
      )}

      {/* lightweight previews + cancel */}
      {imgFile && (
        <div className="ml-2 flex items-center gap-2">
          {imgPreview ? (
            <img
              src={imgPreview}
              className="h-8 w-8 rounded-md object-cover"
              alt="img-preview"
            />
          ) : null}
          <button
            type="button"
            className="btn btn-ghost p-1"
            onClick={() => setImgFile(null)}
            title="Remove image"
          >
            <Close fontSize="small" />
          </button>
        </div>
      )}

      {voiceDraft && (
        <div className="ml-2 flex items-center gap-2">
          <span className="text-[11px] text-muted">
            Voice • {formatMs(voiceDraft.meta.durationMs)}
          </span>
          <button
            type="button"
            className="btn btn-ghost p-1"
            onClick={() => setVoiceDraft(null)}
            title="Remove voice note"
          >
            <Close fontSize="small" />
          </button>
        </div>
      )}

      {recErr ? (
        <p className="text-[11px] text-red-400 ml-2">{recErr}</p>
      ) : null}
    </div>
  );
}
