import logo from "@/public/images/logo.png";
import vector from "@/public/images/Vector.png";
import decoration from "@/public/images/Decoration.png";
import { Step, StepKey } from "./types";

export const IMAGES = {
  logo,
  vector,
  decoration,
};

export const STEPS: Step[] = [
  {
    key: "userName",
    title: "Choose a username",
    subtitle: "This will be your unique handle.",
    placeholder: "e.g. jasper",
    required: true,
    type: "text",
    helper: "Letters, numbers, underscores. No spaces.",
  },
  {
    key: "displayName",
    title: "What should we call you?",
    subtitle: "This is what people see on your profile.",
    placeholder: "e.g. Jasper Stark",
    required: true,
    type: "text",
  },
  {
    key: "avatarUrl",
    title: "Pick a profile photo",
    subtitle: "Optional — you can change this later.",
    required: false,
    type: "image",
    helper: "PNG, JPG, or WebP. Recommended: square image.",
  },
  {
    key: "bio",
    title: "Write a short bio",
    subtitle: "Optional — a line or two is enough.",
    placeholder: "Tell people something cool about you…",
    required: false,
    type: "textarea",
  },
];
