import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  apiAttendanceAdminMeta,
  apiAttendanceUnitParameterCandidates,
  apiAttendanceUnitParameters,
  apiUpdateAttendanceUnitParameters,
} from "../../../../API/attendance";

const TABLE_COLUMNS = [
  { key: "employee", label: "人員", width: "1.5fr" },
  { key: "unit", label: "所屬單位", width: "1.4fr" },
  { key: "permission_summary", label: "權限摘要", width: "1.5fr" },
  { key: "actions", label: "操作", width: "100px" },
];

const INITIAL_ADD_FORM = {
  employee: null,
  can_manage_schedule: true,
  proxy_form_types: [],
};

function unwrapData(response, fallback = null) {
  return response?.data?.data ?? response?.data ?? response ?? fallback;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function employeeLabel(employee = {}) {
  const employeeNo = String(employee?.employee_no || "").trim();
  const displayName = String(employee?.display_name || "").trim();

  if (employeeNo && displayName) {
    return `${employeeNo}/${displayName}`;
  }

  return employeeNo || displayName || "";
}

function employeeUnitLabel(employee = {}) {
  return (
    String(employee?.unit_name || employee?.unit_label || "").trim() || "-"
  );
}

function normalizeProxyFormTypes(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.keys(value);
}

export default function UnitParameterSettingsTab() {
  const [unitOptions, setUnitOptions] = useState([]);
  const [unitId, setUnitId] = useState("");
  const [rows, setRows] = useState([]);
  const [proxyFormTypes, setProxyFormTypes] = useState({});
  const [viewMode, setViewMode] = useState("all");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageErrorText, setPageErrorText] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(INITIAL_ADD_FORM);
  const [candidateOptions, setCandidateOptions] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addErrorText, setAddErrorText] = useState("");
  const [permissionRow, setPermissionRow] = useState(null);
  const [permissionForm, setPermissionForm] = useState({
    can_manage_schedule: false,
    proxy_form_types: [],
  });
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [permissionErrorText, setPermissionErrorText] = useState("");

  const [deleteRow, setDeleteRow] = useState(null);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const proxyTypeEntries = useMemo(
    () => Object.entries(proxyFormTypes || {}),
    [proxyFormTypes],
  );

  const displayRows = useMemo(() => {
    if (viewMode === "schedule") {
      return rows.filter((row) => Boolean(row.can_manage_schedule));
    }

    if (viewMode === "proxy") {
      return rows.filter(
        (row) =>
          Array.isArray(row.proxy_form_types) &&
          row.proxy_form_types.length > 0,
      );
    }

    return rows;
  }, [rows, viewMode]);

  useEffect(() => {
    let active = true;

    const loadMeta = async () => {
      setLoadingMeta(true);
      setPageErrorText("");

      try {
        const meta = await apiAttendanceAdminMeta();
        const options = Array.isArray(meta?.unitOptions)
          ? meta.unitOptions
          : [];

        if (!active) return;

        setUnitOptions(options);

        if (options.length > 0) {
          setUnitId((current) => current || String(options[0].value || ""));
        }
      } catch (error) {
        if (!active) return;
        setPageErrorText(getErrorMessage(error, "載入單位資料失敗。"));
      } finally {
        if (active) {
          setLoadingMeta(false);
        }
      }
    };

    loadMeta();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!unitId) {
      setRows([]);
      setProxyFormTypes({});
      return;
    }

    let active = true;

    const loadUnitParameters = async () => {
      setLoadingUnit(true);
      setPageErrorText("");

      try {
        const response = await apiAttendanceUnitParameters(unitId);
        const data = unwrapData(response, {});

        if (!active) return;

        setRows(
          (Array.isArray(data?.items) ? data.items : []).map((item) => ({
            ...item,
            employee_id: Number(item?.employee_id || 0),
            can_manage_schedule: Boolean(item?.can_manage_schedule),
            proxy_form_types: normalizeProxyFormTypes(item?.proxy_form_types),
          })),
        );

        setProxyFormTypes(
          data?.proxy_form_types && typeof data.proxy_form_types === "object"
            ? data.proxy_form_types
            : {},
        );
      } catch (error) {
        if (!active) return;
        setRows([]);
        setProxyFormTypes({});
        setPageErrorText(getErrorMessage(error, "載入單位參數設定失敗。"));
      } finally {
        if (active) {
          setLoadingUnit(false);
        }
      }
    };

    loadUnitParameters();

    return () => {
      active = false;
    };
  }, [unitId]);

  useEffect(() => {
    if (!addOpen) {
      setCandidateOptions([]);
      setCandidateLoading(false);
      return undefined;
    }

    let active = true;

    const loadCandidates = async () => {
      setCandidateLoading(true);

      try {
        const response = await apiAttendanceUnitParameterCandidates();
        const data = unwrapData(response, []);

        if (!active) return;

        const configuredIds = new Set(
          rows.map((row) => Number(row.employee_id || 0)),
        );

        setCandidateOptions(
          (Array.isArray(data) ? data : []).filter(
            (employee) =>
              Number(employee?.employee_id || 0) > 0 &&
              !configuredIds.has(Number(employee?.employee_id || 0)),
          ),
        );
      } catch {
        if (!active) return;
        setCandidateOptions([]);
      } finally {
        if (active) {
          setCandidateLoading(false);
        }
      }
    };

    loadCandidates();

    return () => {
      active = false;
    };
  }, [addOpen, rows]);

  const handleUnitChange = (event) => {
    setUnitId(event.target.value);
    setViewMode("all");
  };

  const handleViewModeChange = (_event, value) => {
    if (value) {
      setViewMode(value);
    }
  };

  const handleOpenPermission = (row) => {
    setPermissionRow(row);
    setPermissionForm({
      can_manage_schedule: Boolean(row.can_manage_schedule),
      proxy_form_types: Array.isArray(row.proxy_form_types)
        ? [...row.proxy_form_types]
        : [],
    });
    setPermissionErrorText("");
  };

  const handleClosePermission = () => {
    if (permissionSaving) return;

    setPermissionRow(null);
    setPermissionForm({
      can_manage_schedule: false,
      proxy_form_types: [],
    });
    setPermissionErrorText("");
  };

  const handlePermissionProxyTypeChange = (formType, checked) => {
    setPermissionForm((current) => ({
      ...current,
      proxy_form_types: checked
        ? Array.from(new Set([...current.proxy_form_types, formType]))
        : current.proxy_form_types.filter((item) => item !== formType),
    }));
  };

  const handleUpdatePermission = async () => {
    if (!permissionRow) return;

    if (
      !permissionForm.can_manage_schedule &&
      permissionForm.proxy_form_types.length === 0
    ) {
      setPermissionErrorText("請至少設定排班管理或一項代申請表單權限。");
      return;
    }

    const nextRows = rows.map((row) =>
      Number(row.employee_id) === Number(permissionRow.employee_id)
        ? {
            ...row,
            can_manage_schedule: Boolean(permissionForm.can_manage_schedule),
            proxy_form_types: [...permissionForm.proxy_form_types],
          }
        : row,
    );

    setPermissionSaving(true);
    setPermissionErrorText("");

    try {
      const response = await apiUpdateAttendanceUnitParameters(
        unitId,
        nextRows.map((row) => ({
          employee_id: Number(row.employee_id),
          can_manage_schedule: Boolean(row.can_manage_schedule),
          proxy_form_types: Array.isArray(row.proxy_form_types)
            ? row.proxy_form_types
            : [],
        })),
      );

      const data = unwrapData(response, {});

      setRows(
        (Array.isArray(data?.items) ? data.items : []).map((item) => ({
          ...item,
          employee_id: Number(item?.employee_id || 0),
          can_manage_schedule: Boolean(item?.can_manage_schedule),
          proxy_form_types: normalizeProxyFormTypes(item?.proxy_form_types),
        })),
      );

      setProxyFormTypes(
        data?.proxy_form_types && typeof data.proxy_form_types === "object"
          ? data.proxy_form_types
          : proxyFormTypes,
      );

      setPermissionRow(null);
      setPermissionForm({
        can_manage_schedule: false,
        proxy_form_types: [],
      });
      setPermissionErrorText("");

      setSuccessDialog({
        open: true,
        title: "更新成功",
        message: "人員權限已成功更新。",
      });
    } catch (error) {
      setPermissionErrorText(getErrorMessage(error, "更新人員權限失敗。"));
    } finally {
      setPermissionSaving(false);
    }
  };

  const handleOpenDelete = (row) => {
    if (saving) return;
    setDeleteRow(row);
  };

  const handleCloseDelete = () => {
    if (saving) return;
    setDeleteRow(null);
  };

  const handleDelete = async (employeeId) => {
    if (!unitId || saving) return;

    const nextRows = rows.filter(
      (row) => Number(row.employee_id) !== Number(employeeId),
    );

    setSaving(true);
    setPageErrorText("");

    try {
      const response = await apiUpdateAttendanceUnitParameters(
        unitId,
        nextRows.map((row) => ({
          employee_id: Number(row.employee_id),
          can_manage_schedule: Boolean(row.can_manage_schedule),
          proxy_form_types: Array.isArray(row.proxy_form_types)
            ? row.proxy_form_types
            : [],
        })),
      );

      const data = unwrapData(response, {});

      setRows(
        (Array.isArray(data?.items) ? data.items : []).map((item) => ({
          ...item,
          employee_id: Number(item?.employee_id || 0),
          can_manage_schedule: Boolean(item?.can_manage_schedule),
          proxy_form_types: normalizeProxyFormTypes(item?.proxy_form_types),
        })),
      );

      setProxyFormTypes(
        data?.proxy_form_types && typeof data.proxy_form_types === "object"
          ? data.proxy_form_types
          : proxyFormTypes,
      );

      setDeleteRow(null);

      setSuccessDialog({
        open: true,
        title: "移除成功",
        message: "人員已成功從單位參數設定移除。",
      });
    } catch (error) {
      setPageErrorText(getErrorMessage(error, "移除人員失敗。"));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setAddForm(INITIAL_ADD_FORM);
    setCandidateOptions([]);
    setAddErrorText("");
    setAddOpen(true);
  };

  const handleCloseAdd = () => {
    if (candidateLoading || addSaving) return;

    setAddOpen(false);
    setAddForm(INITIAL_ADD_FORM);
    setCandidateOptions([]);
    setAddErrorText("");
  };

  const handleAddProxyTypeChange = (formType, checked) => {
    setAddForm((current) => ({
      ...current,
      proxy_form_types: checked
        ? Array.from(new Set([...current.proxy_form_types, formType]))
        : current.proxy_form_types.filter((item) => item !== formType),
    }));
  };

  const handleAdd = async () => {
    const employee = addForm.employee;

    if (!employee?.employee_id) {
      setAddErrorText("請先搜尋並選擇人員。");
      return;
    }

    if (!addForm.can_manage_schedule && addForm.proxy_form_types.length === 0) {
      setAddErrorText("請至少設定排班管理或一項代申請表單權限。");
      return;
    }

    const employeeId = Number(employee.employee_id);

    if (rows.some((row) => Number(row.employee_id) === employeeId)) {
      setAddErrorText("此人員已加入單位參數設定。");
      return;
    }

    const nextRows = [
      ...rows,
      {
        ...employee,
        employee_id: employeeId,
        can_manage_schedule: Boolean(addForm.can_manage_schedule),
        proxy_form_types: [...addForm.proxy_form_types],
      },
    ];

    setAddSaving(true);
    setAddErrorText("");

    try {
      const response = await apiUpdateAttendanceUnitParameters(
        unitId,
        nextRows.map((row) => ({
          employee_id: Number(row.employee_id),
          can_manage_schedule: Boolean(row.can_manage_schedule),
          proxy_form_types: Array.isArray(row.proxy_form_types)
            ? row.proxy_form_types
            : [],
        })),
      );

      const data = unwrapData(response, {});

      setRows(
        (Array.isArray(data?.items) ? data.items : []).map((item) => ({
          ...item,
          employee_id: Number(item?.employee_id || 0),
          can_manage_schedule: Boolean(item?.can_manage_schedule),
          proxy_form_types: normalizeProxyFormTypes(item?.proxy_form_types),
        })),
      );

      setProxyFormTypes(
        data?.proxy_form_types && typeof data.proxy_form_types === "object"
          ? data.proxy_form_types
          : proxyFormTypes,
      );

      setAddOpen(false);
      setAddForm(INITIAL_ADD_FORM);
      setCandidateOptions([]);
      setAddErrorText("");

      setSuccessDialog({
        open: true,
        title: "新增成功",
        message: "人員已成功加入單位參數設定。",
      });
    } catch (error) {
      setAddErrorText(getErrorMessage(error, "新增人員失敗。"));
    } finally {
      setAddSaving(false);
    }
  };

  const handleSave = async () => {
    if (!unitId) {
      setPageErrorText("請先選擇單位。");
      return;
    }

    const invalidRow = rows.find(
      (row) =>
        !row.can_manage_schedule &&
        (!Array.isArray(row.proxy_form_types) ||
          row.proxy_form_types.length === 0),
    );

    if (invalidRow) {
      setPageErrorText(
        `${employeeLabel(invalidRow) || "人員"}至少需要排班管理或一項代申請權限。`,
      );
      return;
    }

    setSaving(true);
    setPageErrorText("");

    try {
      const response = await apiUpdateAttendanceUnitParameters(
        unitId,
        rows.map((row) => ({
          employee_id: Number(row.employee_id),
          can_manage_schedule: Boolean(row.can_manage_schedule),
          proxy_form_types: Array.isArray(row.proxy_form_types)
            ? row.proxy_form_types
            : [],
        })),
      );

      const data = unwrapData(response, {});

      setRows(
        (Array.isArray(data?.items) ? data.items : []).map((item) => ({
          ...item,
          employee_id: Number(item?.employee_id || 0),
          can_manage_schedule: Boolean(item?.can_manage_schedule),
          proxy_form_types: normalizeProxyFormTypes(item?.proxy_form_types),
        })),
      );

      setProxyFormTypes(
        data?.proxy_form_types && typeof data.proxy_form_types === "object"
          ? data.proxy_form_types
          : proxyFormTypes,
      );

      setSuccessDialog({
        open: true,
        title: "儲存成功",
        message: "單位參數設定已成功儲存。",
      });
    } catch (error) {
      setPageErrorText(getErrorMessage(error, "儲存單位參數設定失敗。"));
    } finally {
      setSaving(false);
    }
  };

  const getPermissionSummary = (row) => {
    const parts = [];

    if (row.can_manage_schedule) {
      parts.push("排班管理");
    }

    const proxyCount = Array.isArray(row.proxy_form_types)
      ? row.proxy_form_types.length
      : 0;

    if (proxyCount > 0) {
      parts.push(`代申請 ${proxyCount} 項`);
    }

    return parts.join(" / ") || "-";
  };

  const renderValue = (row, column) => {
    if (column.key === "employee") {
      return employeeLabel(row) || "-";
    }

    if (column.key === "unit") {
      return employeeUnitLabel(row);
    }

    if (column.key === "permission_summary") {
      return getPermissionSummary(row);
    }

    if (column.key === "actions") {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <Tooltip title="詳細 / 編輯">
            <IconButton
              size="small"
              onClick={() => handleOpenPermission(row)}
              aria-label="詳細 / 編輯"
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="移除">
            <IconButton
              size="small"
              onClick={() => handleOpenDelete(row)}
              aria-label="移除"
              disabled={saving}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    return row[column.key] || "-";
  };

  const loading = loadingMeta || loadingUnit;

  return (
    <>
      <Box
        sx={{
          mb: "18px",
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
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
            單位參數設定
          </Typography>

          <Typography
            sx={{
              mt: "4px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            設定各單位的排班管理員與代申請表單權限。
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: "8px",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<AddOutlinedIcon />}
            disabled={!unitId || loading}
            onClick={handleOpenAdd}
          >
            新增人員
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            disabled={!unitId || loading || saving}
            onClick={handleSave}
          >
            {saving ? "儲存中..." : "儲存"}
          </Button>
        </Box>
      </Box>

      {pageErrorText ? (
        <Alert severity="error" sx={{ mb: "16px" }}>
          {pageErrorText}
        </Alert>
      ) : null}

      <Box
        sx={{
          mb: "16px",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(220px, 360px) auto",
          },
          alignItems: "center",
          gap: "12px",
        }}
      >
        <TextField
          select
          label="單位"
          value={unitId}
          onChange={handleUnitChange}
          size="small"
          disabled={loadingMeta}
          fullWidth
        >
          {unitOptions.map((unit) => (
            <MenuItem key={unit.value} value={String(unit.value)}>
              {unit.label}
            </MenuItem>
          ))}
        </TextField>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          size="small"
          onChange={handleViewModeChange}
          sx={{
            justifySelf: { xs: "stretch", md: "start" },
            "& .MuiToggleButton-root": {
              flex: { xs: 1, md: "none" },
              minWidth: { md: "84px" },
              px: "16px",
              textTransform: "none",
            },
          }}
        >
          <ToggleButton value="all">全部</ToggleButton>
          <ToggleButton value="schedule">排班</ToggleButton>
          <ToggleButton value="proxy">代申請</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box
          sx={{
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={30} />
        </Box>
      ) : (
        <ResponsiveAttendanceTable
          columns={TABLE_COLUMNS}
          rows={displayRows}
          getRowKey={(row) => row.employee_id}
          mobileCardTitleKey="employee"
          emptyText={unitId ? "查無單位參數設定" : "請先選擇單位"}
          renderValue={renderValue}
          pagination
          rowsPerPage={10}
          fitToContainer
        />
      )}

      <FormDialog
        open={addOpen}
        title="新增人員"
        submitting={addSaving}
        submitLabel="加入"
        onClose={handleCloseAdd}
        onSubmit={handleAdd}
      >
        {addErrorText ? <Alert severity="error">{addErrorText}</Alert> : null}

        <Autocomplete
          options={candidateOptions}
          value={addForm.employee}
          loading={candidateLoading}
          getOptionLabel={(option) => employeeLabel(option)}
          isOptionEqualToValue={(option, value) =>
            Number(option?.employee_id || 0) === Number(value?.employee_id || 0)
          }
          noOptionsText="查無符合的人員"
          onChange={(_event, value) => {
            setAddForm((current) => ({
              ...current,
              employee: value,
            }));
            setAddErrorText("");
          }}
          renderOption={(props, option) => (
            <Box
              component="li"
              {...props}
              key={option.employee_id}
              sx={{
                display: "flex !important",
                flexDirection: "column",
                alignItems: "flex-start !important",
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {employeeLabel(option)}
              </Typography>

              <Typography
                sx={{
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                {employeeUnitLabel(option)}
              </Typography>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="選擇人員"
              placeholder="選擇或輸入關鍵字篩選"
              size="small"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {candidateLoading ? <CircularProgress size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Box>
          <Typography
            sx={{
              mb: "6px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#374151",
            }}
          >
            排班權限
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={addForm.can_manage_schedule}
                onChange={(event) =>
                  setAddForm((current) => ({
                    ...current,
                    can_manage_schedule: event.target.checked,
                  }))
                }
              />
            }
            label="排班管理員"
          />
        </Box>

        <Box>
          <Typography
            sx={{
              mb: "6px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#374151",
            }}
          >
            代申請表單
          </Typography>

          {proxyTypeEntries.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: "2px 12px",
              }}
            >
              {proxyTypeEntries.map(([formType, label]) => (
                <FormControlLabel
                  key={formType}
                  control={
                    <Checkbox
                      checked={addForm.proxy_form_types.includes(formType)}
                      onChange={(event) =>
                        handleAddProxyTypeChange(formType, event.target.checked)
                      }
                    />
                  }
                  label={label}
                />
              ))}
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              查無可設定的代申請表單。
            </Typography>
          )}
        </Box>
      </FormDialog>

      <FormDialog
        open={Boolean(permissionRow)}
        title="人員權限詳細"
        submitting={permissionSaving}
        submitLabel="套用"
        onClose={handleClosePermission}
        onSubmit={handleUpdatePermission}
      >
        {permissionErrorText ? (
          <Alert severity="error">{permissionErrorText}</Alert>
        ) : null}

        <Box>
          <Typography sx={{ mb: "4px", fontSize: "13px", color: "#6b7280" }}>
            人員
          </Typography>

          <Typography
            sx={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}
          >
            {permissionRow ? employeeLabel(permissionRow) : "-"}
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ mb: "4px", fontSize: "13px", color: "#6b7280" }}>
            所屬單位
          </Typography>

          <Typography sx={{ fontSize: "15px", color: "#111827" }}>
            {permissionRow ? employeeUnitLabel(permissionRow) : "-"}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              mb: "6px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#374151",
            }}
          >
            排班權限
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={permissionForm.can_manage_schedule}
                onChange={(event) =>
                  setPermissionForm((current) => ({
                    ...current,
                    can_manage_schedule: event.target.checked,
                  }))
                }
              />
            }
            label="排班管理員"
          />
        </Box>

        <Box>
          <Typography
            sx={{
              mb: "6px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#374151",
            }}
          >
            代申請表單
          </Typography>

          {proxyTypeEntries.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: "2px 12px",
              }}
            >
              {proxyTypeEntries.map(([formType, label]) => (
                <FormControlLabel
                  key={formType}
                  control={
                    <Checkbox
                      checked={permissionForm.proxy_form_types.includes(
                        formType,
                      )}
                      onChange={(event) =>
                        handlePermissionProxyTypeChange(
                          formType,
                          event.target.checked,
                        )
                      }
                    />
                  }
                  label={label}
                />
              ))}
            </Box>
          ) : (
            <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
              查無可設定的代申請表單。
            </Typography>
          )}
        </Box>
      </FormDialog>

      <FormDialog
        open={Boolean(deleteRow)}
        title="確認移除人員"
        submitting={saving}
        submitLabel="確認移除"
        onClose={handleCloseDelete}
        onSubmit={() => handleDelete(deleteRow?.employee_id)}
      >
        <Typography sx={{ fontSize: "14px", color: "#374151" }}>
          確定要將「{employeeLabel(deleteRow || {})}」從此單位的參數設定中移除嗎？
        </Typography>

        <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
          移除後，此人員在此單位設定的排班管理與代申請權限將一併刪除。
        </Typography>
      </FormDialog>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() =>
          setSuccessDialog((current) => ({
            ...current,
            open: false,
          }))
        }
      />
    </>
  );
}
