import { useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "cancelling", label: "簽核中" },
  { value: "returned", label: "已駁回" },
  { value: "overtime-returned", label: "加班確認已駁回" },
  { value: "pending-confirm", label: "待確認" },
  { value: "pending-cancel-confirm", label: "核准待確認" },
  { value: "approved", label: "已核准" },
  { value: "cancel-signing", label: "撤銷簽核中" },
  { value: "cancelled", label: "已撤銷" },
];

const MOCK_ROWS = [
  {
    id: 1,
    applyDate: "2026/01/16",
    applicant: "許明城",
    dateTime: "2026/01/12 18:00 -\n2026/01/12 18:30",
    overtimeType: "平日",
    paymentMethod: "加班費",
    overtimeHours: "0 時 30 分",
    status: "已核准",
  },
];

const ROWS_PER_PAGE_OPTIONS = [10, 20, 30, 50];

export default function OvertimeRecord() {
  const now = useMemo(() => new Date(), []);
  const currentYear = String(now.getFullYear());

  const yearOptions = useMemo(() => {
    const baseYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, index) => String(baseYear - 2 + index));
  }, [now]);

  const [year, setYear] = useState(currentYear);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredRows = useMemo(() => {
    if (status === "all") return MOCK_ROWS;

    const statusMap = {
      cancelling: "簽核中",
      returned: "已駁回",
      "overtime-returned": "加班確認已駁回",
      "pending-confirm": "待確認",
      "pending-cancel-confirm": "核准待確認",
      approved: "已核准",
      "cancel-signing": "撤銷簽核中",
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
    setRowsPerPage(10);
    setPage(1);
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
            minWidth: "76px",
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
          onClick={handleSearch}
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
            minHeight: "40px",
            bgcolor: "#2f2f2f",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            px: "16px",
          }}
        >
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            待確認筆數：0 筆
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "12% 17% 17% 10% 14% 15% 15%",
            minHeight: "40px",
            alignItems: "center",
            bgcolor: "#d4d4d4",
            px: "10px",
          }}
        >
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            申請日期
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            申請人
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            日期/時間
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            加班類型
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            給付方式
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            加班時數
          </Typography>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            狀態
          </Typography>
        </Box>

        {pagedRows.map((row) => (
          <Box
            key={row.id}
            sx={{
              display: "grid",
              gridTemplateColumns: "12% 17% 17% 10% 14% 15% 15%",
              px: "10px",
              py: "14px",
              borderBottom: "1px solid #d1d5db",
              alignItems: "start",
            }}
          >
            <Typography sx={{ fontSize: "15px", color: "#111827" }}>
              {row.applyDate}
            </Typography>

            <Typography sx={{ fontSize: "15px", color: "#111827" }}>
              {row.applicant}
            </Typography>

            <Typography
              sx={{
                fontSize: "15px",
                color: "#111827",
                whiteSpace: "pre-line",
                lineHeight: 1.5,
              }}
            >
              {row.dateTime}
            </Typography>

            <Typography sx={{ fontSize: "15px", color: "#111827" }}>
              {row.overtimeType}
            </Typography>

            <Typography sx={{ fontSize: "15px", color: "#111827" }}>
              {row.paymentMethod}
            </Typography>

            <Typography sx={{ fontSize: "15px", color: "#111827" }}>
              {row.overtimeHours}
            </Typography>

            <Typography sx={{ fontSize: "15px", color: "#111827" }}>
              {row.status}
            </Typography>
          </Box>
        ))}

        {pagedRows.length === 0 && (
          <Box
            sx={{
              px: "10px",
              py: "16px",
              borderBottom: "1px solid #d1d5db",
            }}
          >
            <Typography sx={{ fontSize: "15px", color: "#111827" }}>
              查無資料
            </Typography>
          </Box>
        )}
      </Box>

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
              color: "#b9b9b9",
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
              color: "#b9b9b9",
            }}
          >
            <KeyboardArrowLeftIcon sx={{ fontSize: "18px" }} />
          </Button>

          <Box
            sx={{
              width: "68px",
              height: "32px",
              border: "1px solid #d1d5db",
              display: "flex",
              alignItems: "center",
              px: "12px",
              fontSize: "15px",
              color: "#b9b9b9",
              bgcolor: "#f8f8f8",
            }}
          >
            {safePage}
          </Box>

          <Typography sx={{ fontSize: "15px", color: "#111827", fontWeight: 700 }}>
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
              color: "#b9b9b9",
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
              color: "#b9b9b9",
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
            {ROWS_PER_PAGE_OPTIONS.map((item) => (
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