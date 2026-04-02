import { useMemo, useState } from "react";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import { UNIT_OPTIONS, EMPLOYEE_OPTIONS } from "./Options";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "signing", label: "簽核中" },
  { value: "returned", label: "已駁回" },
  { value: "approved", label: "已核准" },
  { value: "cancel-signing", label: "撤銷簽核中" },
  { value: "cancelled", label: "已撤銷" },
];

export default function BusinessTrip() {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();

  const yearOptions = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => String(currentYear - 3 + index));
  }, [currentYear]);

  const [year, setYear] = useState(String(currentYear));
  const [unit, setUnit] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("all");

  const handleClear = () => {
    setYear(String(currentYear));
    setUnit("");
    setEmployee("");
    setStatus("all");
  };

  const selectMenuProps = {
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
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          mb: "14px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Typography sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}>
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
                minWidth: "82px",
                height: "32px",
                fontSize: "15px",
                bgcolor: "#ffffff",
                "& .MuiSelect-select": { py: "4px" },
              }}
            >
              {yearOptions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Typography sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}>
              單位
            </Typography>

            <Select
              size="small"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              displayEmpty
              MenuProps={selectMenuProps}
              sx={{
                minWidth: "186px",
                height: "32px",
                fontSize: "15px",
                bgcolor: "#ffffff",
                "& .MuiSelect-select": { py: "4px" },
              }}
            >
              {UNIT_OPTIONS.map((item) => (
                <MenuItem key={item.label} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Typography sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}>
              工號/姓名
            </Typography>

            <Select
              size="small"
              value={employee}
              onChange={(event) => setEmployee(event.target.value)}
              displayEmpty
              MenuProps={selectMenuProps}
              sx={{
                minWidth: "186px",
                height: "32px",
                fontSize: "15px",
                bgcolor: "#ffffff",
                "& .MuiSelect-select": { py: "4px" },
              }}
            >
              {EMPLOYEE_OPTIONS.map((item) => (
                <MenuItem key={item.label} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
            pb: "10px",
            borderBottom: "1px solid #d1d5db",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Typography sx={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}>
              狀態
            </Typography>

            <Select
              size="small"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              MenuProps={selectMenuProps}
              sx={{
                minWidth: "200px",
                height: "32px",
                fontSize: "15px",
                bgcolor: "#ffffff",
                "& .MuiSelect-select": { py: "4px" },
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
      </Box>

      <Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "11% 16% 16% 20% 16% 11% 10%",
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
            minHeight: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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