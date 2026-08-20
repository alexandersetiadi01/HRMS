import { Box, Typography } from "@mui/material";

import LeaveRulesTab from "./LeaveRulesTab";
import ClockRulesTab from "./ClockRulesTab";
import OvertimeRulesTab from "./OvertimeRulesTab";
import ScheduleRulesTab from "./ScheduleRulesTab";
import OutingRulesTab from "./OutingRulesTab";
import BusinessTripRulesTab from "./BusinessTripRulesTab";

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
        <OutingRulesTab />
      ) : null}

      {activeRule === "business-trip" ? (
        <BusinessTripRulesTab />
      ) : null}
    </Box>
  );
}