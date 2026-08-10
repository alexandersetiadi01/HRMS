import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  apiAttendanceAdminMeta,
  apiAttendanceAdminRecords,
} from "../../../API/attendance";
import FormDialog from "../../../Components/FormDialog";
import { renderDateField } from "../../../Components/GlobalComponent";
import Breadcrumb from "../../../Utils/Breadcrumb";
import ResponsiveAttendanceTable from "../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../AttendanceForm/ApplicationRecord/SharedFields";

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const INITIAL_FILTERS = {
  unit_id: "",
  employee_id: "",
  attendance_status: "",
  date_from: "",
  date_to: getTodayDate(),
};

const ATTENDANCE_STATUS_OPTIONS = [
  { value: "", label: "全部出勤狀態" },
  { value: "normal", label: "正常" },
  { value: "late", label: "遲到" },
  { value: "early_leave", label: "早退" },
  { value: "late_early_leave", label: "遲到 / 早退" },
  { value: "missing_clock_in", label: "缺上班卡" },
  { value: "missing_clock_out", label: "缺下班卡" },
  { value: "absent", label: "缺勤" },
  { value: "leave", label: "請假" },
  { value: "overtime", label: "加班" },
];

const TABLE_COLUMNS = [
  { key: "employee", label: "員工", width: "1.5fr" },
  { key: "work_date", label: "日期", width: "1fr" },
  { key: "actual_in", label: "上班時間", width: "1fr" },
  { key: "actual_out", label: "下班時間", width: "1fr" },
  { key: "attendance_status", label: "出勤狀態", width: "1fr" },
  { key: "actions", label: "操作", width: "70px" },
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

function formatTime(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "-";
  }

  const match = raw.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : raw;
}

function formatHours(value) {
  const valueHours = Number(value);

  if (!Number.isFinite(valueHours)) {
    return "-";
  }

  const totalMinutes = Math.round(valueHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} 小時 ${minutes} 分鐘`;
  }

  if (hours > 0) {
    return `${hours} 小時`;
  }

  return minutes > 0 ? `${minutes} 分鐘` : "-";
}

function formatMinutes(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "-";
  }

  return `${Math.round(minutes)} 分鐘`;
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
    leave: "請假",
    overtime: "加班",
  };

  return map[value] || value || "-";
}

export default function StaffAttendancePage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [unitOptions, setUnitOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [detailRow, setDetailRow] = useState(null);

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);
      setErrorText("");

      try {
        const meta = await apiAttendanceAdminMeta();

        setUnitOptions([
          { value: "", label: "全部單位" },
          ...(Array.isArray(meta?.unitOptions) ? meta.unitOptions : []),
        ]);

        setEmployeeOptions(
          Array.isArray(meta?.employeeOptions) ? meta.employeeOptions : [],
        );
      } catch (error) {
        console.error(error);
        setUnitOptions([{ value: "", label: "全部單位" }]);
        setEmployeeOptions([]);
        setErrorText("無法載入人員出勤查詢條件。");
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    const loadInitialRows = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const result = await apiAttendanceAdminRecords({
          date_to: INITIAL_FILTERS.date_to,
        });

        setRows(getItems(result));
        setAppliedFilters(INITIAL_FILTERS);
      } catch (error) {
        console.error(error);
        setRows([]);
        setErrorText("無法載入人員出勤資料。");
      } finally {
        setLoading(false);
      }
    };

    loadInitialRows();
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
            employee?.label ||
            employee?.display_name ||
            employee?.employee_no ||
            `#${row.employee_id}`,
          unit_id: Number(employee?.unit_id || 0),
        };
      })
      .filter((row) => {
        if (
          appliedFilters.unit_id &&
          String(row.unit_id || "") !== String(appliedFilters.unit_id)
        ) {
          return false;
        }

        if (
          appliedFilters.attendance_status &&
          String(row.attendance_status || "") !==
            String(appliedFilters.attendance_status)
        ) {
          return false;
        }

        return true;
      });
  }, [
    rows,
    employeeMap,
    appliedFilters.unit_id,
    appliedFilters.attendance_status,
  ]);

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
    const result = await apiAttendanceAdminRecords({
      employee_id: nextFilters.employee_id || undefined,
      date_from: nextFilters.date_from || undefined,
      date_to: nextFilters.date_to || undefined,
    });

    setRows(getItems(result));
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
      setAppliedFilters(filters);
      await loadRows(filters);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入人員出勤資料。");
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
      setErrorText("無法載入人員出勤資料。");
    } finally {
      setLoading(false);
    }
  };

  const renderTableValue = (row, column) => {
    if (column.key === "work_date") {
      return formatDate(row.work_date || row.attendance_date);
    }

    if (column.key === "actual_in") {
      return formatTime(row.actual_in);
    }

    if (column.key === "actual_out") {
      return formatTime(row.actual_out);
    }

    if (
      [
        "worked_hours",
        "leave_hours",
        "system_absent_hours",
        "confirmed_absence_hours",
        "unresolved_absent_hours",
      ].includes(column.key)
    ) {
      return formatHours(row[column.key]);
    }

    if (column.key === "attendance_status") {
      return formatAttendanceStatus(row.attendance_status);
    }

    if (column.key === "actions") {
      return (
        <Tooltip title="詳細">
          <IconButton size="small" onClick={() => setDetailRow(row)}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    return row[column.key] || "-";
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, sm: 2.5, md: 3 } }}>
      <Breadcrumb
        rootLabel="主管專區"
        rootTo="/attendance"
        currentLabel="人員出勤"
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
        人員出勤
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          borderColor: "#d1d5db",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: { xs: "14px", sm: "20px" } }}>
          <Box sx={{ mb: "18px" }}>
            <Typography
              sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
            >
              人員出勤
            </Typography>

            <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
              查詢員工出勤狀況、工時、請假、缺勤及異常紀錄
            </Typography>
          </Box>

          <Box sx={{ mb: "18px" }}>
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
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
                  單位
                </Typography>

                <SelectField
                  value={filters.unit_id}
                  onChange={(value) => handleFilterChange("unit_id", value)}
                  options={unitOptions}
                  displayEmpty
                  fullWidth
                  height="38px"
                  disabled={loadingMeta || loading}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
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
                  disabled={loadingMeta || loading}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
                  出勤狀態
                </Typography>

                <SelectField
                  value={filters.attendance_status}
                  onChange={(value) =>
                    handleFilterChange("attendance_status", value)
                  }
                  options={ATTENDANCE_STATUS_OPTIONS}
                  displayEmpty
                  fullWidth
                  height="38px"
                  disabled={loading}
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
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
                  開始日期
                </Typography>

                <Box
                  sx={{ width: "100%", "& > *": { width: "100% !important" } }}
                >
                  {renderDateField(filters.date_from, (event) =>
                    handleFilterChange("date_from", event.target.value),
                  )}
                </Box>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
                  結束日期
                </Typography>

                <Box
                  sx={{ width: "100%", "& > *": { width: "100% !important" } }}
                >
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
                <ActionButtons
                  onClear={handleClear}
                  onSearch={handleSearch}
                  disabled={loadingMeta || loading}
                />
              </Box>
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
                  minHeight: "160px",
                  bgcolor: "rgba(255, 255, 255, 0.72)",
                }}
              >
                <CircularProgress size={32} />
              </Box>
            ) : null}

            <ResponsiveAttendanceTable
              columns={TABLE_COLUMNS}
              rows={displayRows}
              getRowKey={(row) => row.attendance_id}
              mobileCardTitleKey="employee"
              emptyText="查無人員出勤資料"
              desktopMinWidth="720px"
              renderValue={renderTableValue}
              pagination
              rowsPerPage={10}
            />
          </Box>
        </Box>
      </Paper>

      <FormDialog
        open={Boolean(detailRow)}
        title="人員出勤詳細"
        submitLabel="關閉"
        cancelLabel=""
        maxWidth="md"
        onClose={() => setDetailRow(null)}
        onSubmit={() => setDetailRow(null)}
      >
        {detailRow ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                員工
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.employee || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                日期
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatDate(detailRow.work_date || detailRow.attendance_date)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                排班開始
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatTime(
                  detailRow.expected_start || detailRow.shift_start_time,
                )}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                排班結束
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatTime(detailRow.expected_end || detailRow.shift_end_time)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                上班時間
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatTime(detailRow.actual_in)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                下班時間
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatTime(detailRow.actual_out)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                工時
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatHours(detailRow.worked_hours)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                加班時數
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatHours(detailRow.overtime_hours)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                請假時數
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatHours(detailRow.leave_hours)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                系統缺勤時數
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatHours(detailRow.system_absent_hours)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                已確認曠職時數
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatHours(detailRow.confirmed_absence_hours)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                尚未處理缺勤
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatHours(detailRow.unresolved_absent_hours)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                遲到
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatMinutes(detailRow.late_minutes)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                早退
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatMinutes(detailRow.early_leave_minutes)}
              </Typography>
            </Box>

            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                出勤狀態
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatAttendanceStatus(detailRow.attendance_status)}
              </Typography>
            </Box>
          </Box>
        ) : null}
      </FormDialog>
    </Box>
  );
}
