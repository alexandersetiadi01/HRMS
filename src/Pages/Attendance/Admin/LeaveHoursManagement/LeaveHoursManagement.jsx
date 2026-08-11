import { useState } from "react";
import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import EntitlementRequestsTab from "./EntitlementRequestsTab";
import LeaveBalancesTab from "./LeaveBalancesTab";

const TABS = [
  { value: "requests", label: "特殊假別申請" },
  { value: "balances", label: "剩餘假別時數" },
];

export default function LeaveHoursManagement() {
  const [activeTab, setActiveTab] = useState("requests");

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
            onChange={(_event, value) => setActiveTab(value)}
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