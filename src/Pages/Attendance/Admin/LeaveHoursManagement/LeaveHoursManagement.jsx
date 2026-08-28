import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import EntitlementRequestsTab from "./EntitlementRequestsTab";
import LeaveBalancesTab from "./LeaveBalancesTab";

const LEAVE_HOURS_BASE = "/attendance/admin/leave-hours-management";

const TABS = [
  { value: "requests", label: "特殊假別申請" },
  { value: "balances", label: "剩餘假別時數" },
];

function getActiveTab(pathname) {
  const relativePath = pathname
    .replace(LEAVE_HOURS_BASE, "")
    .replace(/^\/+|\/+$/g, "");

  return TABS.some((tab) => tab.value === relativePath)
    ? relativePath
    : "requests";
}

export default function LeaveHoursManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = getActiveTab(location.pathname);

  useEffect(() => {
    const expectedPath = `${LEAVE_HOURS_BASE}/${activeTab}`;

    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [activeTab, location.pathname, navigate]);

  const handleTabChange = (_event, value) => {
    navigate(`${LEAVE_HOURS_BASE}/${value}`);
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, sm: 2.5, md: 3 } }}>
      <Breadcrumb
        rootLabel="管理者專區"
        rootTo="/attendance"
        currentLabel="假別時數管理"
        mb="14px"
      />

      <Typography
        component="h1"
        sx={{
          mb: 2,
          fontSize: { xs: "22px", sm: "25px", md: "28px" },
          fontWeight: 700,
          color: "#111827",
        }}
      >
        假別時數管理
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          overflow: "hidden",
          borderColor: "#d1d5db",
          borderRadius: "8px",
        }}
      >
        <Box sx={{ overflowX: "auto", borderBottom: "1px solid #e5e7eb" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: "48px",
              "& .MuiTab-root": {
                minHeight: "48px",
                minWidth: { xs: "130px", sm: "160px" },
                px: { xs: 1.5, sm: 2.5 },
                fontSize: { xs: "14px", sm: "15px", md: "16px" },
                fontWeight: 700,
              },
            }}
          >
            {TABS.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        {activeTab === "requests" && <EntitlementRequestsTab />}

        {activeTab === "balances" && <LeaveBalancesTab />}
      </Paper>
    </Box>
  );
}