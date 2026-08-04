import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    async function loadProfile(showLoading = true) {
      if (showLoading) setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, role, division_id, section_id, must_change_password")
        .eq("id", user.id)
        .single();

      if (!error) {
        setUserProfile(data);
        localStorage.setItem("userProfile", JSON.stringify(data));
      }
      setLoading(false);
      hasLoadedOnce.current = true;
    }

    loadProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      // Ignore noisy events fired on tab refocus / token refresh —
      // only react to real sign-in/sign-out transitions.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        loadProfile(!hasLoadedOnce.current);
      }
      // Explicitly ignore: "TOKEN_REFRESHED", "INITIAL_SESSION"
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);