
import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children, allowedRole }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // if no token or no role -> not logged in
  if (!role) return <Navigate to="/login" replace />;

  // role based protection (optional)
  if (allowedRole && role !== allowedRole) return <Navigate to="/login" replace />;

  return children;
}