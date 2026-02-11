"use client";

import * as React from "react";
import { CustomBtn } from "../ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { resendToken, verifyEmail } from "@/lib/api/calls/auth";
import toast from "react-hot-toast";
import { toApiError } from "@/utils/api-error";
import { useUser } from "@/contexts/user-cintext";

const OTP_LEN = 6;

const Otp = () => {
  const [otp, setOtp] = React.useState<string[]>(Array(OTP_LEN).fill(""));
  const [submitting, setSubmitting] = React.useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email");
  const { setUser } = useUser();
  // simple resend timer (optional)
  const [seconds, setSeconds] = React.useState(45);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const code = otp.join("");
  const isComplete = code.length === OTP_LEN && otp.every((d) => d !== "");

  const focusIndex = (i: number) => inputsRef.current[i]?.focus();

  const setAt = (index: number, value: string) => {
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index: number, raw: string) => {
    // keep digits only
    const digits = raw.replace(/\D/g, "");

    // If user typed a single digit
    if (digits.length <= 1) {
      setAt(index, digits);
      if (digits && index < OTP_LEN - 1) focusIndex(index + 1);
      return;
    }

    // If user pasted multiple digits into a single input (common on mobile)
    const chunk = digits.slice(0, OTP_LEN - index).split("");
    setOtp((prev) => {
      const next = [...prev];
      for (let i = 0; i < chunk.length; i++) {
        next[index + i] = chunk[i];
      }
      return next;
    });

    const nextFocus = Math.min(index + chunk.length, OTP_LEN - 1);
    focusIndex(nextFocus);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      // if current has value, clear it
      if (otp[index]) {
        setAt(index, "");
        return;
      }
      // else move back
      if (index > 0) {
        focusIndex(index - 1);
        setAt(index - 1, "");
      }
    }

    if (e.key === "ArrowLeft" && index > 0) focusIndex(index - 1);
    if (e.key === "ArrowRight" && index < OTP_LEN - 1) focusIndex(index + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LEN);
    if (!text) return;

    e.preventDefault();
    const arr = text.split("");
    setOtp((prev) => prev.map((_, i) => arr[i] ?? ""));
    focusIndex(Math.min(text.length, OTP_LEN) - 1);
  };

  const onSubmit = async () => {
    if (!isComplete || submitting) return;
    setSubmitting(true);
    toast.loading("verifying email....");
    try {
      // TODO: call your verify endpoint
      const user = await verifyEmail(email!, code);

      console.log(user?.user);

      const mainUser = user?.user?.data?.user || user?.data;

      console.log(mainUser);
      toast.remove();
      toast.success(user?.message || "Signin successful");

      setUser(mainUser);
      mainUser.isNewUser
        ? router.replace("/complete-profile")
        : router.replace("/");

      router.refresh();
    } catch (error) {
      const err = toApiError(error);
      toast.remove();
      toast.error(err?.message ?? "Sign in failed");
      console.error("ERROR", error);
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    if (seconds > 0) return;
    // TODO: call resend endpoint
    setSeconds(45);

    toast.loading("resending token....");
    try {
      const user = await resendToken(email!);

      toast.remove();
      toast.success(user?.message || "token resend successful");
    } catch (error) {
      const err = toApiError(error);
      toast.remove();
      toast.error(err?.message ?? "Token resend failed");
      console.error("ERROR", error);
    } finally {
    }
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] w-full flex items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-lg">
        {/* Soft nebula background */}
        <div className="absolute -inset-6 rounded-[28px] nebula-overlay blur-2xl opacity-60 pointer-events-none" />
        <div className="relative card">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-dim uppercase tracking-widest">
              Security check
            </p>
            <h1 className="text-2xl font-black headline-gradient">
              Enter verification code
            </h1>
            <p className="text-sm text-dim">
              We sent a 6-digit code to{" "}
              <span className="text-ink-100 font-semibold">{email}</span>. Enter
              it below to continue.
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="mt-8">
            <div
              className="flex items-center justify-center gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {otp.map((val, i) => (
                <div
                  key={i}
                  className="input-wrap w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center"
                >
                  <input
                    ref={(el) => {
                      inputsRef.current[i] = el;
                    }}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    pattern="\d*"
                    maxLength={OTP_LEN} // allows iOS paste behavior
                    value={val}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.currentTarget.select()}
                    className="input text-center text-lg sm:text-xl font-bold tracking-wider"
                    aria-label={`OTP digit ${i + 1}`}
                  />
                </div>
              ))}
            </div>
            {!email && (
              <p className="text-red-600 mt-4 text-center">
                No email found, kindly verify yor email on the signin page to
                proceed
              </p>
            )}

            {/* Helper row */}
            <div className="mt-5 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setOtp(Array(OTP_LEN).fill(""));
                  focusIndex(0);
                }}
                className="text-aurora-400 hover:text-gold-400 transition"
              >
                Clear code
              </button>

              <div className="text-dim">
                Didn’t get it?{" "}
                <button
                  type="button"
                  onClick={onResend}
                  disabled={seconds > 0}
                  className={`transition ${
                    seconds > 0
                      ? "text-muted cursor-not-allowed"
                      : "text-aurora-400 hover:text-gold-400"
                  }`}
                >
                  Resend {seconds > 0 ? `(${seconds}s)` : ""}
                </button>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col gap-3">
            <CustomBtn
              variant="primary"
              disabled={!isComplete || submitting}
              onClick={onSubmit}
              className="w-full"
            >
              {submitting ? "Verifying..." : "Verify code"}
            </CustomBtn>

            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => router.replace("/signin")}
            >
              Back to sign in
            </button>
          </div>

          {/* Footer microcopy */}
          <p className="mt-6 text-xs text-muted leading-relaxed">
            Tip: You can paste the full 6-digit code. If you’re having issues,
            check your spam folder or request a new code.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Otp;
