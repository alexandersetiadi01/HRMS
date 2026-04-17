import { Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import { selectMenuProps } from "../../../Utils/Attendance/SharedForm";
import {
  formatBalanceMap,
  getLeaveMinimumText,
} from "./LeaveUtils";

export default function LeaveTypeRow({
  row,
  onChangeType,
  onRemove,
  leaveTypes,
  mobile,
  balanceMap,
  employeeId,
}) {
  const selectedType = leaveTypes.find(
    (item) => String(item.value) === String(row.leaveType),
  );

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
            {formatBalanceMap(balanceMap, row.leaveType, employeeId)}
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