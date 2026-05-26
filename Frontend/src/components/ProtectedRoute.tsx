import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuthSession, parseStoredUser } from "../lib/authSession";

type Props = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { accessToken, userJson } = useAuthSession();
  
  const user = useMemo(() => parseStoredUser<any>(userJson), [userJson]);
  
  if (!accessToken) return <Navigate to="/login" replace />;
  
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user) return <Navigate to="/login" replace />;
    const userRoles = (user.roles || []).map((r: any) => String(r?.name || "").toLowerCase());
    const hasRole = allowedRoles.some(role => userRoles.includes(role.toLowerCase()));
    
    // Also check account_type as a fallback for 'client' or 'diyetisyen'
    const accountType = String(user.account_type || "").toLowerCase();
    const hasAccountType = allowedRoles.some(role => role.toLowerCase() === accountType);
    
    if (!hasRole && !hasAccountType) {
      return <Navigate to="/" replace />; // Unauthorized, redirect to home
    }
  }

  return <>{children}</>;
}
