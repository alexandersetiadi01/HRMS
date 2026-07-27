import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
  createInsuranceUnit,
  updateInsuranceUnit,
} from "../../API/payroll";

const EMPTY_FORM = {
  unit_code: "",
  unit_name: "",
  labor_insurance_unit_no: "",
  health_insurance_unit_no: "",
  labor_pension_unit_no: "",
  supplementary_premium_withholding_enabled: false,
  effective_from: "",
  effective_to: "",
  status: "啟用",
  remarks: "",
  accident_rate: "",
  accident_rate_effective_from: "",
  accident_rate_effective_to: "",
};

const NUMBER_FIELDS = [
  ["labor_insurance_unit_no", "勞保投保單位編號"],
  ["health_insurance_unit_no", "健保投保單位編號"],
  ["labor_pension_unit_no", "勞退提繳單位編號"],
];

function getToday() {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000,
  );

  return local.toISOString().slice(0, 10);
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function toBoolean(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1"
  );
}

function unitToForm(unit) {
  return {
    ...EMPTY_FORM,
    unit_code: String(unit?.unit_code || ""),
    unit_name: String(unit?.unit_name || ""),
    labor_insurance_unit_no: String(
      unit?.labor_insurance_unit_no || "",
    ),
    health_insurance_unit_no: String(
      unit?.health_insurance_unit_no || "",
    ),
    labor_pension_unit_no: String(
      unit?.labor_pension_unit_no || "",
    ),
    supplementary_premium_withholding_enabled:
      toBoolean(
        unit?.supplementary_premium_withholding_enabled,
      ),
    effective_from: String(
      unit?.effective_from || "",
    ),
    effective_to: String(
      unit?.effective_to || "",
    ),
    status:
      unit?.status === "停用" ? "停用" : "啟用",
    remarks: String(unit?.remarks || ""),
  };
}

function buildPayload(form, editing) {
  const payload = {
    unit_code: form.unit_code.trim(),
    unit_name: form.unit_name.trim(),
    labor_insurance_unit_no:
      form.labor_insurance_unit_no.trim(),
    health_insurance_unit_no:
      form.health_insurance_unit_no.trim(),
    labor_pension_unit_no:
      form.labor_pension_unit_no.trim(),
    supplementary_premium_withholding_enabled:
      form.supplementary_premium_withholding_enabled
        ? 1
        : 0,
    effective_from: form.effective_from,
    effective_to: form.effective_to || null,
    status: form.status,
    remarks: form.remarks.trim(),
  };

  if (!editing) {
    payload.accident_rate = {
      accident_rate: Number(form.accident_rate),
      effective_from:
        form.accident_rate_effective_from,
      effective_to:
        form.accident_rate_effective_to || null,
    };
  }

  return payload;
}

function validateForm(form, editing) {
  if (!form.unit_code.trim()) {
    return "請輸入投保單位代碼。";
  }

  if (!form.unit_name.trim()) {
    return "請輸入投保單位名稱。";
  }

  if (!form.effective_from) {
    return "請選擇投保單位生效日。";
  }

  if (
    form.effective_to &&
    form.effective_to < form.effective_from
  ) {
    return "投保單位失效日不可早於生效日。";
  }

  if (editing) {
    return "";
  }

  const rate = Number(form.accident_rate);

  if (
    form.accident_rate === "" ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 100
  ) {
    return "職災保險費率必須介於 0 至 100 之間。";
  }

  if (!form.accident_rate_effective_from) {
    return "請選擇初始職災保險費率生效日。";
  }

  if (
    form.accident_rate_effective_from <
    form.effective_from
  ) {
    return "職災保險費率生效日不可早於投保單位生效日。";
  }

  if (
    form.effective_to &&
    form.accident_rate_effective_from >
      form.effective_to
  ) {
    return "職災保險費率生效日不可晚於投保單位失效日。";
  }

  if (
    form.accident_rate_effective_to &&
    form.accident_rate_effective_to <
      form.accident_rate_effective_from
  ) {
    return "職災保險費率失效日不可早於生效日。";
  }

  if (
    form.effective_to &&
    form.accident_rate_effective_to &&
    form.accident_rate_effective_to >
      form.effective_to
  ) {
    return "職災保險費率失效日不可晚於投保單位失效日。";
  }

  return "";
}

function SectionTitle({ children }) {
  return (
    <Typography
      sx={{
        gridColumn: "1 / -1",
        mt: "4px",
        pb: "6px",
        borderBottom: "1px solid #e5e7eb",
        color: "#1f2937",
        fontSize: "15px",
        fontWeight: 700,
      }}
    >
      {children}
    </Typography>
  );
}

export default function InsuranceUnitFormDialog({
  open,
  unit,
  onClose,
  onSaved,
}) {
  const editing = Boolean(unit?.insurance_unit_id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editing) {
      setForm(unitToForm(unit));
    } else {
      const today = getToday();

      setForm({
        ...EMPTY_FORM,
        effective_from: today,
        accident_rate_effective_from: today,
      });
    }

    setSubmitting(false);
    setError("");
  }, [editing, open, unit]);

  function setField(field, value) {
    setForm((previous) => {
      const next = {
        ...previous,
        [field]: value,
      };

      if (
        !editing &&
        field === "effective_from" &&
        (
          !previous.accident_rate_effective_from ||
          previous.accident_rate_effective_from ===
            previous.effective_from
        )
      ) {
        next.accident_rate_effective_from = value;
      }

      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm(
      form,
      editing,
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (editing) {
        await updateInsuranceUnit(
          unit.insurance_unit_id,
          buildPayload(form, true),
        );
      } else {
        await createInsuranceUnit(
          buildPayload(form, false),
        );
      }

      onSaved(
        editing
          ? "投保單位已更新。"
          : "投保單位已新增。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          editing
            ? "更新投保單位失敗。"
            : "新增投保單位失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const textField = (
    field,
    label,
    props = {},
  ) => (
    <TextField
      key={field}
      label={label}
      size="small"
      value={form[field]}
      onChange={(event) =>
        setField(field, event.target.value)
      }
      {...props}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        {editing
          ? "編輯投保單位"
          : "新增投保單位"}
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "16px",
          }}
        >
          {error ? (
            <Alert
              severity="error"
              sx={{ gridColumn: "1 / -1" }}
            >
              {error}
            </Alert>
          ) : null}

          <SectionTitle>基本資料</SectionTitle>

          {textField(
            "unit_code",
            "投保單位代碼",
            {
              required: true,
              inputProps: { maxLength: 50 },
            },
          )}

          {textField(
            "unit_name",
            "投保單位名稱",
            {
              required: true,
              inputProps: { maxLength: 255 },
            },
          )}

          {NUMBER_FIELDS.map(([field, label]) =>
            textField(field, label, {
              inputProps: { maxLength: 100 },
            }),
          )}

          <FormControl size="small">
            <InputLabel id="insurance-unit-status-label">
              狀態
            </InputLabel>

            <Select
              labelId="insurance-unit-status-label"
              label="狀態"
              value={form.status}
              onChange={(event) =>
                setField(
                  "status",
                  event.target.value,
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

          {textField(
            "effective_from",
            "投保單位生效日",
            {
              type: "date",
              required: true,
              InputLabelProps: { shrink: true },
            },
          )}

          {textField(
            "effective_to",
            "投保單位失效日",
            {
              type: "date",
              InputLabelProps: { shrink: true },
              helperText: "留空代表無期限",
            },
          )}

          <FormControlLabel
            control={
              <Switch
                checked={
                  form.supplementary_premium_withholding_enabled
                }
                onChange={(event) =>
                  setField(
                    "supplementary_premium_withholding_enabled",
                    event.target.checked,
                  )
                }
              />
            }
            label="啟用補充保費扣繳"
            sx={{
              gridColumn: "1 / -1",
              m: 0,
            }}
          />

          {!editing ? (
            <>
              <SectionTitle>
                初始職災保險費率
              </SectionTitle>

              {textField(
                "accident_rate",
                "職災保險費率（%）",
                {
                  type: "number",
                  required: true,
                  inputProps: {
                    min: 0,
                    max: 100,
                    step: 0.0001,
                  },
                },
              )}

              {textField(
                "accident_rate_effective_from",
                "費率生效日",
                {
                  type: "date",
                  required: true,
                  InputLabelProps: {
                    shrink: true,
                  },
                },
              )}

              {textField(
                "accident_rate_effective_to",
                "費率失效日",
                {
                  type: "date",
                  InputLabelProps: {
                    shrink: true,
                  },
                  helperText:
                    "留空代表持續生效",
                },
              )}

              <Alert
                severity="info"
                sx={{ alignSelf: "start" }}
              >
                後續費率異動會保留歷史期間，不會覆寫初始費率。
              </Alert>
            </>
          ) : (
            <Alert
              severity="info"
              sx={{ gridColumn: "1 / -1" }}
            >
              職災保險費率請從費率紀錄新增生效期間，避免覆寫歷史資料。
            </Alert>
          )}

          <SectionTitle>備註</SectionTitle>

          {textField("remarks", "備註", {
            multiline: true,
            minRows: 3,
            sx: { gridColumn: "1 / -1" },
          })}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ px: "24px", py: "14px" }}
      >
        <Button
          onClick={onClose}
          disabled={submitting}
        >
          取消
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
        >
          {submitting ? "儲存中…" : "儲存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}