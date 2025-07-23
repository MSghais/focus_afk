import React, { useState } from "react";

type CheckboxProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
};

export function Checkbox({
  checked = false,
  onChange,
  label,
  id,
  className = "",
  disabled = false,
}: CheckboxProps) {
  const checkboxId = id || React.useId();

  const [isChecked, setIsChecked] = useState(checked);

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={isChecked}
        onChange={e => {
          setIsChecked(e.target.checked);
          onChange?.(e.target.checked);
        }}
        disabled={disabled}
        className="accent-primary w-4 h-4 rounded border border-gray-300 focus:ring-2 focus:ring-primary transition"
      />
      {label && <span>{label}</span>}
    </label>
  );
}
