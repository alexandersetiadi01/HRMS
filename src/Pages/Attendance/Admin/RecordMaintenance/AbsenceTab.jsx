import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";

import {
  apiAttendanceAbsences,
  apiAttendanceAdminMeta,
  apiCreateAttendanceAbsence,
  apiRevokeAttendanceAbsence,
  apiUpdateAttendanceAbsence,
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
  status: "",
  date_from: "",
  date_to: "",
};

const EMPTY_FORM = {
  employee_id: "",
  work_date: "",
  absence_hours: "",
  reason: "",
};

const STATUS_OPTIONS = [
  { value: "", label: "全部狀態" },
  { value: "active", label: "生效中" },
  { value: "revoked", label: "已撤銷" },
];

const TABLE_COLUMNS = [
  { key: "employee", label: "員工", width: "1.4fr" },
  { key: "work_date", label: "日期", width: "1fr" },
  { key: "absence_hours", label: "曠職時數", width: "0.9fr" },
  { key: "calculated_absent_hours", label: "系統缺勤時數", width: "1fr" },
  { key: "source", label: "來源", width: "1fr" },
  { key: "status", label: "狀態", width: "0.8fr" },
  { key: "reason", label: "原因", width: "1.3fr" },
  { key: "actions", label: "操作", width: "120px" },
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

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  const raw = String(value || "").trim();
  return raw ? raw.replace(/-/g, "/").slice(0, 10) : "-";
}

function formatHours(value) {
  const hours = Number(value);

  if (!Number.isFinite(hours)) {
    return "-";
  }

  return `${hours.toFixed(2)} 小時`;
}

function formatStatus(value) {
  const map = {
    active: "生效中",
    revoked: "已撤銷",
  };

  return map[value] || value || "-";
}

export default function AbsenceTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [unitOptions, setUnitOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [revokeRow, setRevokeRow] = useState(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeError, setRevokeError] = useState("");
  const [revoking, setRevoking] = useState(false);
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
        const [meta, absenceResult] = await Promise.all([
          apiAttendanceAdminMeta(),
          apiAttendanceAbsences(),
        ]);

        setUnitOptions([
          { value: "", label: "全部單位" },
          ...(Array.isArray(meta?.unitOptions) ? meta.unitOptions : []),
        ]);

        setEmployeeOptions(
          Array.isArray(meta?.employeeOptions) ? meta.employeeOptions : [],
        );

        setRows(getItems(absenceResult));
      } catch (error) {
        console.error(error);
        setRows([]);
        setErrorText("無法載入曠職紀錄。");
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

  const loadRows = async (nextFilters) => {
    const result = await apiAttendanceAbsences({
      employee_id: nextFilters.employee_id || undefined,
      status: nextFilters.status || undefined,
      date_from: nextFilters.date_from || undefined,
      date_to: nextFilters.date_to || undefined,
    });

    setRows(getItems(result));
  };

  const handleFilterChange = (field, value) => {
    setFilters((current) => {
      const next = { ...current, [field]: value };

      if (field === "unit_id") {
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
      setErrorText("無法載入曠職紀錄。");
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
      setErrorText("無法載入曠職紀錄。");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRow(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditingRow(row);
    setForm({
      employee_id: String(row.employee_id || ""),
      work_date: String(row.work_date || ""),
      absence_hours: String(row.absence_hours || ""),
      reason: String(row.reason || ""),
    });
    setFormError("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (submitting) {
      return;
    }

    setFormOpen(false);
    setEditingRow(null);
    setFormError("");
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!editingRow && !form.employee_id) {
      setFormError("請選擇員工。");
      return;
    }

    if (!editingRow && !form.work_date) {
      setFormError("請選擇曠職日期。");
      return;
    }

    const absenceHours = Number(form.absence_hours);

    if (!Number.isFinite(absenceHours) || absenceHours <= 0 || absenceHours > 24) {
      setFormError("曠職時數必須大於 0 且不可超過 24 小時。");
      return;
    }

    if (!form.reason.trim()) {
      setFormError("請輸入曠職原因。");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      if (editingRow) {
        await apiUpdateAttendanceAbsence(editingRow.absence_id, {
          absence_hours: absenceHours,
          reason: form.reason.trim(),
        });
      } else {
        await apiCreateAttendanceAbsence({
          employee_id: Number(form.employee_id),
          work_date: form.work_date,
          absence_hours: absenceHours,
          reason: form.reason.trim(),
        });
      }

      setFormOpen(false);
      setEditingRow(null);
      setSuccessDialog({
        open: true,
        title: editingRow ? "更新成功" : "新增成功",
        message: editingRow ? "曠職紀錄已成功更新。" : "曠職紀錄已成功建立。",
      });

      await loadRows(appliedFilters);
    } catch (error) {
      console.error(error);
      setFormError(
        getErrorMessage(
          error,
          editingRow ? "更新曠職紀錄失敗。" : "新增曠職紀錄失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRevoke = (row) => {
    setRevokeRow(row);
    setRevokeReason("");
    setRevokeError("");
  };

  const handleCloseRevoke = () => {
    if (revoking) {
      return;
    }

    setRevokeRow(null);
    setRevokeReason("");
    setRevokeError("");
  };

  const handleConfirmRevoke = async () => {
    if (!revokeRow?.absence_id) {
      return;
    }

    if (!revokeReason.trim()) {
      setRevokeError("請輸入撤銷原因。");
      return;
    }

    setRevoking(true);
    setRevokeError("");

    try {
      await apiRevokeAttendanceAbsence(revokeRow.absence_id, revokeReason.trim());

      setRevokeRow(null);
      setRevokeReason("");
      setSuccessDialog({
        open: true,
        title: "撤銷成功",
        message: "曠職紀錄已成功撤銷。",
      });

      await loadRows(appliedFilters);
    } catch (error) {
      console.error(error);
      setRevokeError(getErrorMessage(error, "撤銷曠職紀錄失敗。"));
    } finally {
      setRevoking(false);
    }
  };

  const renderTableValue = (row, column) => {
    if (column.key === "work_date") {
      return formatDate(row.work_date);
    }

    if (column.key === "absence_hours") {
      return formatHours(row.absence_hours);
    }

    if (column.key === "calculated_absent_hours") {
      return formatHours(row.calculated_absent_hours);
    }

    if (column.key === "source") {
      return row.source_anomaly_id ? "出勤異常轉入" : "管理員新增";
    }

    if (column.key === "status") {
      return formatStatus(row.status);
    }

    if (column.key === "actions") {
      if (row.status === "revoked") {
        return "-";
      }

      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Button
            size="small"
            startIcon={<EditOutlinedIcon />}
            onClick={() => handleOpenEdit(row)}
          >
            修改
          </Button>

          <Button
            size="small"
            startIcon={<UndoOutlinedIcon />}
            onClick={() => handleOpenRevoke(row)}
          >
            撤銷
          </Button>
        </Box>
      );
    }

    return row[column.key] || "-";
  };

  return (
    <Box sx={{ p: { xs: "14px", sm: "20px" } }}>
      <Box
        sx={{
          mb: "18px",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
            曠職
          </Typography>

          <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
            查詢及管理已確認的員工曠職紀錄
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={handleOpenCreate}>
          新增曠職
        </Button>
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
        getRowKey={(row) => row.absence_id}
        mobileCardTitleKey="employee"
        emptyText={loading ? "讀取中..." : "查無曠職紀錄"}
        desktopMinWidth="920px"
        renderValue={renderTableValue}
      />

      <FormDialog
        open={formOpen}
        title={editingRow ? "修改曠職" : "新增曠職"}
        submitting={submitting}
        submitLabel={editingRow ? "儲存修改" : "新增"}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formError ? <Alert severity="error">{formError}</Alert> : null}

        <SelectField
          label="員工"
          required
          value={form.employee_id}
          onChange={(value) => handleFormChange("employee_id", value)}
          options={employeeOptions}
          fullWidth
          height="38px"
          disabled={Boolean(editingRow)}
        />

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "14px", fontWeight: 500 }}>
            曠職日期
          </Typography>

          <Box
            sx={{
              pointerEvents: editingRow ? "none" : "auto",
              opacity: editingRow ? 0.6 : 1,
            }}
          >
            {renderDateField(form.work_date, (event) =>
              handleFormChange("work_date", event.target.value),
            )}
          </Box>
        </Box>

        <TextField
          required
          fullWidth
          type="number"
          label="曠職時數"
          value={form.absence_hours}
          onChange={(event) => handleFormChange("absence_hours", event.target.value)}
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
          value={form.reason}
          onChange={(event) => handleFormChange("reason", event.target.value)}
        />
      </FormDialog>

      <FormDialog
        open={Boolean(revokeRow)}
        title="撤銷曠職"
        submitting={revoking}
        submitLabel="確認撤銷"
        onClose={handleCloseRevoke}
        onSubmit={handleConfirmRevoke}
      >
        {revokeError ? <Alert severity="error">{revokeError}</Alert> : null}

        {revokeRow ? (
          <Box sx={{ p: "12px", borderRadius: "6px", bgcolor: "#f9fafb" }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>
              {revokeRow.employee}
            </Typography>

            <Typography sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}>
              {formatDate(revokeRow.work_date)}　{formatHours(revokeRow.absence_hours)}
            </Typography>
          </Box>
        ) : null}

        <TextField
          required
          fullWidth
          multiline
          minRows={3}
          label="撤銷原因"
          value={revokeReason}
          onChange={(event) => setRevokeReason(event.target.value)}
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