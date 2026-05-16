// src/contexts/UserContext.jsx
import { createContext, useContext, useState } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userProfile, setUserProfile] = useState(() => {
    const stored = localStorage.getItem("userProfile");
    return stored ? JSON.parse(stored) : null;
  });

  // ✅ expose both value and setter
  return (
    <UserContext.Provider value={{ userProfile, setUserProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);