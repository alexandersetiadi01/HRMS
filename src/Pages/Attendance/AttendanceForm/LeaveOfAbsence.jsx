import { useMemo, useState } from "react";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import ResponsiveAttendanceTable from "./ResponsiveAttendanceTable";
import {
  ACTION_BUTTON_SX,
  COMMON_SELECT_SX,
} from "./ApplicationRecord/Options";
import {
  FilterActions,
  MobileSectionTitle,
} from "./ApplicationRecord/SharedFields";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "signing", label: "簽核中" },
  { value: "returned", label: "已駁回" },
  { value: "approved", label: "已核准" },
  { value: "re-signing", label: "撤銷簽核中" },
  { value: "cancelled", label: "已撤銷" },
];

const MOCK_ROWS = [
  {
    id: 1,
    applyDate: "2026/01/16",
    applicant: "許明城",
    leaveType: "特休",
    dateTime: "2026/02/23 09:00 -\n2026/02/25 18:00",
    status: "已核准",
  },
  {
    id: 2,
    applyDate: "2026/01/16",
    applicant: "許明城",
    leaveType: "事假",
    dateTime: "2026/02/11 09:00 -\n2026/02/13 18:00",
    status: "已核准",
  },
];

const TABLE_COLUMNS = [
  { key: "applyDate", label: "申請日期", width: "15%" },
  { key: "applicant", label: "申請人", width: "24%" },
  { key: "leaveType", label: "假別", width: "24%" },
  {
    key: "dateTime",
    label: "日期/時間",
    width: "20%",
    desktopWhiteSpace: "pre-line",
    mobileWhiteSpace: "pre-line",
  },
  { key: "status", label: "狀態", width: "17%" },
];

const rowsPerPageOptions = [10, 20, 30, 50];

export default function LeaveOfAbsence() {
  const now = useMemo(() => new Date(), []);
  const currentYear = String(now.getFullYear());

  const yearOptions = useMemo(() => {
    const baseYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, index) =>
      String(baseYear - 2 + index)
    );
  }, [now]);

  const [year, setYear] = useState(currentYear);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredRows = useMemo(() => {
    if (status === "all") return MOCK_ROWS;

    const statusMap = {
      signing: "簽核中",
      returned: "已駁回",
      approved: "已核准",
      "re-signing": "撤銷簽核中",
      cancelled: "已撤銷",
    };

    return MOCK_ROWS.filter((row) => row.status === statusMap[status]);
  }, [status]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const pagedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);
  const displayFrom = totalRows === 0 ? 0 : startIndex + 1;
  const displayTo = Math.min(startIndex + rowsPerPage, totalRows);

  const handleSearch = () => {
    setPage(1);
  };

  const handleClear = () => {
    setYear(currentYear);
    setStatus("all");
    setPage(1);
    setRowsPerPage(10);
  };

  return (
    <Box>
      <MobileSectionTitle>請假紀錄</MobileSectionTitle>

      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          gap: "12px",
          flexWrap: "wrap",
          mb: "14px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: { xs: "8px", sm: "10px" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Typography
            sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}
          >
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
            gap: { xs: "8px", sm: "10px" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Typography
            sx={{
              ml: { xs: 0, sm: "12px" },
              fontSize: "15px",
              color: "#111827",
              fontWeight: 500,
            }}
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
                  borderRadius: 0,
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
            {STATUS_OPTIONS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <FilterActions>
          <Button variant="outlined" onClick={handleSearch} sx={ACTION_BUTTON_SX}>
            搜尋
          </Button>

          <Button variant="outlined" onClick={handleClear} sx={ACTION_BUTTON_SX}>
            清空
          </Button>
        </FilterActions>
      </Box>

      <ResponsiveAttendanceTable
        columns={TABLE_COLUMNS}
        rows={pagedRows}
        mobileCardTitleKey="applyDate"
        getRowKey={(row) => row.id}
      />

      <Box
        sx={{
          mt: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            variant="outlined"
            disabled={safePage === 1}
            sx={{
              minWidth: "32px",
              width: "32px",
              height: "32px",
              p: 0,
              borderColor: "#d1d5db",
              color: "#9ca3af",
            }}
          >
            <KeyboardDoubleArrowLeftIcon sx={{ fontSize: "18px" }} />
          </Button>

          <Button
            variant="outlined"
            disabled={safePage === 1}
            sx={{
              minWidth: "32px",
              width: "32px",
              height: "32px",
              p: 0,
              borderColor: "#d1d5db",
              color: "#9ca3af",
            }}
          >
            <KeyboardArrowLeftIcon sx={{ fontSize: "18px" }} />
          </Button>

          <Box
            sx={{
              width: "70px",
              height: "32px",
              border: "1px solid #d1d5db",
              display: "flex",
              alignItems: "center",
              px: "10px",
              fontSize: "15px",
              color: "#9ca3af",
              bgcolor: "#f8f8f8",
            }}
          >
            {safePage}
          </Box>

          <Typography
            sx={{ fontSize: "15px", color: "#111827", fontWeight: 700 }}
          >
            / 1
          </Typography>

          <Button
            variant="outlined"
            disabled
            sx={{
              minWidth: "32px",
              width: "32px",
              height: "32px",
              p: 0,
              borderColor: "#d1d5db",
              color: "#9ca3af",
            }}
          >
            <KeyboardArrowRightIcon sx={{ fontSize: "18px" }} />
          </Button>

          <Button
            variant="outlined"
            disabled
            sx={{
              minWidth: "32px",
              width: "32px",
              height: "32px",
              p: 0,
              borderColor: "#d1d5db",
              color: "#9ca3af",
            }}
          >
            <KeyboardDoubleArrowRightIcon sx={{ fontSize: "18px" }} />
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(1);
            }}
            sx={{
              width: "70px",
              height: "32px",
              fontSize: "15px",
              bgcolor: "#ffffff",
              "& .MuiSelect-select": {
                py: "4px",
              },
            }}
          >
            {rowsPerPageOptions.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>

          <Typography sx={{ fontSize: "15px", color: "#111827" }}>
            {displayFrom}-{displayTo} / {totalRows}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}