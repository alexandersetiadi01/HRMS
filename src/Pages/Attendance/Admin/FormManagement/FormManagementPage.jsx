import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { apiAttendanceFormManagement } from "../../../../API/attendance";
import FormDialog from "../../../../Components/FormDialog";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  FilterActions,
  FilterRow,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";

const INITIAL_FILTERS = {
  type: "",
  unit_id: "",
  employee_id: "",
  status: "",
  date_from: "",
  date_to: "",
};

const TABLE_COLUMNS = [
  { key: "request_date", label: "申請日期", width: "1fr" },
  { key: "employee_label", label: "申請人", width: "1.4fr" },
  { key: "unit_name", label: "單位", width: "1.2fr" },
  { key: "request_type_label", label: "表單類型", width: "1fr" },
  { key: "content_summary", label: "內容", width: "2.6fr" },
  { key: "status_label", label: "狀態", width: "1fr" },
  { key: "actions", label: "操作", width: "80px" },
];

function getData(response) {
  return response?.data?.data ?? response?.data ?? response ?? {};
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function displayValue(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function formatHours(value) {
  const hours = Number(value);
  return Number.isFinite(hours) && hours > 0 ? `${hours} 小時` : "-";
}

function DetailField({ label, value }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "140px minmax(0, 1fr)" },
        gap: { xs: "4px", sm: "12px" },
        py: "8px",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>
        {label}
      </Typography>

      <Typography
        sx={{
          minWidth: 0,
          fontSize: "14px",
          color: "#111827",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {displayValue(value)}
      </Typography>
    </Box>
  );
}

export default function FormManagementPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    request_types: [],
    statuses: [],
    units: [],
    employees: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [detailRow, setDetailRow] = useState(null);

  const unitOptions = useMemo(
    () => [
      { value: "", label: "全部單位" },
      ...(Array.isArray(meta?.units)
        ? meta.units.map((unit) => ({
            value: String(unit.unit_id || ""),
            label: unit.unit_name || unit.unit_code || `#${unit.unit_id}`,
          }))
        : []),
    ],
    [meta],
  );

  const typeOptions = useMemo(
    () => [
      { value: "", label: "全部表單" },
      ...(Array.isArray(meta?.request_types) ? meta.request_types : []),
    ],
    [meta],
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "全部狀態" },
      ...(Array.isArray(meta?.statuses) ? meta.statuses : []),
    ],
    [meta],
  );

  const employeeOptions = useMemo(() => {
    const employees = Array.isArray(meta?.employees) ? meta.employees : [];

    if (!filters.unit_id) {
      return employees;
    }

    return employees.filter(
      (employee) =>
        String(employee.unit_id || "") === String(filters.unit_id || ""),
    );
  }, [meta, filters.unit_id]);

  const selectedEmployee = useMemo(
    () =>
      employeeOptions.find(
        (employee) =>
          String(employee.employee_id || "") === String(filters.employee_id || ""),
      ) || null,
    [employeeOptions, filters.employee_id],
  );

  const loadData = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setErrorText("");

    try {
      const response = await apiAttendanceFormManagement(nextFilters);
      const data = getData(response);

      setRows(Array.isArray(data?.items) ? data.items : []);

      if (data?.meta) {
        setMeta({
          request_types: Array.isArray(data.meta.request_types)
            ? data.meta.request_types
            : [],
          statuses: Array.isArray(data.meta.statuses)
            ? data.meta.statuses
            : [],
          units: Array.isArray(data.meta.units) ? data.meta.units : [],
          employees: Array.isArray(data.meta.employees)
            ? data.meta.employees
            : [],
        });
      }
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText(getErrorMessage(error, "載入表單紀錄失敗。"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData(INITIAL_FILTERS);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "unit_id") {
        next.employee_id = "";
      }

      return next;
    });
  };

  const handleSearch = () => {
    loadData(filters);
  };

  const handleClear = () => {
    setFilters(INITIAL_FILTERS);
    loadData(INITIAL_FILTERS);
  };

  const renderValue = (row, column) => {
    if (column.key === "actions") {
      return (
        <Tooltip title="查看">
          <IconButton
            size="small"
            onClick={() => setDetailRow(row)}
            aria-label="查看"
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    return displayValue(row?.[column.key]);
  };

  const renderDetailFields = () => {
    if (!detailRow) return null;

    const detail = detailRow.detail || {};
    const type = String(detailRow.request_type || "");

    if (
      type === "leave" ||
      type === "outing" ||
      type === "business_trip"
    ) {
      return (
        <>
          <DetailField label="假別" value={detail.leave_name} />
          <DetailField label="開始時間" value={detail.start_datetime} />
          <DetailField label="結束時間" value={detail.end_datetime} />
          <DetailField
            label="申請時數"
            value={formatHours(detail.requested_hours)}
          />
          <DetailField label="事由" value={detail.reason} />
        </>
      );
    }

    if (type === "overtime") {
      return (
        <>
          <DetailField label="加班類型" value={detail.overtime_type} />
          <DetailField label="開始時間" value={detail.start_datetime} />
          <DetailField label="結束時間" value={detail.end_datetime} />
          <DetailField
            label="申請時數"
            value={formatHours(detail.requested_hours)}
          />
          <DetailField
            label="核准時數"
            value={formatHours(detail.approved_hours)}
          />
          <DetailField label="補償方式" value={detail.pay_method} />
          <DetailField label="事由" value={detail.reason} />
        </>
      );
    }

    if (type === "missed_punch") {
      return (
        <>
          <DetailField
            label="忘打卡類型"
            value={detail.request_punch_type_label}
          />
          <DetailField label="打卡時間" value={detail.request_datetime} />
          <DetailField label="地點" value={detail.location_label} />
          <DetailField label="地點備註" value={detail.location_note} />
          <DetailField label="事由" value={detail.reason} />
        </>
      );
    }

    if (type === "leave_entitlement") {
      return (
        <>
          <DetailField label="特殊假別" value={detail.leave_name} />
          <DetailField label="申請年度" value={detail.request_year} />
          <DetailField label="事件日期" value={detail.event_date} />
          <DetailField label="關係" value={detail.relation_type} />
          <DetailField label="事由" value={detail.reason} />
        </>
      );
    }

    return null;
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, sm: 2.5, md: 3 } }}>
      <Breadcrumb
        rootLabel="管理者專區"
        rootTo="/attendance"
        currentLabel="表單紀錄管理"
        mb="14px"
      />

      <Typography
        component="h1"
        sx={{
          mb: 2,
          fontSize: { xs: "22px", sm: "25px", md: "28px" },
          fontWeight: 700,
          color: "#111827",
        }}
      >
        表單紀錄管理
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: "14px", sm: "18px" },
          borderColor: "#d1d5db",
          borderRadius: "8px",
        }}
      >
        <FilterRow>
          <SelectField
            label="表單類型"
            value={filters.type}
            onChange={(value) => handleFilterChange("type", value)}
            options={typeOptions}
            minWidth="170px"
          />

          <SelectField
            label="單位"
            value={filters.unit_id}
            onChange={(value) => handleFilterChange("unit_id", value)}
            options={unitOptions}
            minWidth="180px"
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: { xs: "100%", sm: "240px" },
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              員工
            </Typography>

            <Autocomplete
              size="small"
              options={employeeOptions}
              value={selectedEmployee}
              getOptionLabel={(option) => option?.employee_label || ""}
              isOptionEqualToValue={(option, value) =>
                Number(option?.employee_id || 0) ===
                Number(value?.employee_id || 0)
              }
              onChange={(_event, value) =>
                handleFilterChange(
                  "employee_id",
                  value ? String(value.employee_id) : "",
                )
              }
              renderInput={(params) => (
                <TextField {...params} placeholder="全部員工" />
              )}
            />
          </Box>

          <SelectField
            label="狀態"
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
            options={statusOptions}
            minWidth="150px"
          />
        </FilterRow>

        <FilterRow>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: { xs: "100%", sm: "180px" },
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              開始日期
            </Typography>

            <TextField
              type="date"
              size="small"
              value={filters.date_from}
              onChange={(event) =>
                handleFilterChange("date_from", event.target.value)
              }
              fullWidth
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: { xs: "100%", sm: "180px" },
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              結束日期
            </Typography>

            <TextField
              type="date"
              size="small"
              value={filters.date_to}
              onChange={(event) =>
                handleFilterChange("date_to", event.target.value)
              }
              fullWidth
            />
          </Box>

          <FilterActions>
            <Button
              variant="outlined"
              onClick={handleSearch}
              disabled={loading}
            >
              搜尋
            </Button>

            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={loading}
            >
              清空
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              重新整理
            </Button>
          </FilterActions>
        </FilterRow>

        {errorText ? (
          <Alert severity="error" sx={{ mt: "16px" }}>
            {errorText}
          </Alert>
        ) : null}

        {loading ? (
          <Box
            sx={{
              minHeight: "280px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={30} />
          </Box>
        ) : (
          <Box sx={{ mt: "18px" }}>
            <ResponsiveAttendanceTable
              columns={TABLE_COLUMNS}
              rows={rows}
              getRowKey={(row) =>
                `${row.request_type}-${row.request_id}`
              }
              mobileCardTitleKey="employee_label"
              emptyText="查無表單紀錄"
              renderValue={renderValue}
              fitToContainer
              pagination
              rowsPerPage={10}
            />
          </Box>
        )}
      </Paper>

      <FormDialog
        open={Boolean(detailRow)}
        title="表單紀錄詳細"
        submitLabel="關閉"
        cancelLabel=""
        maxWidth="md"
        onClose={() => setDetailRow(null)}
        onSubmit={() => setDetailRow(null)}
      >
        {detailRow ? (
          <Box>
            <DetailField
              label="表單類型"
              value={detailRow.request_type_label}
            />
            <DetailField
              label="狀態"
              value={detailRow.status_label}
            />
            <DetailField
              label="申請人"
              value={detailRow.employee_label}
            />
            <DetailField
              label="單位"
              value={detailRow.unit_name}
            />
            <DetailField
              label="申請日期"
              value={detailRow.request_date}
            />

            {renderDetailFields()}
          </Box>
        ) : null}
      </FormDialog>
    </Box>
  );
}