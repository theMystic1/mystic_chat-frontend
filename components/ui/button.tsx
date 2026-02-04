import * as React from "react";

type CustomBtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  look?: "rounded" | "norms";
  children?: React.ReactNode;
};

export function CustomBtn({
  variant = "primary",
  look = "norms",
  className,
  children,
  ...props
}: CustomBtnProps) {
  return (
    <button
      className={[
        "btn z-50",
        variant === "primary" ? "btn-primary" : "btn-secondary",
        look === "rounded" ? "rounded-full" : "rounded-xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
