import { useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

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

export default function BusinessTripRecord() {
  const now = useMemo(() => new Date(), []);
  const currentYear = String(now.getFullYear());

  const yearOptions = useMemo(() => {
    const baseYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, index) => String(baseYear - 2 + index));
  }, [now]);

  const [year, setYear] = useState(currentYear);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const handleClear = () => {
    setYear(currentYear);
    setType("all");
    setStatus("all");
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          flexWrap: "wrap",
          mb: "16px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              minWidth: "92px",
              height: "32px",
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
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              minWidth: "190px",
              height: "32px",
              fontSize: "15px",
              bgcolor: "#ffffff",
              "& .MuiSelect-select": {
                py: "4px",
              },
            }}
          >
            {TYPE_OPTIONS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              minWidth: "190px",
              height: "32px",
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
        </Box>

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
            gridTemplateColumns: "11% 16% 16% 18% 16% 12% 11%",
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
            單位
          </Typography>

          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            申請人
          </Typography>

          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            日期/時間
          </Typography>

          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            總計
          </Typography>

          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            類型
          </Typography>

          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            狀態
          </Typography>
        </Box>

        <Box
          sx={{
            px: "12px",
            py: "12px",
            borderBottom: "1px solid #d1d5db",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "15px",
              color: "#111827",
            }}
          >
            查無資料
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}