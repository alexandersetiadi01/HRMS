import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  createPayrollTaxProfile,
  getInsuranceUnits,
  getTaxDeclarationUnits,
  updatePayrollTaxProfile,
} from "../../API/payroll";

const EMPTY_FORM = {
  tax_declaration_unit_id: "",
  taxpayer_type: "本國人",
  certificate_type: "0",
  residency_status: "居民",
  withholding_method:
    "依照所得稅額表扣繳",
  withholding_rate: "",
  fixed_tax_amount: "",
  part_time_supplementary_enabled: false,
  part_time_health_insurance_unit_id: "",
  vulnerable_group_exempt: false,
  entry_date: "",
  effective_from: "",
  effective_to: "",
  remarks: "",
  status: "啟用",
};

const CERTIFICATE_TYPE_OPTIONS = [
  {
    value: "0",
    label: "0｜本國個人",
  },
  {
    value: "3",
    label: "3｜境內住滿 183 天之外僑或大陸居民",
  },
  {
    value: "5",
    label: "5｜境內未住滿 183 天之大陸地區人民",
  },
  {
    value: "7",
    label: "7｜境內未住滿 183 天之外僑",
  },
];

const WITHHOLDING_METHOD_OPTIONS = [
  {
    value: "依照所得稅額表扣繳",
    label: "依照所得稅額表扣繳",
  },
  {
    value: "不扣繳",
    label: "不扣繳（舊版）",
  },
  {
    value: "依年度參數",
    label: "依年度參數（舊版固定稅率）",
  },
  {
    value: "固定稅率",
    label: "固定稅率（舊版）",
  },
  {
    value: "手動金額",
    label: "手動金額（舊版）",
  },
];

function getToday() {
  const now = new Date();

  const localDate = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60000,
  );

  return localDate
    .toISOString()
    .slice(0, 10);
}

function normalizeDate(value) {
  if (
    !value ||
    value === "0000-00-00"
  ) {
    return "";
  }

  return String(value).slice(0, 10);
}

function toBoolean(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1"
  );
}

function getErrorMessage(
  error,
  fallback,
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function recordToForm(record) {
  if (!record) {
    const today = getToday();

    return {
      ...EMPTY_FORM,
      entry_date: today,
      effective_from: today,
    };
  }

  return {
    ...EMPTY_FORM,

    tax_declaration_unit_id:
      record.tax_declaration_unit_id ||
      "",

    taxpayer_type:
      record.taxpayer_type ||
      "本國人",

    certificate_type:
      String(
        record.certificate_type ||
          "",
      ),

    residency_status:
      record.residency_status ||
      "居民",

    withholding_method:
      record.withholding_method ||
      "依照所得稅額表扣繳",

    withholding_rate:
      record.withholding_rate ===
        null ||
      record.withholding_rate ===
        undefined
        ? ""
        : String(
            record.withholding_rate,
          ),

    fixed_tax_amount:
      record.fixed_tax_amount ===
        null ||
      record.fixed_tax_amount ===
        undefined
        ? ""
        : String(
            record.fixed_tax_amount,
          ),

    part_time_supplementary_enabled:
      toBoolean(
        record.part_time_supplementary_enabled,
      ),

    part_time_health_insurance_unit_id:
      record.part_time_health_insurance_unit_id ||
      "",

    vulnerable_group_exempt:
      toBoolean(
        record.vulnerable_group_exempt,
      ),

    entry_date: normalizeDate(
      record.entry_date,
    ),

    effective_from:
      normalizeDate(
        record.effective_from,
      ),

    effective_to:
      normalizeDate(
        record.effective_to,
      ),

    remarks:
      record.remarks || "",

    status:
      record.status === "停用"
        ? "停用"
        : "啟用",
  };
}

function validateForm(form) {
  if (
    !form.tax_declaration_unit_id
  ) {
    return "請選擇所得稅申報單位。";
  }

  if (!form.certificate_type) {
    return "請選擇證號別。";
  }

  if (!form.effective_from) {
    return "請選擇生效開始日。";
  }

  if (
    form.effective_to &&
    form.effective_to <
      form.effective_from
  ) {
    return "生效結束日不可早於生效開始日。";
  }

  if (
    form.withholding_method ===
    "固定稅率"
  ) {
    const rate = Number(
      form.withholding_rate,
    );

    if (
      form.withholding_rate ===
        "" ||
      !Number.isFinite(rate) ||
      rate <= 0 ||
      rate > 100
    ) {
      return "固定扣繳稅率必須大於 0 且不得超過 100%。";
    }
  }

  if (
    form.withholding_method ===
    "手動金額"
  ) {
    const amount = Number(
      form.fixed_tax_amount,
    );

    if (
      form.fixed_tax_amount ===
        "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return "手動扣繳金額必須大於 0。";
    }
  }

  if (
    form.part_time_supplementary_enabled &&
    !form.part_time_health_insurance_unit_id
  ) {
    return "啟用兼職薪資補充保費時，請選擇兼職員工健保投保單位。";
  }

  return "";
}

function buildPayload(
  form,
  employeeId,
) {
  return {
    employee_id:
      Number(employeeId),

    tax_declaration_unit_id:
      Number(
        form.tax_declaration_unit_id,
      ),

    taxpayer_type:
      form.taxpayer_type,

    certificate_type:
      form.certificate_type,

    residency_status:
      form.residency_status,

    withholding_method:
      form.withholding_method,

    withholding_rate:
      form.withholding_method ===
      "固定稅率"
        ? Number(
            form.withholding_rate,
          )
        : null,

    fixed_tax_amount:
      form.withholding_method ===
      "手動金額"
        ? Number(
            form.fixed_tax_amount,
          )
        : null,

    part_time_supplementary_enabled:
      form.part_time_supplementary_enabled
        ? 1
        : 0,

    part_time_health_insurance_unit_id:
      form.part_time_supplementary_enabled
        ? Number(
            form.part_time_health_insurance_unit_id,
          )
        : null,

    vulnerable_group_exempt:
      form.vulnerable_group_exempt
        ? 1
        : 0,

    entry_date:
      form.entry_date || null,

    effective_from:
      form.effective_from,

    effective_to:
      form.effective_to ||
      null,

    remarks:
      form.remarks.trim(),

    status:
      form.status,
  };
}

function SectionTitle({
  children,
}) {
  return (
    <Typography
      sx={{
        gridColumn: "1 / -1",
        mt: "4px",
        pb: "6px",
        borderBottom:
          "1px solid #e5e7eb",
        color: "#1f2937",
        fontSize: "15px",
        fontWeight: 700,
      }}
    >
      {children}
    </Typography>
  );
}

export default function EmployeeTaxProfileFormDialog({
  open,
  employee,
  record = null,
  onClose,
  onSaved,
}) {
  const editing = Boolean(
    record?.tax_profile_id,
  );

  const [
    form,
    setForm,
  ] = useState(EMPTY_FORM);

  const [
    declarationUnits,
    setDeclarationUnits,
  ] = useState([]);

  const [
    insuranceUnits,
    setInsuranceUnits,
  ] = useState([]);

  const [
    optionsLoading,
    setOptionsLoading,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(
      recordToForm(record),
    );

    setSubmitting(false);
    setError("");
  }, [open, record]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let active = true;

    async function loadOptions() {
      setOptionsLoading(true);
      setError("");

      try {
        const [
          declarationResult,
          insuranceResult,
        ] = await Promise.all([
          getTaxDeclarationUnits({
            status: "啟用",
          }),

          getInsuranceUnits({
            status: "啟用",
          }),
        ]);

        if (!active) {
          return;
        }

        setDeclarationUnits(
          Array.isArray(
            declarationResult,
          )
            ? declarationResult
            : [],
        );

        setInsuranceUnits(
          Array.isArray(
            insuranceResult,
          )
            ? insuranceResult
            : [],
        );
      } catch (
        requestError
      ) {
        if (!active) {
          return;
        }

        setDeclarationUnits([]);
        setInsuranceUnits([]);

        setError(
          getErrorMessage(
            requestError,
            "無法讀取所得稅申報單位或投保單位。",
          ),
        );
      } finally {
        if (active) {
          setOptionsLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [open]);

  function setField(
    field,
    value,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    const employeeId =
      Number(
        employee?.employee_id || 0,
      );

    if (!employeeId) {
      setError(
        "找不到目前選擇的員工。",
      );

      return;
    }

    const validationMessage =
      validateForm(form);

    if (validationMessage) {
      setError(
        validationMessage,
      );

      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload =
        buildPayload(
          form,
          employeeId,
        );

      let savedRecord = null;

      if (editing) {
        savedRecord =
          await updatePayrollTaxProfile(
            record.tax_profile_id,
            payload,
          );
      } else {
        savedRecord =
          await createPayrollTaxProfile(
            payload,
          );
      }

      onSaved?.(
        savedRecord,
      );
    } catch (
      requestError
    ) {
      setError(
        getErrorMessage(
          requestError,
          editing
            ? "更新員工所得稅資料失敗。"
            : "新增員工所得稅資料失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const employeeName =
    employee?.display_name ||
    employee?.english_name ||
    employee?.email ||
    `員工 #${
      employee?.employee_id ||
      "--"
    }`;

  return (
    <Dialog
      open={open}
      onClose={
        submitting
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="md"
      PaperProps={{
        component: "form",
        onSubmit:
          handleSubmit,
      }}
    >
      <DialogTitle
        sx={{
          pb: "8px",
          fontWeight: 700,
        }}
      >
        {editing
          ? "編輯員工所得稅資料"
          : "新增員工所得稅資料"}
      </DialogTitle>

      <DialogContent dividers>
        <Typography
          sx={{
            mb: "18px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          員工：
          {employee?.employee_no
            ? `${employee.employee_no}｜`
            : ""}
          {employeeName}
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: "16px",
            }}
          >
            {error}
          </Alert>
        )}

        {optionsLoading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
              gap: "10px",
              minHeight:
                "240px",
            }}
          >
            <CircularProgress
              size={24}
            />

            <Typography
              sx={{
                color:
                  "#64748b",
                fontSize:
                  "13px",
              }}
            >
              載入選項中...
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs:
                  "minmax(0, 1fr)",
                sm:
                  "repeat(2, minmax(0, 1fr))",
              },
              gap: "16px",
            }}
          >
            <SectionTitle>
              所得稅身分
            </SectionTitle>

            <FormControl
              fullWidth
              size="small"
              required
            >
              <InputLabel>
                所得稅申報單位
              </InputLabel>

              <Select
                label="所得稅申報單位"
                value={
                  form.tax_declaration_unit_id
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    "tax_declaration_unit_id",
                    event.target
                      .value,
                  )
                }
              >
                {declarationUnits.map(
                  (unit) => (
                    <MenuItem
                      key={
                        unit.tax_declaration_unit_id
                      }
                      value={
                        unit.tax_declaration_unit_id
                      }
                    >
                      {
                        unit.declaration_unit_name
                      }
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                納稅人類型
              </InputLabel>

              <Select
                label="納稅人類型"
                value={
                  form.taxpayer_type
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    "taxpayer_type",
                    event.target
                      .value,
                  )
                }
              >
                <MenuItem value="本國人">
                  本國人
                </MenuItem>

                <MenuItem value="外國人">
                  外國人
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              size="small"
              required
            >
              <InputLabel>
                證號別
              </InputLabel>

              <Select
                label="證號別"
                value={
                  form.certificate_type
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    "certificate_type",
                    event.target
                      .value,
                  )
                }
              >
                {CERTIFICATE_TYPE_OPTIONS.map(
                  (option) => (
                    <MenuItem
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                居留狀態
              </InputLabel>

              <Select
                label="居留狀態"
                value={
                  form.residency_status
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    "residency_status",
                    event.target
                      .value,
                  )
                }
              >
                <MenuItem value="居民">
                  居民
                </MenuItem>

                <MenuItem value="非居民">
                  非居民
                </MenuItem>
              </Select>
            </FormControl>

            <SectionTitle>
              扣繳設定
            </SectionTitle>

            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                扣繳方式
              </InputLabel>

              <Select
                label="扣繳方式"
                value={
                  form.withholding_method
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    "withholding_method",
                    event.target
                      .value,
                  )
                }
              >
                {WITHHOLDING_METHOD_OPTIONS.map(
                  (option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>

            {form.withholding_method ===
              "依照所得稅額表扣繳" && (
              <Alert
                severity="info"
                sx={{
                  gridColumn: "1 / -1",
                }}
              >
                系統會依計薪年度的所得稅參數、員工有效扶養親屬人數及應稅所得，自動查找適用的所得稅額表級距。
              </Alert>
            )}

            {form.withholding_method ===
              "固定稅率" && (
              <TextField
                fullWidth
                size="small"
                type="number"
                label="固定扣繳稅率（%）"
                value={
                  form.withholding_rate
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    "withholding_rate",
                    event.target
                      .value,
                  )
                }
                inputProps={{
                  min: 0,
                  max: 100,
                  step: "0.0001",
                }}
              />
            )}

            {form.withholding_method ===
              "手動金額" && (
              <TextField
                fullWidth
                size="small"
                type="number"
                label="手動扣繳金額"
                value={
                  form.fixed_tax_amount
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    "fixed_tax_amount",
                    event.target
                      .value,
                  )
                }
                inputProps={{
                  min: 0,
                  step: "1",
                }}
              />
            )}

            <SectionTitle>
              兼職薪資補充保費
            </SectionTitle>

            <FormControlLabel
              control={
                <Switch
                  checked={
                    form.part_time_supplementary_enabled
                  }
                  onChange={(
                    event,
                  ) =>
                    setField(
                      "part_time_supplementary_enabled",
                      event.target
                        .checked,
                    )
                  }
                />
              }
              label="計算兼職薪資補充保費"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={
                    form.vulnerable_group_exempt
                  }
                  onChange={(
                    event,
                  ) =>
                    setField(
                      "vulnerable_group_exempt",
                      event.target
                        .checked,
                    )
                  }
                />
              }
              label="補充保費弱勢族群身分"
            />

            {form.part_time_supplementary_enabled && (
              <FormControl
                fullWidth
                size="small"
                required
                sx={{
                  gridColumn: {
                    xs: "auto",
                    sm:
                      "1 / -1",
                  },
                }}
              >
                <InputLabel>
                  兼職員工健保投保單位
                </InputLabel>

                <Select
                  label="兼職員工健保投保單位"
                  value={
                    form.part_time_health_insurance_unit_id
                  }
                  onChange={(
                    event,
                  ) =>
                    setField(
                      "part_time_health_insurance_unit_id",
                      event.target
                        .value,
                    )
                  }
                >
                  {insuranceUnits.map(
                    (unit) => (
                      <MenuItem
                        key={
                          unit.insurance_unit_id
                        }
                        value={
                          unit.insurance_unit_id
                        }
                      >
                        {
                          unit.unit_name
                        }
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            )}

            <SectionTitle>
              生效與狀態
            </SectionTitle>

            <TextField
              fullWidth
              size="small"
              type="date"
              label="建檔日期"
              value={
                form.entry_date
              }
              onChange={(
                event,
              ) =>
                setField(
                  "entry_date",
                  event.target
                    .value,
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
            />

            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                狀態
              </InputLabel>

              <Select
                label="狀態"
                value={
                  form.status
                }
                onChange={(
                  event,
                ) =>
                  setField(
                    "status",
                    event.target
                      .value,
                  )
                }
              >
                <MenuItem value="啟用">
                  啟用
                </MenuItem>

                <MenuItem value="停用">
                  停用
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              required
              size="small"
              type="date"
              label="生效開始日"
              value={
                form.effective_from
              }
              onChange={(
                event,
              ) =>
                setField(
                  "effective_from",
                  event.target
                    .value,
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              size="small"
              type="date"
              label="生效結束日"
              value={
                form.effective_to
              }
              onChange={(
                event,
              ) =>
                setField(
                  "effective_to",
                  event.target
                    .value,
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="備註"
              value={
                form.remarks
              }
              onChange={(
                event,
              ) =>
                setField(
                  "remarks",
                  event.target
                    .value,
                )
              }
              sx={{
                gridColumn:
                  "1 / -1",
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: "24px",
          py: "14px",
        }}
      >
        <Button
          type="button"
          disabled={
            submitting
          }
          onClick={onClose}
        >
          取消
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={
            submitting ||
            optionsLoading
          }
          startIcon={
            submitting ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : null
          }
        >
          {submitting
            ? "儲存中..."
            : "儲存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}