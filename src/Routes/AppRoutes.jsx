import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../Layouts/MainLayout";
import AttendanceLayout from "../Layouts/AttendanceLayout";
import HomePage from "../Pages/HomePage";
import LoginPage from "../Pages/LoginPages";
import AdminDashboardPage from "../Pages/AdminDashboardPage";
import AttendanceSchedule from "../Pages/Attendance/AttendanceSchedule";
import AttendanceMissedPunch from "../Pages/Attendance/AttendanceMissedPunch";
import AttendanceRecord from "../Pages/Attendance/Record/AttendanceRecord";
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
import AttendanceFormPage from "../Pages/Attendance/AttendanceForm/AttendanceFormPage";
import CompanyRegulations from "../Pages/CompanyRegulation/CompanyRegulation";
import CompanyAnnouncement from "../Pages/Announcement/Company/CompanyAnnouncement";
import LatestNews from "../Pages/LatestNews";
import OrderingSystem from "../Pages/OrderingSystem";
import ToDoList from "../Pages/ToDoList";
import StickyNotes from "../Pages/StickyNotes";
import Settings from "../Pages/Settings/Settings";
import MenuShortcuts from "../Pages/Settings/MenuShortcut";
import RequireAuth from "./RequireAuth";

function PlaceholderPage({ title }) {
  return <div style={{ padding: "24px" }}>{title}</div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/account" element={<AccountLayout title="account" />} />

        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/payroll/:payrollId" element={<PayrollDetail />} />

        <Route path="/regulation" element={<CompanyRegulations />} />

        <Route path="/announcement" element={<CompanyAnnouncement />} />

        <Route path="/latest-news" element={<LatestNews />} />

        <Route path="/ordering-system" element={<OrderingSystem />} />

        <Route path="/to-do-list" element={<ToDoList />} />

        <Route path="/sticky-note" element={<StickyNotes />} />

        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/menu-shortcuts" element={<MenuShortcuts />} />

        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />

        <Route path="/attendance" element={<AttendanceLayout />} />
        <Route path="/attendance/clock" element={<Absent />} />
        <Route path="/attendance/schedule" element={<AttendanceSchedule />} />
        <Route path="/attendance/missed-punch" element={<AttendanceMissedPunch />} />
        <Route path="/attendance/record" element={<AttendanceRecord />} />
        <Route path="/attendance/special-leave" element={<AttendanceSpecialLeave />} />
        <Route path="/attendance/leave" element={<AttendanceLeave />} />
        <Route path="/attendance/overtime" element={<AttendanceOvertime />} />
        <Route path="/attendance/form-record" element={<AttendanceFormPage />} />
        <Route path="/attendance/leave-balance" element={<AttendanceLeaveBalance />} />
        <Route path="/attendance/pending-approval" element={<AttendancePendingApproval />} />
        <Route path="/attendance/business-trip" element={<AttendanceBusinessTrip />} />

        <Route
          path="/attendance/admin/staff-attendance"
          element={<PlaceholderPage title="人員出勤" />}
        />
        <Route
          path="/attendance/admin/shift-approval"
          element={<PlaceholderPage title="班表審核" />}
        />
        <Route
          path="/attendance/admin/shift-manager-setting"
          element={<PlaceholderPage title="單位排班管理員設定" />}
        />
        <Route
          path="/attendance/admin/report-center"
          element={<PlaceholderPage title="報表中心" />}
        />
        <Route
          path="/attendance/admin/record-maintenance"
          element={<PlaceholderPage title="打卡紀錄維護" />}
        />
        <Route
          path="/attendance/admin/form-management"
          element={<PlaceholderPage title="表單紀錄管理" />}
        />
        <Route
          path="/attendance/admin/leave-hours-management"
          element={<PlaceholderPage title="假別時數管理" />}
        />
        <Route
          path="/attendance/admin/payroll-work"
          element={<PlaceholderPage title="結算作業" />}
        />
        <Route
          path="/attendance/admin/module-setting"
          element={<PlaceholderPage title="模組設定" />}
        />
        <Route
          path="/attendance/admin/personnel-basic"
          element={<PlaceholderPage title="人員基本資料" />}
        />
        <Route
          path="/attendance/admin/manager-report-center"
          element={<PlaceholderPage title="報表中心" />}
        />
        <Route
          path="/attendance/admin/shift-import"
          element={<PlaceholderPage title="班表匯入" />}
        />
      </Route>
    </Routes>
  );
}