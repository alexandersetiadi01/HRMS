import { Box, Typography } from "@mui/material";

import LeaveRulesTab from "./LeaveRulesTab";
import ClockRulesTab from "./ClockRulesTab";
import OvertimeRulesTab from "./OvertimeRulesTab";
import ScheduleRulesTab from "./ScheduleRulesTab";

export default function AttendanceRulesTab({ activeRule = "leave" }) {
  return (
    <Box>
      {activeRule === "leave" ? (
        <LeaveRulesTab />
      ) : null}

      {activeRule === "clock" ? (
        <ClockRulesTab />
      ) : null}

      {activeRule === "overtime" ? (
        <OvertimeRulesTab />
      ) : null}

      {activeRule === "schedule" ? (
        <ScheduleRulesTab />
      ) : null}

      {activeRule === "outing" ? (
        <Box>
          <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
            公出規則
          </Typography>

          <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
            Attendance 公出申請相關規則設定
          </Typography>
        </Box>
      ) : null}

      {activeRule === "business-trip" ? (
        <Box>
          <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
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