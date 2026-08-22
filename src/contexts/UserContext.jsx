import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const UserContext = createContext(null);

// division_id/section_id are foreign keys — `division:divisions(name)` and
// `section:sections(name)` pull in the related row's name via PostgREST's
// embedded-resource syntax, so userProfile.division?.name /
// userProfile.section?.name are available without a second round trip.
// Only one of the two will ever be populated for a given user (division
// focals have a division_id but no section_id, and vice versa for
// section-scoped roles), which TopHeader's getScopeLabel already accounts
// for by picking the right one based on role.
const PROFILE_SELECT =
  "id, email, full_name, id_number, role, division_id, section_id, must_change_password, division:divisions(id, name), section:sections(name)";

export function UserProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);
  const userIdRef = useRef(null);

  const loadProfile = useCallback(async (showLoading = true) => {
  if (showLoading) setLoading(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setUserProfile(null);
    userIdRef.current = null;
    setLoading(false);
    return;
  }

  userIdRef.current = user.id;

  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .single();

  if (!error) {
    setUserProfile((prev) => {
      // Skip the update entirely if nothing actually changed —
      // avoids triggering re-renders/effects on every tab refocus.
      if (prev && JSON.stringify(prev) === JSON.stringify(data)) {
        return prev;
      }
      localStorage.setItem("userProfile", JSON.stringify(data));
      return data;
    });
  }
  setLoading(false);
  hasLoadedOnce.current = true;
}, []);

  // Exposed so any screen (e.g. a self-edit form) can force a refresh
  // without waiting on Realtime.
  const refreshProfile = useCallback(() => loadProfile(false), [loadProfile]);

  useEffect(() => {
    loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        loadProfile(!hasLoadedOnce.current);
      }
      // Explicitly ignore: "TOKEN_REFRESHED", "INITIAL_SESSION"
    });

    return () => authListener.subscription.unsubscribe();
  }, [loadProfile]);

  // ── Realtime: react the moment an admin edits this user's row ──
  useEffect(() => {
  let cancelled = false;
  let channel = null;

  async function subscribe() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || cancelled) return;

    const topic = `users-row-${user.id}`;

    // Defensive: if a channel with this topic is already registered
    // (e.g. from a StrictMode double-invoke or HMR reload), tear it
    // down first so .on() below never lands on an already-subscribed
    // channel instance.
    const existing = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${topic}`);
    if (existing) {
      await supabase.removeChannel(existing);
    }

    if (cancelled) return;

    channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        () => {
          // payload.new is the raw `users` row only — it can't contain the
          // embedded divisions/sections name, so re-fetch through the same
          // joined query instead of setting state from the payload
          // directly. Otherwise a realtime-triggered update would wipe
          // out division/section names until the next full reload.
          loadProfile(false);
        },
      )
      .subscribe();
  }

  subscribe();

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}, [loadProfile]);

  // ── Safety net: refetch on tab refocus in case Realtime dropped ──
  useEffect(() => {
    function handleFocus() {
      if (userIdRef.current) loadProfile(false);
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadProfile]);

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile, loading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);