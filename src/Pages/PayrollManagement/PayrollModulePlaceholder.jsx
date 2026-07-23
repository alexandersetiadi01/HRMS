import { Alert, Box, Typography } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { findPayrollNavigationItem } from "./PayrollNavigation";

export default function PayrollModulePlaceholder({
  title,
  description,
}) {
  return (
    <Box
      sx={{
        minHeight: "280px",
        p: { xs: "16px", sm: "22px" },
        border: "1px solid #dfe4e8",
        borderRadius: "5px",
        bgcolor: "#ffffff",
      }}
    >
      <Typography
        sx={{
          color: "#111827",
          fontSize: { xs: "18px", sm: "20px" },
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: "5px",
          mb: "20px",
          color: "#7b8794",
          fontSize: "13px",
        }}
      >
        {description}
      </Typography>

      <Alert severity="info">
        此功能頁已加入薪資管理架構，將在對應的後端資料與 REST API
        完成後啟用。
      </Alert>
    </Box>
  );
}

export function PayrollUnavailableModule() {
  const location = useLocation();
  const current = findPayrollNavigationItem(location.pathname);

  if (!current) {
    return (
      <Navigate
        to="/attendance/admin/payroll/operations/salary"
        replace
      />
    );
  }

  return (
    <PayrollModulePlaceholder
      title={current.item.label}
      description={`${current.section.label}中的「${current.item.label}」功能`}
    />
  );
}