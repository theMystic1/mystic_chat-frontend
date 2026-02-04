"use client";

import * as React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { CustomBtn } from "../ui/button";
import { FormData, StepKey } from "@/utils/types";
import { STEPS } from "@/utils/constants";
import toast from "react-hot-toast";
import { toApiError } from "@/utils/api-error";
import { updateMe } from "@/lib/api/calls/auth";
import { useRouter } from "next/navigation";
import AppLoader from "@/app/loading";

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

const stepVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    filter: "blur(6px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.32, ease: "easeOut" },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
    filter: "blur(6px)",
    transition: { duration: 0.25, ease: "easeIn" },
  }),
};

const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isValidUsername(v: string) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(v);
}

const ProfileWizard = () => {
  const [data, setData] = React.useState<FormData>({
    userName: "",
    displayName: "",
    avatarUrl: "",
    bio: "",
  });

  // store the actual picked file for upload later
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);

  const [step, setStep] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [touched, setTouched] = React.useState(false);
  const [skipping, setSkipping] = React.useState(false);
  const [anim, setAnim] = React.useState<"idle" | "shake">("idle");
  const router = useRouter();

  const total = STEPS.length;
  const s = STEPS[step];
  const value = data[s.key];

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // keep track of object URLs so we can revoke and avoid memory leaks
  const lastObjectUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (lastObjectUrlRef.current)
        URL.revokeObjectURL(lastObjectUrlRef.current);
    };
  }, []);

  const error = React.useMemo(() => {
    if (!touched) return null;

    if (s.key === "userName") {
      const v = data.userName.trim();
      if (!v) return "This field is required.";
      if (!isValidUsername(v))
        return "Use 3–24 chars: letters, numbers, underscores.";
      return null;
    }

    if (s.key === "displayName") {
      const v = data.displayName.trim();
      if (!v) return "This field is required.";
      return null;
    }

    // avatar + bio are optional here
    return null;
  }, [touched, s.key, data.userName, data.displayName]);

  const progress = Math.round(((step + 1) / total) * 100);

  const go = (next: number) => {
    const clamped = clamp(next, 0, total - 1);
    setDirection(clamped > step ? 1 : -1);
    setStep(clamped);
    setTouched(false);
    setAnim("idle");
  };

  const next = () => {
    setTouched(true);
    if (error) {
      setAnim("shake");
      window.setTimeout(() => setAnim("idle"), 400);
      return;
    }

    if (step < total - 1) go(step + 1);
    else submit();
  };

  const back = () => {
    if (step === 0) return;
    go(step - 1);
  };

  const skip = async () => {
    if (step < total - 1) go(step + 1);
    else submit();
  };

  const skipSetup = async () => {
    // toast.loading("wait while we complete your profile....");
    setSkipping(true);
    try {
      // TODO: call your verify endpoint
      const user = await updateMe({
        isNewUser: false,
      });

      toast.remove();
      toast.success(user?.message || "update successful");

      router.replace("/");
    } catch (error) {
      const err = toApiError(error);
      toast.remove();
      toast.error(err?.message ?? "update failed");
      console.error("ERROR", error);
    } finally {
      setSkipping(false);
    }
  };

  const submit = async () => {
    // minimal final validation
    const u = data.userName.trim();
    const d = data.displayName.trim();
    if (!u || !d || !isValidUsername(u)) {
      setTouched(true);
      setAnim("shake");
      window.setTimeout(() => setAnim("idle"), 400);
      return;
    }

    const payload = {
      ...data,
      userName: u,
      displayName: d,
      //  avatarFile,
      isNewUser: false,
    };

    toast.loading("updating tour settings....");
    try {
      const user = await updateMe(payload);

      toast.remove();
      toast.success(user?.message || "update successful");

      router.replace("/");
    } catch (error) {
      const err = toApiError(error);
      toast.remove();
      toast.error(err?.message ?? "update failed");
      console.error("ERROR", error);
    }
  };

  // Enter to continue (textarea uses Ctrl/Cmd+Enter)
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      // if on image step, don't hijack enter (let buttons handle)
      if (s.type === "image") return;

      if (s.type === "textarea") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          next();
        }
        return;
      }

      e.preventDefault();
      next();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, s.type, error, data]);

  const setField = (k: StepKey, v: string) => {
    setData((prev) => ({ ...prev, [k]: v }));
    if (!touched) setTouched(true);
  };

  const onPickAvatarClick = () => fileInputRef.current?.click();

  const onAvatarSelected = (file: File | null) => {
    if (!file) return;

    // only images
    if (!file.type.startsWith("image/")) return;

    // clean old object URL
    if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);

    const objectUrl = URL.createObjectURL(file);
    lastObjectUrlRef.current = objectUrl;

    setAvatarFile(file);
    setField("avatarUrl", objectUrl); // preview url for UI
  };

  const removeAvatar = () => {
    if (lastObjectUrlRef.current) URL.revokeObjectURL(lastObjectUrlRef.current);
    lastObjectUrlRef.current = null;

    setAvatarFile(null);
    setData((prev) => ({ ...prev, avatarUrl: "" }));
  };

  if (skipping) return <AppLoader />;
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="min-h-[calc(100vh-2rem)] w-full flex items-center justify-center px-4 py-10"
    >
      <div className="relative w-full max-w-2xl">
        <div className="absolute -inset-6 rounded-[28px] nebula-overlay blur-2xl opacity-60 pointer-events-none" />

        <div className="relative card overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-dim uppercase tracking-widest">
              Profile setup
            </div>

            {/* always visible skip */}
            <button
              type="button"
              onClick={skipSetup}
              className="text-xs text-aurora-400 hover:text-gold-400 transition"
            >
              Skip
            </button>
          </div>

          <div className="mt-3 h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gold-gradient transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-8 min-h-80">
            <AnimatePresence
              mode="popLayout"
              initial={false}
              custom={direction}
            >
              <motion.div
                key={s.key}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col gap-3"
              >
                <p className="text-xs text-dim uppercase tracking-widest">
                  Step {step + 1} of {total}
                </p>

                <h1 className="text-2xl sm:text-3xl font-black headline-gradient">
                  {s.title}
                </h1>

                {s.subtitle ? (
                  <p className="text-sm text-dim leading-relaxed">
                    {s.subtitle}
                  </p>
                ) : null}

                {/* Input area */}
                <motion.div
                  className="mt-5"
                  variants={shakeVariants}
                  animate={anim}
                >
                  {s.type === "text" && (
                    <>
                      <div
                        className={`input-wrap ${error ? "input-wrap--error" : ""}`}
                      >
                        <input
                          className="input"
                          placeholder={s.placeholder}
                          value={value}
                          onChange={(e) => setField(s.key, e.target.value)}
                          onBlur={() => setTouched(true)}
                          autoComplete={
                            s.key === "displayName" ? "name" : "off"
                          }
                        />
                      </div>

                      <div className="mt-2 min-h-4.5">
                        {error ? (
                          <p className="text-xs text-red-400">{error}</p>
                        ) : s.helper ? (
                          <p className="text-xs text-muted">{s.helper}</p>
                        ) : (
                          <p className="text-xs text-muted">
                            Press <span className="text-ink-100">Enter</span> to
                            continue.
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {s.type === "textarea" && (
                    <>
                      <div className="input-wrap">
                        <textarea
                          className="input min-h-35 resize-none"
                          placeholder={s.placeholder}
                          value={value}
                          onChange={(e) => setField(s.key, e.target.value)}
                          onBlur={() => setTouched(true)}
                        />
                      </div>

                      <div className="mt-2 min-h-4.5">
                        {s.helper ? (
                          <p className="text-xs text-muted">{s.helper}</p>
                        ) : (
                          <p className="text-xs text-muted">
                            Press{" "}
                            <span className="text-ink-100">
                              Ctrl/Cmd + Enter
                            </span>{" "}
                            to continue.
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* IMAGE PICKER STEP */}
                  {s.type === "image" && (
                    <>
                      {/* hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          onAvatarSelected(e.target.files?.[0] ?? null)
                        }
                      />

                      <div className="surface p-5">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                            {data.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={data.avatarUrl}
                                alt="Avatar preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-muted">
                                No photo
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="text-sm text-ink-100 font-semibold">
                              Profile photo
                            </p>
                            <p className="text-xs text-muted">
                              {avatarFile
                                ? `${avatarFile.name} • ${Math.round(avatarFile.size / 1024)} KB`
                                : s.helper}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onPickAvatarClick}
                          >
                            {data.avatarUrl ? "Change photo" : "Choose photo"}
                          </button>

                          {data.avatarUrl ? (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={removeAvatar}
                            >
                              Remove
                            </button>
                          ) : null}

                          <div className="sm:ml-auto">
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={skip}
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted">
                        Tip: square images look best. You can update this later.
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer controls */}
          <div className="mt-8 flex items-center justify-between gap-3 z-50">
            <button
              type="button"
              onClick={back}
              className={`btn btn-ghost ${step === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
              disabled={step === 0}
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              {/* always visible skip */}
              <button type="button" onClick={skip} className="btn btn-ghost">
                Skip
              </button>

              <motion.div
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 520, damping: 28 }}
              >
                <CustomBtn onClick={next}>
                  {step === total - 1 ? "Finish" : "Continue"}
                </CustomBtn>
              </motion.div>
            </div>
          </div>

          <div className="mt-4 text-xs text-muted">
            You can always edit this later in settings.
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileWizard;
