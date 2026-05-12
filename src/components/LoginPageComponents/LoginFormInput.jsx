import React from "react";

/**
 * LoginFormInput — Reusable labelled text input with optional
 * right-side icon (e.g. password-visibility toggle).
 *
 * @param {object}   props
 * @param {string}   props.id          — unique input id
 * @param {string}   props.label       — visible label text
 * @param {string}   props.type        — input type (text, password, etc.)
 * @param {string}   props.value       — controlled value
 * @param {function} props.onChange     — change handler
 * @param {string}   [props.placeholder]
 * @param {React.ReactNode} [props.endIcon] — optional icon button rendered at the end
 * @param {string}   [props.autoComplete]
 */
export function LoginFormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  endIcon = null,
  autoComplete,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[0.82rem] font-semibold text-[#374151] tracking-wide"
      >
        {label}
      </label>
      <div className="relative group">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border-[1.5px] border-[#d1dce8] bg-[#f8fafd] px-4 py-3 text-sm text-gray-800
                     outline-none transition-all duration-300
                     placeholder:text-gray-400
                     focus:border-[#2986e8] focus:bg-white focus:ring-[3px] focus:ring-[#2986e8]/12
                     hover:border-[#a0b8d8]"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2986e8] transition-colors cursor-pointer">
            {endIcon}
          </div>
        )}
      </div>
    </div>
  );
}
