import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import {
  apiAttendanceCalendars,
} from "../../../../API/attendance";

import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";
import {
  CALENDAR_STATUS_FILTER_OPTIONS,
  createCalendarYearOptions,
  getCalendarStatusLabel,
} from "./moduleSettingOptions";

const CURRENT_YEAR = new Date().getFullYear();

const YEAR_OPTIONS = [
  { value: "", label: "全部年度" },
  ...createCalendarYearOptions(CURRENT_YEAR - 5, CURRENT_YEAR + 5),
];

const INITIAL_FILTERS = {
  year: "",
  status: "",
};

const TABLE_COLUMNS = [
  { key: "calendar_code", label: "行事曆代碼", width: "1.1fr" },
  { key: "calendar_name", label: "行事曆名稱", width: "1.5fr" },
  { key: "calendar_year_text", label: "年度", width: "0.8fr" },
  { key: "status_text", label: "狀態", width: "0.9fr" },
  { key: "published_at_text", label: "發布時間", width: "1.2fr" },
  { key: "updated_at_text", label: "最後更新", width: "1.2fr" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}

function formatDateTime(value) {
  const raw = String(value || "").trim();

  if (!raw) return "-";

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?/,
  );

  if (!match) return raw;

  return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
}

export default function CalendarTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const displayRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      calendar_year_text: row.calendar_year ? `${row.calendar_year} 年` : "-",
      status_text: getCalendarStatusLabel(row.status),
      published_at_text: formatDateTime(row.published_at),
      updated_at_text: formatDateTime(row.updated_at),
    }));
  }, [rows]);

  const loadRows = useCallback(async (params = {}) => {
    const response = await apiAttendanceCalendars(params);
    setRows(getItems(response));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const response = await apiAttendanceCalendars();

        if (active) {
          setRows(getItems(response));
        }
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setErrorText("無法載入行事曆資料。");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      await loadRows(filters);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入行事曆資料。");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setFilters(INITIAL_FILTERS);
    setLoading(true);
    setErrorText("");

    try {
      await loadRows();
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入行事曆資料。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: "18px" }}>
        <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
          行事曆管理
        </Typography>

        <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
          建立及管理年度行事曆與特殊日期設定
        </Typography>
      </Box>

      <Box sx={{ mb: "18px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(2, minmax(0, 260px))",
            },
            gap: "14px",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              年度
            </Typography>

            <SelectField
              value={filters.year}
              onChange={(value) => handleFilterChange("year", value)}
              options={YEAR_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              狀態
            </Typography>

            <SelectField
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              options={CALENDAR_STATUS_FILTER_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>
        </Box>

        <Box sx={{ mt: "14px", display: "flex", justifyContent: "flex-end" }}>
          <ActionButtons
            onClear={handleClear}
            onSearch={handleSearch}
            disabled={loading}
          />
        </Box>
      </Box>

      {errorText ? (
        <Alert severity="error" sx={{ mb: "14px" }}>
          {errorText}
        </Alert>
      ) : null}

      <Box sx={{ position: "relative" }}>
        {loading ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "140px",
              bgcolor: "rgba(255, 255, 255, 0.72)",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : null}

        <ResponsiveAttendanceTable
          columns={TABLE_COLUMNS}
          rows={displayRows}
          getRowKey={(row) => row.calendar_id}
          mobileCardTitleKey="calendar_name"
          emptyText="查無行事曆資料"
          fitToContainer
          pagination
          rowsPerPage={10}
        />
      </Box>
    </Box>
  );
}