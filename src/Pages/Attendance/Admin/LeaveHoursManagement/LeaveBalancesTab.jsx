import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  apiLeaveApplicationMeta,
  apiLeaveBalances,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";

const INITIAL_FILTERS = {
  unit: "",
  employee_id: "",
  leave_type_id: "",
};

const TABLE_COLUMNS = [
  { key: "employee", label: "員工", width: "1.4fr" },
  { key: "leave_name", label: "假別", width: "1.2fr" },
  { key: "granted_hours", label: "核給時數", width: "1fr" },
  { key: "used_hours", label: "已使用", width: "1fr" },
  { key: "remaining_hours", label: "剩餘時數", width: "1fr" },
  { key: "valid_period", label: "有效期限", width: "1.5fr" },
  { key: "actions", label: "操作", width: "100px" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
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

function buildValidPeriod(validFrom, validTo) {
  const from = formatDate(validFrom);
  const to = formatDate(validTo);

  if (from === "-" && to === "-") {
    return "-";
  }

  if (from === "-") {
    return `~ ${to}`;
  }

  if (to === "-") {
    return `${from} ~`;
  }

  return `${from} ~ ${to}`;
}

export default function LeaveBalancesTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [unitOptions, setUnitOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [detailRow, setDetailRow] = useState(null);

  const filteredEmployeeOptions = useMemo(() => {
    if (!filters.unit) {
      return employeeOptions;
    }

    return employeeOptions.filter(
      (employee) => String(employee.unit_label || "") === String(filters.unit),
    );
  }, [employeeOptions, filters.unit]);

  const employeeMap = useMemo(
    () =>
      new Map(
        employeeOptions.map((employee) => [
          Number(employee.employee_id || employee.value || 0),
          employee,
        ]),
      ),
    [employeeOptions],
  );

  const leaveTypeOptions = useMemo(() => {
    const optionMap = new Map();

    rows.forEach((row) => {
      const leaveTypeId = Number(row.leave_type_id || 0);
      const leaveName = String(row.leave_name || "").trim();

      if (leaveTypeId > 0 && leaveName && !optionMap.has(leaveTypeId)) {
        optionMap.set(leaveTypeId, {
          value: leaveTypeId,
          label: leaveName,
        });
      }
    });

    return [
      { value: "", label: "全部假別" },
      ...Array.from(optionMap.values()),
    ];
  }, [rows]);

  const displayRows = useMemo(() => {
    return rows
      .map((row) => {
        const employee = employeeMap.get(Number(row.employee_id || 0));

        return {
          ...row,
          employee:
            row.employee_no && row.employee_name
              ? `${row.employee_no}/${row.employee_name}`
              : employee?.label ||
                row.employee_name ||
                row.employee_no ||
                `#${row.employee_id}`,
          unit_label: employee?.unit_label || "",
          valid_period: buildValidPeriod(row.valid_from, row.valid_to),
        };
      })
      .filter((row) => {
        if (
          appliedFilters.unit &&
          String(row.unit_label || "") !== String(appliedFilters.unit)
        ) {
          return false;
        }

        return true;
      });
  }, [rows, employeeMap, appliedFilters.unit]);

  const loadMeta = useCallback(async () => {
    const meta = await apiLeaveApplicationMeta();

    setUnitOptions([
      { value: "", label: "全部單位" },
      ...(Array.isArray(meta?.unitOptions) ? meta.unitOptions : []),
    ]);

    setEmployeeOptions(
      Array.isArray(meta?.employeeOptions) ? meta.employeeOptions : [],
    );
  }, []);

  const loadRows = useCallback(async (nextFilters) => {
    const result = await apiLeaveBalances({
      employee_id: nextFilters.employee_id || undefined,
      leave_type_id: nextFilters.leave_type_id || undefined,
      use_current_employee: false,
    });

    setRows(getItems(result));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        await Promise.all([loadMeta(), loadRows(INITIAL_FILTERS)]);
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setErrorText("無法載入剩餘假別時數資料。");
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
  }, [loadMeta, loadRows]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => {
      const next = { ...current, [field]: value };

      if (field === "unit") {
        next.employee_id = "";
      }

      return next;
    });
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
      setErrorText("無法載入剩餘假別時數資料。");
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
      setErrorText("無法載入剩餘假別時數資料。");
    } finally {
      setLoading(false);
    }
  };

  const renderTableValue = (row, column) => {
    if (
      [
        "granted_hours",
        "used_hours",
        "remaining_hours",
      ].includes(column.key)
    ) {
      return formatHours(row[column.key]);
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
    <Box sx={{ p: { xs: "14px", sm: "20px" } }}>
      <Box sx={{ mb: "18px" }}>
        <Typography
          sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
        >
          剩餘假別時數
        </Typography>

        <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
          查詢員工假別核給、已使用及剩餘時數
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
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              單位
            </Typography>

            <SelectField
              value={filters.unit}
              onChange={(value) => handleFilterChange("unit", value)}
              options={unitOptions}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
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
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              假別
            </Typography>

            <SelectField
              value={filters.leave_type_id}
              onChange={(value) => handleFilterChange("leave_type_id", value)}
              options={leaveTypeOptions}
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
          getRowKey={(row) =>
            `${row.balance_source || "balance"}-${row.balance_source_id || 0}-${row.employee_id}-${row.leave_type_id}-${row.relation_type || ""}`
          }
          mobileCardTitleKey="employee"
          emptyText="查無剩餘假別時數資料"
          desktopMinWidth="900px"
          renderValue={renderTableValue}
          mergeColumns={["employee"]}
          pagination
          rowsPerPage={10}
        />
      </Box>

      <FormDialog
        open={Boolean(detailRow)}
        title="假別時數詳細"
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
                假別
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.leave_name || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                核給時數
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatHours(detailRow.granted_hours)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                已使用時數
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatHours(detailRow.used_hours)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                剩餘時數
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatHours(detailRow.remaining_hours)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                年度
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.request_year || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                有效開始日
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatDate(detailRow.valid_from)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                有效結束日
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {formatDate(detailRow.valid_to)}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                額度來源
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.balance_source || "-"}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                關係 / 類別
              </Typography>
              <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                {detailRow.relation_type || "-"}
              </Typography>
            </Box>
          </Box>
        ) : null}
      </FormDialog>
    </Box>
  );
}