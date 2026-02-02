import React from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, className = "", ...rest }) => {
  return (
    <label className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-medium text-text-main/70 uppercase tracking-wide">
          {label}
        </span>
      )}
      <input
        className={`rounded-full border border-grid-deep/20 bg-white/80 px-5 py-3 text-sm text-text-main outline-none transition-all duration-200 ease-out placeholder:text-text-main/40 hover:border-grid-deep/30 hover:bg-white focus:border-accent-primary focus:bg-white focus:ring-2 focus:ring-accent-primary/20 ${className}`}
        {...rest}
      />
    </label>
  );
};

