import { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export function CustomDatePicker({ value, onChange, placeholder = "dd/mm/yyyy" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? parseISO(value) : new Date());
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

  useEffect(() => {
    if (value && isValid(parseISO(value))) {
      setCurrentMonth(parseISO(value));
    }
  }, [value]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDateClick = (day) => {
    onChange(format(day, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  const selectedDate = value ? parseISO(value) : null;

  return (
    <div className="relative w-full z-[50]" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-[12px] border py-2.5 sm:py-3 min-h-[42px] sm:min-h-[46px] text-[0.85rem] font-semibold transition-all outline-none focus:ring-2 focus:ring-blue-100 pl-10 pr-3.5 ${
          isOpen 
            ? "border-blue-500 bg-white text-slate-800 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" 
            : "border-slate-200/80 bg-slate-50/50 hover:border-blue-200 hover:bg-white text-slate-700"
        }`}
      >
        <CalendarIcon className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none ${isOpen ? "text-blue-500" : "text-slate-400"}`} size={16} strokeWidth={2} />
        <span className="truncate">{selectedDate && isValid(selectedDate) ? format(selectedDate, "MMM d, yyyy") : placeholder}</span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-[220px] rounded-[16px] border border-slate-200 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)] origin-top animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[0.75rem] font-bold text-slate-800">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-0.5 mb-1.5">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
              <div key={day} className="text-center text-[0.6rem] font-bold text-slate-400">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-y-0.5 gap-x-0.5">
            {days.map(day => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              return (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`h-[24px] w-full rounded-full flex items-center justify-center text-[0.7rem] transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : isCurrentMonth
                        ? "text-slate-700 font-medium hover:bg-slate-100"
                        : "text-slate-300 font-medium hover:bg-slate-50"
                  }`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
          
          <div className="mt-2.5 flex justify-between border-t border-slate-100 pt-2">
            <button 
              type="button" 
              onClick={() => { onChange(""); setIsOpen(false); }}
              className="text-[0.75rem] font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
            <button 
              type="button" 
              onClick={() => handleDateClick(new Date())}
              className="text-[0.75rem] font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
