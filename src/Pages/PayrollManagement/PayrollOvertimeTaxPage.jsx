import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  getPayrollOvertimeTaxSettings,
  updatePayrollOvertimeTaxSettings,
} from "../../API/payroll";

const RULE_DEFINITIONS = [
  {
    code: "weekday",
    name: "平日",
  },
  {
    code: "holiday",
    name: "休假日",
  },
  {
    code: "regular_holiday",
    name: "例假日",
  },
  {
    code: "rest_day",
    name: "休息日",
  },
  {
    code: "national_holiday",
    name: "國定假日",
  },
  {
    code: "monthly_salary_holiday",
    name: "月薪人員假日",
  },
];

const CALCULATION_MODES = [
  {
    value: "all_hours",
    label: "全部時數使用相同類型",
  },
  {
    value: "tiered",
    label: "依時數區間判定",
  },
  {
    value: "not_applicable",
    label: "不適用",
  },
];

const TAX_TYPES = [
  {
    value: "tax_free",
    label: "免稅",
  },
  {
    value: "taxable",
    label: "應稅",
  },
  {
    value: "monthly_quota",
    label: "計入每月時數判定",
  },
];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function createDefaultRule(definition) {
  return {
    overtime_type_code: definition.code,
    overtime_type_name: definition.name,
    calculation_mode: "all_hours",
    all_hours_tax_type: "monthly_quota",
    segments: [],
  };
}

function normalizeSegment(segment, index) {
  return {
    overtime_tax_segment_id:
      segment?.overtime_tax_segment_id || null,
    start_hour:
      segment?.start_hour === null ||
      segment?.start_hour === undefined
        ? index === 0
          ? 0
          : ""
        : segment.start_hour,
    end_hour:
      segment?.end_hour === null ||
      segment?.end_hour === undefined
        ? null
        : segment.end_hour,
    tax_type:
      segment?.tax_type || "tax_free",
  };
}

function normalizeRule(rule, definition) {
  const segments = Array.isArray(rule?.segments)
    ? rule.segments.map(normalizeSegment)
    : [];

  return {
    overtime_tax_rule_id:
      rule?.overtime_tax_rule_id || null,
    overtime_type_code: definition.code,
    overtime_type_name:
      rule?.overtime_type_name ||
      definition.name,
    calculation_mode:
      rule?.calculation_mode || "all_hours",
    all_hours_tax_type:
      rule?.all_hours_tax_type ||
      "monthly_quota",
    segments,
  };
}

function normalizeResponse(payload) {
  const receivedRules = Array.isArray(payload?.rules)
    ? payload.rules
    : [];

  return {
    allowanceMode:
      payload?.setting?.allowance_mode ||
      "monthly_46",
    rules: RULE_DEFINITIONS.map((definition) => {
      const receivedRule = receivedRules.find(
        (rule) =>
          rule?.overtime_type_code ===
          definition.code,
      );

      return receivedRule
        ? normalizeRule(
            receivedRule,
            definition,
          )
        : createDefaultRule(definition);
    }),
  };
}

function createInitialSegments() {
  return [
    {
      start_hour: 0,
      end_hour: 8,
      tax_type: "tax_free",
    },
    {
      start_hour: 8,
      end_hour: null,
      tax_type: "monthly_quota",
    },
  ];
}

function RuleSelect({
  value,
  onChange,
  options,
  ariaLabel,
}) {
  return (
    <FormControl fullWidth size="small">
      <Select
        value={value}
        onChange={onChange}
        inputProps={{
          "aria-label": ariaLabel,
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function OvertimeRuleCard({
  rule,
  onChange,
}) {
  function changeMode(calculationMode) {
    onChange({
      ...rule,
      calculation_mode: calculationMode,
      all_hours_tax_type:
        calculationMode === "all_hours"
          ? rule.all_hours_tax_type ||
            "monthly_quota"
          : null,
      segments:
        calculationMode === "tiered"
          ? rule.segments.length > 0
            ? rule.segments
            : createInitialSegments()
          : [],
    });
  }

  function updateSegmentEnd(index, value) {
    const segments = rule.segments.map(
      (segment) => ({ ...segment }),
    );

    segments[index].end_hour = value;

    if (segments[index + 1]) {
      segments[index + 1].start_hour =
        value;
    }

    onChange({
      ...rule,
      segments,
    });
  }

  function updateSegmentTaxType(
    index,
    taxType,
  ) {
    onChange({
      ...rule,
      segments: rule.segments.map(
        (segment, segmentIndex) =>
          segmentIndex === index
            ? {
                ...segment,
                tax_type: taxType,
              }
            : segment,
      ),
    });
  }

  function addSegment() {
    const segments = rule.segments.map(
      (segment) => ({ ...segment }),
    );

    if (segments.length === 0) {
      onChange({
        ...rule,
        segments: createInitialSegments(),
      });
      return;
    }

    const lastIndex = segments.length - 1;
    const lastSegment = segments[lastIndex];
    const startHour =
      Number(lastSegment.start_hour) || 0;
    const boundary = startHour + 8;

    lastSegment.end_hour = boundary;

    segments.push({
      start_hour: boundary,
      end_hour: null,
      tax_type: "monthly_quota",
    });

    onChange({
      ...rule,
      segments,
    });
  }

  function removeSegment(index) {
    if (rule.segments.length <= 1) {
      return;
    }

    const removedStart =
      rule.segments[index].start_hour;

    const segments = rule.segments
      .filter(
        (_, segmentIndex) =>
          segmentIndex !== index,
      )
      .map((segment) => ({ ...segment }));

    if (index === 0 && segments[0]) {
      segments[0].start_hour = 0;
    } else if (segments[index]) {
      segments[index].start_hour =
        removedStart;
    }

    if (segments.length > 0) {
      segments[
        segments.length - 1
      ].end_hour = null;
    }

    onChange({
      ...rule,
      segments,
    });
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "16px",
          sm: "20px",
        },
        borderColor: "#dfe5ea",
        borderRadius: "8px",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "180px minmax(0, 1fr)",
          },
          gap: {
            xs: "12px",
            md: "20px",
          },
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#0f172a",
              fontSize: {
                xs: "17px",
                sm: "18px",
              },
              fontWeight: 700,
            }}
          >
            {rule.overtime_type_name}
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            {rule.overtime_type_code}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              mb: "6px",
              color: "#475569",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            判定方式
          </Typography>

          <RuleSelect
            value={rule.calculation_mode}
            onChange={(event) =>
              changeMode(event.target.value)
            }
            options={CALCULATION_MODES}
            ariaLabel={`${rule.overtime_type_name}判定方式`}
          />
        </Box>
      </Box>

      {rule.calculation_mode ===
      "all_hours" ? (
        <>
          <Divider sx={{ my: "18px" }} />

          <Box
            sx={{
              maxWidth: {
                xs: "100%",
                md: "420px",
              },
            }}
          >
            <Typography
              sx={{
                mb: "6px",
                color: "#475569",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              全部加班時數的所得稅類型
            </Typography>

            <RuleSelect
              value={
                rule.all_hours_tax_type ||
                "monthly_quota"
              }
              onChange={(event) =>
                onChange({
                  ...rule,
                  all_hours_tax_type:
                    event.target.value,
                })
              }
              options={TAX_TYPES}
              ariaLabel={`${rule.overtime_type_name}所得稅類型`}
            />
          </Box>
        </>
      ) : null}

      {rule.calculation_mode ===
      "tiered" ? (
        <>
          <Divider sx={{ my: "18px" }} />

          <Box
            sx={{
              display: "flex",
              alignItems: {
                xs: "stretch",
                sm: "center",
              },
              justifyContent: "space-between",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              gap: "10px",
              mb: "12px",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#1e293b",
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                時數區間
              </Typography>

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                區間必須連續，最後一段固定為不限時數。
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addSegment}
              sx={{
                alignSelf: {
                  xs: "flex-start",
                  sm: "center",
                },
              }}
            >
              新增區間
            </Button>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: "10px",
            }}
          >
            {rule.segments.map(
              (segment, index) => {
                const isLast =
                  index ===
                  rule.segments.length - 1;

                return (
                  <Box
                    key={
                      segment.overtime_tax_segment_id ||
                      `${rule.overtime_type_code}-${index}`
                    }
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr 1fr",
                        sm:
                          "minmax(110px, 0.8fr) minmax(110px, 0.8fr) minmax(210px, 1.4fr) auto",
                      },
                      gap: "10px",
                      alignItems: "center",
                      p: {
                        xs: "12px",
                        sm: 0,
                      },
                      border: {
                        xs: "1px solid #e5e7eb",
                        sm: "none",
                      },
                      borderRadius: {
                        xs: "6px",
                        sm: 0,
                      },
                    }}
                  >
                    <TextField
                      label="開始時數"
                      size="small"
                      type="number"
                      value={segment.start_hour}
                      disabled
                      inputProps={{
                        min: 0,
                        step: 0.5,
                      }}
                    />

                    {isLast ? (
                      <TextField
                        label="結束時數"
                        size="small"
                        value="不限"
                        disabled
                      />
                    ) : (
                      <TextField
                        label="結束時數"
                        size="small"
                        type="number"
                        value={segment.end_hour}
                        onChange={(event) =>
                          updateSegmentEnd(
                            index,
                            event.target.value,
                          )
                        }
                        inputProps={{
                          min:
                            Number(
                              segment.start_hour,
                            ) || 0,
                          step: 0.5,
                        }}
                      />
                    )}

                    <Box
                      sx={{
                        gridColumn: {
                          xs: "1 / -1",
                          sm: "auto",
                        },
                      }}
                    >
                      <RuleSelect
                        value={segment.tax_type}
                        onChange={(event) =>
                          updateSegmentTaxType(
                            index,
                            event.target.value,
                          )
                        }
                        options={TAX_TYPES}
                        ariaLabel={`${rule.overtime_type_name}第 ${
                          index + 1
                        } 段所得稅類型`}
                      />
                    </Box>

                    <Button
                      color="error"
                      size="small"
                      startIcon={
                        <DeleteOutlineOutlinedIcon />
                      }
                      disabled={
                        rule.segments.length <= 1
                      }
                      onClick={() =>
                        removeSegment(index)
                      }
                      sx={{
                        gridColumn: {
                          xs: "1 / -1",
                          sm: "auto",
                        },
                        justifySelf: {
                          xs: "flex-start",
                          sm: "center",
                        },
                        whiteSpace: "nowrap",
                      }}
                    >
                      刪除
                    </Button>
                  </Box>
                );
              },
            )}
          </Box>
        </>
      ) : null}

      {rule.calculation_mode ===
      "not_applicable" ? (
        <Alert
          severity="info"
          sx={{ mt: "18px" }}
        >
          此加班類型不參與加班費所得稅判定。
        </Alert>
      ) : null}
    </Paper>
  );
}

function validateRules(rules) {
  for (const rule of rules) {
    if (
      rule.calculation_mode !== "tiered"
    ) {
      continue;
    }

    if (rule.segments.length === 0) {
      return `${rule.overtime_type_name}至少需要一個時數區間。`;
    }

    for (
      let index = 0;
      index < rule.segments.length;
      index += 1
    ) {
      const segment = rule.segments[index];
      const startHour = Number(
        segment.start_hour,
      );
      const isLast =
        index === rule.segments.length - 1;

      if (!Number.isFinite(startHour)) {
        return `${rule.overtime_type_name}第 ${
          index + 1
        } 段的開始時數不正確。`;
      }

      if (!isLast) {
        const endHour = Number(
          segment.end_hour,
        );

        if (
          !Number.isFinite(endHour) ||
          endHour <= startHour
        ) {
          return `${rule.overtime_type_name}第 ${
            index + 1
          } 段的結束時數必須大於開始時數。`;
        }
      }
    }
  }

  return "";
}

function buildSavePayload(
  allowanceMode,
  rules,
) {
  return {
    setting: {
      allowance_mode: allowanceMode,
    },
    rules: rules.map((rule) => ({
      overtime_type_code:
        rule.overtime_type_code,
      calculation_mode:
        rule.calculation_mode,
      all_hours_tax_type:
        rule.calculation_mode ===
        "all_hours"
          ? rule.all_hours_tax_type
          : null,
      segments:
        rule.calculation_mode === "tiered"
          ? rule.segments.map(
              (segment, index) => ({
                start_hour: Number(
                  segment.start_hour,
                ),
                end_hour:
                  index ===
                  rule.segments.length - 1
                    ? null
                    : Number(
                        segment.end_hour,
                      ),
                tax_type:
                  segment.tax_type,
              }),
            )
          : [],
    })),
  };
}

export default function PayrollOvertimeTaxPage() {
  const [allowanceMode, setAllowanceMode] =
    useState("monthly_46");
  const [rules, setRules] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const loadSettings = useCallback(
    async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const response =
          await getPayrollOvertimeTaxSettings();

        const normalized =
          normalizeResponse(response);

        setAllowanceMode(
          normalized.allowanceMode,
        );
        setRules(normalized.rules);
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
            "載入加班費所得稅設定失敗。",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function updateRule(
    ruleCode,
    nextRule,
  ) {
    setRules((previous) =>
      previous.map((rule) =>
        rule.overtime_type_code === ruleCode
          ? nextRule
          : rule,
      ),
    );

    setSuccess("");
  }

  async function handleSave() {
    const validationError =
      validateRules(rules);

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await updatePayrollOvertimeTaxSettings(
          buildSavePayload(
            allowanceMode,
            rules,
          ),
        );

      const normalized =
        normalizeResponse(response);

      setAllowanceMode(
        normalized.allowanceMode,
      );
      setRules(normalized.rules);
      setSuccess(
        "加班費所得稅設定已儲存。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "儲存加班費所得稅設定失敗。",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
          justifyContent: "space-between",
          gap: "12px",
          mb: "18px",
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              color: "#111827",
              fontSize: {
                xs: "22px",
                sm: "25px",
              },
              fontWeight: 700,
            }}
          >
            加班費所得稅類型
          </Typography>

          <Typography
            sx={{
              mt: "4px",
              color: "#64748b",
              fontSize: {
                xs: "13px",
                sm: "14px",
              },
            }}
          >
            設定不同加班類型的免稅、應稅及每月時數判定規則。
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={loading || saving}
            onClick={loadSettings}
          >
            重新載入
          </Button>

          <Button
            variant="contained"
            startIcon={
              saving ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <SaveOutlinedIcon />
              )
            }
            disabled={
              loading ||
              saving ||
              rules.length !==
                RULE_DEFINITIONS.length
            }
            onClick={handleSave}
          >
            {saving ? "儲存中…" : "儲存設定"}
          </Button>
        </Box>
      </Box>

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: "16px" }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert
          severity="success"
          sx={{ mb: "16px" }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      ) : null}

      {loading ? (
        <Paper
          variant="outlined"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "280px",
            borderColor: "#dfe5ea",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={34} />

            <Typography
              sx={{
                mt: "12px",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              正在載入加班費所得稅設定…
            </Typography>
          </Box>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: "16px",
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: {
                xs: "16px",
                sm: "22px",
              },
              borderColor: "#dfe5ea",
              borderRadius: "8px",
            }}
          >
            <Typography
              sx={{
                color: "#0f172a",
                fontSize: {
                  xs: "17px",
                  sm: "19px",
                },
                fontWeight: 700,
              }}
            >
              免稅時數判定方式
            </Typography>

            <Typography
              sx={{
                mt: "4px",
                mb: "14px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              此設定套用至「計入每月時數判定」的加班時數。
            </Typography>

            <RadioGroup
              value={allowanceMode}
              onChange={(event) => {
                setAllowanceMode(
                  event.target.value,
                );
                setSuccess("");
              }}
              sx={{
                gap: "8px",
              }}
            >
              <FormControlLabel
                value="monthly_46"
                control={<Radio />}
                label={
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      每月 46 小時
                    </Typography>

                    <Typography
                      sx={{
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      每個月最多以 46 小時作為免稅時數判定。
                    </Typography>
                  </Box>
                }
                sx={{
                  alignItems: "flex-start",
                  m: 0,
                  p: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />

              <FormControlLabel
                value="quarterly_138"
                control={<Radio />}
                label={
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      每月 54 小時／每三個月 138 小時
                    </Typography>

                    <Typography
                      sx={{
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      單月上限為 54 小時，同時受三個月合計 138 小時限制。
                    </Typography>
                  </Box>
                }
                sx={{
                  alignItems: "flex-start",
                  m: 0,
                  p: "10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
            </RadioGroup>
          </Paper>

          {rules.map((rule) => (
            <OvertimeRuleCard
              key={rule.overtime_type_code}
              rule={rule}
              onChange={(nextRule) =>
                updateRule(
                  rule.overtime_type_code,
                  nextRule,
                )
              }
            />
          ))}
        </Box>
      )}
    </Box>
  );
}