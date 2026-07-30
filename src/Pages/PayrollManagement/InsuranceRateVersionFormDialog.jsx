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
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const INITIAL_VALUES = {
  version_code: "",
  version_name: "",
  effective_from: "",
  effective_to: "",

  labor_ordinary_accident_rate: "",
  labor_employment_insurance_rate: "",
  labor_arrear_wage_fund_rate: "",
  labor_employer_share_rate: "",
  labor_employee_share_rate: "",
  labor_government_share_rate: "",

  health_general_insurance_rate: "",
  health_average_dependent_count: "",
  health_dependent_count_limit: "",
  health_employer_share_rate: "",
  health_employee_share_rate: "",
  health_government_share_rate: "",
  health_supplementary_premium_rate: "",

  source_name: "",
  source_url: "",
  remarks: "",
};

function createFormValues(version = null) {
  if (!version) {
    return { ...INITIAL_VALUES };
  }

  return Object.keys(INITIAL_VALUES).reduce((result, fieldName) => {
    const value = version[fieldName];

    result[fieldName] =
      value === null || value === undefined ? "" : String(value);

    return result;
  }, {});
}

const LABOR_FIELDS = [
  {
    name: "labor_ordinary_accident_rate",
    label: "勞工保險普通事故保險費率",
    english: "Ordinary Accident Insurance Rate",
    suffix: "%",
  },
  {
    name: "labor_employment_insurance_rate",
    label: "就業保險費率",
    english: "Employment Insurance Rate",
    suffix: "%",
  },
  {
    name: "labor_arrear_wage_fund_rate",
    label: "積欠工資墊償基金提繳費率",
    english: "Arrear Wage Fund Rate",
    suffix: "%",
  },
  {
    name: "labor_employer_share_rate",
    label: "雇主負擔比例",
    english: "Employer Share Rate",
    suffix: "%",
  },
  {
    name: "labor_employee_share_rate",
    label: "員工負擔比例",
    english: "Employee Share Rate",
    suffix: "%",
  },
  {
    name: "labor_government_share_rate",
    label: "政府負擔比例",
    english: "Government Share Rate",
    suffix: "%",
  },
];

const HEALTH_FIELDS = [
  {
    name: "health_general_insurance_rate",
    label: "全民健康保險一般保險費率",
    english: "General Health Insurance Rate",
    suffix: "%",
  },
  {
    name: "health_average_dependent_count",
    label: "平均眷口人數",
    english: "Average Dependent Count",
  },
  {
    name: "health_dependent_count_limit",
    label: "眷屬人數上限",
    english: "Dependent Count Limit",
    integer: true,
  },
  {
    name: "health_employer_share_rate",
    label: "雇主負擔比例",
    english: "Employer Share Rate",
    suffix: "%",
  },
  {
    name: "health_employee_share_rate",
    label: "員工負擔比例",
    english: "Employee Share Rate",
    suffix: "%",
  },
  {
    name: "health_government_share_rate",
    label: "政府負擔比例",
    english: "Government Share Rate",
    suffix: "%",
  },
  {
    name: "health_supplementary_premium_rate",
    label: "補充保險費率",
    english: "Supplementary Premium Rate",
    suffix: "%",
  },
];

function getServerMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function getServerFieldErrors(error) {
  const items =
    error?.response?.data?.data?.errors || error?.response?.data?.errors || [];

  if (!Array.isArray(items)) {
    return {};
  }

  return items.reduce((result, item) => {
    if (item?.field && item?.message) {
      result[item.field] = item.message;
    }

    return result;
  }, {});
}

function isValidHttpUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateValues(values) {
  const errors = {};

  const versionCode = values.version_code.trim();
  const versionName = values.version_name.trim();

  if (!versionCode) {
    errors.version_code = "版本代碼為必填。";
  } else if (versionCode.length > 50) {
    errors.version_code = "版本代碼不得超過 50 個字元。";
  }

  if (!versionName) {
    errors.version_name = "版本名稱為必填。";
  } else if (versionName.length > 255) {
    errors.version_name = "版本名稱不得超過 255 個字元。";
  }

  if (!values.effective_from) {
    errors.effective_from = "生效日為必填。";
  }

  if (
    values.effective_from &&
    values.effective_to &&
    values.effective_to < values.effective_from
  ) {
    errors.effective_to = "失效日不得早於生效日。";
  }

  [...LABOR_FIELDS, ...HEALTH_FIELDS].forEach((field) => {
    const value = values[field.name];

    if (value === "") {
      errors[field.name] = "此欄位為必填。";
      return;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      errors[field.name] = "必須是有效數字。";
      return;
    }

    if (field.integer) {
      if (!Number.isInteger(number) || number < 0 || number > 255) {
        errors[field.name] = "必須是 0 至 255 之間的整數。";
      }

      return;
    }

    if (number < 0 || number > 100) {
      errors[field.name] = "必須介於 0 至 100 之間。";
    }
  });

  if (values.source_name.trim().length > 255) {
    errors.source_name = "資料來源名稱不得超過 255 個字元。";
  }

  if (!isValidHttpUrl(values.source_url.trim())) {
    errors.source_url = "資料來源網址必須是有效的 HTTP 或 HTTPS 網址。";
  }

  return errors;
}

function buildPayload(values) {
  const payload = {
    version_code: values.version_code.trim(),
    version_name: values.version_name.trim(),
    effective_from: values.effective_from,
    effective_to: values.effective_to || null,

    source_name: values.source_name.trim(),
    source_url: values.source_url.trim(),
    remarks: values.remarks.trim(),
  };

  [...LABOR_FIELDS, ...HEALTH_FIELDS].forEach((field) => {
    payload[field.name] = field.integer
      ? Number.parseInt(values[field.name], 10)
      : Number.parseFloat(values[field.name]);
  });

  return payload;
}

function SectionHeading({ title, english }) {
  return (
    <Box sx={{ mb: "14px" }}>
      <Typography
        sx={{
          color: "#1f2937",
          fontSize: "16px",
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>

      {/* <Typography
        sx={{
          mt: "2px",
          color: "#94a3b8",
          fontSize: "12px",
        }}
      >
        {english}
      </Typography> */}
    </Box>
  );
}

function RateField({ field, value, error, onChange, disabled }) {
  return (
    <TextField
      name={field.name}
      label={field.label}
      value={value}
      onChange={onChange}
      type="number"
      required
      fullWidth
      disabled={disabled}
      error={Boolean(error)}
      helperText={error} //|| field.english}
      inputProps={{
        min: 0,
        max: field.integer ? 255 : 100,
        step: field.integer ? 1 : 0.0001,
      }}
      InputProps={
        field.suffix
          ? {
              endAdornment: (
                <InputAdornment position="end">{field.suffix}</InputAdornment>
              ),
            }
          : undefined
      }
    />
  );
}

export default function InsuranceRateVersionFormDialog({
  open,
  version = null,
  onClose,
  onSubmit,
}) {
  const isEditing = Boolean(version?.insurance_rate_version_id);
  const [values, setValues] = useState(() => createFormValues(version));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(createFormValues(version));
    setErrors({});
    setSubmitError("");
    setSubmitting(false);
  }, [open, version]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];

      return next;
    });

    if (submitError) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateValues(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError("請修正表單中標示的欄位。");
      return;
    }

    setSubmitting(true);
    setErrors({});
    setSubmitError("");

    try {
      await onSubmit(buildPayload(values));
    } catch (error) {
      setErrors(getServerFieldErrors(error));
      setSubmitError(
        getServerMessage(
          error,
          isEditing ? "更新保險費率草稿失敗。" : "建立保險費率草稿失敗。",
        ),
      );
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          pr: "12px",
        }}
      >
        <Box>
          <Typography
            component="div"
            sx={{
              color: "#1f2937",
              fontSize: "19px",
              fontWeight: 700,
            }}
          >
            {isEditing ? "編輯保險費率草稿" : "新增保險費率版本"}
          </Typography>

          <Typography
            component="div"
            sx={{
              mt: "2px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            {isEditing
              ? "Edit Insurance Rate Draft"
              : "Create Insurance Rate Version"}
          </Typography>
        </Box>

        <IconButton
          onClick={handleClose}
          disabled={submitting}
          aria-label="關閉"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {submitError ? (
          <Alert severity="error" sx={{ mb: "18px" }}>
            {submitError}
          </Alert>
        ) : null}

        <SectionHeading title="版本基本資料" english="Version Information" />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "16px",
          }}
        >
          <TextField
            name="version_code"
            label="版本代碼"
            value={values.version_code}
            onChange={handleChange}
            required
            fullWidth
            disabled={submitting}
            error={Boolean(errors.version_code)}
            helperText={errors.version_code || "最多 50 個字元"}
            inputProps={{ maxLength: 50 }}
          />

          <TextField
            name="version_name"
            label="版本名稱"
            value={values.version_name}
            onChange={handleChange}
            required
            fullWidth
            disabled={submitting}
            error={Boolean(errors.version_name)}
            helperText={errors.version_name}
            inputProps={{ maxLength: 255 }}
          />

          <TextField
            name="effective_from"
            label="生效日"
            type="date"
            value={values.effective_from}
            onChange={handleChange}
            required
            fullWidth
            disabled={submitting}
            error={Boolean(errors.effective_from)}
            helperText={errors.effective_from}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            name="effective_to"
            label="失效日"
            type="date"
            value={values.effective_to}
            onChange={handleChange}
            fullWidth
            disabled={submitting}
            error={Boolean(errors.effective_to)}
            helperText={errors.effective_to || "留空代表無期限"}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: values.effective_from || undefined,
            }}
          />
        </Box>

        <Divider sx={{ my: "24px" }} />

        <SectionHeading title="勞工保險費率" english="Labor Insurance Rates" />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "16px",
          }}
        >
          {LABOR_FIELDS.map((field) => (
            <RateField
              key={field.name}
              field={field}
              value={values[field.name]}
              error={errors[field.name]}
              onChange={handleChange}
              disabled={submitting}
            />
          ))}
        </Box>

        <Divider sx={{ my: "24px" }} />

        <SectionHeading
          title="全民健康保險費率"
          english="National Health Insurance Rates"
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "16px",
          }}
        >
          {HEALTH_FIELDS.map((field) => (
            <RateField
              key={field.name}
              field={field}
              value={values[field.name]}
              error={errors[field.name]}
              onChange={handleChange}
              disabled={submitting}
            />
          ))}
        </Box>

        <Divider sx={{ my: "24px" }} />

        <SectionHeading title="資料來源與備註" english="Source and Remarks" />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: "16px",
          }}
        >
          <TextField
            name="source_name"
            label="資料來源名稱"
            value={values.source_name}
            onChange={handleChange}
            fullWidth
            disabled={submitting}
            error={Boolean(errors.source_name)}
            helperText={errors.source_name || "例如：勞動部、衛生福利部"}
            inputProps={{ maxLength: 255 }}
          />

          <TextField
            name="source_url"
            label="資料來源網址"
            value={values.source_url}
            onChange={handleChange}
            type="url"
            fullWidth
            disabled={submitting}
            error={Boolean(errors.source_url)}
            helperText={errors.source_url || "選填，僅接受 HTTP 或 HTTPS 網址"}
          />

          <TextField
            name="remarks"
            label="備註"
            value={values.remarks}
            onChange={handleChange}
            multiline
            minRows={3}
            fullWidth
            disabled={submitting}
            error={Boolean(errors.remarks)}
            helperText={errors.remarks || "Remarks"}
            sx={{
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: {
            xs: "16px",
            sm: "24px",
          },
          py: "14px",
        }}
      >
        <Button
          type="button"
          onClick={handleClose}
          disabled={submitting}
          sx={{ color: "#64748b" }}
        >
          取消
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{
            bgcolor: "#1f9bd1",
            "&:hover": {
              bgcolor: "#168dc5",
            },
          }}
        >
          {submitting
            ? isEditing
              ? "儲存中..."
              : "建立中..."
            : isEditing
              ? "儲存草稿"
              : "建立草稿"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
