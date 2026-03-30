import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../Layouts/MainLayout";
import AttendanceLayout from "../Layouts/AttendanceLayout";
import HomePage from "../Pages/HomePage";
import LoginPage from "../Pages/LoginPages";
import AdminDashboardPage from "../Pages/AdminDashboardPage";
import AttendanceSchedule from "../Pages/Attendance/AttendanceSchedule";
import AttendanceMissedPunch from "../Pages/Attendance/AttendanceMissedPunch";
import AttendanceRecord from "../Pages/Attendance/AttendanceRecord";
import AttendanceFormRecord from "../Pages/Attendance/AttendanceFormRecord";
import AttendanceSpecialLeave from "../Pages/Attendance/AttendanceSpecialLeave";
import AttendanceLeave from "../Pages/Attendance/AttendanceLeave";
import AttendanceOvertime from "../Pages/Attendance/AttendanceOverTime";
import AttendanceLeaveBalance from "../Pages/Attendance/AttendanceLeaveBalance";
import AttendancePendingApproval from "../Pages/Attendance/AttendancePendingApproval";
import Absent from "../Pages/Attendance/Absent";

function PlaceholderPage({ title }) {
  return <div style={{ padding: "24px" }}>{title}</div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/foundation" element={<PlaceholderPage title="Foundation" />} />
        <Route path="/payroll" element={<PlaceholderPage title="Payroll" />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
        <Route path="/mayo-form" element={<PlaceholderPage title="MAYO Form" />} />

        {/* attendance landing page */}
        <Route path="/attendance" element={<AttendanceLayout />} />

        {/* attendance subpages */}
        <Route path="/attendance/clock" element={<Absent />} />
        <Route path="/attendance/schedule" element={<AttendanceSchedule />} />
        <Route path="/attendance/missed-punch" element={<AttendanceMissedPunch />} />
        <Route path="/attendance/record" element={<AttendanceRecord />} />
        <Route path="/attendance/special-leave" element={<AttendanceSpecialLeave />} />
        <Route path="/attendance/leave" element={<AttendanceLeave />} />
        <Route path="/attendance/overtime" element={<AttendanceOvertime />} />
        <Route path="/attendance/form-record" element={<AttendanceFormRecord />} />
        <Route path="/attendance/leave-balance" element={<AttendanceLeaveBalance />} />
        <Route path="/attendance/pending-approval" element={<AttendancePendingApproval />} />
      </Route>
    </Routes>
  );
}