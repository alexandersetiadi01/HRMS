import { useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "applying", label: "申請中" },
  { value: "returned", label: "已退回" },
  { value: "confirmed", label: "已確認" },
];

export default function SpecialLeaveForm() {
  const now = useMemo(() => new Date(), []);
  const currentYear = String(now.getFullYear());

  const yearOptions = useMemo(() => {
    const baseYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, index) => String(baseYear - 2 + index));
  }, [now]);

  const [year, setYear] = useState(currentYear);
  const [status, setStatus] = useState("all");

  const handleClear = () => {
    setYear(currentYear);
    setStatus("all");
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          mb: "14px",
        }}
      >
        <Typography sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}>
          年度
        </Typography>

        <Select
          size="small"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          sx={{
            minWidth: "80px",
            height: "30px",
            fontSize: "15px",
            bgcolor: "#ffffff",
            "& .MuiSelect-select": {
              py: "4px",
            },
          }}
        >
          {yearOptions.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>

        <Typography
          sx={{
            ml: "8px",
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
            minWidth: "150px",
            height: "30px",
            fontSize: "15px",
            bgcolor: "#ffffff",
            "& .MuiSelect-select": {
              py: "4px",
            },
          }}
        >
          {STATUS_OPTIONS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </Select>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          sx={{
            minWidth: "50px",
            height: "32px",
            px: "14px",
            borderColor: "#9ca3af",
            color: "#111827",
            fontSize: "15px",
            borderRadius: "4px",
          }}
        >
          搜尋
        </Button>

        <Button
          variant="outlined"
          onClick={handleClear}
          sx={{
            minWidth: "50px",
            height: "32px",
            px: "14px",
            borderColor: "#9ca3af",
            color: "#111827",
            fontSize: "15px",
            borderRadius: "4px",
          }}
        >
          清空
        </Button>
      </Box>

      <Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "15% 22% 21% 22% 20%",
            minHeight: "40px",
            alignItems: "center",
            bgcolor: "#d4d4d4",
            px: "12px",
          }}
        >
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            申請日期
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            申請人
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            假別
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            附件
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            狀態
          </Typography>
        </Box>

        <Box
          sx={{
            minHeight: "40px",
            display: "flex",
            alignItems: "center",
            px: "12px",
            borderBottom: "1px solid #d1d5db",
          }}
        >
          <Typography sx={{ fontSize: "15px", color: "#111827" }}>
            查無資料
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}