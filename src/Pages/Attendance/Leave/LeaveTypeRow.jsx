import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { selectMenuProps } from "../../../Utils/Attendance/SharedForm";
import {
  formatBalanceMap,
  getLeaveMinimumText,
  safeText,
} from "./LeaveUtils";

function formatEntitlementInstanceText(instance) {
  if (!instance) {
    return "";
  }

  const validFrom = safeText(instance?.valid_from, "");
  const validTo = safeText(instance?.valid_to, "");

  const remainingHours = Number(instance?.remaining_hours);
  const remainingDays = Number(instance?.remaining_days);

  let remainingText = "";

  if (Number.isFinite(remainingHours) && remainingHours > 0) {
    const totalMinutes = Math.round(remainingHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    remainingText = `剩餘：${hours} 小時 ${minutes} 分`;
  } else if (Number.isFinite(remainingDays) && remainingDays > 0) {
    remainingText = `剩餘：${remainingDays} 天`;
  }

  const rangeText =
    validFrom && validTo
      ? `可用期間：${validFrom} ~ ${validTo}`
      : validFrom
        ? `可用期間：${validFrom} 起`
        : validTo
          ? `可用期間：至 ${validTo}`
          : "";

  return [remainingText, rangeText].filter(Boolean).join("，");
}

export default function LeaveTypeRow({
  row,
  onChangeType,
  onRemove,
  leaveTypes,
  mobile,
  balanceMap,
  employeeId,
  entitlementInstance = null,
  isSpecialLeave = false,
}) {
  const selectedType = leaveTypes.find(
    (item) => String(item.value) === String(row.leaveType),
  );

  const entitlementText = formatEntitlementInstanceText(entitlementInstance);
  const balanceText = isSpecialLeave
    ? entitlementText || "剩餘：-"
    : formatBalanceMap(balanceMap, row.leaveType, employeeId);

  return (
    <Box sx={{ mb: mobile ? "12px" : "10px", width: "100%", minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          width: "100%",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: "18px",
            minWidth: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mt: "10px",
          }}
        >
          <CancelIcon
            onClick={onRemove}
            sx={{
              color: "#7b7b7b",
              fontSize: "18px",
              cursor: "pointer",
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "8px",
              width: "100%",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <FormControl sx={{ width: "100%", minWidth: 0 }}>
              <Select
                displayEmpty
                value={row.leaveType}
                onChange={(e) => onChangeType(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{
                  height: "38px",
                  fontSize: "14px",
                }}
              >
                <MenuItem value="">請選擇假別</MenuItem>
                {leaveTypes.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Typography
            sx={{
              fontSize: "14px",
              color: "#1f3b67",
              mt: "8px",
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {balanceText}
          </Typography>

          <Typography
            sx={{
              fontSize: "12px",
              color: "#6b7280",
              lineHeight: 1.5,
              mt: "4px",
              wordBreak: "break-word",
            }}
          >
            {getLeaveMinimumText(selectedType?.raw)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}