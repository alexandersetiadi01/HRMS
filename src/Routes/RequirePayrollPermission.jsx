import {
  Alert,
  Box,
  Button,
  Paper,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { getStoredAuthUser } from "../API/auth";
import {
  hasAnyPayrollPermission,
  hasPayrollOverride,
} from "../Utils/PayrollPermissions";

const PAYROLL_DEFAULT_ROUTES = [
  {
    permissions: [
      "payroll_view",
      "payroll_calculate",
      "payroll_approve",
      "payroll_close",
      "payroll_mark_paid",
    ],
    path:
      "/attendance/admin/payroll/operations/salary",
  },
  {
    permissions: [
      "payroll_settings_manage",
    ],
    path:
      "/attendance/admin/payroll/settings/ranges",
  },
  {
    permissions: [
      "payroll_tax_insurance_manage",
    ],
    path:
      "/attendance/admin/payroll/settings/insurance-units",
  },
  {
    permissions: [
      "payroll_permissions_manage",
    ],
    path:
      "/attendance/admin/payroll/settings/permissions",
  },
  {
    permissions: [
      "payroll_reports_view",
    ],
    path:
      "/attendance/admin/payroll/reports/report-center",
  },
];

export function PayrollDefaultRedirect() {
  const authUser = getStoredAuthUser();

  if (hasPayrollOverride(authUser)) {
    return (
      <Navigate
        to="/attendance/admin/payroll/operations/salary"
        replace
      />
    );
  }

  const matchedRoute =
    PAYROLL_DEFAULT_ROUTES.find(
      (route) =>
        hasAnyPayrollPermission(
          authUser,
          route.permissions,
        ),
    );

  if (!matchedRoute) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return (
    <Navigate
      to={matchedRoute.path}
      replace
    />
  );
}

export default function RequirePayrollPermission({
  permissions = [],
  children,
}) {
  const navigate = useNavigate();
  const authUser = getStoredAuthUser();

  const allowed =
    hasAnyPayrollPermission(
      authUser,
      permissions,
    );

  if (allowed) {
    return children;
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "720px",
        mx: "auto",
        px: {
          xs: "16px",
          sm: "24px",
        },
        py: {
          xs: "24px",
          sm: "40px",
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: {
            xs: "20px",
            sm: "28px",
          },
          borderColor: "#e2e8f0",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            mb: "16px",
          }}
        >
          <LockOutlinedIcon
            sx={{
              color: "#dc2626",
            }}
          />

          <Typography
            component="h1"
            sx={{
              color: "#1e293b",
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            無此薪資功能權限
          </Typography>
        </Box>

        <Alert
          severity="error"
          sx={{
            mb: "20px",
          }}
        >
          目前帳號沒有使用此薪資功能的權限。如需存取，請聯絡系統管理員。
        </Alert>

        <Button
          variant="contained"
          onClick={() =>
            navigate(
              "/attendance/admin/payroll",
              {
                replace: true,
              },
            )
          }
        >
          返回薪資管理
        </Button>
      </Paper>
    </Box>
  );
}