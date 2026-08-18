import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import {
  apiAttendanceAdminMeta,
  apiAttendanceShiftGroupAssignments,
  apiAttendanceShiftGroups,
  apiCreateAttendanceShiftGroupAssignment,
  apiDeleteAttendanceShiftGroupAssignment,
  apiUpdateAttendanceShiftGroupAssignment,
} from "../../../../API/attendance";

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
  shift_group_id: "",
};

const INITIAL_FORM = {
  employee_id: "",
  shift_group_id: "",
  effective_start_date: "",
  effective_end_date: "",
};

const TABLE_COLUMNS = [
  { key: "employee", label: "員工", width: "1.35fr" },
  { key: "unit_label", label: "單位", width: "1.2fr" },
  { key: "shift_group", label: "班別", width: "1.2fr" },
  { key: "effective_start_date_text", label: "開始日", width: "0.9fr" },
  { key: "effective_end_date_text", label: "結束日", width: "0.9fr" },
  { key: "status_text", label: "狀態", width: "0.75fr" },
  { key: "actions", label: "操作", width: "90px" },
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

  return raw ? raw.replace(/-/g, "/").slice(0, 10) : "-";
}

function formatAssignmentStatus(row) {
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Taipei",
  });

  const startDate = String(row?.effective_start_date || "");
  const endDate = String(row?.effective_end_date || "");

  if (String(row?.status || "") !== "active") {
    return "停用";
  }

  if (startDate && startDate > today) {
    return "未生效";
  }

  if (endDate && endDate < today) {
    return "已結束";
  }

  return "生效中";
}

export default function ShiftGroupAssignments() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [unitOptions, setUnitOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [shiftGroupOptions, setShiftGroupOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrorText, setFormErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

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
  const assignmentEmployeeOptions = useMemo(() => {
    return employeeOptions.map((employee) => ({
      value: String(employee.employee_id || employee.value || ""),
      label:
        employee.label ||
        (employee.employee_no && employee.display_name
          ? `${employee.employee_no}/${employee.display_name}`
          : employee.display_name ||
            employee.employee_no ||
            `#${employee.employee_id || employee.value}`),
    }));
  }, [employeeOptions]);
  const displayRows = useMemo(() => {
    return rows
      .map((row) => {
        const employee = employeeMap.get(Number(row.employee_id || 0));

        return {
          ...row,
          employee:
            employee?.label ||
            (row.employee_no && row.display_name
              ? `${row.employee_no}/${row.display_name}`
              : row.display_name || row.employee_no || `#${row.employee_id}`),
          unit_id: Number(employee?.unit_id || 0),
          unit_label: employee?.unit_label || "-",
          shift_group:
            row.shift_group_code && row.shift_group_name
              ? `${row.shift_group_code}/${row.shift_group_name}`
              : row.shift_group_name || row.shift_group_code || "-",
          effective_start_date_text: formatDate(row.effective_start_date),
          effective_end_date_text: formatDate(row.effective_end_date),
          status_text: formatAssignmentStatus(row),
        };
      })
      .filter((row) => {
        if (
          appliedFilters.unit_id &&
          String(row.unit_id || "") !== String(appliedFilters.unit_id)
        ) {
          return false;
        }

        return true;
      });
  }, [rows, employeeMap, appliedFilters.unit_id]);

  const loadMeta = useCallback(async () => {
    const [meta, shiftGroupResponse] = await Promise.all([
      apiAttendanceAdminMeta(),
      apiAttendanceShiftGroups({ status: "active" }),
    ]);

    setUnitOptions([
      { value: "", label: "全部單位" },
      ...(Array.isArray(meta?.unitOptions) ? meta.unitOptions : []),
    ]);

    setEmployeeOptions(
      Array.isArray(meta?.employeeOptions) ? meta.employeeOptions : [],
    );

    setShiftGroupOptions([
      { value: "", label: "全部班別" },
      ...getItems(shiftGroupResponse).map((row) => ({
        value: String(row.shift_group_id),
        label:
          row.shift_group_code && row.shift_group_name
            ? `${row.shift_group_code}/${row.shift_group_name}`
            : row.shift_group_name ||
              row.shift_group_code ||
              `#${row.shift_group_id}`,
      })),
    ]);
  }, []);

  const loadRows = useCallback(async (nextFilters) => {
    const response = await apiAttendanceShiftGroupAssignments({
      employee_id: nextFilters.employee_id || undefined,
      shift_group_id: nextFilters.shift_group_id || undefined,
    });

    setRows(getItems(response));
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoadingMeta(true);
      setLoading(true);
      setErrorText("");

      try {
        await Promise.all([loadMeta(), loadRows(INITIAL_FILTERS)]);
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setErrorText("無法載入人員班別設定資料。");
        }
      } finally {
        if (active) {
          setLoadingMeta(false);
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

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      setAppliedFilters(filters);
      await loadRows(filters);
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText("無法載入人員班別設定資料。");
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
      setErrorText("無法載入人員班別設定資料。");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRow(null);
    setForm(INITIAL_FORM);
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditingRow(row);
    setForm({
      employee_id: String(row.employee_id || ""),
      shift_group_id: String(row.shift_group_id || ""),
      effective_start_date: String(row.effective_start_date || ""),
      effective_end_date: String(row.effective_end_date || ""),
    });
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (submitting) return;

    setFormOpen(false);
    setEditingRow(null);
    setForm(INITIAL_FORM);
    setFormErrorText("");
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const employeeId = Number(form.employee_id || 0);
    const shiftGroupId = Number(form.shift_group_id || 0);
    const effectiveStartDate = String(form.effective_start_date || "");
    const effectiveEndDate = String(form.effective_end_date || "");

    if (employeeId <= 0) {
      setFormErrorText("請選擇員工。");
      return;
    }

    if (shiftGroupId <= 0) {
      setFormErrorText("請選擇班別。");
      return;
    }

    if (!effectiveStartDate) {
      setFormErrorText("請選擇班別生效開始日。");
      return;
    }

    if (effectiveEndDate && effectiveEndDate < effectiveStartDate) {
      setFormErrorText("班別生效結束日不可早於開始日。");
      return;
    }

    const payload = {
      employee_id: employeeId,
      shift_group_id: shiftGroupId,
      effective_start_date: effectiveStartDate,
      effective_end_date: effectiveEndDate,
    };

    setSubmitting(true);
    setFormErrorText("");

    try {
      const editing = Boolean(editingRow);

      const response = editingRow
        ? await apiUpdateAttendanceShiftGroupAssignment(
            editingRow.assignment_id,
            payload,
          )
        : await apiCreateAttendanceShiftGroupAssignment(payload);

      const responseData = response?.data ?? response;
      const generation = responseData?.generation || {};
      const insertedCount = Number(generation.inserted || 0);
      const updatedCount = Number(generation.updated || 0);
      const generatedCount = insertedCount + updatedCount;
      const clearedCount = Number(responseData?.cleared_schedule_count || 0);

      setFormOpen(false);
      setEditingRow(null);
      setForm(INITIAL_FORM);
      await loadRows(appliedFilters);

      setSuccessDialog({
        open: true,
        title: editing ? "更新成功" : "新增成功",
        message: editing
          ? `人員班別設定已成功更新，清除 ${clearedCount} 筆原班表，並重新產生 ${generatedCount} 筆未來班表。`
          : `人員班別設定已成功新增，並產生 ${generatedCount} 筆未來班表。`,
      });
    } catch (error) {
      console.error(error);
      setFormErrorText(
        error?.response?.data?.message ||
          (editingRow ? "更新人員班別設定失敗。" : "新增人員班別設定失敗。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const editingStarted = useMemo(() => {
    if (!editingRow?.effective_start_date) return false;

    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Taipei",
    });

    return String(editingRow.effective_start_date) <= today;
  }, [editingRow]);

  const handleOpenDelete = (row) => {
    setDeleteRow(row);
    setErrorText("");
  };

  const handleCloseDelete = () => {
    if (deleteSubmitting) return;

    setDeleteRow(null);
  };

  const handleDelete = async () => {
    const assignmentId = Number(deleteRow?.assignment_id || 0);

    if (assignmentId <= 0) return;

    setDeleteSubmitting(true);
    setErrorText("");

    try {
      const response =
        await apiDeleteAttendanceShiftGroupAssignment(assignmentId);

      const responseData = response?.data ?? response;
      const clearedCount = Number(responseData?.cleared_schedule_count || 0);

      setDeleteRow(null);
      await loadRows(appliedFilters);

      setSuccessDialog({
        open: true,
        title: "刪除成功",
        message: `人員班別設定已成功刪除，並清除 ${clearedCount} 筆未來班表。`,
      });
    } catch (error) {
      console.error(error);
      setErrorText(
        error?.response?.data?.message || "刪除人員班別設定失敗。",
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const assignmentStarted = (row) => {
    const startDate = String(row?.effective_start_date || "");

    if (!startDate) return false;

    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Taipei",
    });

    return startDate <= today;
  };

  const renderTableValue = (row, column) => {
    if (column.key === "actions") {
      const started = assignmentStarted(row);

      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <Tooltip title="編輯">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {!started ? (
            <Tooltip title="刪除">
              <IconButton size="small" onClick={() => handleOpenDelete(row)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      );
    }

    return row[column.key] ?? "-";
  };

  return (
    <Box>
      <Box
        sx={{
          mb: "18px",
          display: "flex",
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: "12px",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            人員班別設定
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            管理員工班別、生效期間及班別異動紀錄
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          disabled={loadingMeta}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          新增人員班別
        </Button>
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
              onChange={(value) => handleFilterChange("employee_id", value)}
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

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                mb: "6px",
                fontSize: "15px",
                fontWeight: 500,
              }}
            >
              班別
            </Typography>

            <SelectField
              value={filters.shift_group_id}
              onChange={(value) => handleFilterChange("shift_group_id", value)}
              options={shiftGroupOptions}
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
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <ActionButtons
            onClear={handleClear}
            onSearch={handleSearch}
            disabled={loadingMeta || loading}
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
          rows={displayRows}
          getRowKey={(row) => row.assignment_id}
          mobileCardTitleKey="employee"
          emptyText="查無人員班別設定資料"
          renderValue={renderTableValue}
          fitToContainer
          pagination
          rowsPerPage={10}
        />
      </Box>

      <FormDialog
        open={formOpen}
        title={editingRow ? "編輯人員班別" : "新增人員班別"}
        submitLabel={editingRow ? "更新" : "新增"}
        submitting={submitting}
        maxWidth="sm"
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formErrorText ? (
          <Alert severity="error">{formErrorText}</Alert>
        ) : null}

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            員工
          </Typography>

          <SelectField
            value={form.employee_id}
            onChange={(value) => handleFormChange("employee_id", value)}
            options={assignmentEmployeeOptions}
            displayEmpty
            fullWidth
            height="38px"
            disabled={submitting || editingStarted}
          />
        </Box>

        <Box>
          <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
            班別
          </Typography>

          <SelectField
            value={form.shift_group_id}
            onChange={(value) => handleFormChange("shift_group_id", value)}
            options={shiftGroupOptions.filter((option) => option.value)}
            displayEmpty
            fullWidth
            height="38px"
            disabled={submitting || editingStarted}
          />
        </Box>

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
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              開始日
            </Typography>

            <TextField
              type="date"
              value={form.effective_start_date}
              onChange={(event) =>
                handleFormChange("effective_start_date", event.target.value)
              }
              fullWidth
              size="small"
              disabled={submitting || editingStarted}
            />
          </Box>

          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              結束日
            </Typography>

            <TextField
              type="date"
              value={form.effective_end_date}
              onChange={(event) =>
                handleFormChange("effective_end_date", event.target.value)
              }
              fullWidth
              size="small"
              disabled={submitting}
            />
          </Box>
        </Box>

        {editingStarted ? (
          <Typography
            sx={{
              fontSize: "13px",
              color: "#6b7280",
              lineHeight: 1.6,
            }}
          >
            此班別設定已生效，員工、班別及開始日需保留歷史紀錄，只能調整結束日。
          </Typography>
        ) : (
          <Typography
            sx={{
              fontSize: "13px",
              color: "#6b7280",
              lineHeight: 1.6,
            }}
          >
            同一員工的班別生效期間不可重疊。
          </Typography>
        )}
      </FormDialog>

      <FormDialog
        open={Boolean(deleteRow)}
        title="確認刪除"
        submitLabel="刪除"
        cancelLabel="取消"
        submitting={deleteSubmitting}
        maxWidth="xs"
        onClose={handleCloseDelete}
        onSubmit={handleDelete}
      >
        <Typography
          sx={{
            fontSize: "15px",
            color: "#374151",
            lineHeight: 1.7,
          }}
        >
          {`確認刪除「${deleteRow?.employee || deleteRow?.display_name || ""}」的未生效班別設定？`}
        </Typography>

        <Typography
          sx={{
            mt: "8px",
            fontSize: "13px",
            color: "#6b7280",
            lineHeight: 1.6,
          }}
        >
          已生效的班別設定需保留歷史紀錄，因此無法刪除。
        </Typography>
      </FormDialog>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() =>
          setSuccessDialog({
            open: false,
            title: "",
            message: "",
          })
        }
      />
    </Box>
  );
}
