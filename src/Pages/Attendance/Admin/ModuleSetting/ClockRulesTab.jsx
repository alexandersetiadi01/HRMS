import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import {
  apiAttendanceRuleRanges,
  apiAttendanceRules,
  apiCreateAttendanceRule,
  apiSaveAttendanceRuleRanges,
  apiUpdateAttendanceRule,
} from "../../../../API/attendance";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import { SelectField } from "../../AttendanceForm/ApplicationRecord/SharedFields";
import { ENABLE_STATUS_OPTIONS } from "./moduleSettingOptions";

const RULE_CONFIGS = [
  {
    key: "late",
    ruleCode: "CLOCK_LATE",
    ruleName: "遲到規則",
    ruleType: "late",
    rangeTitle: "遲到扣薪級距",
  },
  {
    key: "early_leave",
    ruleCode: "CLOCK_EARLY_LEAVE",
    ruleName: "早退規則",
    ruleType: "early_leave",
    rangeTitle: "早退扣薪級距",
  },
];

const INITIAL_RANGE = {
  start_minutes: "0",
  end_minutes: "",
  salary_action: "no_deduction",
};

const SALARY_ACTION_OPTIONS = [
  { value: "no_deduction", label: "不扣薪" },
  { value: "deduct_actual_minutes", label: "依實際分鐘扣薪" },
];

const TABLE_COLUMNS = [
  { key: "rule_name", label: "規則", width: "1.2fr" },
  { key: "range_summary", label: "扣薪級距", width: "2.4fr" },
  { key: "status", label: "狀態", width: "0.8fr" },
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

function normalizeRange(range = {}) {
  return {
    start_minutes: String(Math.max(0, Number(range.start_minutes || 0))),
    end_minutes:
      range.end_minutes === null ||
      range.end_minutes === undefined ||
      range.end_minutes === ""
        ? ""
        : String(Math.max(0, Number(range.end_minutes))),
    salary_action: range.salary_action || "no_deduction",
  };
}

function formatRange(range = {}) {
  const start = Math.max(0, Number(range.start_minutes || 0));
  const end =
    range.end_minutes === null ||
    range.end_minutes === undefined ||
    range.end_minutes === ""
      ? null
      : Math.max(0, Number(range.end_minutes));

  const action =
    SALARY_ACTION_OPTIONS.find(
      (item) => item.value === String(range.salary_action || ""),
    )?.label || "-";

  return {
    range:
      end === null
        ? `${start} 分鐘以上`
        : `${start} ～ ${Math.max(start, end - 1)} 分鐘`,
    action,
  };
}

function buildRangeSummary(ranges = []) {
  if (!ranges.length) return [];

  return ranges.map(formatRange);
}

function getRuleConfig(ruleCode) {
  return (
    RULE_CONFIGS.find(
      (config) => config.ruleCode === String(ruleCode || "").toUpperCase(),
    ) || null
  );
}

export default function ClockRulesTab() {
  const [rules, setRules] = useState({});
  const [rangesByRule, setRangesByRule] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [activeConfig, setActiveConfig] = useState(null);
  const [form, setForm] = useState({
    status: "啟用",
    ranges: [{ ...INITIAL_RANGE }],
  });
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
        const ranges = rangesByRule[config.ruleCode] || [];

        return {
          attendance_rule_id: rule?.attendance_rule_id || config.ruleCode,
          rule_code: config.ruleCode,
          rule_name: config.ruleName,
          rule_type: config.ruleType,
          range_summary: buildRangeSummary(ranges),
          status: rule?.status || "未設定",
          configured: Boolean(rule?.attendance_rule_id),
        };
      }),
    [rules, rangesByRule],
  );

  const loadData = useCallback(async () => {
    const ruleResponse = await apiAttendanceRules();
    const items = getItems(ruleResponse);

    const nextRules = {};

    RULE_CONFIGS.forEach((config) => {
      const rule =
        items.find(
          (item) =>
            String(item.rule_code || "").toUpperCase() === config.ruleCode,
        ) || null;

      if (rule) {
        nextRules[config.ruleCode] = rule;
      }
    });

    const rangeEntries = await Promise.all(
      Object.entries(nextRules).map(async ([ruleCode, rule]) => {
        const response = await apiAttendanceRuleRanges(
          Number(rule.attendance_rule_id),
        );

        return [ruleCode, getItems(response)];
      }),
    );

    setRules(nextRules);
    setRangesByRule(Object.fromEntries(rangeEntries));
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
          setRangesByRule({});
          setErrorText("無法載入打卡規則資料。");
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

    if (!config) return;

    const rule = rules[config.ruleCode] || null;
    const ranges = rangesByRule[config.ruleCode] || [];

    setActiveConfig(config);
    setForm({
      status: rule?.status || "啟用",
      ranges: ranges.length
        ? ranges.map(normalizeRange)
        : [{ ...INITIAL_RANGE }],
    });
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (submitting) return;

    setFormOpen(false);
    setActiveConfig(null);
    setForm({
      status: "啟用",
      ranges: [{ ...INITIAL_RANGE }],
    });
    setFormErrorText("");
  };

  const handleStatusChange = (value) => {
    setForm((current) => ({
      ...current,
      status: value,
    }));
  };

  const handleRangeChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      ranges: current.ranges.map((range, rangeIndex) =>
        rangeIndex === index
          ? {
              ...range,
              [field]: value,
            }
          : range,
      ),
    }));
  };

  const handleAddRange = () => {
    setForm((current) => {
      const previous = current.ranges[current.ranges.length - 1];

      const nextStart =
        previous?.end_minutes !== "" &&
        previous?.end_minutes !== null &&
        previous?.end_minutes !== undefined
          ? String(Math.max(0, Number(previous.end_minutes)))
          : "";

      return {
        ...current,
        ranges: [
          ...current.ranges,
          {
            start_minutes: nextStart,
            end_minutes: "",
            salary_action: "deduct_actual_minutes",
          },
        ],
      };
    });
  };

  const handleRemoveRange = (index) => {
    setForm((current) => ({
      ...current,
      ranges: current.ranges.filter(
        (_, rangeIndex) => rangeIndex !== index,
      ),
    }));
  };

  const validateForm = () => {
    if (!form.ranges.length) {
      return "請至少設定一筆扣薪級距。";
    }

    const normalizedRanges = form.ranges
      .map((range) => ({
        start_minutes: Number(range.start_minutes),
        end_minutes:
          range.end_minutes === "" ? null : Number(range.end_minutes),
        salary_action: range.salary_action,
      }))
      .sort((a, b) => a.start_minutes - b.start_minutes);

    for (let index = 0; index < normalizedRanges.length; index += 1) {
      const range = normalizedRanges[index];
      const previous = normalizedRanges[index - 1];

      if (
        !Number.isInteger(range.start_minutes) ||
        range.start_minutes < 0
      ) {
        return `第 ${index + 1} 個級距的開始分鐘必須是 0 以上的整數。`;
      }

      if (
        range.end_minutes !== null &&
        (!Number.isInteger(range.end_minutes) ||
          range.end_minutes <= range.start_minutes)
      ) {
        return `第 ${index + 1} 個級距的結束分鐘必須大於開始分鐘。`;
      }

      if (!range.salary_action) {
        return `請選擇第 ${index + 1} 個級距的扣薪方式。`;
      }

      if (previous?.end_minutes === null) {
        return "無上限級距必須是最後一個級距。";
      }

      if (
        previous &&
        previous.end_minutes !== null &&
        range.start_minutes < previous.end_minutes
      ) {
        return `第 ${index + 1} 個級距與前一級距重疊。`;
      }
    }

    return "";
  };

  const handleSubmit = async () => {
    if (!activeConfig) return;

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormErrorText(validationMessage);
      return;
    }

    setSubmitting(true);
    setFormErrorText("");

    try {
      const normalizedRanges = form.ranges
        .map((range) => ({
          start_minutes: Number(range.start_minutes),
          end_minutes:
            range.end_minutes === "" ? null : Number(range.end_minutes),
          salary_action: range.salary_action,
        }))
        .sort((a, b) => a.start_minutes - b.start_minutes);

      const existingRule = rules[activeConfig.ruleCode] || null;
      let attendanceRuleId = Number(
        existingRule?.attendance_rule_id || 0,
      );

      if (attendanceRuleId > 0) {
        await apiUpdateAttendanceRule(attendanceRuleId, {
          rule_code: activeConfig.ruleCode,
          rule_name: activeConfig.ruleName,
          rule_type: activeConfig.ruleType,
          status: form.status,
        });
      } else {
        const createResponse = await apiCreateAttendanceRule({
          rule_code: activeConfig.ruleCode,
          rule_name: activeConfig.ruleName,
          rule_type: activeConfig.ruleType,
          status: form.status,
        });

        const createdRule = unwrapPayload(createResponse, {});

        attendanceRuleId = Number(
          createdRule?.attendance_rule_id || 0,
        );

        if (!attendanceRuleId) {
          throw new Error(
            `建立${activeConfig.ruleName}後未取得規則編號。`,
          );
        }
      }

      await apiSaveAttendanceRuleRanges(
        attendanceRuleId,
        normalizedRanges,
      );

      await loadData();

      setFormOpen(false);
      setSuccessDialog({
        open: true,
        title: "操作成功",
        message: existingRule
          ? `${activeConfig.ruleName}已成功更新。`
          : `${activeConfig.ruleName}已成功建立。`,
      });
    } catch (error) {
      console.error(error);

      setFormErrorText(
        error?.response?.data?.message ||
          error?.message ||
          `儲存${activeConfig.ruleName}失敗。`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderValue = (row, column) => {
    if (column.key === "range_summary") {
      const items = Array.isArray(row.range_summary)
        ? row.range_summary
        : [];

      if (!items.length) {
        return (
          <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
            尚未設定級距
          </Typography>
        );
      }

      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {items.map((item, index) => (
            <Box
              key={`${row.rule_code}-range-summary-${index}`}
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(110px, auto) 1fr",
                alignItems: "center",
                columnGap: "16px",
              }}
            >
              <Typography sx={{ fontSize: "14px", color: "#111827", whiteSpace: "nowrap" }}>
                {item.range}
              </Typography>

              <Typography sx={{ fontSize: "14px", color: "#374151" }}>
                {item.action}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }

    if (column.key === "actions") {
      return (
        <Tooltip title={row.configured ? "編輯" : "設定"}>
          <IconButton
            size="small"
            onClick={() => handleOpenForm(row)}
            aria-label={row.configured ? "編輯" : "設定"}
          >
            {row.configured ? (
              <EditOutlinedIcon fontSize="small" />
            ) : (
              <AddIcon fontSize="small" />
            )}
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
          打卡規則
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          設定遲到與早退的扣薪級距及規則狀態。
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
        desktopMinWidth="720px"
        emptyText={loading ? "載入中..." : "查無打卡規則資料"}
        renderValue={renderValue}
        fitToContainer
      />

      <FormDialog
        open={formOpen}
        title={
          activeConfig
            ? `${rules[activeConfig.ruleCode] ? "編輯" : "設定"}${activeConfig.ruleName}`
            : "打卡規則"
        }
        submitting={submitting}
        submitLabel="儲存"
        maxWidth="md"
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formErrorText ? (
          <Alert severity="error">{formErrorText}</Alert>
        ) : null}

        <SelectField
          label="狀態"
          required
          value={form.status}
          onChange={handleStatusChange}
          options={ENABLE_STATUS_OPTIONS}
          fullWidth
        />

        <Box>
          <Box
            sx={{
              mb: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {activeConfig?.rangeTitle || "扣薪級距"}
            </Typography>

            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddRange}
              disabled={submitting}
            >
              新增級距
            </Button>
          </Box>

          <Typography
            sx={{
              mb: "12px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            級距採前含後不含，例如 0～15 表示 0 至 14 分鐘。
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {form.ranges.map((range, index) => (
              <Box
                key={`${activeConfig?.key || "rule"}-range-${index}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1fr) minmax(0, 1fr) minmax(220px, 1.3fr) 40px",
                  },
                  alignItems: "end",
                  gap: "10px",
                  p: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                }}
              >
                <TextField
                  label="開始分鐘"
                  type="number"
                  size="small"
                  value={range.start_minutes}
                  onChange={(event) =>
                    handleRangeChange(
                      index,
                      "start_minutes",
                      event.target.value,
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 1,
                    },
                  }}
                  fullWidth
                />

                <TextField
                  label="結束分鐘"
                  type="number"
                  size="small"
                  value={range.end_minutes}
                  onChange={(event) =>
                    handleRangeChange(
                      index,
                      "end_minutes",
                      event.target.value,
                    )
                  }
                  placeholder="留空代表無上限"
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 1,
                    },
                  }}
                  fullWidth
                />

                <TextField
                  select
                  label="扣薪方式"
                  size="small"
                  required
                  value={range.salary_action}
                  onChange={(event) =>
                    handleRangeChange(
                      index,
                      "salary_action",
                      event.target.value,
                    )
                  }
                  fullWidth
                >
                  {SALARY_ACTION_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Tooltip title="刪除級距">
                    <span>
                      <IconButton
                        onClick={() => handleRemoveRange(index)}
                        disabled={submitting || form.ranges.length <= 1}
                        aria-label="刪除級距"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
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