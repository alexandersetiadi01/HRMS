import { useMemo, useState } from "react";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import { MobileSectionTitle } from "./ApplicationRecord/SharedFields";
import ResponsiveAttendanceTable from "./ResponsiveAttendanceTable";

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
  {
    key: "dateTime",
    label: "日期/時間",
    width: "20%",
    desktopWhiteSpace: "pre-line",
    mobileWhiteSpace: "pre-line",
  },
  { key: "type", label: "類型", width: "10%" },
  { key: "location", label: "地點", width: "16%" },
  { key: "status", label: "狀態", width: "12%" },
];

// ✅ Mock data added
const MOCK_ROWS = [
  {
    id: 1,
    applyDate: "2026/04/02",
    applicant: "許明城",
    maintainType: "忘打卡",
    dateTime: "2026/04/01 09:00",
    type: "上班",
    location: "台北辦公室",
    status: "已核准",
  },
];

export default function CheckInRecord() {
  const now = useMemo(() => new Date(), []);
  const initialYear = String(now.getFullYear());
  const initialMonth = String(now.getMonth() + 1);

  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, index) =>
      String(currentYear - 2 + index)
    );
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
      <MobileSectionTitle>打卡紀錄管理</MobileSectionTitle>

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

      <ResponsiveAttendanceTable
        columns={TABLE_COLUMNS}
        rows={MOCK_ROWS} // ✅ use mock data
        mobileCardTitleKey="applyDate"
        getRowKey={(row) => row.id}
      />
    </Box>
  );
}