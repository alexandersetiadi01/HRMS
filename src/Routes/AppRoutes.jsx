import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../Layouts/MainLayout";
import AttendanceLayout from "../Layouts/AttendanceLayout";
import HomePage from "../Pages/HomePage";
import LoginPage from "../Pages/LoginPages";
import AdminDashboardPage from "../Pages/AdminDashboardPage";
import AttendanceSchedule from "../Pages/Attendance/AttendanceSchedule";
import AttendanceMissedPunch from "../Pages/Attendance/AttendanceMissedPunch";
import AttendanceRecord from "../Pages/Attendance/Record/AttendanceRecord";
import AttendanceSpecialLeave from "../Pages/Attendance/SpecialLeave/AttendanceSpecialLeave";
import AttendanceLeave from "../Pages/Attendance/Leave/AttendanceLeave";
import AttendanceOvertime from "../Pages/Attendance/Overtime/AttendanceOverTime";
import AttendanceLeaveBalance from "../Pages/Attendance/AttendanceLeaveBalance";
import AttendancePendingApproval from "../Pages/Attendance/PendingApproval/AttendancePendingApproval";
import Absent from "../Pages/Attendance/Absent";
import AttendanceBusinessTrip from "../Pages/Attendance/AttendanceBusinessTrip";
import AccountLayout from "../Layouts/AccountLayout";
import PayrollPage from "../Pages/Payroll/PayrollPage";
import PayrollDetail from "../Pages/Payroll/PayrollDetail";
import PayrollManagement from "../Pages/PayrollManagement/PayrollManagement";
import PayrollWorkspaceLayout from "../Pages/PayrollManagement/PayrollWorkspaceLayout";
import { PayrollUnavailableModule } from "../Pages/PayrollManagement/PayrollModulePlaceholder";
import PayrollRangesPage from "../Pages/PayrollManagement/PayrollRangesPage";
import PayrollPeriodsPage from "../Pages/PayrollManagement/PayrollPeriodsPage";
import PayrollItemsPage from "../Pages/PayrollManagement/PayrollItemsPage";
import PayrollOvertimeTaxPage from "../Pages/PayrollManagement/PayrollOvertimeTaxPage";
import PayrollSalaryBanksPage from "../Pages/PayrollManagement/PayrollSalaryBanksPage";
import AttendanceFormPage from "../Pages/Attendance/AttendanceForm/AttendanceFormPage";
import CompanyRegulations from "../Pages/CompanyRegulation/CompanyRegulation";
import CompanyAnnouncement from "../Pages/Announcement/Company/CompanyAnnouncement";
import LatestNews from "../Pages/LatestNews";
import OrderingSystem from "../Pages/OrderSystem/OrderingSystem";
import ToDoList from "../Pages/Task/ToDoList";
import StickyNotes from "../Pages/StickyNote/StickyNotes";
import Settings from "../Pages/Settings/Settings";
import MenuShortcuts from "../Pages/Settings/MenuShortcut";
import RequireAuth from "./RequireAuth";
import RequirePayrollAdmin from "./RequirePayrollAdmin";
import RequirePayrollPermission, {
  PayrollDefaultRedirect,
} from "./RequirePayrollPermission";
import PayrollHourlyFormulaPage from "../Pages/PayrollManagement/PayrollHourlyFormulaPage";
import PayrollInsuranceUnitsPage from "../Pages/PayrollManagement/PayrollInsuranceUnitPage";
import PayrollInsuranceGradesPage from "../Pages/PayrollManagement/PayrollInsuranceGradesPage";
import PayrollInsuranceRatesPage from "../Pages/PayrollManagement/PayrollInsuranceRatesPage";
import PayrollInsuranceIdentitiesPage from "../Pages/PayrollManagement/PayrollInsuranceIdentitiesPage";
import PayrollTaxDeclarationUnitsPage from "../Pages/PayrollManagement/PayrollTaxDeclarationUnitsPage";
import PayrollTaxParametersPage from "../Pages/PayrollManagement/PayrollTaxParametersPage";
import PayrollPermissionsPage from "../Pages/PayrollManagement/PayrollPermissionsPage";
import PayrollBulkAdjustmentPage from "../Pages/PayrollManagement/PayrollBulkAdjustmentPage";
import PayrollAdjustmentHistoryPage from "../Pages/PayrollManagement/PayrollAdjustmentHistoryPage";
import PayrollEmployeeDataPage from "../Pages/PayrollManagement/PayrollEmployeeDataPage";
import PayrollWithholdingOperationsPage from "../Pages/PayrollManagement/PayrollWithholdingOperationsPage";

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

        <Route
          path="/dashboard"
          element={<PlaceholderPage title="Dashboard" />}
        />

        <Route path="/attendance" element={<AttendanceLayout />} />
        <Route path="/attendance/clock" element={<Absent />} />
        <Route path="/attendance/schedule" element={<AttendanceSchedule />} />
        <Route
          path="/attendance/missed-punch"
          element={<AttendanceMissedPunch />}
        />
        <Route path="/attendance/record" element={<AttendanceRecord />} />
        <Route
          path="/attendance/special-leave"
          element={<AttendanceSpecialLeave />}
        />
        <Route path="/attendance/leave" element={<AttendanceLeave />} />
        <Route path="/attendance/overtime" element={<AttendanceOvertime />} />
        <Route
          path="/attendance/form-record"
          element={<AttendanceFormPage />}
        />
        <Route
          path="/attendance/leave-balance"
          element={<AttendanceLeaveBalance />}
        />
        <Route
          path="/attendance/pending-approval"
          element={<AttendancePendingApproval />}
        />
        <Route
          path="/attendance/business-trip"
          element={<AttendanceBusinessTrip />}
        />

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
          element={
            <RequirePayrollAdmin>
              <PayrollDefaultRedirect />
            </RequirePayrollAdmin>
          }
        />

        <Route
          path="/attendance/admin/payroll"
          element={
            <RequirePayrollAdmin>
              <PayrollWorkspaceLayout />
            </RequirePayrollAdmin>
          }
        >
          <Route
            index
            element={
              <PayrollDefaultRedirect />
            }
          />

          <Route
            path="operations/salary"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_view",
                  "payroll_calculate",
                  "payroll_approve",
                  "payroll_close",
                  "payroll_mark_paid",
                ]}
              >
                <PayrollManagement />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/ranges"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_settings_manage",
                ]}
              >
                <PayrollRangesPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/periods"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_settings_manage",
                ]}
              >
                <PayrollPeriodsPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/items"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_settings_manage",
                ]}
              >
                <PayrollItemsPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/overtime-tax"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_settings_manage",
                ]}
              >
                <PayrollOvertimeTaxPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/hourly-formula"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_settings_manage",
                ]}
              >
                <PayrollHourlyFormulaPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/banks"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_settings_manage",
                ]}
              >
                <PayrollSalaryBanksPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/insurance-units"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_tax_insurance_manage",
                ]}
              >
                <PayrollInsuranceUnitsPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/insurance-grades"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_tax_insurance_manage",
                ]}
              >
                <PayrollInsuranceGradesPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/insurance-rates"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_tax_insurance_manage",
                ]}
              >
                <PayrollInsuranceRatesPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/insurance-identities"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_tax_insurance_manage",
                ]}
              >
                <PayrollInsuranceIdentitiesPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/tax-units"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_tax_insurance_manage",
                ]}
              >
                <PayrollTaxDeclarationUnitsPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/tax-parameters"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_tax_insurance_manage",
                ]}
              >
                <PayrollTaxParametersPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="settings/permissions"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_permissions_manage",
                ]}
              >
                <PayrollPermissionsPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="employee-data/settings"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_settings_manage",
                  "payroll_tax_insurance_manage",
                ]}
              >
                <PayrollEmployeeDataPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="employee-data/bulk-adjustment"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_settings_manage",
                ]}
              >
                <PayrollBulkAdjustmentPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="employee-data/adjustment-history"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_settings_manage",
                ]}
              >
                <PayrollAdjustmentHistoryPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="tax/withholding"
            element={
              <RequirePayrollPermission
                permissions={[
                  "payroll_tax_insurance_manage",
                ]}
              >
                <PayrollWithholdingOperationsPage />
              </RequirePayrollPermission>
            }
          />

          <Route
            path="*"
            element={
              <PayrollUnavailableModule />
            }
          />
        </Route>
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
