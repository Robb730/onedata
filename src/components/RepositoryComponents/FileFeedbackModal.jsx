import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X, Lock, MessagesSquare } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import ModalPortal from "../Modals/ModalPortal";
import { pushNotification } from "../../utils/notifications";

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
];
function hashStr(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function avatarColor(name) {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
}

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfDay = (x) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function FileFeedbackModal({
  isOpen,
  onClose,
  file,
  section,
  userProfile,
  onRead,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !file?.id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("file_feedback")
        .select("*")
        .eq("file_id", file.id)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        if (!error) setMessages(data || []);
        setLoading(false);
      }
      await supabase.from("file_feedback_reads").upsert({
        file_id: file.id,
        user_id: userProfile.id,
        last_read_at: new Date().toISOString(),
      });
      onRead?.(file.id);
    }
    load();

    const channel = supabase
      .channel(`file-feedback-${file.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "file_feedback",
          filter: `file_id=eq.${file.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.new.id)
              ? prev
              : [...prev, payload.new],
          );
          if (payload.new.created_by !== userProfile.id) {
            supabase.from("file_feedback_reads").upsert({
              file_id: file.id,
              user_id: userProfile.id,
              last_read_at: new Date().toISOString(),
            });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isOpen, file?.id, userProfile?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Auto-grow the textarea up to a max height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [draft]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");

    const { data, error } = await supabase
      .from("file_feedback")
      .insert({
        file_id: file.id,
        section_id: section?.id,
        message: text,
        created_by: userProfile.id,
        created_by_name: userProfile.full_name,
        created_by_role: userProfile.role,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setDraft(text);
    } else if (data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data],
      );

      if (file.uploaderId && file.uploaderId !== userProfile.id) {
        try {
          await pushNotification({
            recipientIds: [file.uploaderId],
            type: "file_feedback",
            title: "New feedback on your file",
            content: `${userProfile.full_name} commented on ${file.name}`,
            meta: { related_file_id: file.id, section_id: section?.id },
          });
        } catch (notifyErr) {
          console.error(
            "Failed to notify uploader of new feedback:",
            notifyErr,
          );
        }
      }
    }
    setSending(false);
  }

  if (!isOpen || !file) return null;

  // Group consecutive same-sender messages, and insert day dividers
  const groups = [];
  let currentGroup = null;
  let lastDay = null;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const day = dayLabel(m.created_at);
    if (day !== lastDay) {
      groups.push({ type: "divider", label: day, key: `day-${m.id}` });
      lastDay = day;
      currentGroup = null;
    }
    if (!currentGroup || currentGroup.senderId !== m.created_by) {
      currentGroup = {
        type: "group",
        senderId: m.created_by,
        senderName: m.created_by_name,
        messages: [m],
        key: `group-${m.id}`,
      };
      groups.push(currentGroup);
    } else {
      currentGroup.messages.push(m);
    }
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <button
          type="button"
          className="modal-overlay absolute inset-0 border-0 p-0"
          aria-label="Close feedback"
          onClick={onClose}
        />
        <div className="relative z-10 w-full sm:max-w-lg flex flex-col max-h-[72dvh] sm:h-[82vh] sm:max-h-[680px] bg-white rounded-t-[1.35rem] sm:rounded-3xl shadow-[0_40px_100px_rgba(15,23,42,0.28)] border border-slate-200/80 overflow-hidden">
          {/* Mobile sheet handle */}
          <div className="sm:hidden flex justify-center pt-2 pb-0.5 shrink-0 bg-gradient-to-b from-slate-50/80 to-white">
            <div className="w-9 h-1 rounded-full bg-slate-200" />
          </div>

          {/* Header */}
          <div className="relative flex items-start gap-2 sm:gap-3 px-4 sm:px-6 pt-2.5 sm:pt-6 pb-3 sm:pb-5 shrink-0 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-[0_6px_16px_rgba(37,99,235,0.35)]">
              <MessagesSquare
                size={18}
                className="text-white"
                strokeWidth={2.2}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.9rem] sm:text-[1rem] font-black text-slate-800 tracking-[-0.01em] leading-tight">
                Feedback
              </h2>
              <p className="text-[0.68rem] sm:text-[0.75rem] text-slate-400 font-semibold truncate mt-0.5">
                {file.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0 -mr-1"
              aria-label="Close"
            >
              <X size={17} strokeWidth={2.2} />
            </button>
          </div>

          {/* Privacy notice */}
          <div className="mx-4 sm:mx-6 mt-2 sm:mt-4 flex items-start sm:items-center gap-2 rounded-lg sm:rounded-xl bg-blue-50/70 border border-blue-100 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 shrink-0">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Lock size={10} className="text-blue-500" strokeWidth={2.5} />
            </div>
            <p className="text-[9.5px] sm:text-[11px] text-blue-700/80 font-medium leading-snug">
              Visible to everyone in this section, plus division officers and
              administrators.
            </p>
          </div>

          {/* Messages */}
          <div className="overflow-y-auto overscroll-contain px-3.5 sm:px-5 py-2.5 sm:py-4 max-h-[36dvh] sm:max-h-none sm:flex-1 sm:min-h-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.100)_1px,transparent_0)] [background-size:18px_18px]">
            {loading ? (
              <div className="flex items-center justify-center min-h-[120px] sm:min-h-0 sm:h-full gap-2 text-[12px] text-slate-400 font-medium">
                <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                Loading conversation…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[120px] sm:min-h-0 sm:h-full text-center gap-2.5 sm:gap-3 py-2">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] border border-slate-100 flex items-center justify-center">
                  <MessageSquare
                    size={22}
                    className="text-slate-300 sm:hidden"
                    strokeWidth={1.5}
                  />
                  <MessageSquare
                    size={26}
                    className="text-slate-300 hidden sm:block"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-[12px] sm:text-[13px] font-bold text-slate-600">
                    No feedback yet
                  </p>
                  <p className="text-[10.5px] sm:text-[11.5px] text-slate-400 font-medium mt-0.5">
                    Be the first to start the conversation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((item) => {
                  if (item.type === "divider") {
                    return (
                      <div
                        key={item.key}
                        className="flex items-center gap-3 py-1.5"
                      >
                        <div className="flex-1 h-px bg-slate-200/70" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 rounded-full bg-white border border-slate-100 shadow-sm">
                          {item.label}
                        </span>
                        <div className="flex-1 h-px bg-slate-200/70" />
                      </div>
                    );
                  }

                  const isOwn = item.senderId === userProfile.id;
                  return (
                    <div
                      key={item.key}
                      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full ${avatarColor(item.senderName)} flex items-center justify-center shrink-0 self-end ring-2 ring-white shadow-sm`}
                      >
                        <span className="text-[10px] font-bold text-white">
                          {getInitials(item.senderName)}
                        </span>
                      </div>

                      <div
                        className={`flex flex-col gap-1 max-w-[88%] sm:max-w-[72%] ${isOwn ? "items-end" : "items-start"}`}
                      >
                        {!isOwn && (
                          <p className="text-[10.5px] font-bold text-slate-500 px-1 whitespace-nowrap">
                            {item.senderName}
                          </p>
                        )}
                        {item.messages.map((m, idx) => {
  const isLast = idx === item.messages.length - 1;
  const roundedCorner = isOwn
    ? isLast ? "rounded-br-md" : "rounded-br-2xl"
    : isLast ? "rounded-bl-md" : "rounded-bl-2xl";
  return (
    <div
      key={m.id}
      className={`group/message flex items-end gap-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm rounded-2xl ${roundedCorner} ${
          isOwn
            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
            : "bg-white text-slate-700 border border-slate-100"
        }`}
      >
        {m.message}
      </div>

      {/* Reveals on hover, sits beside the bubble — space is always
          reserved so bubbles don't shift when it appears/disappears */}
      <span
        className={`w-11 sm:w-12 shrink-0 text-[9px] font-medium text-slate-400 whitespace-nowrap opacity-60 sm:opacity-0 sm:group-hover/message:opacity-100 transition-opacity duration-150 ${
          isOwn ? "text-right" : "text-left"
        }`}
      >
        {new Date(m.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
})}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="flex items-end gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:pb-3.5 border-t border-slate-100 bg-white shrink-0">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write feedback…"
              rows={1}
              className="flex-1 min-w-0 resize-none rounded-xl sm:rounded-2xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 text-[12.5px] sm:text-[13px] leading-snug placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-200 disabled:to-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(37,99,235,0.3)] disabled:shadow-none active:scale-95"
            >
              {sending ? (
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={15} className="sm:scale-110" strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
