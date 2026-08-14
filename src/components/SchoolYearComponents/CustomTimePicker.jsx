import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      const value = `${hh}:${mm}`;
      const label = new Date(0, 0, 0, h, m).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      options.push({ value, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function CustomTimePicker({ value, onChange, placeholder = "--:--" }) {
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

  const getLabel = (optValue) => {
    if (!optValue) return placeholder;
    // Format if they typed a specific time that is not in the list
    const opt = TIME_OPTIONS.find((o) => o.value === optValue);
    if (opt) return opt.label;
    
    // Fallback formatter for exact times (like 14:15)
    try {
      const [h, m] = optValue.split(":");
      return new Date(0, 0, 0, h, m).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return optValue;
    }
  };

  return (
    <div className="relative w-full z-[40]" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-[12px] border py-2.5 sm:py-3 min-h-[42px] sm:min-h-[46px] text-[0.85rem] font-semibold transition-all outline-none focus:ring-2 focus:ring-blue-100 pl-3.5 pr-10 ${
          isOpen
            ? "border-blue-500 bg-white text-slate-800 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
            : "border-slate-200/80 bg-slate-50/50 hover:border-blue-200 hover:bg-white text-slate-700"
        }`}
      >
        <span className="truncate">{getLabel(value)}</span>
        <Clock
          size={16}
          strokeWidth={2}
          className={`absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors ${
            isOpen ? "text-blue-500" : "text-slate-400"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full min-w-[160px] rounded-[12px] border border-slate-200 bg-white shadow-lg origin-top animate-in fade-in zoom-in-95 duration-150">
          <div className="flex max-h-60 flex-col overflow-y-auto custom-scrollbar py-1">
            {TIME_OPTIONS.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-4 py-3 text-left text-[0.85rem] font-semibold transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
