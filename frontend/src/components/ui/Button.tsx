import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center rounded-full font-medium tracking-wide transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";
  
  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base"
  };
  
  const variants: Record<string, string> = {
    primary:
      "bg-accent-primary text-background shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft-sm focus-visible:ring-accent-primary/50",
    secondary:
      "bg-accent-secondary text-background shadow-soft-sm hover:bg-accent-secondary/90 hover:shadow-soft-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft-sm focus-visible:ring-accent-secondary/50",
    ghost:
      "border border-grid-deep/20 text-text-main bg-white/50 hover:bg-grid-deep/5 hover:border-grid-deep/30 active:bg-grid-deep/10 focus-visible:ring-grid-deep/30"
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
};

