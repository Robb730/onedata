import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const UserContext = createContext(null);

const PROFILE_SELECT =
  "id, email, full_name, role, division_id, section_id, must_change_password";

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
    let channel;

    async function subscribe() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`users-row-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            // payload.new already has the updated row — no extra fetch needed.
            setUserProfile(payload.new);
            localStorage.setItem("userProfile", JSON.stringify(payload.new));
          }
        )
        .subscribe();
    }

    subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

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