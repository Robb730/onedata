import { useState, useRef, useEffect } from "react";
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, 
  parseISO, isValid, isBefore, isAfter, startOfDay 
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export function CustomDateRangePicker({ 
  startDate, 
  endDate, 
  onChange, 
  placeholder = "Select Date Range...", 
  minDate 
}) {
  const [isOpen, setIsOpen] = useState(false);
  // Default view month based on startDate or current date
  const [currentMonth, setCurrentMonth] = useState(
    startDate ? parseISO(startDate) : new Date()
  );
  
  // Temporary state while selecting
  const [hoverDate, setHoverDate] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHoverDate(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (startDate && isValid(parseISO(startDate))) {
      setCurrentMonth(parseISO(startDate));
    }
  }, [startDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const parsedStart = startDate ? parseISO(startDate) : null;
  const parsedEnd = endDate ? parseISO(endDate) : null;

  const handleDateClick = (day) => {
    const formatted = format(day, "yyyy-MM-dd");

    if (!startDate || (startDate && endDate)) {
      // Start a new selection
      onChange({ startDate: formatted, endDate: "" });
    } else if (startDate && !endDate) {
      // Complete the selection
      if (isBefore(day, parsedStart)) {
        // If they click a date before the start, reset start
        onChange({ startDate: formatted, endDate: "" });
      } else {
        onChange({ startDate, endDate: formatted });
        setIsOpen(false);
        setHoverDate(null);
      }
    }
  };

  const handleMouseEnter = (day) => {
    if (startDate && !endDate) {
      setHoverDate(day);
    }
  };

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${format(parsedStart, "MMM d, yyyy")} - ${format(parsedEnd, "MMM d, yyyy")}`;
    }
    if (startDate) {
      return `${format(parsedStart, "MMM d, yyyy")} - ...`;
    }
    return placeholder;
  };

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
        <span className="truncate">{getDisplayText()}</span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-[240px] rounded-[16px] border border-slate-200 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)] origin-top animate-in fade-in zoom-in-95 duration-150">
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
          
          <div className="grid grid-cols-7 gap-0 mb-1.5">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
              <div key={day} className="text-center text-[0.6rem] font-bold text-slate-400">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-y-0.5" onMouseLeave={() => setHoverDate(null)}>
            {days.map(day => {
              const isStart = parsedStart && isSameDay(day, parsedStart);
              const isEnd = parsedEnd && isSameDay(day, parsedEnd);
              const isSelected = isStart || isEnd;
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isPast = minDate && isBefore(day, startOfDay(parseISO(minDate)));
              
              // Determine if it's in range (between start and end)
              const inRange = parsedStart && parsedEnd && isAfter(day, parsedStart) && isBefore(day, parsedEnd);
              
              // Determine if it's in hover range
              const inHoverRange = startDate && !endDate && hoverDate && isAfter(day, parsedStart) && !isBefore(day, hoverDate) && !isAfter(day, hoverDate);
              const isHovered = inHoverRange || (startDate && !endDate && hoverDate && isAfter(day, parsedStart) && isBefore(day, hoverDate));

              return (
                <div 
                  key={day.toString()} 
                  className={`flex justify-center ${inRange || isHovered ? "bg-blue-50" : ""} ${isStart && (parsedEnd || hoverDate) ? "rounded-l-full bg-gradient-to-r from-transparent to-blue-50" : ""} ${isEnd || (isHovered && isSameDay(day, hoverDate)) ? "rounded-r-full bg-gradient-to-l from-transparent to-blue-50" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => handleDateClick(day)}
                    onMouseEnter={() => handleMouseEnter(day)}
                    disabled={isPast}
                    className={`h-[26px] w-[26px] rounded-full flex items-center justify-center text-[0.7rem] transition-colors ${
                      isPast
                        ? "text-slate-300 cursor-not-allowed opacity-50"
                        : isSelected
                          ? "bg-blue-600 text-white shadow-sm font-bold z-10"
                          : isCurrentMonth
                            ? (inRange || isHovered) ? "text-blue-700 font-semibold" : "text-slate-700 font-medium hover:bg-slate-100"
                            : (inRange || isHovered) ? "text-blue-400 font-medium" : "text-slate-300 font-medium hover:bg-slate-50"
                    }`}
                  >
                    {format(day, "d")}
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-2.5 flex justify-between border-t border-slate-100 pt-2">
            <button 
              type="button" 
              onClick={() => { onChange({ startDate: "", endDate: "" }); setIsOpen(false); }}
              className="text-[0.75rem] font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
            <button 
              type="button" 
              onClick={() => {
                const today = format(new Date(), "yyyy-MM-dd");
                onChange({ startDate: today, endDate: today });
                setIsOpen(false);
              }}
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
