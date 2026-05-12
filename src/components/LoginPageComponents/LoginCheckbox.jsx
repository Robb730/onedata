import React from "react";
import { Check } from "lucide-react";

/**
 * LoginCheckbox — Custom styled checkbox with smooth animation.
 *
 * @param {object}   props
 * @param {string}   props.id       — unique checkbox id
 * @param {string}   props.label    — visible label text
 * @param {boolean}  props.checked  — controlled checked state
 * @param {function} props.onChange  — change handler
 */
export function LoginCheckbox({ id, label, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer select-none group"
    >
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div
          className={`
            flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-2 transition-all duration-200
            ${
              checked
                ? "border-[#2986e8] bg-[#2986e8]"
                : "border-gray-300 bg-white group-hover:border-gray-400"
            }
          `}
        >
          {checked && <Check size={12} strokeWidth={3} className="text-white" />}
        </div>
      </div>
      <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
        {label}
      </span>
    </label>
  );
}
