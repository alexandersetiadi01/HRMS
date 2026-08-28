import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Link,
  Typography,
} from "@mui/material";

import { apiLeaveEntitlementRequests } from "../../../API/attendance";
import { getCurrentEmployeeId } from "../../../API/account";
import {
  ActionButtons,
  MobileSectionTitle,
  SelectField,
} from "./ApplicationRecord/SharedFields";
import ResponsiveAttendanceTable from "./ResponsiveAttendanceTable";

const STATUS_OPTIONS = [
  { value: "", label: "全部" },
  { value: "待審核", label: "待審核" },
  { value: "已核准", label: "已核准" },
  { value: "已駁回", label: "已駁回" },
];

const TABLE_COLUMNS = [
  { key: "submitted_at", label: "申請日期", width: "1.1fr" },
  { key: "leave_name", label: "特殊假別", width: "1.2fr" },
  { key: "relation_type", label: "親屬稱謂", width: "1fr" },
  { key: "attachments", label: "附件", width: "1.4fr" },
  { key: "request_status", label: "狀態", width: "1fr" },
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

  return raw.replace(/-/g, "/").slice(0, 10);
}

function getSubmittedYear(row) {
  const raw = String(row?.submitted_at || "").trim();
  return raw ? raw.slice(0, 4) : "";
}

export default function SpecialLeaveForm() {
  const currentYear = String(new Date().getFullYear());
  const employeeId = Number(getCurrentEmployeeId() || 0);

  const yearOptions = useMemo(() => {
    const baseYear = Number(currentYear);

    return Array.from({ length: 5 }, (_, index) => {
      const value = String(baseYear - 3 + index);

      return {
        value,
        label: value,
      };
    });
  }, [currentYear]);

  const [year, setYear] = useState(currentYear);
  const [status, setStatus] = useState("");
  const [appliedYear, setAppliedYear] = useState(currentYear);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const response = await apiLeaveEntitlementRequests({
          employee_id: employeeId || undefined,
        });

        if (active) {
          setRows(getItems(response));
        }
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setErrorText(
            error?.response?.data?.message ||
              "無法載入特殊假別申請紀錄。",
          );
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
  }, [employeeId]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (
        appliedYear &&
        getSubmittedYear(row) !== String(appliedYear)
      ) {
        return false;
      }

      if (
        appliedStatus &&
        String(row.request_status || "") !== String(appliedStatus)
      ) {
        return false;
      }

      return true;
    });
  }, [rows, appliedYear, appliedStatus]);

  const handleSearch = () => {
    setAppliedYear(year);
    setAppliedStatus(status);
  };

  const handleClear = () => {
    setYear(currentYear);
    setStatus("");
    setAppliedYear(currentYear);
    setAppliedStatus("");
  };

  const renderTableValue = (row, column) => {
    if (column.key === "submitted_at") {
      return formatDate(row.submitted_at);
    }

    if (column.key === "relation_type") {
      return row.relation_type || "-";
    }

    if (column.key === "attachments") {
      const attachments = Array.isArray(row.attachments)
        ? row.attachments
        : [];

      if (attachments.length === 0) {
        return "-";
      }

      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "2px",
          }}
        >
          {attachments.map((attachment, index) => (
            <Link
              key={
                attachment.attachment_id ||
                attachment.file_url ||
                `${attachment.file_name}-${index}`
              }
              href={attachment.file_url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{
                fontSize: "14px",
                wordBreak: "break-all",
                cursor: attachment.file_url ? "pointer" : "default",
              }}
            >
              {attachment.file_name || `附件 ${index + 1}`}
            </Link>
          ))}
        </Box>
      );
    }

    return row[column.key] || "-";
  };

  return (
    <Box>
      <MobileSectionTitle>特殊假別申請</MobileSectionTitle>

      <Box sx={{ pb: "10px", borderBottom: "1px solid #d1d5db" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(2, minmax(0, 1fr))",
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
          mobileCardTitleKey="leave_name"
          getRowKey={(row) => row.entitlement_request_id}
          emptyText="查無特殊假別申請紀錄"
          fitToContainer
          renderValue={renderTableValue}
          pagination
          rowsPerPage={10}
        />
      </Box>
    </Box>
  );
}