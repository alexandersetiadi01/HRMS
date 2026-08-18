import { Box, Typography } from "@mui/material";

import LeaveRulesTab from "./LeaveRulesTab";
import ClockRulesTab from "./ClockRulesTab";

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
        <Box>
          <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
            加班規則
          </Typography>

          <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
            Attendance 加班申請及時數規則設定
          </Typography>
        </Box>
      ) : null}

      {activeRule === "schedule" ? (
        <Box>
          <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
            排班規則
          </Typography>

          <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
            Attendance 排班及班表相關規則設定
          </Typography>
        </Box>
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