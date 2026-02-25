import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import AppEntry from "./pages/AppEntry";
import ClientHome from "./pages/ClientHome";
import DietitianHome from "./pages/DietitianHome";
import DietitianVerification from "./pages/DietitianVerification";
import ProtectedRoute from "./components/ProtectedRoute";
import SettingsDrawer from "./components/SettingsDrawer";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<AppEntry />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/admin-panel" replace />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-home"
          element={
            <ProtectedRoute>
              <ClientHome profile={{}} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dietitian-home"
          element={
            <ProtectedRoute>
              <DietitianHome profile={{}} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dietitian-verification"
          element={
            <ProtectedRoute>
              <DietitianVerification />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SettingsDrawer />
    </>
  );
}
