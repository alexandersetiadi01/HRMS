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
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  apiCreateLeaveRule,
  apiDeleteLeaveRule,
  apiCreateLeaveRuleCondition,
  apiDeleteLeaveRuleCondition,
  apiLeaveRuleConditions,
  apiLeaveRuleSettings,
  apiLeaveRules,
  apiLeaveTypes,
  apiSaveLeaveRuleSettings,
  apiUpdateLeaveRule,
  apiUpdateLeaveRuleCondition,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";

const INITIAL_FILTERS = {
  leave_type_id: "",
  status: "",
};

const INITIAL_FORM = {
  leave_type_id: "",
  require_attachment: "0",
  require_event_date: "0",
  require_relation_type: "0",
  require_request_year: "0",
  require_start_end_dt: "0",
  must_be_continuous: "0",
  allow_split: "1",
  exclude_non_working_days: "0",
  use_balance_control: "1",
  valid_window_mode: "無",
  entitlement_mode: "配額",
  salary_pay_type: "依假別",
  status: "啟用",
};

const YES_NO_OPTIONS = [
  { value: "0", label: "否" },
  { value: "1", label: "是" },
];

const RELATION_OPTIONS = [
  { value: "父母", label: "父母" },
  { value: "養父母", label: "養父母" },
  { value: "繼父母", label: "繼父母" },
  { value: "配偶", label: "配偶" },
  { value: "祖父母", label: "祖父母" },
  { value: "外祖父母", label: "外祖父母" },
  { value: "子女", label: "子女" },
  { value: "配偶之父母", label: "配偶之父母" },
  { value: "配偶之祖父母", label: "配偶之祖父母" },
  { value: "配偶之養父母", label: "配偶之養父母" },
  { value: "配偶之繼父母", label: "配偶之繼父母" },
  { value: "曾祖父母", label: "曾祖父母" },
  { value: "外曾祖父母", label: "外曾祖父母" },
  { value: "兄弟姊妹", label: "兄弟姊妹" },
];

const CONDITION_RESULT_OPTIONS = [
  { value: "entitlement_days", label: "給假天數" },
  { value: "entitlement_hours", label: "給假時數" },
];

const CONDITION_COLUMNS = [
  { key: "condition_value", label: "親屬稱謂", width: "1.4fr" },
  { key: "result_type_label", label: "結果類型", width: "1.2fr" },
  { key: "result_display", label: "給假額度", width: "1fr" },
  { key: "actions", label: "操作", width: "100px" },
];

const STATUS_OPTIONS = [
  { value: "", label: "全部狀態" },
  { value: "啟用", label: "啟用" },
  { value: "停用", label: "停用" },
];

const VALID_WINDOW_OPTIONS = [
  { value: "無", label: "無" },
  { value: "年度", label: "年度" },
  { value: "事件日前後", label: "事件日前後" },
  { value: "事件日後", label: "事件日後" },
  { value: "依申請期間", label: "依申請期間" },
];

const ENTITLEMENT_OPTIONS = [
  { value: "配額", label: "配額" },
  { value: "固定天數", label: "固定天數" },
  { value: "固定時數", label: "固定時數" },
  { value: "條件對應天數", label: "條件對應天數" },
  { value: "依申請時間", label: "依申請時間" },
];

const PAID_TYPE_OPTIONS = [
  { value: "支薪", label: "支薪" },
  { value: "不支薪", label: "不支薪" },
  { value: "半薪", label: "半薪" },
  { value: "依假別", label: "依假別" },
];

const TABLE_COLUMNS = [
  { key: "leave_name", label: "假別", width: "1.4fr" },
  { key: "require_attachment_text", label: "附件", width: "0.8fr" },
  { key: "use_balance_control_text", label: "餘額控管", width: "1fr" },
  { key: "entitlement_mode", label: "給假方式", width: "1.1fr" },
  { key: "salary_pay_type", label: "薪資給付", width: "1fr" },
  { key: "status", label: "狀態", width: "0.9fr" },
  { key: "actions", label: "操作", width: "190px" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}

export default function LeaveRulesTab() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [specialTypes, setSpecialTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [detailRow, setDetailRow] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrorText, setFormErrorText] = useState("");
  const [deleteRow, setDeleteRow] = useState(null);
  const [settingsRow, setSettingsRow] = useState(null);
  const [settingsForm, setSettingsForm] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsErrorText, setSettingsErrorText] = useState("");
  const [conditionRuleRow, setConditionRuleRow] = useState(null);
  const [conditionRows, setConditionRows] = useState([]);
  const [conditionFormOpen, setConditionFormOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState(null);
  const [conditionForm, setConditionForm] = useState({
    condition_value: "",
    result_key: "entitlement_days",
    result_value: "",
  });
  const [conditionLoading, setConditionLoading] = useState(false);
  const [conditionErrorText, setConditionErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const typeOptions = useMemo(
    () => [
      { value: "", label: "全部特殊假別" },
      ...specialTypes.map((type) => ({
        value: type.leave_type_id,
        label: type.leave_name,
      })),
    ],
    [specialTypes],
  );

  const availableCreateTypes = useMemo(() => {
    const existingTypeIds = new Set(
      rows.map((row) => Number(row.leave_type_id || 0)),
    );

    return specialTypes.filter(
      (type) => !existingTypeIds.has(Number(type.leave_type_id || 0)),
    );
  }, [rows, specialTypes]);

  const displayRows = useMemo(() => {
    return rows
      .map((row) => ({
        ...row,
        require_attachment_text:
          Number(row.require_attachment || 0) === 1 ? "是" : "否",
        use_balance_control_text:
          Number(row.use_balance_control || 0) === 1 ? "是" : "否",
      }))
      .filter((row) => {
        if (
          appliedFilters.leave_type_id &&
          String(row.leave_type_id) !== String(appliedFilters.leave_type_id)
        ) {
          return false;
        }

        if (
          appliedFilters.status &&
          String(row.status || "") !== appliedFilters.status
        ) {
          return false;
        }

        return true;
      });
  }, [rows, appliedFilters]);

  const loadData = useCallback(async () => {
    const [ruleResponse, typeResponse] = await Promise.all([
      apiLeaveRules(),
      apiLeaveTypes(),
    ]);

    setRows(getItems(ruleResponse));
    setSpecialTypes(
      getItems(typeResponse).filter(
        (type) => String(type.leave_category || "") === "特殊",
      ),
    );
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorText("");

      try {
        await loadData();
      } catch (error) {
        console.error(error);

        if (active) {
          setRows([]);
          setSpecialTypes([]);
          setErrorText("無法載入假別規則資料。");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [loadData]);

  const handleSearch = async () => {
    setLoading(true);
    setErrorText("");

    try {
      setAppliedFilters(filters);
      await loadData();
    } catch (error) {
      console.error(error);
      setErrorText("無法載入假別規則資料。");
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
      await loadData();
    } catch (error) {
      console.error(error);
      setErrorText("無法載入假別規則資料。");
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
      leave_type_id: row.leave_type_id,
      require_attachment: String(Number(row.require_attachment || 0)),
      require_event_date: String(Number(row.require_event_date || 0)),
      require_relation_type: String(Number(row.require_relation_type || 0)),
      require_request_year: String(Number(row.require_request_year || 0)),
      require_start_end_dt: String(Number(row.require_start_end_dt || 0)),
      must_be_continuous: String(Number(row.must_be_continuous || 0)),
      allow_split: String(Number(row.allow_split || 0)),
      exclude_non_working_days: String(
        Number(row.exclude_non_working_days || 0),
      ),
      use_balance_control: String(Number(row.use_balance_control || 0)),
      valid_window_mode: row.valid_window_mode || "無",
      entitlement_mode: row.entitlement_mode || "配額",
      salary_pay_type: row.salary_pay_type || "依假別",
      status: row.status || "啟用",
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
    if (!form.leave_type_id) {
      setFormErrorText("請選擇特殊假別。");
      return;
    }

    const payload = {
      leave_type_id: Number(form.leave_type_id),
      require_attachment: Number(form.require_attachment),
      require_event_date: Number(form.require_event_date),
      require_relation_type: Number(form.require_relation_type),
      require_request_year: Number(form.require_request_year),
      require_start_end_dt: Number(form.require_start_end_dt),
      must_be_continuous: Number(form.must_be_continuous),
      allow_split: Number(form.allow_split),
      exclude_non_working_days: Number(form.exclude_non_working_days),
      use_balance_control: Number(form.use_balance_control),
      valid_window_mode: form.valid_window_mode,
      entitlement_mode: form.entitlement_mode,
      salary_pay_type: form.salary_pay_type,
      status: form.status,
    };

    setSubmitting(true);
    setFormErrorText("");

    try {
      if (editingRow) {
        await apiUpdateLeaveRule(editingRow.leave_rule_id, payload);
      } else {
        await apiCreateLeaveRule(payload);
      }

      const editing = Boolean(editingRow);

      setFormOpen(false);
      setEditingRow(null);
      setForm(INITIAL_FORM);
      await loadData();

      setSuccessDialog({
        open: true,
        title: editing ? "更新成功" : "新增成功",
        message: editing ? "假別規則已成功更新。" : "假別規則已成功新增。",
      });
    } catch (error) {
      console.error(error);
      setFormErrorText(
        error?.response?.data?.message ||
          (editingRow ? "更新假別規則失敗。" : "新增假別規則失敗。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSettings = async (row) => {
    setSettingsRow(row);
    setSettingsForm({});
    setSettingsErrorText("");
    setSettingsLoading(true);

    try {
      const response = await apiLeaveRuleSettings(row.leave_type_id);
      const payload = response?.data ?? response;
      const settings = Array.isArray(payload?.settings) ? payload.settings : [];

      const nextForm = {};

      settings.forEach((setting) => {
        nextForm[setting.setting_key] =
          setting.setting_value === null ? "" : String(setting.setting_value);
      });

      setSettingsForm(nextForm);
    } catch (error) {
      console.error(error);
      setSettingsErrorText(
        error?.response?.data?.message || "無法載入規則設定。",
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCloseSettings = () => {
    if (submitting) return;

    setSettingsRow(null);
    setSettingsForm({});
    setSettingsErrorText("");
  };

  const handleSettingChange = (field, value) => {
    setSettingsForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    const leaveTypeId = Number(settingsRow?.leave_type_id || 0);

    if (leaveTypeId <= 0) return;

    setSubmitting(true);
    setSettingsErrorText("");

    try {
      await apiSaveLeaveRuleSettings(leaveTypeId, settingsForm);

      setSettingsRow(null);
      setSettingsForm({});

      setSuccessDialog({
        open: true,
        title: "更新成功",
        message: "假別規則詳細設定已成功更新。",
      });
    } catch (error) {
      console.error(error);
      setSettingsErrorText(
        error?.response?.data?.message || "更新假別規則詳細設定失敗。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loadConditionRows = async (leaveTypeId) => {
    const response = await apiLeaveRuleConditions({
      leave_type_id: leaveTypeId,
    });

    const payload = response?.data ?? response;
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    setConditionRows(items);
  };

  const handleOpenConditions = async (row) => {
    setConditionRuleRow(row);
    setConditionRows([]);
    setConditionErrorText("");
    setConditionLoading(true);

    try {
      await loadConditionRows(row.leave_type_id);
    } catch (error) {
      console.error(error);
      setConditionErrorText(
        error?.response?.data?.message || "無法載入條件規則。",
      );
    } finally {
      setConditionLoading(false);
    }
  };

  const handleCloseConditions = () => {
    if (submitting) return;

    setConditionRuleRow(null);
    setConditionRows([]);
    setConditionFormOpen(false);
    setEditingCondition(null);
    setConditionErrorText("");
  };

  const handleOpenCreateCondition = () => {
    setEditingCondition(null);
    setConditionForm({
      condition_value: "",
      result_key: "entitlement_days",
      result_value: "",
    });
    setConditionErrorText("");
    setConditionFormOpen(true);
  };

  const handleOpenEditCondition = (row) => {
    setEditingCondition(row);
    setConditionForm({
      condition_value: row.condition_value || "",
      result_key: row.result_key || "entitlement_days",
      result_value: row.result_value || "",
    });
    setConditionErrorText("");
    setConditionFormOpen(true);
  };

  const handleSaveCondition = async () => {
    const leaveTypeId = Number(conditionRuleRow?.leave_type_id || 0);

    if (leaveTypeId <= 0) return;

    if (!conditionForm.condition_value) {
      setConditionErrorText("請選擇親屬稱謂。");
      return;
    }

    if (
      !conditionForm.result_value ||
      Number(conditionForm.result_value) <= 0
    ) {
      setConditionErrorText("請輸入大於 0 的給假額度。");
      return;
    }

    const payload = {
      leave_type_id: leaveTypeId,
      condition_type: "relation_type",
      condition_value: conditionForm.condition_value,
      result_key: conditionForm.result_key,
      result_value: conditionForm.result_value,
    };

    setSubmitting(true);
    setConditionErrorText("");

    try {
      if (editingCondition) {
        await apiUpdateLeaveRuleCondition(
          editingCondition.condition_id,
          payload,
        );
      } else {
        await apiCreateLeaveRuleCondition(payload);
      }

      const editing = Boolean(editingCondition);

      await loadConditionRows(leaveTypeId);

      setConditionFormOpen(false);
      setEditingCondition(null);
      setConditionForm({
        condition_value: "",
        result_key: "entitlement_days",
        result_value: "",
      });

      setSuccessDialog({
        open: true,
        title: editing ? "更新成功" : "新增成功",
        message: editing ? "條件規則已成功更新。" : "條件規則已成功新增。",
      });
    } catch (error) {
      console.error(error);
      setConditionErrorText(
        error?.response?.data?.message ||
          (editingCondition ? "更新條件規則失敗。" : "新增條件規則失敗。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCondition = async (row) => {
    const conditionId = Number(row?.condition_id || 0);
    const leaveTypeId = Number(conditionRuleRow?.leave_type_id || 0);

    if (conditionId <= 0 || leaveTypeId <= 0) return;

    setSubmitting(true);
    setConditionErrorText("");

    try {
      await apiDeleteLeaveRuleCondition(conditionId);
      await loadConditionRows(leaveTypeId);

      setSuccessDialog({
        open: true,
        title: "刪除成功",
        message: "條件規則已成功刪除。",
      });
    } catch (error) {
      console.error(error);
      setConditionErrorText(
        error?.response?.data?.message || "刪除條件規則失敗。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const leaveRuleId = Number(deleteRow?.leave_rule_id || 0);
    if (leaveRuleId <= 0) return;

    setSubmitting(true);
    setErrorText("");

    try {
      await apiDeleteLeaveRule(leaveRuleId);
      setDeleteRow(null);
      await loadData();

      setSuccessDialog({
        open: true,
        title: "刪除成功",
        message: "假別規則已成功刪除。",
      });
    } catch (error) {
      console.error(error);
      setErrorText(error?.response?.data?.message || "刪除假別規則失敗。");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTableValue = (row, column) => {
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
          <Tooltip title="詳細">
            <IconButton size="small" onClick={() => setDetailRow(row)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="編輯">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="規則設定">
            <IconButton size="small" onClick={() => handleOpenSettings(row)}>
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {Number(row.require_relation_type || 0) === 1 ? (
            <Tooltip title="條件規則">
              <IconButton
                size="small"
                onClick={() => handleOpenConditions(row)}
              >
                <AccountTreeOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}

          <Tooltip title="刪除">
            <IconButton size="small" onClick={() => setDeleteRow(row)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    return row[column.key] || "-";
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
            sx={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}
          >
            假別規則
          </Typography>

          <Typography sx={{ mt: "2px", fontSize: "14px", color: "#6b7280" }}>
            設定特殊假別的申請條件、額度控管、有效期間及給假方式
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          disabled={availableCreateTypes.length === 0}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          新增規則
        </Button>
      </Box>

      <Box sx={{ mb: "18px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              特殊假別
            </Typography>

            <SelectField
              value={filters.leave_type_id}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  leave_type_id: value,
                }))
              }
              options={typeOptions}
              displayEmpty
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
              value={filters.status}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value,
                }))
              }
              options={STATUS_OPTIONS}
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
          getRowKey={(row) => row.leave_rule_id}
          mobileCardTitleKey="leave_name"
          emptyText="查無假別規則資料"
          renderValue={renderTableValue}
          fitToContainer
          pagination
          rowsPerPage={10}
        />
      </Box>

      <FormDialog
        open={Boolean(detailRow)}
        title="假別規則詳細"
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
            {[
              ["假別", detailRow.leave_name],
              [
                "需附件",
                Number(detailRow.require_attachment) === 1 ? "是" : "否",
              ],
              [
                "需事件日期",
                Number(detailRow.require_event_date) === 1 ? "是" : "否",
              ],
              [
                "需親屬稱謂",
                Number(detailRow.require_relation_type) === 1 ? "是" : "否",
              ],
              [
                "需年度",
                Number(detailRow.require_request_year) === 1 ? "是" : "否",
              ],
              [
                "需開始/結束日期時間",
                Number(detailRow.require_start_end_dt) === 1 ? "是" : "否",
              ],
              [
                "須連續一次休足",
                Number(detailRow.must_be_continuous) === 1 ? "是" : "否",
              ],
              ["可分次使用", Number(detailRow.allow_split) === 1 ? "是" : "否"],
              [
                "排除週末/假日",
                Number(detailRow.exclude_non_working_days) === 1 ? "是" : "否",
              ],
              [
                "使用餘額控管",
                Number(detailRow.use_balance_control) === 1 ? "是" : "否",
              ],
              ["有效期間模式", detailRow.valid_window_mode],
              ["給假方式", detailRow.entitlement_mode],
              ["薪資給付", detailRow.salary_pay_type],
              ["狀態", detailRow.status],
            ].map(([label, value]) => (
              <Box key={label}>
                <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                  {value || "-"}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : null}
      </FormDialog>

      <FormDialog
        open={formOpen}
        title={editingRow ? "編輯假別規則" : "新增假別規則"}
        submitLabel={editingRow ? "更新" : "新增"}
        submitting={submitting}
        maxWidth="md"
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formErrorText ? <Alert severity="error">{formErrorText}</Alert> : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: "14px",
          }}
        >
          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              特殊假別
            </Typography>
            <SelectField
              value={form.leave_type_id}
              onChange={(value) => handleFormChange("leave_type_id", value)}
              options={
                editingRow
                  ? [
                      {
                        value: editingRow.leave_type_id,
                        label: editingRow.leave_name,
                      },
                    ]
                  : availableCreateTypes.map((type) => ({
                      value: type.leave_type_id,
                      label: type.leave_name,
                    }))
              }
              fullWidth
              height="38px"
              disabled={submitting || Boolean(editingRow)}
            />
          </Box>

          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              狀態
            </Typography>
            <SelectField
              value={form.status}
              onChange={(value) => handleFormChange("status", value)}
              options={STATUS_OPTIONS.filter((item) => item.value)}
              fullWidth
              height="38px"
              disabled={submitting}
            />
          </Box>

          {[
            ["require_attachment", "需附件"],
            ["require_event_date", "需事件日期"],
            ["require_relation_type", "需親屬稱謂"],
            ["require_request_year", "需年度"],
            ["require_start_end_dt", "需開始/結束日期時間"],
            ["must_be_continuous", "須連續一次休足"],
            ["allow_split", "可分次使用"],
            ["exclude_non_working_days", "排除週末/假日"],
            ["use_balance_control", "使用餘額控管"],
          ].map(([field, label]) => (
            <Box key={field}>
              <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
                {label}
              </Typography>
              <SelectField
                value={form[field]}
                onChange={(value) => handleFormChange(field, value)}
                options={YES_NO_OPTIONS}
                fullWidth
                height="38px"
                disabled={submitting}
              />
            </Box>
          ))}

          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              有效期間模式
            </Typography>
            <SelectField
              value={form.valid_window_mode}
              onChange={(value) => handleFormChange("valid_window_mode", value)}
              options={VALID_WINDOW_OPTIONS}
              fullWidth
              height="38px"
              disabled={submitting}
            />
          </Box>

          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              給假方式
            </Typography>
            <SelectField
              value={form.entitlement_mode}
              onChange={(value) => handleFormChange("entitlement_mode", value)}
              options={ENTITLEMENT_OPTIONS}
              fullWidth
              height="38px"
              disabled={submitting}
            />
          </Box>

          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              薪資給付
            </Typography>
            <SelectField
              value={form.salary_pay_type}
              onChange={(value) => handleFormChange("salary_pay_type", value)}
              options={PAID_TYPE_OPTIONS}
              fullWidth
              height="38px"
              disabled={submitting}
            />
          </Box>
        </Box>
      </FormDialog>

      <FormDialog
        open={Boolean(settingsRow)}
        title={`規則設定${settingsRow?.leave_name ? `－${settingsRow.leave_name}` : ""}`}
        submitLabel="儲存"
        cancelLabel="取消"
        maxWidth="md"
        submitting={submitting}
        onClose={handleCloseSettings}
        onSubmit={handleSaveSettings}
      >
        {settingsErrorText ? (
          <Alert severity="error">{settingsErrorText}</Alert>
        ) : null}

        {settingsLoading ? (
          <Box
            sx={{
              minHeight: "160px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : settingsRow ? (
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
            {Number(settingsRow.require_relation_type || 0) !== 1 &&
            ["固定天數", "以天為單位"].includes(
              settingsRow.entitlement_mode,
            ) ? (
              <Box>
                <Typography
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
                  給假天數
                </Typography>

                <TextField
                  type="number"
                  value={settingsForm.entitlement_days || ""}
                  onChange={(event) =>
                    handleSettingChange("entitlement_days", event.target.value)
                  }
                  inputProps={{ min: 0, step: 0.5 }}
                  fullWidth
                  size="small"
                  disabled={submitting}
                />
              </Box>
            ) : null}

            {Number(settingsRow.require_relation_type || 0) !== 1 &&
            ["固定時數", "以小時為單位"].includes(
              settingsRow.entitlement_mode,
            ) ? (
              <Box>
                <Typography
                  sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                >
                  給假時數
                </Typography>

                <TextField
                  type="number"
                  value={settingsForm.entitlement_hours || ""}
                  onChange={(event) =>
                    handleSettingChange("entitlement_hours", event.target.value)
                  }
                  inputProps={{ min: 0, step: 0.5 }}
                  fullWidth
                  size="small"
                  disabled={submitting}
                />
              </Box>
            ) : null}

            {settingsRow.valid_window_mode === "事件日前後" ||
            settingsRow.valid_window_mode === "事件日後" ? (
              <>
                <Box>
                  <Typography
                    sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                  >
                    事件日前可使用天數
                  </Typography>

                  <TextField
                    type="number"
                    value={settingsForm.valid_before_days || ""}
                    onChange={(event) =>
                      handleSettingChange(
                        "valid_before_days",
                        event.target.value,
                      )
                    }
                    inputProps={{ min: 0, step: 1 }}
                    fullWidth
                    size="small"
                    disabled={submitting}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                  >
                    事件日後有效天數
                  </Typography>

                  <TextField
                    type="number"
                    value={settingsForm.valid_after_days || ""}
                    onChange={(event) =>
                      handleSettingChange(
                        "valid_after_days",
                        event.target.value,
                      )
                    }
                    inputProps={{ min: 0, step: 1 }}
                    fullWidth
                    size="small"
                    disabled={submitting}
                  />
                </Box>
              </>
            ) : null}

            {settingsRow.valid_window_mode === "固定日期" ? (
              <>
                <Box>
                  <Typography
                    sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                  >
                    固定有效起日
                  </Typography>

                  <TextField
                    type="date"
                    value={settingsForm.valid_from || ""}
                    onChange={(event) =>
                      handleSettingChange("valid_from", event.target.value)
                    }
                    fullWidth
                    size="small"
                    disabled={submitting}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}
                  >
                    固定有效迄日
                  </Typography>

                  <TextField
                    type="date"
                    value={settingsForm.valid_to || ""}
                    onChange={(event) =>
                      handleSettingChange("valid_to", event.target.value)
                    }
                    fullWidth
                    size="small"
                    disabled={submitting}
                  />
                </Box>
              </>
            ) : null}

            <Box>
              <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
                展延有效天數
              </Typography>

              <TextField
                type="number"
                value={settingsForm.extended_valid_days || ""}
                onChange={(event) =>
                  handleSettingChange("extended_valid_days", event.target.value)
                }
                inputProps={{ min: 0, step: 1 }}
                fullWidth
                size="small"
                disabled={submitting}
              />

              <Typography
                sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}
              >
                選填。未設定時視為 0 天。
              </Typography>
            </Box>

            {Number(settingsRow.require_relation_type || 0) === 1 ? (
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <Alert severity="info">
                  此假別需要「親屬稱謂」，給假額度由條件規則決定。此處只設定有效期間及展延設定。
                </Alert>
              </Box>
            ) : null}
          </Box>
        ) : null}
      </FormDialog>
      <FormDialog
        open={Boolean(conditionRuleRow)}
        title={`條件規則${conditionRuleRow?.leave_name ? `－${conditionRuleRow.leave_name}` : ""}`}
        submitLabel="關閉"
        cancelLabel=""
        maxWidth="md"
        onClose={handleCloseConditions}
        onSubmit={handleCloseConditions}
      >
        {conditionErrorText ? (
          <Alert severity="error" sx={{ mb: "14px" }}>
            {conditionErrorText}
          </Alert>
        ) : null}

        <Box
          sx={{
            mb: "14px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateCondition}
            disabled={conditionLoading || submitting}
          >
            新增條件
          </Button>
        </Box>

        {conditionLoading ? (
          <Box
            sx={{
              minHeight: "160px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : (
          <ResponsiveAttendanceTable
            columns={CONDITION_COLUMNS}
            rows={conditionRows.map((row) => ({
              ...row,
              result_type_label:
                row.result_key === "entitlement_hours"
                  ? "給假時數"
                  : "給假天數",
              result_display:
                row.result_key === "entitlement_hours"
                  ? `${row.result_value} 小時`
                  : `${row.result_value} 天`,
            }))}
            getRowKey={(row) => row.condition_id}
            mobileCardTitleKey="condition_value"
            emptyText="目前沒有條件規則"
            fitToContainer
            renderValue={(row, column) => {
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
                    <Tooltip title="編輯">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditCondition(row)}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="刪除">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCondition(row)}
                        disabled={submitting}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              }

              return row[column.key] || "-";
            }}
          />
        )}

        <FormDialog
          open={conditionFormOpen}
          title={editingCondition ? "編輯條件規則" : "新增條件規則"}
          submitLabel={editingCondition ? "更新" : "新增"}
          submitting={submitting}
          maxWidth="sm"
          onClose={() => {
            if (submitting) return;

            setConditionFormOpen(false);
            setEditingCondition(null);
            setConditionErrorText("");
          }}
          onSubmit={handleSaveCondition}
        >
          {conditionErrorText ? (
            <Alert severity="error">{conditionErrorText}</Alert>
          ) : null}

          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              親屬稱謂
            </Typography>

            <SelectField
              value={conditionForm.condition_value}
              onChange={(value) =>
                setConditionForm((current) => ({
                  ...current,
                  condition_value: value,
                }))
              }
              options={RELATION_OPTIONS}
              fullWidth
              height="38px"
              disabled={submitting}
            />
          </Box>

          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              結果類型
            </Typography>

            <SelectField
              value={conditionForm.result_key}
              onChange={(value) =>
                setConditionForm((current) => ({
                  ...current,
                  result_key: value,
                }))
              }
              options={CONDITION_RESULT_OPTIONS}
              fullWidth
              height="38px"
              disabled={submitting}
            />
          </Box>

          <Box>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              給假額度
            </Typography>

            <TextField
              type="number"
              value={conditionForm.result_value}
              onChange={(event) =>
                setConditionForm((current) => ({
                  ...current,
                  result_value: event.target.value,
                }))
              }
              inputProps={{ min: 0.5, step: 0.5 }}
              fullWidth
              size="small"
              disabled={submitting}
            />

            <Typography sx={{ mt: "6px", fontSize: "13px", color: "#6b7280" }}>
              {conditionForm.result_key === "entitlement_hours"
                ? "單位：小時"
                : "單位：天"}
            </Typography>
          </Box>
        </FormDialog>
      </FormDialog>
      <FormDialog
        open={Boolean(deleteRow)}
        title="確認刪除"
        submitLabel="刪除"
        cancelLabel="取消"
        maxWidth="xs"
        submitting={submitting}
        onClose={() => {
          if (!submitting) setDeleteRow(null);
        }}
        onSubmit={handleDelete}
      >
        <Typography
          sx={{ fontSize: "15px", color: "#374151", lineHeight: 1.7 }}
        >
          確認刪除「{deleteRow?.leave_name || ""}
          」的假別規則？其規則詳細設定及條件也會一併刪除。
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
