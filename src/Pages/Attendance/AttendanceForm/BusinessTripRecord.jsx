import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

import { apiLeaveRequests } from "../../../API/attendance";
import { getCurrentEmployeeId } from "../../../API/account";
import {
  ActionButtons,
  MobileSectionTitle,
  SelectField,
} from "./ApplicationRecord/SharedFields";
import ResponsiveAttendanceTable from "./ResponsiveAttendanceTable";

const TYPE_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "公出", label: "公出" },
  { value: "出差", label: "出差" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "待審核", label: "待審核" },
  { value: "已核准", label: "已核准" },
  { value: "已駁回", label: "已駁回" },
  { value: "已取消", label: "已取消" },
];

const TABLE_COLUMNS = [
  { key: "apply_date", label: "申請日期", width: "1fr" },
  {
    key: "date_time",
    label: "日期/時間",
    width: "1.8fr",
    desktopWhiteSpace: "pre-line",
    mobileWhiteSpace: "pre-line",
  },
  { key: "total", label: "總計", width: "0.9fr" },
  { key: "type", label: "類型", width: "0.8fr" },
  { key: "reason", label: "事由", width: "1.5fr" },
  { key: "status", label: "狀態", width: "0.9fr" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}

function formatDate(value) {
  const raw = String(value || "").trim();

  if (!raw) return "-";

  return raw.slice(0, 10).replace(/-/g, "/");
}

function formatDateTime(value) {
  const raw = String(value || "").trim();

  if (!raw) return "-";

  return raw.slice(0, 16).replace(/-/g, "/");
}

function formatHours(value) {
  const hours = Number(value || 0);

  if (!Number.isFinite(hours) || hours <= 0) return "-";

  return `${Number(hours.toFixed(2))} 小時`;
}

export default function BusinessTripRecord() {
  const now = useMemo(() => new Date(), []);
  const currentYear = String(now.getFullYear());
  const employeeId = Number(getCurrentEmployeeId() || 0);

  const yearOptions = useMemo(() => {
    const baseYear = now.getFullYear();

    return Array.from({ length: 5 }, (_, index) => {
      const value = String(baseYear - 3 + index);

      return {
        value,
        label: value,
      };
    });
  }, [now]);

  const [year, setYear] = useState(currentYear);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [appliedYear, setAppliedYear] = useState(currentYear);
  const [appliedType, setAppliedType] = useState("all");
  const [appliedStatus, setAppliedStatus] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const loadData = async (nextYear, nextStatus) => {
    setLoading(true);
    setErrorText("");

    try {
      const response = await apiLeaveRequests({
        employee_id: employeeId || undefined,
        request_status: nextStatus === "all" ? undefined : nextStatus,
        date_from: `${nextYear}-01-01`,
        date_to: `${nextYear}-12-31`,
      });

      setRows(
        getItems(response).filter((row) =>
          ["公出", "出差"].includes(String(row.leave_name || "").trim()),
        ),
      );
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText(
        error?.response?.data?.message ||
          error?.response?.data?.data?.message ||
          "無法載入公出/出差申請紀錄。",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(appliedYear, appliedStatus);
  }, [employeeId, appliedYear, appliedStatus]);

  const filteredRows = useMemo(() => {
    return rows
      .filter(
        (row) =>
          appliedType === "all" || String(row.leave_name || "") === appliedType,
      )
      .map((row) => ({
        ...row,
        apply_date: formatDate(row.submitted_at || row.created_at),
        date_time: `${formatDateTime(row.start_datetime)} -\n${formatDateTime(
          row.end_datetime,
        )}`,
        total: formatHours(row.requested_hours),
        type: row.leave_name || "-",
        reason: row.reason || "-",
        status: row.request_status || "-",
      }));
  }, [rows, appliedType]);

  const handleSearch = () => {
    setAppliedYear(year);
    setAppliedType(type);
    setAppliedStatus(status);
  };

  const handleClear = () => {
    setYear(currentYear);
    setType("all");
    setStatus("all");
    setAppliedYear(currentYear);
    setAppliedType("all");
    setAppliedStatus("all");
  };

  return (
    <Box>
      <MobileSectionTitle>公出/出差</MobileSectionTitle>

      <Box sx={{ pb: "10px", borderBottom: "1px solid #d1d5db" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              年度
            </Typography>

            <SelectField
              value={year}
              onChange={setYear}
              options={yearOptions}
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              類型
            </Typography>

            <SelectField
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS}
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
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
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

      <Box sx={{ height: "14px" }} />

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
              minHeight: "140px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(255, 255, 255, 0.72)",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : null}

        <ResponsiveAttendanceTable
          columns={TABLE_COLUMNS}
          rows={filteredRows}
          mobileCardTitleKey="apply_date"
          getRowKey={(row) => row.leave_request_id}
          emptyText="查無公出/出差申請紀錄"
          fitToContainer
          pagination
          rowsPerPage={10}
        />
      </Box>
    </Box>
  );
}
