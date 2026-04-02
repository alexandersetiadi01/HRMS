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

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "applying", label: "申請中" },
  { value: "returned", label: "已退回" },
  { value: "confirmed", label: "已確認" },
];

const TABLE_COLUMNS = [
  { key: "applyDate", label: "申請日期", width: "15%" },
  { key: "applicant", label: "申請人", width: "22%" },
  { key: "leaveType", label: "假別", width: "21%" },
  { key: "attachment", label: "附件", width: "22%" },
  { key: "status", label: "狀態", width: "20%" },
];

const MOCK_ROWS = [
  {
    id: 1,
    applyDate: "2026/04/03",
    applicant: "許明城",
    leaveType: "家庭照顧假",
    attachment: "-",
    status: "已確認",
  },
];

export default function SpecialLeaveForm() {
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

  const filteredRows = useMemo(() => {
    if (status === "all") return MOCK_ROWS;

    const statusMap = {
      applying: "申請中",
      returned: "已退回",
      confirmed: "已確認",
    };

    return MOCK_ROWS.filter((row) => row.status === statusMap[status]);
  }, [status]);

  const handleClear = () => {
    setYear(currentYear);
    setStatus("all");
  };

  return (
    <Box>
      <MobileSectionTitle>特殊假別申請</MobileSectionTitle>

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
              minWidth: { xs: "100%", sm: "80px" },
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
              ml: { xs: 0, sm: "8px" },
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
              minWidth: { xs: "100%", sm: "150px" },
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