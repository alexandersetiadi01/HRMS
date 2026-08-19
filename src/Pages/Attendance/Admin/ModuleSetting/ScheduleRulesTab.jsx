import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import {
  apiAttendanceScheduleRules,
  apiUpdateAttendanceScheduleRule,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";

const BOOLEAN_OPTIONS = [
  { value: "1", label: "是" },
  { value: "0", label: "否" },
];

const RULE_CONFIGS = [
  {
    ruleCode: "schedule_enabled",
    ruleName: "排班功能",
    valueType: "boolean",
    description: "是否啟用排班相關功能。",
  },
  {
    ruleCode: "employee_self_scheduling_enabled",
    ruleName: "開放員工自己排班",
    valueType: "boolean",
    description: "是否允許員工於指定排班期間自行安排次月班表。",
  },
  {
    ruleCode: "employee_scheduling_start_day",
    ruleName: "員工排班開始日",
    valueType: "day",
    suffix: "日",
    description: "每月開放員工自行安排次月班表的開始日期。",
  },
  {
    ruleCode: "employee_scheduling_end_day",
    ruleName: "員工排班結束日",
    valueType: "day",
    suffix: "日",
    description: "每月開放員工自行安排次月班表的結束日期。",
  },
];

const TABLE_COLUMNS = [
  { key: "rule_name", label: "規則", width: "1.2fr" },
  { key: "display_value", label: "設定值", width: "1fr" },
  { key: "description", label: "說明", width: "2.2fr" },
  { key: "actions", label: "操作", width: "90px" },
];

function unwrapPayload(response, fallback = null) {
  const payload = response?.data ?? response;

  if (payload?.data !== undefined) {
    return payload.data;
  }

  return payload ?? fallback;
}

function getItems(response) {
  const payload = unwrapPayload(response, []);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}

function getRuleConfig(ruleCode) {
  return (
    RULE_CONFIGS.find(
      (config) => config.ruleCode === String(ruleCode || ""),
    ) || null
  );
}

function formatRuleValue(config, value) {
  const normalizedValue = String(value ?? "");

  if (config.valueType === "boolean") {
    return normalizedValue === "1" ? "是" : "否";
  }

  if (config.suffix) {
    return normalizedValue !== ""
      ? `${normalizedValue} ${config.suffix}`
      : "-";
  }

  return normalizedValue || "-";
}

export default function ScheduleRulesTab() {
  const [rules, setRules] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [activeConfig, setActiveConfig] = useState(null);
  const [formValue, setFormValue] = useState("");
  const [formErrorText, setFormErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const displayRows = useMemo(
    () =>
      RULE_CONFIGS.map((config) => {
        const rule = rules[config.ruleCode] || null;

        return {
          schedule_rule_id: rule?.schedule_rule_id || config.ruleCode,
          rule_code: config.ruleCode,
          rule_name: config.ruleName,
          rule_value: rule?.rule_value ?? "",
          display_value: rule
            ? formatRuleValue(config, rule.rule_value)
            : "未設定",
          description: config.description,
          configured: Boolean(rule?.schedule_rule_id),
        };
      }),
    [rules],
  );

  const loadData = useCallback(async () => {
    const response = await apiAttendanceScheduleRules();
    const items = getItems(response);
    const nextRules = {};

    RULE_CONFIGS.forEach((config) => {
      const rule =
        items.find(
          (item) =>
            String(item.rule_code || "") === config.ruleCode,
        ) || null;

      if (rule) {
        nextRules[config.ruleCode] = rule;
      }
    });

    setRules(nextRules);
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
          setRules({});
          setErrorText("無法載入排班規則資料。");
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

  const handleOpenForm = (row) => {
    const config = getRuleConfig(row.rule_code);
    const rule = rules[row.rule_code] || null;

    if (!config || !rule?.schedule_rule_id) return;

    setActiveConfig(config);
    setFormValue(String(rule.rule_value ?? ""));
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
      return "找不到要修改的排班規則。";
    }

    if (
      activeConfig.valueType === "boolean"
      && !["0", "1"].includes(formValue)
    ) {
      return "請選擇是否啟用此規則。";
    }

    if (activeConfig.valueType === "day") {
      const value = Number(formValue);

      if (
        formValue === ""
        || !Number.isInteger(value)
        || value < 1
        || value > 31
      ) {
        return "員工排班日期必須介於 1 到 31 日。";
      }

      const startDay = activeConfig.ruleCode === "employee_scheduling_start_day"
        ? value
        : Number(rules.employee_scheduling_start_day?.rule_value || 0);

      const endDay = activeConfig.ruleCode === "employee_scheduling_end_day"
        ? value
        : Number(rules.employee_scheduling_end_day?.rule_value || 0);

      if (startDay > 0 && endDay > 0 && startDay > endDay) {
        return "員工排班開始日不可晚於結束日。";
      }
    }

    return "";
  };

  const handleSubmit = async () => {
    if (!activeConfig || submitting) return;

    const rule = rules[activeConfig.ruleCode] || null;

    if (!rule?.schedule_rule_id) {
      setFormErrorText("找不到要修改的排班規則。");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setFormErrorText(validationError);
      return;
    }

    setSubmitting(true);
    setFormErrorText("");

    try {
      await apiUpdateAttendanceScheduleRule(
        Number(rule.schedule_rule_id),
        {
          rule_value: formValue,
        },
      );

      await loadData();

      setFormOpen(false);
      setActiveConfig(null);
      setFormValue("");
      setSuccessDialog({
        open: true,
        title: "操作成功",
        message: `${activeConfig.ruleName}已成功更新。`,
      });
    } catch (error) {
      console.error(error);

      setFormErrorText(
        error?.response?.data?.message
          || error?.message
          || `更新${activeConfig.ruleName}失敗。`,
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
        type="number"
        size="small"
        required
        value={formValue}
        onChange={(event) => setFormValue(event.target.value)}
        helperText="可設定每月 1 至 31 日。"
        slotProps={{
          htmlInput: {
            min: 1,
            max: 31,
            step: 1,
          },
        }}
        fullWidth
      />
    );
  };

  const renderValue = (row, column) => {
    if (column.key === "actions") {
      if (!row.configured) {
        return "-";
      }

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
          排班規則
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          設定排班功能、員工自行排班及每月排班期間。
        </Typography>
      </Box>

      {errorText ? (
        <Alert severity="error" sx={{ mb: "16px" }}>
          {errorText}
        </Alert>
      ) : null}

      <ResponsiveAttendanceTable
        columns={TABLE_COLUMNS}
        rows={displayRows}
        getRowKey={(row) => row.rule_code}
        mobileCardTitleKey="rule_name"
        desktopMinWidth="760px"
        emptyText={loading ? "載入中..." : "查無排班規則資料"}
        renderValue={renderValue}
        fitToContainer
      />

      <FormDialog
        open={formOpen}
        title={
          activeConfig
            ? `編輯${activeConfig.ruleName}`
            : "排班規則"
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