import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../Pages/LoginPages";
import AttendancePage from "../Pages/AttendancePage";
import AdminDashboardPage from "../Pages/AdminDashboardPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/attendance" replace />} />
      <Route path="/attendance" element={<AttendancePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
    </Routes>
  );
}

export default AppRoutes;