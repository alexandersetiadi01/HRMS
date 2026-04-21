import { useEffect, useMemo, useState } from "react";
import { Box, TextField, Typography } from "@mui/material";
import {
  apiGetPendingApprovalActor,
  apiOvertimeApplicationRecords,
} from "../../../API/attendance";
import {
  ActionButtons,
  FilterRow,
  SelectField,
  YearMonthField,
} from "./ApplicationRecord/SharedFields";

function getCurrentTaiwanYearMonth() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "2026";
  const month = parts.find((part) => part.type === "month")?.value || "01";

  return {
    year,
    month: String(Number(month)),
  };
}

function getErrorMessage(error, fallback = "載入資料失敗，請稍後再試。") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "pending", label: "待審核" },
  { value: "approved", label: "已核准" },
  { value: "rejected", label: "已駁回" },
];

const SEARCH_INPUT_SX = {
  width: { xs: "100%", sm: "180px" },
  "& .MuiOutlinedInput-root": {
    height: "32px",
    bgcolor: "#fff",
  },
  "& .MuiOutlinedInput-input": {
    py: "6px",
    px: "10px",
    fontSize: "14px",
  },
};

export default function OvertimeRecord() {
  const taiwanNow = useMemo(() => getCurrentTaiwanYearMonth(), []);
  const currentYear = Number(taiwanNow.year);

  const yearOptions = useMemo(() => {
    const baseYear = Number(currentYear);
    const years = [];
    for (let year = baseYear - 3; year <= baseYear + 1; year += 1) {
      years.push(String(year));
    }
    return years;
  }, [currentYear]);

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => String(index + 1)),
    [],
  );

  const [year, setYear] = useState(taiwanNow.year);
  const [month, setMonth] = useState(taiwanNow.month);
  const [status, setStatus] = useState("all");

  const [searchText, setSearchText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [actor, setActor] = useState(null);

  const isEmployeeOnly = !!actor?.is_employee_position;

  const filteredRows = useMemo(() => {
    if (!searchKeyword.trim()) {
      return rows;
    }

    const keyword = searchKeyword.trim().toLowerCase();

    return rows.filter((row) =>
      [
        row.request_date,
        row.applicant_name,
        row.overtime_type_label,
        row.datetime_text,
        row.requested_hours,
        row.reason,
        row.status_label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [rows, searchKeyword]);

  const loadData = async (nextYear, nextMonth, nextStatus) => {
    try {
      setLoading(true);
      setErrorText("");

      const [actorResponse, response] = await Promise.all([
        apiGetPendingApprovalActor(),
        apiOvertimeApplicationRecords({
          year: Number(nextYear),
          month: Number(nextMonth),
          request_status: nextStatus === "all" ? undefined : nextStatus,
        }),
      ]);

      const actorData =
        actorResponse?.data?.data || actorResponse?.data || actorResponse || {};
      setActor(actorData);

      const payload = response?.data?.data || response?.data || response || {};
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setRows(items);
    } catch (error) {
      console.error(error);
      setErrorText(getErrorMessage(error));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(year, month, status);
  }, [year, month, status]);

  const handleSearch = () => {
    setSearchKeyword(searchText.trim());
  };

  const handleClear = () => {
    setSearchText("");
    setSearchKeyword("");
  };

  return (
    <Box>
      <FilterRow withDivider>
        <YearMonthField
          year={year}
          onYearChange={setYear}
          yearOptions={yearOptions}
          month={month}
          onMonthChange={setMonth}
          monthOptions={monthOptions}
        />

        <SelectField
          label="狀態"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          minWidth="180px"
        />

        <Box
          sx={{
            ml: { xs: 0, sm: "auto" },
            width: { xs: "100%", sm: "auto" },
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <TextField
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="搜尋"
            size="small"
            sx={SEARCH_INPUT_SX}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <ActionButtons onClear={handleClear} onSearch={handleSearch} />
        </Box>
      </FilterRow>

      <Box sx={{ pt: "14px", overflowX: "auto" }}>
        <Box sx={{ minWidth: isEmployeeOnly ? "965px" : "1100px" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isEmployeeOnly
                ? "135px 160px 200px 100px 1fr 110px"
                : "135px 135px 160px 200px 100px 1fr 110px",
              minHeight: "40px",
              alignItems: "center",
              bgcolor: "#d4d4d4",
              px: "12px",
            }}
          >
            <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
              申請日期
            </Typography>
            {!isEmployeeOnly ? (
              <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
                申請人
              </Typography>
            ) : null}
            <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
              加班類型
            </Typography>
            <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
              日期/時間
            </Typography>
            <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
              時數
            </Typography>
            <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
              事由
            </Typography>
            <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
              狀態
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ minHeight: "56px", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #d1d5db" }}>
              <Typography sx={{ fontSize: "15px" }}>載入中...</Typography>
            </Box>
          ) : errorText ? (
            <Box sx={{ minHeight: "56px", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #d1d5db" }}>
              <Typography sx={{ fontSize: "15px", color: "#dc2626" }}>{errorText}</Typography>
            </Box>
          ) : filteredRows.length === 0 ? (
            <Box sx={{ minHeight: "56px", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #d1d5db" }}>
              <Typography sx={{ fontSize: "15px" }}>查無資料</Typography>
            </Box>
          ) : (
            filteredRows.map((row) => (
              <Box
                key={row.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: isEmployeeOnly
                    ? "135px 160px 200px 100px 1fr 110px"
                    : "135px 135px 160px 200px 100px 1fr 110px",
                  minHeight: "54px",
                  alignItems: "center",
                  px: "12px",
                  borderBottom: "1px solid #d1d5db",
                }}
              >
                <Typography sx={{ fontSize: "15px" }}>{row.request_date || "-"}</Typography>
                {!isEmployeeOnly ? (
                  <Typography sx={{ fontSize: "15px" }}>{row.applicant_name || "-"}</Typography>
                ) : null}
                <Typography sx={{ fontSize: "15px" }}>{row.overtime_type_label || "-"}</Typography>
                <Typography sx={{ fontSize: "15px" }}>{row.datetime_text || "-"}</Typography>
                <Typography sx={{ fontSize: "15px" }}>{row.requested_hours || 0}</Typography>
                <Typography
                  sx={{
                    fontSize: "15px",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    pr: "8px",
                  }}
                >
                  {row.reason || "-"}
                </Typography>
                <Typography sx={{ fontSize: "15px" }}>{row.status_label || "-"}</Typography>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}