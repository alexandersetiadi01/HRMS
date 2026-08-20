import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  apiAttendanceBusinessTripRules,
  apiUpdateAttendanceBusinessTripRule,
} from "../../../../API/attendance";

const BOOLEAN_OPTIONS = [
  { value: "1", label: "是" },
  { value: "0", label: "否" },
];

const RULE_CONFIGS = [
  {
    ruleCode: "business_trip_enabled",
    ruleName: "出差功能",
    valueType: "boolean",
    defaultValue: "1",
    description: "是否啟用出差申請相關功能。",
  },
  {
    ruleCode: "business_trip_form_description",
    ruleName: "出差申請說明",
    valueType: "text",
    defaultValue: "",
    description: "設定員工申請出差時顯示的說明文字。",
  },
];

const TABLE_COLUMNS = [
  { key: "rule_name", label: "規則", width: "1.2fr" },
  { key: "display_value", label: "設定值", width: "1fr" },
  { key: "description", label: "說明", width: "2.2fr" },
  { key: "actions", label: "操作", width: "90px" },
];

function getRuleConfig(ruleCode) {
  return (
    RULE_CONFIGS.find((config) => config.ruleCode === String(ruleCode || "")) ||
    null
  );
}

function formatRuleValue(config, value) {
  const normalizedValue = String(value ?? "");

  if (config.valueType === "boolean") {
    return normalizedValue === "1" ? "是" : "否";
  }

  return normalizedValue || "未設定";
}

export default function BusinessTripRulesTab() {
  const [rules, setRules] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadErrorText, setLoadErrorText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [activeConfig, setActiveConfig] = useState(null);
  const [formValue, setFormValue] = useState("");
  const [formErrorText, setFormErrorText] = useState("");
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const applyRuleRows = (rows) => {
    const nextRules = RULE_CONFIGS.reduce((result, config) => {
      result[config.ruleCode] = config.defaultValue;
      return result;
    }, {});

    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const ruleCode = String(row?.rule_code || "");

      if (!getRuleConfig(ruleCode)) return;

      nextRules[ruleCode] = String(row?.rule_value ?? "");
    });

    setRules(nextRules);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadRules() {
      setLoading(true);
      setLoadErrorText("");

      try {
        const response = await apiAttendanceBusinessTripRules();
        const payload =
          response?.data?.data || response?.data || response || [];

        if (!cancelled) {
          applyRuleRows(payload);
        }
      } catch (error) {
        console.error("Failed to load business trip rules:", error);

        if (!cancelled) {
          applyRuleRows([]);
          setLoadErrorText(
            error?.response?.data?.message ||
              error?.message ||
              "出差規則載入失敗。",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRules();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayRows = useMemo(
    () =>
      RULE_CONFIGS.map((config) => ({
        rule_code: config.ruleCode,
        rule_name: config.ruleName,
        rule_value: rules[config.ruleCode] ?? "",
        display_value: formatRuleValue(config, rules[config.ruleCode] ?? ""),
        description: config.description,
      })),
    [rules],
  );

  const handleOpenForm = (row) => {
    const config = getRuleConfig(row.rule_code);

    if (!config) return;

    setActiveConfig(config);
    setFormValue(String(rules[row.rule_code] ?? ""));
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (submitting) return;

    setFormOpen(false);
    setActiveConfig(null);
    setFormValue("");
    setFormErrorText("");
  };

  const validateForm = () => {
    if (!activeConfig) {
      return "找不到要修改的出差規則。";
    }

    if (
      activeConfig.valueType === "boolean" &&
      !["0", "1"].includes(formValue)
    ) {
      return "請選擇是否啟用此規則。";
    }

    if (activeConfig.valueType === "text" && formValue.trim().length > 500) {
      return "出差申請說明不可超過 500 字。";
    }

    return "";
  };

  const handleSubmit = async () => {
    if (!activeConfig || submitting) return;

    const validationError = validateForm();

    if (validationError) {
      setFormErrorText(validationError);
      return;
    }

    setSubmitting(true);
    setFormErrorText("");

    try {
      const response = await apiUpdateAttendanceBusinessTripRule(
        activeConfig.ruleCode,
        activeConfig.valueType === "text" ? formValue.trim() : formValue,
      );

      const payload = response?.data?.data || response?.data || response || [];

      applyRuleRows(payload);

      const successRuleName = activeConfig.ruleName;

      setFormOpen(false);
      setActiveConfig(null);
      setFormValue("");
      setSuccessDialog({
        open: true,
        title: "操作成功",
        message: `${successRuleName}已成功更新。`,
      });
    } catch (error) {
      console.error("Failed to update business trip rule:", error);

      setFormErrorText(
        error?.response?.data?.message ||
          error?.message ||
          "出差規則更新失敗。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = () => {
    if (!activeConfig) return null;

    if (activeConfig.valueType === "boolean") {
      return (
        <TextField
          select
          label={activeConfig.ruleName}
          size="small"
          required
          value={formValue}
          onChange={(event) => setFormValue(event.target.value)}
          fullWidth
        >
          {BOOLEAN_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    return (
      <TextField
        label={activeConfig.ruleName}
        size="small"
        value={formValue}
        onChange={(event) => setFormValue(event.target.value)}
        multiline
        minRows={4}
        fullWidth
        slotProps={{
          htmlInput: {
            maxLength: 500,
          },
        }}
        helperText={`${formValue.length}/500`}
      />
    );
  };

  const renderValue = (row, column) => {
    if (column.key === "actions") {
      return (
        <Tooltip title="編輯">
          <IconButton
            size="small"
            onClick={() => handleOpenForm(row)}
            aria-label="編輯"
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    return row[column.key];
  };

  return (
    <Box>
      <Box sx={{ mb: "18px" }}>
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          出差規則
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          設定出差功能及出差申請說明。
        </Typography>
      </Box>

      {loadErrorText ? (
        <Alert severity="error" sx={{ mb: "16px" }}>
          {loadErrorText}
        </Alert>
      ) : null}

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
          getRowKey={(row) => row.rule_code}
          mobileCardTitleKey="rule_name"
          desktopMinWidth="760px"
          emptyText="查無出差規則資料"
          renderValue={renderValue}
          fitToContainer
        />
      )}

      <FormDialog
        open={formOpen}
        title={
          activeConfig
            ? `編輯${activeConfig.ruleName}`
            : "出差規則"
        }
        submitting={submitting}
        submitLabel="儲存"
        maxWidth="sm"
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formErrorText ? (
          <Alert severity="error">{formErrorText}</Alert>
        ) : null}

        {renderFormField()}

        {activeConfig ? (
          <Typography
            sx={{
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#6b7280",
            }}
          >
            {activeConfig.description}
          </Typography>
        ) : null}
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