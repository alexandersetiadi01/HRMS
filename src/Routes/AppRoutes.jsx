import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../Layouts/MainLayout";
import AttendanceLayout from "../Layouts/AttendanceLayout";
import HomePage from "../Pages/HomePage";
import LoginPage from "../Pages/LoginPages";
import AdminDashboardPage from "../Pages/AdminDashboardPage";
import AttendanceSchedule from "../Pages/Attendance/AttendanceSchedule";
import AttendanceMissedPunch from "../Pages/Attendance/AttendanceMissedPunch";
import AttendanceRecord from "../Pages/Attendance/Record/AttendanceRecord";
import AttendanceFormRecord from "../Pages/Attendance/AttendanceFormRecord";
import AttendanceSpecialLeave from "../Pages/Attendance/AttendanceSpecialLeave";
import AttendanceLeave from "../Pages/Attendance/Leave/AttendanceLeave";
import AttendanceOvertime from "../Pages/Attendance/AttendanceOverTime";
import AttendanceLeaveBalance from "../Pages/Attendance/AttendanceLeaveBalance";
import AttendancePendingApproval from "../Pages/Attendance/AttendancePendingApproval";
import Absent from "../Pages/Attendance/Absent";
import AttendanceBusinessTrip from "../Pages/Attendance/AttendanceBusinessTrip";
import AccountLayout from "../Layouts/AccountLayout";
import PayrollPage from "../Pages/Payroll/PayrollPage";
import PayrollDetail from "../Pages/Payroll/PayrollDetail";

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
        <Route path="/account" element={<AccountLayout title="account" />} />

        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/payroll/:payrollId" element={<PayrollDetail />} />

        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />

        <Route path="/attendance" element={<AttendanceLayout />} />
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
        <Route path="/attendance/business-trip" element={<AttendanceBusinessTrip />} />
      </Route>
    </Routes>
  );
}