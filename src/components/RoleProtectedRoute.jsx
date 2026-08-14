import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { useUser } from "../contexts/UserContext.jsx";

export default function RoleProtectedRoute({ session, roles, children }) {
  const { userProfile, loading } = useUser();

  return (
    <ProtectedRoute session={session}>
      {loading ? null : roles.includes(userProfile?.role) ? (
        children
      ) : (
        <Navigate to="/not-found" replace />
      )}
    </ProtectedRoute>
  );
}