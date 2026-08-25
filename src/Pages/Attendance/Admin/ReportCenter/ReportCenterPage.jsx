import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

import {
  apiAttendanceReportCenter,
  apiAttendanceReportCenterMeta,
} from "../../../../API/attendance";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import * as XLSX from "xlsx";
import { renderDateField } from "../../../../Components/GlobalComponent";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";
import { ACTION_BUTTON_SX } from "../../AttendanceForm/ApplicationRecord/Options";

function getLocalDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = new Date();

const INITIAL_FILTERS = {
  report_type: "attendance_detail",
  unit_id: "",
  employee_id: "",
  date_from: getLocalDateValue(
    new date(today.getfullyear(), today.getmonth(), 1),
  ),
  date_to: getLocalDateValue(today),
};

const REPORT_EXPORT_COLUMNS = {
  attendance_detail: [
    ["日期", "date"],
    ["員工", "employee_label"],
    ["單位", "unit_name"],
    ["班次", "shift_name"],
    ["應上班", "expected_start"],
    ["應下班", "expected_end"],
    ["實際上班", "actual_in"],
    ["實際下班", "actual_out"],
    ["請假時數", "leave_hours"],
    ["加班時數", "overtime_hours"],
    ["曠職時數", "absence_hours"],
    ["出勤狀態", "attendance_status"],
  ],
  punch: [
    ["日期", "date"],
    ["員工", "employee_label"],
    ["單位", "unit_name"],
    ["打卡類型", "punch_type"],
    ["打卡時間", "punch_time"],
    ["地點", "location_label"],
    ["方式", "method"],
    ["來源", "source"],
  ],
  anomaly: [
    ["日期", "date"],
    ["員工", "employee_label"],
    ["單位", "unit_name"],
    ["異常類型", "anomaly_type"],
    ["異常內容", "remark"],
    ["處理狀態", "status"],
  ],
  leave: [
    ["申請日期", "date"],
    ["員工", "employee_label"],
    ["單位", "unit_name"],
    ["假別", "leave_name"],
    ["開始時間", "start_datetime"],
    ["結束時間", "end_datetime"],
    ["申請時數", "requested_hours"],
    ["狀態", "status"],
  ],
  overtime: [
    ["申請日期", "date"],
    ["員工", "employee_label"],
    ["單位", "unit_name"],
    ["加班類型", "overtime_type"],
    ["開始時間", "start_datetime"],
    ["結束時間", "end_datetime"],
    ["申請時數", "requested_hours"],
    ["核准時數", "approved_hours"],
    ["補償方式", "pay_method"],
    ["狀態", "status"],
  ],
  outing_trip: [
    ["申請日期", "date"],
    ["員工", "employee_label"],
    ["單位", "unit_name"],
    ["類型", "request_type_label"],
    ["開始時間", "start_datetime"],
    ["結束時間", "end_datetime"],
    ["事由", "reason"],
    ["狀態", "status"],
  ],
  absence: [
    ["日期", "date"],
    ["員工", "employee_label"],
    ["單位", "unit_name"],
    ["曠職時數", "absence_hours"],
    ["來源", "reason"],
    ["狀態", "status"],
  ],
  schedule: [
    ["日期", "date"],
    ["員工", "employee_label"],
    ["單位", "unit_name"],
    ["班次", "shift_name"],
    ["預計上班", "expected_start"],
    ["預計下班", "expected_end"],
    ["發布狀態", "publication_status"],
  ],
};

const REPORT_COLUMNS = {
  attendance_detail: [
    { key: "date", label: "日期", width: "0.9fr" },
    { key: "employee_label", label: "員工", width: "1.4fr" },
    { key: "unit_name", label: "單位", width: "1.2fr" },
    { key: "shift_name", label: "班次", width: "1fr" },
    { key: "expected_start", label: "應上班", width: "0.9fr" },
    { key: "expected_end", label: "應下班", width: "0.9fr" },
    { key: "actual_in", label: "實際上班", width: "0.9fr" },
    { key: "actual_out", label: "實際下班", width: "0.9fr" },
    { key: "leave_hours", label: "請假時數", width: "0.9fr" },
    { key: "overtime_hours", label: "加班時數", width: "0.9fr" },
    { key: "absence_hours", label: "曠職時數", width: "0.9fr" },
    { key: "attendance_status", label: "出勤狀態", width: "1fr" },
  ],
  punch: [
    { key: "date", label: "日期", width: "0.9fr" },
    { key: "employee_label", label: "員工", width: "1.4fr" },
    { key: "unit_name", label: "單位", width: "1.2fr" },
    { key: "punch_type", label: "打卡類型", width: "1fr" },
    { key: "punch_time", label: "打卡時間", width: "1.2fr" },
    { key: "location_label", label: "地點", width: "1.3fr" },
    { key: "method", label: "方式", width: "1fr" },
    { key: "source", label: "來源", width: "1fr" },
  ],
  anomaly: [
    { key: "date", label: "日期", width: "0.9fr" },
    { key: "employee_label", label: "員工", width: "1.4fr" },
    { key: "unit_name", label: "單位", width: "1.2fr" },
    { key: "anomaly_type", label: "異常類型", width: "1.2fr" },
    { key: "remark", label: "異常內容", width: "2fr" },
    { key: "status", label: "處理狀態", width: "1fr" },
  ],
  leave: [
    { key: "date", label: "申請日期", width: "1fr" },
    { key: "employee_label", label: "員工", width: "1.4fr" },
    { key: "unit_name", label: "單位", width: "1.2fr" },
    { key: "leave_name", label: "假別", width: "1.1fr" },
    { key: "start_datetime", label: "開始時間", width: "1.3fr" },
    { key: "end_datetime", label: "結束時間", width: "1.3fr" },
    { key: "requested_hours", label: "申請時數", width: "0.9fr" },
    { key: "status", label: "狀態", width: "1fr" },
  ],
  overtime: [
    { key: "date", label: "申請日期", width: "1fr" },
    { key: "employee_label", label: "員工", width: "1.4fr" },
    { key: "unit_name", label: "單位", width: "1.2fr" },
    { key: "overtime_type", label: "加班類型", width: "1.1fr" },
    { key: "start_datetime", label: "開始時間", width: "1.3fr" },
    { key: "end_datetime", label: "結束時間", width: "1.3fr" },
    { key: "requested_hours", label: "申請時數", width: "0.9fr" },
    { key: "approved_hours", label: "核准時數", width: "0.9fr" },
    { key: "pay_method", label: "補償方式", width: "1fr" },
    { key: "status", label: "狀態", width: "1fr" },
  ],
  outing_trip: [
    { key: "date", label: "申請日期", width: "1fr" },
    { key: "employee_label", label: "員工", width: "1.4fr" },
    { key: "unit_name", label: "單位", width: "1.2fr" },
    { key: "request_type_label", label: "類型", width: "1fr" },
    { key: "start_datetime", label: "開始時間", width: "1.3fr" },
    { key: "end_datetime", label: "結束時間", width: "1.3fr" },
    { key: "reason", label: "事由", width: "1.8fr" },
    { key: "status", label: "狀態", width: "1fr" },
  ],
  absence: [
    { key: "date", label: "日期", width: "1fr" },
    { key: "employee_label", label: "員工", width: "1.4fr" },
    { key: "unit_name", label: "單位", width: "1.2fr" },
    { key: "absence_hours", label: "曠職時數", width: "1fr" },
    { key: "reason", label: "來源", width: "1.5fr" },
    { key: "status", label: "狀態", width: "1fr" },
  ],
  schedule: [
    { key: "date", label: "日期", width: "1fr" },
    { key: "employee_label", label: "員工", width: "1.4fr" },
    { key: "unit_name", label: "單位", width: "1.2fr" },
    { key: "shift_name", label: "班次", width: "1.1fr" },
    { key: "expected_start", label: "預計上班", width: "1.1fr" },
    { key: "expected_end", label: "預計下班", width: "1.1fr" },
    { key: "publication_status", label: "發布狀態", width: "1fr" },
  ],
};

function getData(response, fallback = null) {
  return response?.data?.data ?? response?.data ?? response ?? fallback;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  const raw = String(value ?? "").trim();
  return raw ? raw.replace(/-/g, "/").slice(0, 10) : "-";
}

function formatDateTime(value) {
  const raw = String(value ?? "").trim();

  if (!raw) return "-";

  return raw
    .replace("T", " ")
    .replace(/-/g, "/")
    .slice(0, 16);
}

function formatTime(value) {
  const raw = String(value ?? "").trim();

  if (!raw) return "-";

  const match = raw.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : raw;
}

function formatHours(value) {
  const hours = Number(value);

  if (!Number.isFinite(hours)) return "-";

  const minutes = Math.round(hours * 60);
  const wholeHours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (wholeHours > 0 && remainder > 0) {
    return `${wholeHours} 小時 ${remainder} 分鐘`;
  }

  if (wholeHours > 0) {
    return `${wholeHours} 小時`;
  }

  return remainder > 0 ? `${remainder} 分鐘` : "0 小時";
}

function displayValue(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function exportValue(row, key) {
  const value = row?.[key];

  if (key === "date") {
    return formatDate(value);
  }

  if (
    [
      "start_datetime",
      "end_datetime",
      "punch_time",
    ].includes(key)
  ) {
    return formatDateTime(value);
  }

  if (
    [
      "expected_start",
      "expected_end",
      "actual_in",
      "actual_out",
    ].includes(key)
  ) {
    return formatTime(value);
  }

  if (
    [
      "leave_hours",
      "overtime_hours",
      "absence_hours",
      "requested_hours",
      "approved_hours",
    ].includes(key)
  ) {
    return formatHours(value);
  }

  return displayValue(value);
}

export default function ReportCenterPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [meta, setMeta] = useState({
    report_types: [],
    units: [],
    employees: [],
  });
  const [rows, setRows] = useState([]);
  const [reportLabel, setReportLabel] = useState("出勤明細");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);
      setErrorText("");

      try {
        const response = await apiAttendanceReportCenterMeta();
        const data = getData(response, {});

        setMeta({
          report_types: Array.isArray(data?.report_types)
            ? data.report_types
            : [],
          units: Array.isArray(data?.units)
            ? data.units
            : [],
          employees: Array.isArray(data?.employees)
            ? data.employees
            : [],
        });
      } catch (error) {
        console.error(error);
        setErrorText(
          getErrorMessage(error, "無法載入報表中心查詢條件。"),
        );
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const response =
          await apiAttendanceReportCenter(
            INITIAL_FILTERS,
          );

        const data = getData(response, {});

        setRows(
          Array.isArray(data?.items)
            ? data.items
            : [],
        );
        setReportLabel(
          data?.report_label || "出勤明細",
        );
        setAppliedFilters(INITIAL_FILTERS);
      } catch (error) {
        console.error(error);
        setRows([]);
        setErrorText(
          getErrorMessage(error, "無法載入報表資料。"),
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, []);

  const reportTypeOptions = useMemo(
    () =>
      Array.isArray(meta.report_types) && meta.report_types.length
        ? meta.report_types
        : [
            { value: "attendance_detail", label: "出勤明細" },
            { value: "punch", label: "打卡紀錄" },
            { value: "anomaly", label: "出勤異常" },
            { value: "leave", label: "請假紀錄" },
            { value: "overtime", label: "加班紀錄" },
            { value: "outing_trip", label: "公出/出差紀錄" },
            { value: "absence", label: "曠職紀錄" },
            { value: "schedule", label: "班表" },
          ],
    [meta.report_types],
  );

  const unitOptions = useMemo(
    () => [
      { value: "", label: "全部單位" },
      ...meta.units.map((unit) => ({
        value: String(unit.unit_id || ""),
        label:
          unit.unit_code && unit.unit_name
            ? `${unit.unit_code}/${unit.unit_name}`
            : unit.unit_name ||
              unit.unit_code ||
              `#${unit.unit_id}`,
      })),
    ],
    [meta.units],
  );

  const filteredEmployeeOptions = useMemo(() => {
    const employees = Array.isArray(meta.employees)
      ? meta.employees
      : [];

    const filtered = filters.unit_id
      ? employees.filter(
          (employee) =>
            String(employee.unit_id || "") ===
            String(filters.unit_id),
        )
      : employees;

    return filtered.map((employee) => ({
      value: String(employee.employee_id || ""),
      label:
        employee.employee_no && employee.display_name
          ? `${employee.employee_no}/${employee.display_name}`
          : employee.display_name ||
            employee.employee_no ||
            `#${employee.employee_id}`,
    }));
  }, [meta.employees, filters.unit_id]);

  const columns =
    REPORT_COLUMNS[
      appliedFilters.report_type
    ] || REPORT_COLUMNS.attendance_detail;

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

  const loadRows = async (nextFilters) => {
    const response =
      await apiAttendanceReportCenter(
        nextFilters,
      );

    const data = getData(response, {});

    setRows(
      Array.isArray(data?.items)
        ? data.items
        : [],
    );
    setReportLabel(
      data?.report_label || "",
    );
  };

  const handleSearch = async () => {
    if (
      filters.date_from &&
      filters.date_to &&
      filters.date_from > filters.date_to
    ) {
      setErrorText("開始日期不可晚於結束日期。");
      return;
    }

    setLoading(true);
    setErrorText("");

    try {
      await loadRows(filters);
      setAppliedFilters(filters);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText(
        getErrorMessage(error, "無法載入報表資料。"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setFilters(INITIAL_FILTERS);
    setLoading(true);
    setErrorText("");

    try {
      await loadRows(INITIAL_FILTERS);
      setAppliedFilters(INITIAL_FILTERS);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText(
        getErrorMessage(error, "無法載入報表資料。"),
      );
    } finally {
      setLoading(false);
    }
  };

    const handleDownloadExcel = () => {
    if (!rows.length) return;

    const exportColumns =
      REPORT_EXPORT_COLUMNS[
        appliedFilters.report_type
      ] || [];

    if (!exportColumns.length) return;

    const sheetRows = [
      exportColumns.map(([label]) => label),
      ...rows.map((row) =>
        exportColumns.map(([, key]) =>
          exportValue(row, key),
        ),
      ),
    ];

    const worksheet =
      XLSX.utils.aoa_to_sheet(
        sheetRows,
      );

    worksheet["!cols"] =
      exportColumns.map(([label], index) => {
        const maxLength = Math.max(
          String(label).length,
          ...sheetRows
            .slice(1)
            .map((row) =>
              String(row[index] ?? "").length,
            ),
        );

        return {
          wch: Math.min(
            Math.max(maxLength + 2, 12),
            30,
          ),
        };
      });

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      reportLabel || "報表",
    );

    const rangeText =
      appliedFilters.date_from ||
      appliedFilters.date_to
        ? `_${appliedFilters.date_from || "起"}_${appliedFilters.date_to || "迄"}`
        : "";

    XLSX.writeFile(
      workbook,
      `${reportLabel || "報表"}${rangeText}.xlsx`,
    );
  };

  const renderValue = (row, column) => {
    const value = row?.[column.key];

    if (
      [
        "date",
      ].includes(column.key)
    ) {
      return formatDate(value);
    }

    if (
      [
        "start_datetime",
        "end_datetime",
        "punch_time",
      ].includes(column.key)
    ) {
      return formatDateTime(value);
    }

    if (
      [
        "expected_start",
        "expected_end",
        "actual_in",
        "actual_out",
      ].includes(column.key)
    ) {
      return formatTime(value);
    }

    if (
      [
        "leave_hours",
        "overtime_hours",
        "absence_hours",
        "requested_hours",
        "approved_hours",
      ].includes(column.key)
    ) {
      return formatHours(value);
    }

    return displayValue(value);
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      <Breadcrumb
        rootLabel="管理者專區"
        rootTo="/attendance"
        currentLabel="報表中心"
        mb="14px"
      />

      <Typography
        component="h1"
        sx={{
          mb: 2,
          fontSize: {
            xs: "22px",
            sm: "25px",
            md: "28px",
          },
          fontWeight: 700,
          color: "#111827",
        }}
      >
        報表中心
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          borderColor: "#d1d5db",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: { xs: "14px", sm: "20px" },
          }}
        >
          <Box sx={{ mb: "18px" }}>
            <Typography
              sx={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              報表查詢
            </Typography>

            <Typography
              sx={{
                mt: "2px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              查詢及預覽出勤相關報表
            </Typography>
          </Box>

          <Box sx={{ mb: "24px" }}>
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
                <Typography
                  sx={{
                    mb: "6px",
                    fontSize: "15px",
                    fontWeight: 500,
                  }}
                >
                  報表項目
                </Typography>

                <SelectField
                  value={filters.report_type}
                  onChange={(value) =>
                    handleFilterChange(
                      "report_type",
                      value,
                    )
                  }
                  options={reportTypeOptions}
                  fullWidth
                  height="38px"
                  disabled={loadingMeta || loading}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    mb: "6px",
                    fontSize: "15px",
                    fontWeight: 500,
                  }}
                >
                  單位
                </Typography>

                <SelectField
                  value={filters.unit_id}
                  onChange={(value) =>
                    handleFilterChange(
                      "unit_id",
                      value,
                    )
                  }
                  options={unitOptions}
                  displayEmpty
                  fullWidth
                  height="38px"
                  disabled={loadingMeta || loading}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    mb: "6px",
                    fontSize: "15px",
                    fontWeight: 500,
                  }}
                >
                  員工
                </Typography>

                <SelectField
                  value={filters.employee_id}
                  onChange={(value) =>
                    handleFilterChange(
                      "employee_id",
                      value,
                    )
                  }
                  options={[
                    {
                      value: "",
                      label: "全部員工",
                    },
                    ...filteredEmployeeOptions,
                  ]}
                  displayEmpty
                  fullWidth
                  height="38px"
                  disabled={loadingMeta || loading}
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
                <Typography
                  sx={{
                    mb: "6px",
                    fontSize: "15px",
                    fontWeight: 500,
                  }}
                >
                  開始日期
                </Typography>

                <Box
                  sx={{
                    width: "100%",
                    "& > *": {
                      width: "100% !important",
                    },
                  }}
                >
                  {renderDateField(
                    filters.date_from,
                    (event) =>
                      handleFilterChange(
                        "date_from",
                        event.target.value,
                      ),
                  )}
                </Box>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    mb: "6px",
                    fontSize: "15px",
                    fontWeight: 500,
                  }}
                >
                  結束日期
                </Typography>

                <Box
                  sx={{
                    width: "100%",
                    "& > *": {
                      width: "100% !important",
                    },
                  }}
                >
                  {renderDateField(
                    filters.date_to,
                    (event) =>
                      handleFilterChange(
                        "date_to",
                        event.target.value,
                      ),
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  gridColumn: {
                    xs: "1",
                    sm: "1 / -1",
                    md: "3 / 5",
                  },
                  display: "flex",
                  justifyContent: {
                    xs: "stretch",
                    md: "flex-end",
                  },
                  alignItems: "flex-end",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <ActionButtons
                  onClear={handleClear}
                  onSearch={handleSearch}
                  disabled={loadingMeta || loading}
                />

                <Button
                  variant="outlined"
                  startIcon={<DownloadOutlinedIcon />}
                  onClick={handleDownloadExcel}
                  disabled={
                    loadingMeta ||
                    loading ||
                    !rows.length
                  }
                  sx={ACTION_BUTTON_SX}
                >
                  下載 Excel
                </Button>
              </Box>
            </Box>
          </Box>

          {errorText ? (
            <Alert
              severity="error"
              sx={{ mb: "14px" }}
            >
              {errorText}
            </Alert>
          ) : null}

          <Box sx={{ mb: "12px" }}>
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {reportLabel || "報表預覽"}
            </Typography>

            <Typography
              sx={{
                mt: "2px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              共 {rows.length} 筆
            </Typography>
          </Box>

          <Box
            sx={{
              position: "relative",
              minHeight: loading
                ? "120px"
                : "auto",
            }}
          >
            {loading ? (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(255,255,255,0.72)",
                }}
              >
                <CircularProgress size={28} />
              </Box>
            ) : null}

            <ResponsiveAttendanceTable
              columns={columns}
              rows={rows}
              getRowKey={(row, index) =>
                `${appliedFilters.report_type}-${row.id || index}`
              }
              mobileCardTitleKey="employee_label"
              emptyText="查無報表資料"
              renderValue={renderValue}
              pagination
              rowsPerPage={10}
              fitToContainer
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}