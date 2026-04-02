import { useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

const CHECKIN_TYPES = [
  { value: "", label: "請選擇" },
  { value: "all", label: "全部" },
  { value: "missed", label: "忘打卡申請" },
  { value: "Accidental-deletion", label: "誤打卡刪除" },
  { value: "make-up", label: "打卡補登" },
];

const TABLE_COLUMNS = [
  { key: "applyDate", label: "申請日期", width: "15%" },
  { key: "applicant", label: "申請人", width: "15%" },
  { key: "maintainType", label: "維護類型", width: "12%" },
  { key: "dateTime", label: "日期/時間", width: "20%" },
  { key: "type", label: "類型", width: "10%" },
  { key: "location", label: "地點", width: "16%" },
  { key: "status", label: "狀態", width: "12%" },
];

export default function CheckInRecord() {
  const now = useMemo(() => new Date(), []);
  const initialYear = String(now.getFullYear());
  const initialMonth = String(now.getMonth() + 1);

  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, index) => String(currentYear - 2 + index));
  }, [now]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => String(index + 1));
  }, []);

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [type, setType] = useState("");

  const handleClear = () => {
    setYear(initialYear);
    setMonth(initialMonth);
    setType("");
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
          mb: "18px",
        }}
      >
        <Typography sx={{ fontSize: "15px", color: "#111827" }}>
          年度/月份
        </Typography>

        <Select
          size="small"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          displayEmpty
          sx={{
            minWidth: "76px",
            height: "32px",
            fontSize: "15px",
            bgcolor: "#ffffff",
          }}
        >
          {yearOptions.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>

        <Typography sx={{ fontSize: "18px", color: "#6b7280" }}>/</Typography>

        <Select
          size="small"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          displayEmpty
          sx={{
            minWidth: "62px",
            height: "32px",
            fontSize: "15px",
            bgcolor: "#ffffff",
          }}
        >
          {monthOptions.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>

        <Typography
          sx={{
            ml: { xs: 0, md: "14px" },
            fontSize: "15px",
            color: "#111827",
          }}
        >
          維護類型
        </Typography>

        <Select
          size="small"
          value={type}
          onChange={(event) => setType(event.target.value)}
          displayEmpty
          sx={{
            minWidth: "200px",
            height: "32px",
            fontSize: "15px",
            bgcolor: "#ffffff",
          }}
        >
          {CHECKIN_TYPES.map((item) => (
            <MenuItem key={item.value || "empty"} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Select>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          sx={{
            minWidth: "48px",
            height: "32px",
            px: "14px",
            fontSize: "15px",
            color: "#111827",
            borderColor: "#9ca3af",
          }}
        >
          搜尋
        </Button>

        <Button
          variant="outlined"
          onClick={handleClear}
          sx={{
            minWidth: "48px",
            height: "32px",
            px: "14px",
            fontSize: "15px",
            color: "#111827",
            borderColor: "#9ca3af",
          }}
        >
          清空
        </Button>
      </Box>

      <Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "15% 15% 12% 20% 10% 16% 12%",
            bgcolor: "#d9d9d9",
            minHeight: "40px",
            alignItems: "center",
            px: "12px",
          }}
        >
          {TABLE_COLUMNS.map((column) => (
            <Typography
              key={column.key}
              sx={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {column.label}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            minHeight: "48px",
            display: "flex",
            alignItems: "center",
            px: "12px",
            borderBottom: "1px solid #d1d5db",
          }}
        >
          <Typography
            sx={{
              fontSize: "15px",
              color: "#3f3f46",
            }}
          >
            查無資料
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}