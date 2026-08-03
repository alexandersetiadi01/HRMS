import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  createEmployeePensionInsuranceRecord,
  getInsuranceUnits,
  transferEmployeePensionInsurance,
} from "../../API/payroll";

const OPERATION_CONFIG = {
  enroll: {
    label: "新增提繳",
    actionType: "提繳",
  },
  withdraw: {
    label: "停繳",
    actionType: "停繳",
  },
  adjust: {
    label: "調整提繳資料",
    actionType: "提繳",
  },
  transfer: {
    label: "轉換提繳單位",
    actionType: "提繳",
  },
};

const PENSION_TYPE_OPTIONS = ["新制", "舊制"];

const NATIONALITY_OPTIONS = ["本國人", "外籍", "外籍配偶", "大陸配偶"];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function toDateInput(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTomorrow() {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return toDateInput(date);
}

function getNextMonthFirstDay() {
  const date = new Date();

  date.setMonth(date.getMonth() + 1, 1);

  return toDateInput(date);
}

function isFirstDayOfMonth(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-01$/.test(value);
}

function isLaterDate(value, baselineValue) {
  if (!value || !baselineValue) {
    return true;
  }

  return value > String(baselineValue).slice(0, 10);
}

function getBackendFieldErrors(error) {
  const responseData =
    error?.response?.data?.data || error?.response?.data || {};

  const message = error?.response?.data?.message || responseData?.message || "";

  const field = responseData?.field;

  const fields = Array.isArray(responseData?.fields) ? responseData.fields : [];

  const nextErrors = {};

  if (field) {
    nextErrors[field] = message;
  }

  fields.forEach((fieldName) => {
    nextErrors[fieldName] = message;
  });

  return nextErrors;
}

function getDayAfter(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + 1);

  return toDateInput(date);
}

function getUnitLabel(unit) {
  return [unit?.unit_code, unit?.unit_name].filter(Boolean).join("｜");
}

function nullableNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function createInitialForm(operation, currentRecord) {
  const adjustmentDate = getNextMonthFirstDay();

  const normalDate = getTomorrow();

  return {
    effective_date:
      operation === "adjust"
        ? adjustmentDate
        : normalDate,

    withdrawal_effective_date: normalDate,

    enrollment_effective_date: getDayAfter(normalDate),

    insurance_unit_id: currentRecord?.insurance_unit_id || "",

    new_insurance_unit_id: "",

    pension_type: currentRecord?.pension_type || "新制",

    nationality_type: currentRecord?.nationality_type || "本國人",

    insured_salary: currentRecord?.insured_salary ?? "",

    employer_contribution_rate: currentRecord?.employer_contribution_rate ?? 6,

    employee_contribution_rate: currentRecord?.employee_contribution_rate ?? 0,

    withdrawal_remarks: "",
    remarks: "",
  };
}

function validateForm(operation, form, currentRecord) {
  const errors = {};

  const latestEffectiveDate = String(currentRecord?.effective_date || "").slice(
    0,
    10,
  );

  if (operation === "transfer") {
    if (!form.withdrawal_effective_date) {
      errors.withdrawal_effective_date = "請選擇原單位停繳生效日。";
    }

    if (!form.enrollment_effective_date) {
      errors.enrollment_effective_date = "請選擇新單位提繳生效日。";
    }

    if (
      form.withdrawal_effective_date &&
      !isLaterDate(form.withdrawal_effective_date, latestEffectiveDate)
    ) {
      errors.withdrawal_effective_date =
        "停繳生效日必須晚於目前最後一筆異動單。";
    }

    if (
      form.withdrawal_effective_date &&
      form.enrollment_effective_date &&
      form.enrollment_effective_date <= form.withdrawal_effective_date
    ) {
      errors.enrollment_effective_date = "新單位提繳日必須晚於原單位停繳日。";
    }

    if (!form.new_insurance_unit_id) {
      errors.new_insurance_unit_id = "請選擇新的勞退提繳單位。";
    }

    if (
      Number(form.new_insurance_unit_id) ===
      Number(currentRecord?.insurance_unit_id)
    ) {
      errors.new_insurance_unit_id = "新的提繳單位不可與目前單位相同。";
    }
  } else {
    if (!form.effective_date) {
      errors.effective_date = "請選擇生效日。";
    }

    if (
      form.effective_date &&
      currentRecord &&
      !isLaterDate(form.effective_date, latestEffectiveDate)
    ) {
      errors.effective_date = "新異動單的生效日必須晚於目前最後一筆異動單。";
    }

    if (
      operation === "adjust" &&
      form.effective_date &&
      !isFirstDayOfMonth(form.effective_date)
    ) {
      errors.effective_date = "提繳資料調整只能在每月一號生效。";
    }

    if (operation === "enroll" && !form.insurance_unit_id) {
      errors.insurance_unit_id = "請選擇勞退提繳單位。";
    }
  }

  if (
    operation !== "withdraw" &&
    !PENSION_TYPE_OPTIONS.includes(form.pension_type)
  ) {
    errors.pension_type = "勞退類別必須是新制或舊制。";
  }

  if (
    operation !== "withdraw" &&
    !NATIONALITY_OPTIONS.includes(form.nationality_type)
  ) {
    errors.nationality_type = "請選擇有效的籍別。";
  }

  if (
    operation !== "withdraw" &&
    (form.insured_salary === "" ||
      !Number.isFinite(Number(form.insured_salary)) ||
      Number(form.insured_salary) <= 0)
  ) {
    errors.insured_salary = "請輸入大於 0 的月提繳工資。";
  }

  if (operation !== "withdraw") {
    const employerRate = Number(form.employer_contribution_rate);

    if (
      !Number.isFinite(employerRate) ||
      employerRate < 6 ||
      employerRate > 100
    ) {
      errors.employer_contribution_rate = "雇主提繳率必須介於 6% 至 100%。";
    }

    const employeeRate = Number(form.employee_contribution_rate);

    if (
      !Number.isFinite(employeeRate) ||
      employeeRate < 0 ||
      employeeRate > 6
    ) {
      errors.employee_contribution_rate = "個人提繳率必須介於 0% 至 6%。";
    }
  }

  if (operation === "adjust") {
    const salaryChanged =
      Number(form.insured_salary) !==
      Number(currentRecord?.insured_salary);

    const employeeRateChanged =
      Number(form.employee_contribution_rate) !==
      Number(currentRecord?.employee_contribution_rate);

    if (!salaryChanged && !employeeRateChanged) {
      errors.insured_salary = "請至少調整月提繳工資或個人提繳率其中一項。";
      errors.employee_contribution_rate =
        "請至少調整月提繳工資或個人提繳率其中一項。";
    }
  }

  if (form.remarks.length > 250) {
    errors.remarks = "備註不可超過 250 個字元。";
  }

  if (form.withdrawal_remarks.length > 250) {
    errors.withdrawal_remarks = "原單位停繳備註不可超過 250 個字元。";
  }

  return errors;
}

export default function PensionRecordOperationDialog({
  open,
  operation,
  employee,
  currentRecord,
  onClose,
  onExited,
  onSuccess,
}) {
  const config = OPERATION_CONFIG[operation];

  const [form, setForm] = useState(() =>
    createInitialForm(operation, currentRecord),
  );

  const [units, setUnits] = useState([]);

  const [errors, setErrors] = useState({});

  const [requestError, setRequestError] = useState("");

  const [loadingOptions, setLoadingOptions] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setForm(createInitialForm(operation, currentRecord));

    setErrors({});
    setRequestError("");

    if (operation !== "enroll" && operation !== "transfer") {
      setUnits([]);
      setLoadingOptions(false);

      return undefined;
    }

    let active = true;

    async function loadUnits() {
      setLoadingOptions(true);

      try {
        const result = await getInsuranceUnits({
          status: "啟用",
        });

        if (!active) {
          return;
        }

        setUnits(Array.isArray(result) ? result : []);
      } catch (error) {
        if (active) {
          setRequestError(getErrorMessage(error, "無法載入勞退提繳單位。"));
        }
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    loadUnits();

    return () => {
      active = false;
    };
  }, [currentRecord, open, operation]);

  const title = useMemo(() => `勞退${config?.label || ""}`, [config]);

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[field];

      return next;
    });
  }

  const selectedUnitId =
    operation === "transfer"
      ? form.new_insurance_unit_id
      : form.insurance_unit_id;

  const selectedUnit =
    units.find(
      (unit) => Number(unit.insurance_unit_id) === Number(selectedUnitId),
    ) || null;

  async function handleSubmit() {
    const nextErrors = validateForm(operation, form, currentRecord);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const employeeId = Number(employee?.employee_id || 0);

    if (!employeeId) {
      setRequestError("找不到目前選擇的員工。");

      return;
    }

    setSubmitting(true);
    setRequestError("");

    try {
      if (operation === "withdraw") {
        await createEmployeePensionInsuranceRecord({
          employee_id: employeeId,
          effective_date: form.effective_date,
          action_type: "停繳",
          remarks: form.remarks.trim(),
        });
      } else if (operation === "transfer") {
        await transferEmployeePensionInsurance({
          employee_id: employeeId,

          withdrawal_effective_date: form.withdrawal_effective_date,

          enrollment_effective_date: form.enrollment_effective_date,

          new_insurance_unit_id: Number(form.new_insurance_unit_id),

          pension_type: form.pension_type,

          nationality_type: form.nationality_type,

          insured_salary: Number(form.insured_salary),

          employer_contribution_rate: nullableNumber(
            form.employer_contribution_rate,
          ),

          employee_contribution_rate: nullableNumber(
            form.employee_contribution_rate,
          ),

          withdrawal_remarks: form.withdrawal_remarks.trim(),

          remarks: form.remarks.trim(),
        });
      } else {
        await createEmployeePensionInsuranceRecord({
          employee_id: employeeId,

          effective_date: form.effective_date,

          action_type: config.actionType,

          insurance_unit_id: Number(
            operation === "enroll"
              ? form.insurance_unit_id
              : currentRecord?.insurance_unit_id,
          ),

          pension_type: form.pension_type,

          nationality_type: form.nationality_type,

          insured_salary: Number(form.insured_salary),

          employer_contribution_rate: nullableNumber(
            form.employer_contribution_rate,
          ),

          employee_contribution_rate: nullableNumber(
            form.employee_contribution_rate,
          ),

          remarks: form.remarks.trim(),
        });
      }

      await onSuccess(`${title}已完成。`);
    } catch (error) {
      const backendFieldErrors = getBackendFieldErrors(error);

      if (Object.keys(backendFieldErrors).length > 0) {
        setErrors((current) => ({
          ...current,
          ...backendFieldErrors,
        }));
      }

      setRequestError(getErrorMessage(error, `${title}失敗。`));
    } finally {
      setSubmitting(false);
    }
  }

  const showDetailFields = operation !== "withdraw";

  const unitDisabled = operation === "adjust";

  const salaryDisabled = false;

  const employerRateDisabled = operation === "adjust";

  const employeeRateDisabled = false;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      TransitionProps={{
        onExited,
      }}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>

      <DialogContent dividers>
        <Typography
          sx={{
            mb: "16px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          員工：
          {employee?.employee_no || "--"}｜
          {employee?.display_name ||
            employee?.employee_name ||
            employee?.email ||
            `員工 #${employee?.employee_id || "--"}`}
        </Typography>

        {requestError && (
          <Alert severity="error" sx={{ mb: "16px" }}>
            {requestError}
          </Alert>
        )}

        {operation === "adjust" && (
          <Alert severity="info" sx={{ mb: "16px" }}>
            可同時調整月提繳工資及個人提繳率。系統會建立一筆新的完整提繳紀錄，並沿用目前的提繳單位、勞退類別、籍別及雇主提繳率。
          </Alert>
        )}

        {operation === "transfer" && (
          <Alert severity="info" sx={{ mb: "16px" }}>
            系統會在同一筆交易中建立原單位停繳及新單位提繳紀錄。
          </Alert>
        )}

        {loadingOptions ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: "50px",
            }}
          >
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "16px",
              pt: "4px",
            }}
          >
            {operation === "transfer" ? (
              <>
                <TextField
                  label="原單位停繳生效日"
                  type="date"
                  size="small"
                  required
                  value={form.withdrawal_effective_date}
                  onChange={(event) => {
                    const nextDate = event.target.value;

                    setField("withdrawal_effective_date", nextDate);

                    if (
                      !form.enrollment_effective_date ||
                      form.enrollment_effective_date <= nextDate
                    ) {
                      setField(
                        "enrollment_effective_date",
                        getDayAfter(nextDate),
                      );
                    }
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={Boolean(errors.withdrawal_effective_date)}
                  helperText={errors.withdrawal_effective_date}
                />

                <TextField
                  label="新單位提繳生效日"
                  type="date"
                  size="small"
                  required
                  value={form.enrollment_effective_date}
                  onChange={(event) =>
                    setField("enrollment_effective_date", event.target.value)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={Boolean(errors.enrollment_effective_date)}
                  helperText={errors.enrollment_effective_date}
                />
              </>
            ) : (
              <TextField
                label="生效日"
                type="date"
                size="small"
                required
                value={form.effective_date}
                onChange={(event) =>
                  setField("effective_date", event.target.value)
                }
                InputLabelProps={{
                  shrink: true,
                }}
                error={Boolean(errors.effective_date)}
                helperText={errors.effective_date}
              />
            )}

            {showDetailFields && (
              <>
                {unitDisabled ? (
                  <TextField
                    label="提繳單位"
                    size="small"
                    disabled
                    value={
                      [
                        currentRecord?.insurance_unit_code,
                        currentRecord?.insurance_unit_name,
                      ]
                        .filter(Boolean)
                        .join("｜") || "--"
                    }
                  />
                ) : (
                  <Autocomplete
                    options={
                      operation === "transfer"
                        ? units.filter(
                            (unit) =>
                              Number(unit.insurance_unit_id) !==
                              Number(currentRecord?.insurance_unit_id),
                          )
                        : units
                    }
                    value={selectedUnit}
                    isOptionEqualToValue={(option, value) =>
                      Number(option.insurance_unit_id) ===
                      Number(value.insurance_unit_id)
                    }
                    getOptionLabel={getUnitLabel}
                    noOptionsText="找不到啟用中的提繳單位"
                    onChange={(_, unit) =>
                      setField(
                        operation === "transfer"
                          ? "new_insurance_unit_id"
                          : "insurance_unit_id",
                        unit?.insurance_unit_id || "",
                      )
                    }
                    renderInput={(params) => {
                      const fieldName =
                        operation === "transfer"
                          ? "new_insurance_unit_id"
                          : "insurance_unit_id";

                      return (
                        <TextField
                          {...params}
                          label={
                            operation === "transfer" ? "新提繳單位" : "提繳單位"
                          }
                          size="small"
                          required
                          error={Boolean(errors[fieldName])}
                          helperText={errors[fieldName]}
                        />
                      );
                    }}
                  />
                )}

                <TextField
                  select
                  label="勞退類別"
                  size="small"
                  required
                  value={form.pension_type}
                  disabled={operation === "adjust"}
                  onChange={(event) =>
                    setField("pension_type", event.target.value)
                  }
                  error={Boolean(errors.pension_type)}
                  helperText={errors.pension_type}
                >
                  {PENSION_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="籍別"
                  size="small"
                  required
                  value={form.nationality_type}
                  disabled={operation === "adjust"}
                  onChange={(event) =>
                    setField("nationality_type", event.target.value)
                  }
                  error={Boolean(errors.nationality_type)}
                  helperText={errors.nationality_type}
                >
                  {NATIONALITY_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="月提繳工資"
                  type="number"
                  size="small"
                  required
                  value={form.insured_salary}
                  disabled={salaryDisabled}
                  onChange={(event) =>
                    setField("insured_salary", event.target.value)
                  }
                  inputProps={{
                    min: 1,
                    step: 1,
                  }}
                  error={Boolean(errors.insured_salary)}
                  helperText={errors.insured_salary}
                />

                <TextField
                  label="雇主提繳率（%）"
                  type="number"
                  size="small"
                  required
                  value={form.employer_contribution_rate}
                  disabled={employerRateDisabled}
                  onChange={(event) =>
                    setField("employer_contribution_rate", event.target.value)
                  }
                  inputProps={{
                    min: 6,
                    max: 100,
                    step: 0.0001,
                  }}
                  error={Boolean(errors.employer_contribution_rate)}
                  helperText={errors.employer_contribution_rate}
                />

                <TextField
                  label="個人提繳率（%）"
                  type="number"
                  size="small"
                  required
                  value={form.employee_contribution_rate}
                  disabled={employeeRateDisabled}
                  onChange={(event) =>
                    setField("employee_contribution_rate", event.target.value)
                  }
                  inputProps={{
                    min: 0,
                    max: 6,
                    step: 0.0001,
                  }}
                  error={Boolean(errors.employee_contribution_rate)}
                  helperText={errors.employee_contribution_rate}
                />
              </>
            )}

            {operation === "transfer" && (
              <TextField
                label="原單位停繳備註"
                value={form.withdrawal_remarks}
                onChange={(event) =>
                  setField("withdrawal_remarks", event.target.value)
                }
                multiline
                minRows={2}
                inputProps={{
                  maxLength: 250,
                }}
                error={Boolean(errors.withdrawal_remarks)}
                helperText={errors.withdrawal_remarks}
                sx={{
                  gridColumn: {
                    xs: "auto",
                    sm: "1 / -1",
                  },
                }}
              />
            )}

            <TextField
              label={operation === "transfer" ? "新單位提繳備註" : "備註"}
              value={form.remarks}
              onChange={(event) => setField("remarks", event.target.value)}
              multiline
              minRows={2}
              inputProps={{
                maxLength: 250,
              }}
              error={Boolean(errors.remarks)}
              helperText={errors.remarks}
              sx={{
                gridColumn: {
                  xs: "auto",
                  sm: "1 / -1",
                },
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: "14px 20px" }}>
        <Button
          type="button"
          color="inherit"
          disabled={submitting}
          onClick={onClose}
        >
          取消
        </Button>

        <Button
          type="button"
          variant="contained"
          disabled={loadingOptions || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            `確認${config?.label || ""}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
