import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export function CustomDropdown({ 
  value, 
  options, 
  onChange, 
  ariaLabel, 
  placeholder = "",
  disabled = false,
  icon: Icon = null,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Options can be strings or objects { value, label }
  const getLabel = (optValue) => {
    if (optValue === "" || optValue == null) return placeholder;
    const opt = options.find(o => (typeof o === 'object' ? String(o.value) === String(optValue) : String(o) === String(optValue)));
    return opt ? (typeof opt === 'object' ? opt.label : opt) : placeholder;
  };

  return (
    <div className={`relative w-full ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`} ref={containerRef}>
      {Icon && (
        <Icon className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none ${isOpen ? "text-blue-500" : "text-slate-400"}`} size={16} strokeWidth={2} />
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`w-full flex items-center justify-between rounded-[12px] border py-2.5 sm:py-3 min-h-[42px] sm:min-h-[46px] text-[0.85rem] font-semibold transition-all outline-none focus:ring-2 focus:ring-blue-100 ${
          Icon ? "pl-10" : "pl-3.5"
        } pr-3.5 ${
          isOpen 
            ? "border-blue-500 bg-white text-slate-800 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" 
            : "border-slate-200/80 bg-slate-50/50 hover:border-blue-200 hover:bg-white text-slate-700"
        }`}
      >
        <span className="truncate">{getLabel(value)}</span>
        <ChevronDown
          size={14}
          className={`ml-2 shrink-0 transition-transform ${isOpen ? "rotate-180 text-blue-500" : "text-slate-400"}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full min-w-[160px] rounded-[12px] border border-slate-200 bg-white shadow-lg origin-top animate-in fade-in zoom-in-95 duration-150">
          <div className="flex max-h-60 flex-col overflow-y-auto custom-scrollbar py-1">
            {options.map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const isSelected = String(optValue) === String(value);
              
              return (
                <button
                  key={optValue}
                  type="button"
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-3 text-left text-[0.85rem] font-semibold transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {optLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
