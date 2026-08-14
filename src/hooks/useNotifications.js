// hooks/useNotifications.js
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../contexts/UserContext.jsx";
import { ShieldCheck, CalendarClock, UploadCloud, AlertTriangle } from "lucide-react";

const TYPE_META = {
  verification:  { icon: ShieldCheck, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  file_verified: { icon: ShieldCheck, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  reminder:      { icon: CalendarClock, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  upload:        { icon: UploadCloud, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  file_uploaded: { icon: UploadCloud, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  alert:                          { icon: AlertTriangle, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  file_unverified:                { icon: AlertTriangle, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  file_deleted:                   { icon: AlertTriangle, iconBg: "bg-rose-100",  iconColor: "text-rose-600" },
  file_access_request:            { icon: AlertTriangle, iconBg: "bg-blue-100",  iconColor: "text-blue-600" },
  division_access_request:        { icon: AlertTriangle, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
  access_request_approved:        { icon: ShieldCheck,   iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  access_request_denied:          { icon: AlertTriangle, iconBg: "bg-rose-100",  iconColor: "text-rose-600" },
  access_request_revoked:         { icon: AlertTriangle, iconBg: "bg-rose-100",  iconColor: "text-rose-600" },
  division_access_request_approved: { icon: ShieldCheck, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  division_access_request_denied:   { icon: AlertTriangle, iconBg: "bg-rose-100", iconColor: "text-rose-600" },
};

function getGroup(createdAt) {
  const date = new Date(createdAt);
  const now = new Date();
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return "Earlier";
}

function formatTime(createdAt) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return new Date(createdAt).toLocaleString("en-US", {
    month: "short", day: "2-digit", hour: "numeric", minute: "2-digit",
  });
}

function decorate(row) {
  const meta = TYPE_META[row.type] ?? TYPE_META.verification;
  return {
    id: row.id,
    type: row.type,
    group: getGroup(row.created_at),
    title: row.title,
    time: formatTime(row.created_at),
    content: row.content,
    unread: !row.is_read,
    ...meta,
  };
}

export function useNotifications() {
  const { userProfile } = useUser();
  const [notificationsList, setNotificationsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userProfile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) setNotificationsList(data.map(decorate));
    setLoading(false);
  }, [userProfile?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime: new notifications push in live (e.g. a verification just happened)
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel(`notifications:${userProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userProfile.id}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userProfile?.id, fetchNotifications]);

  const markAsRead = async (id) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const removeNotification = async (id) => {
  const prev = notificationsList;
  setNotificationsList((p) => p.filter((n) => n.id !== id));

  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) {
    console.error("removeNotification failed:", error.message, error.code, error.details, error.hint);
    setNotificationsList(prev);
  }
};

  const clearAll = async () => {
  const ids = notificationsList.map((n) => n.id);
  if (!ids.length) return;

  const prev = notificationsList;
  setNotificationsList([]); // optimistic

  const { error } = await supabase.from("notifications").delete().in("id", ids);

  if (error) {
    console.error("clearAll failed:", error.message, error.code, error.details, error.hint);
    setNotificationsList(prev); // roll back so the UI doesn't lie
  }
};

  return { notificationsList, loading, markAsRead, removeNotification, clearAll };
}