import React, { useState } from "react";
import { CheckCheck, X, ShieldCheck, CalendarClock, UploadCloud, AlertTriangle, ArrowRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications.js"; // adjust path to match your tree

export default function NotificationsPanel({ isOpen, onClose, onUnreadChange }) {
  const { notificationsList, markAsRead, removeNotification, clearAll } = useNotifications();
  const [removingId, setRemovingId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const handleRemove = (id) => {
    setRemovingId(id);
    setTimeout(() => {
      removeNotification(id);
      setRemovingId(null);
    }, 300);
  };

  const handleClearAll = () => clearAll();

  const unreadCount = notificationsList.filter((n) => n.unread).length;

  React.useEffect(() => {
    if (onUnreadChange) {
      onUnreadChange(unreadCount);
    }
  }, [unreadCount, onUnreadChange]);

  const visibleNotifications =
    activeTab === "unread"
      ? notificationsList.filter((n) => n.unread)
      : notificationsList;

  const groupedNotifications = visibleNotifications.reduce((acc, notif) => {
    if (!acc[notif.group]) acc[notif.group] = [];
    acc[notif.group].push(notif);
    return acc;
  }, {});

  const groupOrder = ["Today", "Yesterday", "Earlier"];

  return (
    <div
      className={`absolute right-0 top-[calc(100%+8px)] w-[420px] rounded-2xl bg-white z-50 overflow-hidden transition-all duration-300 origin-top-right ${isOpen
          ? "opacity-100 scale-100 visible pointer-events-auto"
          : "opacity-0 scale-95 invisible pointer-events-none"
        }`}
      style={{
        boxShadow: "0 10px 40px rgba(15,23,42,0.12), 0 1px 3px rgba(15,23,42,0.05)",
        border: "1px solid rgba(203,213,225,0.6)"
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[1.15rem] font-extrabold text-slate-800 tracking-tight">Notifications</h3>
          {unreadCount > 0 && (
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white shadow-sm">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-[0.82rem] font-bold text-rose-500 hover:text-rose-600 transition-colors"
          >
            <Trash2 size={15} strokeWidth={2.5} />
            Clear all
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-50 p-1 rounded-md"
            aria-label="Close notifications"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-1.5 rounded-full text-[0.82rem] font-bold transition-colors ${activeTab === "all"
              ? "bg-blue-50 text-blue-600"
              : "text-slate-500 hover:bg-slate-50"
            }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={`px-3.5 py-1.5 rounded-full text-[0.82rem] font-bold transition-colors ${activeTab === "unread"
              ? "bg-blue-50 text-blue-600"
              : "text-slate-500 hover:bg-slate-50"
            }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="px-3 py-3">
          {visibleNotifications.length > 0 ? (
            <div className="flex flex-col gap-4">
              {groupOrder.map((group) => {
                const groupNotifs = groupedNotifications[group];
                if (!groupNotifs || groupNotifs.length === 0) return null;

                return (
                  <div key={group}>
                    <p className="px-2 text-[0.68rem] font-bold tracking-widest text-slate-400 uppercase mb-2 mt-1">
                      {group}
                    </p>
                    <div className="flex flex-col gap-1">
                      {groupNotifs.map((notif) => {
                        const isRemoving = removingId === notif.id;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            className={`group relative flex items-start gap-3.5 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-all duration-300 ease-out overflow-hidden ${isRemoving ? "opacity-0 -translate-x-8 max-h-0 !p-0 !m-0" : "opacity-100 max-h-[150px]"
                              }`}
                          >
                            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notif.iconBg} ${notif.iconColor}`}>
                              <notif.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-[0.88rem] font-bold text-slate-800 leading-tight">
                                  {notif.title}
                                </p>
                                <span className="text-[0.7rem] font-semibold text-slate-400 shrink-0 mt-0.5">
                                  {notif.time}
                                </span>
                              </div>
                              <p className="text-[0.82rem] text-slate-500 leading-snug">
                                {notif.content}
                              </p>
                            </div>
                            {/* Unread indicator */}
                            {notif.unread && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-blue-600 shadow-sm transition-opacity duration-200 group-hover:opacity-0" />
                            )}
                            {/* Delete button (shows on hover) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(notif.id);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md"
                            >
                              <X size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                <CheckCheck size={24} />
              </div>
                <p className="text-slate-500 font-semibold text-[0.85rem]">
                  {activeTab === "unread" ? "No unread notifications" : "You're all caught up!"}
                </p>
                <p className="text-slate-400 text-[0.75rem] mt-1">
                  {activeTab === "unread" ? "You've read everything." : "No new notifications right now."}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

