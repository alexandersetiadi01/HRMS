import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";

import {
  apiAttendanceAdminMeta,
  apiAttendanceAnomalies,
  apiConvertAttendanceAnomalyToAbsence,
} from "../../../../API/attendance";
import { renderDateField } from "../../../../Components/GlobalComponent";
import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";

const INITIAL_FILTERS = {
  unit_id: "",
  employee_id: "",
  anomaly_type: "",
  status: "",
  date_from: "",
  date_to: "",
};

const ANOMALY_TYPE_OPTIONS = [
  { value: "", label: "全部異常類型" },
  { value: "late", label: "遲到" },
  { value: "early_leave", label: "早退" },
  { value: "missing_clock_in", label: "缺上班卡" },
  { value: "missing_clock_out", label: "缺下班卡" },
  { value: "late_early_leave", label: "遲到且早退" },
  { value: "absent", label: "曠職" },
  { value: "overtime", label: "加班" },
  { value: "leave", label: "請假" },
  { value: "other", label: "其他" },
];

const STATUS_OPTIONS = [
  { value: "", label: "全部狀態" },
  { value: "open", label: "待處理" },
  { value: "resolved", label: "已處理" },
  { value: "ignored", label: "已忽略" },
];

const TABLE_COLUMNS = [
  { key: "employee", label: "員工", width: "1.4fr" },
  { key: "work_date", label: "日期", width: "1fr" },
  { key: "anomaly_type", label: "異常類型", width: "1fr" },
  { key: "minutes_value", label: "分鐘", width: "0.7fr" },
  { key: "status", label: "狀態", width: "0.8fr" },
  { key: "attendance_status", label: "出勤狀態", width: "1fr" },
  { key: "actions", label: "操作", width: "100px" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function formatDate(value) {
  const raw = String(value || "").trim();
  return raw ? raw.replace(/-/g, "/").slice(0, 10) : "-";
}

function formatAnomalyType(value) {
  const map = {
    late: "遲到",
    early_leave: "早退",
    missing_clock_in: "缺上班卡",
    missing_clock_out: "缺下班卡",
    late_early_leave: "遲到且早退",
    absent: "曠職",
    overtime: "加班",
    leave: "請假",
    other: "其他",
  };

  return map[value] || value || "-";
}

function formatStatus(value) {
  const map = {
    open: "待處理",
    pending: "待處理",
    resolved: "已處理",
    closed: "已處理",
    ignored: "已忽略",
  };

  return map[value] || value || "-";
}

function formatAttendanceStatus(value) {
  const map = {
    normal: "正常",
    late: "遲到",
    early_leave: "早退",
    late_early_leave: "遲到 / 早退",
    missing_clock_in: "缺上班卡",
    missing_clock_out: "缺下班卡",
    absent: "缺勤",
  };

  return map[value] || value || "-";
}

export default function AttendanceAnomaliesTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [unitOptions, setUnitOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [detailRow, setDetailRow] = useState(null);
  const [convertRow, setConvertRow] = useState(null);
  const [convertHours, setConvertHours] = useState("");
  const [convertReason, setConvertReason] = useState("");
  const [convertError, setConvertError] = useState("");
  const [converting, setConverting] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const [meta, anomalyResult] = await Promise.all([
          apiAttendanceAdminMeta(),
          apiAttendanceAnomalies(),
        ]);

        setUnitOptions([
          { value: "", label: "全部單位" },
          ...(Array.isArray(meta?.unitOptions) ? meta.unitOptions : []),
        ]);

        setEmployeeOptions(
          Array.isArray(meta?.employeeOptions) ? meta.employeeOptions : [],
        );

        setRows(getItems(anomalyResult));
      } catch (error) {
        console.error(error);
        setRows([]);
        setErrorText("無法載入出勤異常資料。");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const employeeMap = useMemo(
    () =>
      new Map(
        employeeOptions.map((employee) => [
          Number(employee.employee_id || 0),
          employee,
        ]),
      ),
    [employeeOptions],
  );

  const filteredEmployeeOptions = useMemo(() => {
    if (!filters.unit_id) {
      return employeeOptions;
    }

    return employeeOptions.filter(
      (employee) => String(employee.unit_id || "") === String(filters.unit_id),
    );
  }, [employeeOptions, filters.unit_id]);

  const displayRows = useMemo(() => {
    return rows
      .map((row) => {
        const employee = employeeMap.get(Number(row.employee_id || 0));

        return {
          ...row,
          employee:
            row.employee_no && row.display_name
              ? `${row.employee_no}/${row.display_name}`
              : employee?.label ||
                row.display_name ||
                row.employee_no ||
                `#${row.employee_id}`,
          unit_id: Number(row.unit_id || employee?.unit_id || 0),
        };
      })
      .filter((row) => {
        if (!appliedFilters.unit_id) {
          return true;
        }

        return String(row.unit_id || "") === String(appliedFilters.unit_id);
      });
  }, [rows, employeeMap, appliedFilters.unit_id]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => {
      const next = { ...current, [field]: value };

      if (field === "unit_id") {
        next.employee_id = "";
      }

      return next;
    });
  };

  const loadRows = async (nextFilters) => {
    const result = await apiAttendanceAnomalies({
      employee_id: nextFilters.employee_id || undefined,
      anomaly_type: nextFilters.anomaly_type || undefined,
      status: nextFilters.status || undefined,
      date_from: nextFilters.date_from || undefined,
      date_to: nextFilters.date_to || undefined,
    });

    setRows(getItems(result));
  };

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      setAppliedFilters(filters);
      await loadRows(filters);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入出勤異常資料。");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setLoading(true);
    setErrorText("");

    try {
      await loadRows(INITIAL_FILTERS);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入出勤異常資料。");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConvert = (row) => {
    setConvertRow(row);
    setConvertHours(
      Number(row.minutes_value || 0) > 0
        ? String(Number(row.minutes_value) / 60)
        : "",
    );
    setConvertReason("");
    setConvertError("");
  };

  const handleCloseConvert = () => {
    if (converting) {
      return;
    }

    setConvertRow(null);
    setConvertHours("");
    setConvertReason("");
    setConvertError("");
  };

  const handleConfirmConvert = async () => {
    const hours = Number(convertHours);

    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
      setConvertError("曠職時數必須大於 0 且不可超過 24 小時。");
      return;
    }

    if (!convertReason.trim()) {
      setConvertError("請輸入曠職原因。");
      return;
    }

    setConverting(true);
    setConvertError("");

    try {
      await apiConvertAttendanceAnomalyToAbsence(convertRow.anomaly_id, {
        absence_hours: hours,
        reason: convertReason.trim(),
      });

      setConvertRow(null);
      setConvertHours("");
      setConvertReason("");
      setSuccessDialog({
        open: true,
        title: "轉曠職成功",
        message: "出勤異常已成功轉為曠職紀錄。",
      });

      await loadRows(appliedFilters);
    } catch (error) {
      console.error(error);
      setConvertError(
        error?.response?.data?.message ||
          error?.message ||
          "出勤異常轉曠職失敗。",
      );
    } finally {
      setConverting(false);
    }
  };

  const renderTableValue = (row, column) => {
    if (column.key === "work_date") {
      return formatDate(row.work_date);
    }

    if (column.key === "anomaly_type") {
      return formatAnomalyType(row.anomaly_type);
    }

    if (column.key === "status") {
      return formatStatus(row.status);
    }

    if (column.key === "attendance_status") {
      return formatAttendanceStatus(row.attendance_status);
    }

    if (column.key === "minutes_value") {
      return Number(row.minutes_value || 0) || "-";
    }

    if (column.key === "actions") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <Tooltip title="詳細">
            <IconButton size="small" onClick={() => setDetailRow(row)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {row.status === "open" ? (
            <Tooltip title="轉曠職">
              <IconButton size="small" onClick={() => handleOpenConvert(row)}>
                <PersonOffOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      );
    }

    return row[column.key] || "-";
  };

  return (
    <Box sx={{ p: { xs: "14px", sm: "20px" } }}>
      <Box sx={{ mb: "18px" }}>
        <Typography
          sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
        >
          出勤異常
        </Typography>

        <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
          查詢員工遲到、早退、缺卡及缺勤等出勤異常
        </Typography>
      </Box>

      <Box sx={{ mb: "18px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              單位
            </Typography>

            <SelectField
              value={filters.unit_id}
              onChange={(value) => handleFilterChange("unit_id", value)}
              options={unitOptions}
              displayEmpty
              fullWidth
              height="38px"
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              員工
            </Typography>

            <SelectField
              value={filters.employee_id}
              onChange={(value) => handleFilterChange("employee_id", value)}
              options={[
                { value: "", label: "全部員工" },
                ...filteredEmployeeOptions,
              ]}
              displayEmpty
              fullWidth
              height="38px"
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              異常類型
            </Typography>

            <SelectField
              value={filters.anomaly_type}
              onChange={(value) => handleFilterChange("anomaly_type", value)}
              options={ANOMALY_TYPE_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              狀態
            </Typography>

            <SelectField
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              options={STATUS_OPTIONS}
              displayEmpty
              fullWidth
              height="38px"
            />
          </Box>
        </Box>

        <Box
          sx={{
            mt: "14px",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              開始日期
            </Typography>

            <Box sx={{ width: "100%", "& > *": { width: "100% !important" } }}>
              {renderDateField(filters.date_from, (event) =>
                handleFilterChange("date_from", event.target.value),
              )}
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              結束日期
            </Typography>

            <Box sx={{ width: "100%", "& > *": { width: "100% !important" } }}>
              {renderDateField(filters.date_to, (event) =>
                handleFilterChange("date_to", event.target.value),
              )}
            </Box>
          </Box>

          <Box
            sx={{
              gridColumn: { xs: "1", sm: "1 / -1", md: "3 / 5" },
              display: "flex",
              justifyContent: { xs: "stretch", md: "flex-end" },
              alignItems: "flex-end",
            }}
          >
            <ActionButtons onClear={handleClear} onSearch={handleSearch} />
          </Box>
        </Box>
      </Box>

      {errorText ? (
        <Alert severity="error" sx={{ mb: "14px" }}>
          {errorText}
        </Alert>
      ) : null}

      <ResponsiveAttendanceTable
        columns={TABLE_COLUMNS}
        rows={displayRows}
        getRowKey={(row) => row.anomaly_id}
        mobileCardTitleKey="employee"
        emptyText={loading ? "讀取中..." : "查無出勤異常"}
        desktopMinWidth="100%"
        renderValue={renderTableValue}
        pagination
        rowsPerPage={10}
      />

      <FormDialog
        open={Boolean(detailRow)}
        title="出勤異常詳細"
        submitLabel="關閉"
        cancelLabel=""
        maxWidth="sm"
        onClose={() => setDetailRow(null)}
        onSubmit={() => setDetailRow(null)}
      >
        {detailRow ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: "14px",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                員工
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.employee}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                日期
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatDate(detailRow.work_date)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                異常類型
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatAnomalyType(detailRow.anomaly_type)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                異常分鐘
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {Number(detailRow.minutes_value || 0) || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                異常狀態
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatStatus(detailRow.status)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                出勤狀態
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatAttendanceStatus(detailRow.attendance_status)}
              </Typography>
            </Box>

            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                備註
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.remark || "-"}
              </Typography>
            </Box>
          </Box>
        ) : null}
      </FormDialog>

      <FormDialog
        open={Boolean(convertRow)}
        title="轉為曠職"
        submitting={converting}
        submitLabel="確認轉曠職"
        onClose={handleCloseConvert}
        onSubmit={handleConfirmConvert}
      >
        {convertError ? <Alert severity="error">{convertError}</Alert> : null}

        {convertRow ? (
          <Box sx={{ p: "12px", borderRadius: "6px", bgcolor: "#f9fafb" }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>
              {convertRow.employee}
            </Typography>

            <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
              {formatDate(convertRow.work_date)}　
              {formatAnomalyType(convertRow.anomaly_type)}
            </Typography>
          </Box>
        ) : null}

        <TextField
          required
          fullWidth
          type="number"
          label="曠職時數"
          value={convertHours}
          onChange={(event) => setConvertHours(event.target.value)}
          slotProps={{
            htmlInput: {
              min: 0.01,
              max: 24,
              step: 0.25,
            },
          }}
        />

        <TextField
          required
          fullWidth
          multiline
          minRows={3}
          label="曠職原因"
          value={convertReason}
          onChange={(event) => setConvertReason(event.target.value)}
        />
      </FormDialog>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() =>
          setSuccessDialog((current) => ({ ...current, open: false }))
        }
      />
    </Box>
  );
}
