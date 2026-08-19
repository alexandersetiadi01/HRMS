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
  apiOvertimeRules,
  apiUpdateOvertimeRule,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";

const BOOLEAN_OPTIONS = [
  { value: "1", label: "是" },
  { value: "0", label: "否" },
];

const START_BASIS_OPTIONS = [
  { value: "shift_end", label: "班次結束後" },
];

const RULE_CONFIGS = [
  {
    ruleCode: "minimum_overtime_minutes",
    ruleName: "最低加班分鐘",
    valueType: "integer",
    suffix: "分鐘",
    description: "每筆加班申請至少需要達到的時間。",
  },
  {
    ruleCode: "overtime_minute_step",
    ruleName: "申請時間單位",
    valueType: "minute_step",
    suffix: "分鐘",
    description: "限制加班開始與結束時間可選擇的分鐘間隔。",
  },
  {
    ruleCode: "allow_cross_day_overtime",
    ruleName: "允許跨日加班",
    valueType: "boolean",
    description: "是否允許加班開始與結束時間跨越不同日期。",
  },
  {
    ruleCode: "allow_past_date_overtime",
    ruleName: "允許補申請過去日期",
    valueType: "boolean",
    description: "是否允許建立今天以前日期的加班申請。",
  },
  {
    ruleCode: "require_clock_in_for_overtime",
    ruleName: "要求已有上班打卡",
    valueType: "boolean",
    description: "一般工作日申請加班時是否必須已有上班打卡。",
  },
  {
    ruleCode: "allow_leave_day_overtime",
    ruleName: "允許請假日申請加班",
    valueType: "boolean",
    description: "是否允許在已有核准請假的日期建立加班申請。",
  },
  {
    ruleCode: "allow_multiple_same_day_overtime",
    ruleName: "允許同日多筆加班",
    valueType: "boolean",
    description: "同一員工同一工作日是否允許多筆已核准加班。",
  },
  {
    ruleCode: "overtime_start_basis",
    ruleName: "工作日加班開始基準",
    valueType: "start_basis",
    description: "一般工作日可開始申請加班的時間基準。",
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

  if (config.valueType === "start_basis") {
    return (
      START_BASIS_OPTIONS.find(
        (option) => option.value === normalizedValue,
      )?.label || normalizedValue || "-"
    );
  }

  if (config.suffix) {
    return normalizedValue !== ""
      ? `${normalizedValue} ${config.suffix}`
      : "-";
  }

  return normalizedValue || "-";
}

export default function OvertimeRulesTab() {
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
          overtime_rule_id: rule?.overtime_rule_id || config.ruleCode,
          rule_code: config.ruleCode,
          rule_name: config.ruleName,
          rule_value: rule?.rule_value ?? "",
          display_value: rule
            ? formatRuleValue(config, rule.rule_value)
            : "未設定",
          description: config.description,
          configured: Boolean(rule?.overtime_rule_id),
        };
      }),
    [rules],
  );

  const loadData = useCallback(async () => {
    const response = await apiOvertimeRules();
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
          setErrorText("無法載入加班規則資料。");
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

    if (!config || !rule?.overtime_rule_id) return;

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
      return "找不到要修改的加班規則。";
    }

    if (activeConfig.valueType === "integer") {
      const value = Number(formValue);

      if (
        formValue === ""
        || !Number.isInteger(value)
        || value < 1
        || value > 1440
      ) {
        return "最低加班分鐘必須介於 1 到 1440 分鐘。";
      }
    }

    if (activeConfig.valueType === "minute_step") {
      const value = Number(formValue);

      if (
        formValue === ""
        || !Number.isInteger(value)
        || value < 1
        || value > 60
        || 60 % value !== 0
      ) {
        return "申請時間單位必須是可整除 60 的分鐘數。";
      }
    }

    if (
      activeConfig.valueType === "boolean"
      && !["0", "1"].includes(formValue)
    ) {
      return "請選擇是否允許此規則。";
    }

    if (
      activeConfig.valueType === "start_basis"
      && formValue !== "shift_end"
    ) {
      return "目前工作日加班開始基準僅支援班次結束後。";
    }

    return "";
  };

  const handleSubmit = async () => {
    if (!activeConfig || submitting) return;

    const rule = rules[activeConfig.ruleCode] || null;

    if (!rule?.overtime_rule_id) {
      setFormErrorText("找不到要修改的加班規則。");
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
      await apiUpdateOvertimeRule(
        Number(rule.overtime_rule_id),
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

    if (activeConfig.valueType === "start_basis") {
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
          {START_BASIS_OPTIONS.map((option) => (
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
        helperText={
          activeConfig.valueType === "minute_step"
            ? "必須是可整除 60 的分鐘數，例如 5、10、15、20、30、60。"
            : "可設定 1 至 1440 分鐘。"
        }
        slotProps={{
          htmlInput: {
            min: 1,
            max:
              activeConfig.valueType === "minute_step"
                ? 60
                : 1440,
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
          加班規則
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          設定加班申請的時間、日期及工作日檢核規則。
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
        emptyText={loading ? "載入中..." : "查無加班規則資料"}
        renderValue={renderValue}
        fitToContainer
      />

      <FormDialog
        open={formOpen}
        title={
          activeConfig
            ? `編輯${activeConfig.ruleName}`
            : "加班規則"
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