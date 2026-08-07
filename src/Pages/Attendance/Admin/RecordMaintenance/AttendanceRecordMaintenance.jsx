import { useState } from "react";
import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import Breadcrumb from "../../../../Utils/Breadcrumb";

import PunchRecordsTab from "./PunchRecordsTab";
import BulkPunchTab from "./BulkPunchTab";
import AttendanceAnomaliesTab from "./AttendanceAnomaliesTab";
import AbsenceTab from "./AbsenceTab";

const TABS = [
  { value: "records", label: "打卡紀錄" },
  { value: "bulk", label: "批次打卡" },
  { value: "anomalies", label: "出勤異常" },
  { value: "absence", label: "曠職" },
];

export default function AttendanceRecordMaintenance() {
  const [activeTab, setActiveTab] = useState("records");

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, sm: 2.5, md: 3 } }}>
      <Breadcrumb
        rootLabel="管理者專區"
        rootTo="/attendance"
        currentLabel="打卡紀錄維護"
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
        打卡紀錄維護
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
                minWidth: { xs: "110px", sm: "130px" },
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

        {activeTab === "records" && <PunchRecordsTab />}
        {activeTab === "bulk" && <BulkPunchTab />}
        {activeTab === "anomalies" && <AttendanceAnomaliesTab />}
        {activeTab === "absence" && <AbsenceTab />}
      </Paper>
    </Box>
  );
}