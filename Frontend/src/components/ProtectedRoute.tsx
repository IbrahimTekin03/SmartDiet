import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthSession } from "../lib/authSession";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { accessToken } = useAuthSession();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
