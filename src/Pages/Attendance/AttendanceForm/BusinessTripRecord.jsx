import { useMemo, useState } from "react";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import {
  ACTION_BUTTON_SX,
  COMMON_SELECT_SX,
} from "./ApplicationRecord/Options";
import {
  FilterActions,
  MobileSectionTitle,
} from "./ApplicationRecord/SharedFields";
import ResponsiveAttendanceTable from "./ResponsiveAttendanceTable";

const TYPE_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "public-outing", label: "公出" },
  { value: "business-trip", label: "出差" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "signing", label: "簽核中" },
  { value: "returned", label: "已駁回" },
  { value: "approved", label: "已核准" },
  { value: "cancel-signing", label: "撤銷簽核中" },
  { value: "cancelled", label: "已撤銷" },
];

const TABLE_COLUMNS = [
  { key: "applyDate", label: "申請日期", width: "11%" },
  { key: "unit", label: "單位", width: "16%" },
  { key: "applicant", label: "申請人", width: "16%" },
  {
    key: "dateTime",
    label: "日期/時間",
    width: "18%",
    desktopWhiteSpace: "pre-line",
    mobileWhiteSpace: "pre-line",
  },
  { key: "total", label: "總計", width: "16%" },
  { key: "type", label: "類型", width: "12%" },
  { key: "status", label: "狀態", width: "11%" },
];

const MOCK_ROWS = [
  {
    id: 1,
    applyDate: "2026/04/03",
    unit: "業務部",
    applicant: "許明城",
    dateTime: "2026/04/05 09:00 -\n2026/04/05 12:00",
    total: "3 小時",
    type: "公出",
    status: "已核准",
  },
];

export default function BusinessTripRecord() {
  const now = useMemo(() => new Date(), []);
  const currentYear = String(now.getFullYear());

  const yearOptions = useMemo(() => {
    const baseYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, index) =>
      String(baseYear - 2 + index)
    );
  }, [now]);

  const [year, setYear] = useState(currentYear);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const filteredRows = useMemo(() => {
    return MOCK_ROWS.filter((row) => {
      const typeMap = {
        "public-outing": "公出",
        "business-trip": "出差",
      };

      const statusMap = {
        signing: "簽核中",
        returned: "已駁回",
        approved: "已核准",
        "cancel-signing": "撤銷簽核中",
        cancelled: "已撤銷",
      };

      const typeMatch = type === "all" || row.type === typeMap[type];
      const statusMatch = status === "all" || row.status === statusMap[status];

      return typeMatch && statusMatch;
    });
  }, [type, status]);

  const handleClear = () => {
    setYear(currentYear);
    setType("all");
    setStatus("all");
  };

  return (
    <Box>
      <MobileSectionTitle>公出/出差</MobileSectionTitle>

      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          gap: "18px",
          flexWrap: "wrap",
          mb: "16px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: "8px", sm: "8px" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Typography
            sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}
          >
            <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
              *
            </Box>
            年度
          </Typography>

          <Select
            size="small"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            sx={{
              minWidth: { xs: "100%", sm: "92px" },
              width: { xs: "100%", sm: "auto" },
              ...COMMON_SELECT_SX,
            }}
          >
            {yearOptions.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: "8px", sm: "8px" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Typography
            sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}
          >
            類型
          </Typography>

          <Select
            size="small"
            value={type}
            onChange={(event) => setType(event.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  mt: "2px",
                  borderRadius: "2px",
                  boxShadow: "none",
                  border: "1px solid #cfcfcf",
                  maxHeight: 220,
                  "& .MuiMenuItem-root": {
                    minHeight: "36px",
                    fontSize: "15px",
                    color: "#374151",
                  },
                  "& .Mui-selected": {
                    bgcolor: "#dbe5f1 !important",
                    color: "#111827",
                  },
                  "& .MuiMenuItem-root:hover": {
                    bgcolor: "#eef3f8",
                  },
                },
              },
            }}
            sx={{
              minWidth: { xs: "100%", sm: "190px" },
              width: { xs: "100%", sm: "auto" },
              ...COMMON_SELECT_SX,
            }}
          >
            {TYPE_OPTIONS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: "8px", sm: "8px" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Typography
            sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}
          >
            狀態
          </Typography>

          <Select
            size="small"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  mt: "2px",
                  borderRadius: "2px",
                  boxShadow: "none",
                  border: "1px solid #cfcfcf",
                  maxHeight: 260,
                  "& .MuiMenuItem-root": {
                    minHeight: "36px",
                    fontSize: "15px",
                    color: "#374151",
                  },
                  "& .Mui-selected": {
                    bgcolor: "#dbe5f1 !important",
                    color: "#111827",
                  },
                  "& .MuiMenuItem-root:hover": {
                    bgcolor: "#eef3f8",
                  },
                },
              },
            }}
            sx={{
              minWidth: { xs: "100%", sm: "190px" },
              width: { xs: "100%", sm: "auto" },
              ...COMMON_SELECT_SX,
            }}
          >
            {STATUS_OPTIONS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <FilterActions>
          <Button variant="outlined" sx={ACTION_BUTTON_SX}>
            搜尋
          </Button>

          <Button variant="outlined" onClick={handleClear} sx={ACTION_BUTTON_SX}>
            清空
          </Button>
        </FilterActions>
      </Box>

      <ResponsiveAttendanceTable
        columns={TABLE_COLUMNS}
        rows={filteredRows}
        mobileCardTitleKey="applyDate"
        getRowKey={(row) => row.id}
      />
    </Box>
  );
}