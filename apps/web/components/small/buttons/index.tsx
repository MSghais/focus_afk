import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

/**
 * ButtonPrimary uses CSS variables for brand color, text, and background,
 * supporting both light and dark mode via CSS variables.
 */
export function ButtonPrimary({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        min-w-[2.5rem]
        flex items-center gap-2 justify-center
        rounded-md
        border-2
        border-[var(--brand-primary)]
        bg-[var(--brand-primary)]
        text-[var(--button-primary-text, #fff)]
        px-5 py-2
        transition-colors
        hover:bg-[var(--brand-secondary)]
        hover:border-[var(--brand-secondary)]
        focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        // fallback for text color if not set in theme
        color: "var(--button-primary-text, #fff)",
        background: "var(--brand-primary)",
        borderColor: "var(--brand-primary)",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * ButtonSecondary uses CSS variables for secondary color, text, and background,
 * supporting both light and dark mode via CSS variables.
 */
export function ButtonSecondary({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        min-h-10 min-w-[2.5rem]
        flex items-center gap-2 justify-center
        rounded-md
        border-2
        border-[var(--brand-secondary)]
        bg-[var(--button-secondary-bg,transparent)]
        px-5 py-2
        transition-colors
        hover:bg-[var(--brand-secondary)]
        hover:text-[var(--button-secondary-hover-text,#fff)]
        focus:outline-none focus:ring-2 focus:ring-[var(--brand-secondary)] focus:ring-offset-2
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      // text-[var(--button-secondary-text,var(--brand-secondary))]

      style={{
        // color: "var(--button-secondary-text, var(--brand-secondary))",
        background: "var(--button-secondary-bg, transparent)",
        borderColor: "var(--brand-secondary)",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * ButtonSimple uses CSS variables for neutral color, text, and background,
 * supporting both light and dark mode via CSS variables.
 */
export function ButtonSimple({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        min-h-10 min-w-[2.5rem]
        flex items-center gap-2 justify-center
        rounded-md
        border-2
        border-[var(--button-simple-border,var(--gray-300))]
        bg-[var(--button-simple-bg,transparent)]
        text-[var(--button-simple-text,var(--gray-900))]
        px-5 py-2
        transition-colors
        hover:bg-[var(--button-simple-hover-bg,var(--gray-100))]
        focus:outline-none focus:ring-2 focus:ring-[var(--button-simple-border,var(--gray-300))] focus:ring-offset-2
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        color: "var(--button-simple-text, var(--gray-900))",
        background: "var(--button-simple-bg, transparent)",
        borderColor: "var(--button-simple-border, var(--gray-300))",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}