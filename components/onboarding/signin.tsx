"use client";

import * as React from "react";
import Image from "next/image";
import toast from "react-hot-toast";

import { IMAGES } from "@/utils/constants";
import { CustomBtn } from "../ui/button";
import { motion, Variants } from "framer-motion";
import { toApiError } from "@/utils/api-error";
import { signin } from "@/lib/api/calls/auth";
import { useRouter } from "next/navigation";

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

const gridVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.12 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const formVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

// Subtle shake for invalid submit
const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

function isValidEmail(email: string) {
  const v = email.trim();
  // Practical, safe regex for UI validation (not RFC-perfect but industry standard)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

const Signin = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="min-h-[calc(100vh-2rem)] w-full flex items-center justify-center px-4 py-10"
    >
      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-5xl grid grid-cols-1 xl:grid-cols-2 gap-6"
      >
        <motion.div variants={cardVariants} className="w-full">
          <Card />
        </motion.div>

        <motion.div variants={cardVariants} className="w-full">
          <SideCard />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const Card = () => {
  const [email, setEmail] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [anim, setAnim] = React.useState<"idle" | "shake">("idle");
  const [loading, setLoading] = React.useState(false);

  const router = useRouter();

  const emailOk = isValidEmail(email);
  const showError = touched && !!error;

  const validate = React.useCallback((value: string) => {
    const v = value.trim();
    if (!v) return "Email is required.";
    if (!isValidEmail(v)) return "Please enter a valid email address.";
    return null;
  }, []);

  React.useEffect(() => {
    if (!touched) return;
    setError(validate(email));
  }, [email, touched, validate]);

  const onSubmit = async () => {
    setTouched(true);

    const nextError = validate(email);
    setError(nextError);

    if (nextError) {
      setAnim("shake");
      window.setTimeout(() => setAnim("idle"), 400);
      return;
    }

    setLoading(true);
    toast.loading("signin in....");
    try {
      const user = await signin(email);

      toast.remove();
      toast.success(user?.message || "Signin successful");

      router.replace(`/otp?email=${email}`);
    } catch (error) {
      const err = toApiError(error);
      toast.remove();
      toast.error(err?.message ?? "Sign in failed");
      console.error("ERROR", error);
    } finally {
      setLoading(false);
    }
    console.log("Proceed with:", email.trim());
  };

  return (
    <div className="relative w-full">
      <div className="absolute -inset-6 rounded-[28px] nebula-overlay blur-2xl opacity-60 pointer-events-none" />

      <motion.div
        variants={cardVariants}
        className="relative card overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-nebula-gradient opacity-40 blur-2xl" />

        {/* Header */}
        <motion.div variants={itemVariants} className="w-full">
          <p className="text-xs text-dim uppercase tracking-widest">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-black headline-gradient">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-dim leading-relaxed">
            Enter your email and we’ll send a one-time code to verify it.
          </p>
        </motion.div>

        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="show"
          className="mt-8 w-full flex flex-col gap-6"
        >
          <motion.div variants={itemVariants}>
            <Col className="gap-2">
              <label className="text-sm text-dim" htmlFor="Email">
                Email
              </label>

              <motion.div variants={shakeVariants} animate={anim}>
                <InputContainer error={showError}>
                  <input
                    id="Email"
                    className="input"
                    placeholder="Enter your email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    aria-invalid={showError ? "true" : "false"}
                    aria-describedby={showError ? "email-error" : undefined}
                  />
                </InputContainer>
              </motion.div>

              <div className="min-h-4.5">
                {showError ? (
                  <p id="email-error" className="text-xs text-red-400">
                    {error}
                  </p>
                ) : (
                  <p className="text-xs text-muted">
                    We’ll never share your email with anyone.
                  </p>
                )}
              </div>
            </Col>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.div
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 520, damping: 28 }}
            >
              <CustomBtn
                className={`w-full ${loading ? "cursor-not-allowed" : ""}`}
                onClick={onSubmit}
                disabled={!emailOk || loading}
              >
                {loading ? "Signing in..." : "Continue"}
              </CustomBtn>
            </motion.div>

            <div className="mt-3 text-center text-xs text-muted">
              By continuing, you agree to our{" "}
              <a className="hover:underline" href="#">
                Terms
              </a>{" "}
              and{" "}
              <a className="hover:underline" href="#">
                Privacy Policy
              </a>
              .
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex items-center justify-between text-xs text-muted"
        >
          <span>Need help?</span>
          <a
            className="text-aurora-400 hover:text-gold-400 transition"
            href="#"
          >
            Contact support
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

const SideCard = () => {
  return (
    <div className="relative w-full hidden xl:block">
      <div className="absolute -inset-6 rounded-[28px] nebula-overlay blur-3xl opacity-35 pointer-events-none" />

      <motion.div
        variants={cardVariants}
        className="relative surface p-6 h-full flex flex-col justify-between overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gold-gradient opacity-80" />

        <div className="flex flex-col gap-3">
          <motion.h2 variants={itemVariants} className="text-2xl font-black">
            Keep it secure.
            <span className="block text-dim text-base font-semibold mt-1">
              Passwordless sign-in via OTP.
            </span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-sm text-dim leading-relaxed"
          >
            Faster, safer, and built for modern authentication. You’ll receive a
            code instantly paste it in and you’re in.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-3 inline-flex items-center gap-2 text-xs text-muted"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400/80" />
            <span>Instant delivery • Secure verification</span>
          </motion.div>
        </div>

        <motion.div
          className="relative w-full mt-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
          whileHover={{ y: -4 }}
        >
          <div className="relative w-full h-72">
            <motion.div
              className="absolute inset-0"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 5.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src={IMAGES.vector}
                alt="BgIMG"
                fill
                className="object-contain"
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-4 text-xs text-muted">
          Tip: You can paste the OTP code on the next screen.
        </motion.div>
      </motion.div>
    </div>
  );
};

const InputContainer = ({
  children,
  error,
}: {
  children?: React.ReactNode;
  error?: boolean;
}) => {
  return (
    <div className={`input-wrap ${error ? "input-wrap--error" : ""}`}>
      {children}
    </div>
  );
};

const Col = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return <div className={`flex flex-col ${className ?? ""}`}>{children}</div>;
};

export default Signin;
