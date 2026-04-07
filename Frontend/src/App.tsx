import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import AdminPanel from "./pages/AdminPanel";
import ClinicManagerPanel from "./pages/ClinicManagerPanel";
import Profile from "./pages/Profile";
import AppEntry from "./pages/AppEntry";
import DietitianVerification from "./pages/DietitianVerification";
import MealPlanner from "./pages/MealPlanner";
import DietitianDashboard from "./pages/DietitianDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import SettingsDrawer from "./components/SettingsDrawer";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<AppEntry />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clinic-manager"
          element={
            <ProtectedRoute>
              <ClinicManagerPanel />
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
              <Navigate to="/" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dietitian-home"
          element={
            <ProtectedRoute>
              <DietitianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meal-planner"
          element={
            <ProtectedRoute>
              <MealPlanner />
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
