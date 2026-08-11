import { useState } from "react";
import {
  Box,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import LeaveRulesTab from "./LeaveRulesTab";

const RULE_TABS = [
  { value: "leave", label: "假別規則" },
  { value: "clock", label: "打卡規則" },
  { value: "overtime", label: "加班規則" },
  { value: "schedule", label: "排班規則" },
  { value: "outing", label: "公出規則" },
  { value: "business-trip", label: "出差規則" },
];

export default function AttendanceRulesTab() {
  const [activeRule, setActiveRule] = useState("leave");

  return (
    <Box>
      <Box sx={{ mb: "18px" }}>
        <Typography
          sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
        >
          出勤規則設定
        </Typography>

        <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
          管理 Attendance 各項出勤功能的規則設定
        </Typography>
      </Box>

      <Box
        sx={{
          mb: "18px",
          overflowX: "auto",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Tabs
          value={activeRule}
          onChange={(_event, value) => setActiveRule(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: "44px",
            "& .MuiTab-root": {
              minHeight: "44px",
              minWidth: { xs: "110px", sm: "130px" },
              px: { xs: 1.5, sm: 2 },
              fontSize: { xs: "14px", sm: "15px" },
              fontWeight: 700,
            },
          }}
        >
          {RULE_TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {activeRule === "leave" ? (
        <LeaveRulesTab />
      ) : null}

      {activeRule === "clock" ? (
        <Box>
          <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
            打卡規則
          </Typography>

          <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
            Attendance 打卡相關規則設定
          </Typography>
        </Box>
      ) : null}

      {activeRule === "overtime" ? (
        <Box>
          <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
            加班規則
          </Typography>

          <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
            Attendance 加班申請及時數規則設定
          </Typography>
        </Box>
      ) : null}

      {activeRule === "schedule" ? (
        <Box>
          <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
            排班規則
          </Typography>

          <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
            Attendance 排班及班表相關規則設定
          </Typography>
        </Box>
      ) : null}

      {activeRule === "outing" ? (
        <Box>
          <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
            公出規則
          </Typography>

          <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
            Attendance 公出申請相關規則設定
          </Typography>
        </Box>
      ) : null}

      {activeRule === "business-trip" ? (
        <Box>
          <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
            出差規則
          </Typography>

          <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
            Attendance 出差申請相關規則設定
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}