import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  createEmployeeLaborInsuranceRecord,
  createEmployeeOccupationalInsuranceRecord,
  getInsuranceIdentities,
  getInsuranceUnits,
  transferEmployeeLaborInsurance,
  transferEmployeeOccupationalInsurance,
} from "../../API/payroll";

const OPERATION_LABELS = {
  enroll: "加保",
  withdraw: "退保",
  adjust: "投保薪資調整",
  transfer: "跨單位轉保",
};

const TYPE_CONFIG = {
  labor: {
    label: "勞保",
    identityFlag: "labor_insurance_enabled",
    create: createEmployeeLaborInsuranceRecord,
    transfer: transferEmployeeLaborInsurance,
  },
  occupational: {
    label: "職保",
    identityFlag:
      "occupational_insurance_enabled",
    create:
      createEmployeeOccupationalInsuranceRecord,
    transfer:
      transferEmployeeOccupationalInsurance,
  },
};

const NATIONALITY_OPTIONS = [
  "本國人",
  "外籍",
  "外籍配偶",
  "大陸配偶",
];

const NO_SUBSIDY_VALUES = ["否", "無"];

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

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

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
  return [
    unit?.unit_code,
    unit?.unit_name,
  ]
    .filter(Boolean)
    .join("｜");
}

function createInitialForm(
  operation,
  currentRecord,
) {
  const defaultDate =
    operation === "adjust"
      ? getNextMonthFirstDay()
      : getTomorrow();

  return {
    effective_date: defaultDate,
    withdrawal_effective_date: getTomorrow(),
    enrollment_effective_date: getDayAfter(
      getTomorrow(),
    ),
    insurance_unit_id:
      currentRecord?.insurance_unit_id || "",
    new_insurance_unit_id: "",
    nationality_type:
      currentRecord?.nationality_type ||
      "本國人",
    insurance_identity_id:
      currentRecord?.insurance_identity_id ||
      "",
    insured_salary:
      currentRecord?.insured_salary ?? "",
    employer_fee_cancelled: Boolean(
      Number(
        currentRecord?.employer_fee_cancelled ||
          0,
      ),
    ),
    employee_fee_cancelled: Boolean(
      Number(
        currentRecord?.employee_fee_cancelled ||
          0,
      ),
    ),
    subsidy_type:
      currentRecord?.subsidy_type || "否",
    subsidy_rate:
      currentRecord?.subsidy_rate ?? "",
    subsidy_amount_limit:
      currentRecord?.subsidy_amount_limit ?? "",
    withdrawal_remarks: "",
    remarks: "",
  };
}

function nullableNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return Number(value);
}

function validateForm(
  operation,
  form,
  currentRecord,
) {
  const errors = {};

  if (
    operation === "transfer" &&
    !form.withdrawal_effective_date
  ) {
    errors.withdrawal_effective_date =
      "請選擇退保生效日。";
  }

  if (
    operation === "transfer" &&
    !form.enrollment_effective_date
  ) {
    errors.enrollment_effective_date =
      "請選擇新單位加保生效日。";
  }

  if (
    operation === "transfer" &&
    form.withdrawal_effective_date &&
    form.enrollment_effective_date &&
    form.enrollment_effective_date <=
      form.withdrawal_effective_date
  ) {
    errors.enrollment_effective_date =
      "新單位加保日必須晚於退保日。";
  }

  if (
    operation !== "transfer" &&
    !form.effective_date
  ) {
    errors.effective_date =
      "請選擇生效日。";
  }

  if (
    operation === "adjust" &&
    form.effective_date &&
    form.effective_date.slice(8, 10) !==
      "01"
  ) {
    errors.effective_date =
      "投保薪資調整只能在每月一號生效。";
  }

  if (
    operation === "enroll" &&
    !form.insurance_unit_id
  ) {
    errors.insurance_unit_id =
      "請選擇投保單位。";
  }

  if (
    operation === "transfer" &&
    !form.new_insurance_unit_id
  ) {
    errors.new_insurance_unit_id =
      "請選擇新投保單位。";
  }

  if (
    operation === "transfer" &&
    Number(form.new_insurance_unit_id) ===
      Number(currentRecord?.insurance_unit_id)
  ) {
    errors.new_insurance_unit_id =
      "新投保單位不可與目前單位相同。";
  }

  if (
    operation !== "withdraw" &&
    !form.insurance_identity_id
  ) {
    errors.insurance_identity_id =
      "請選擇投保身分。";
  }

  if (
    operation !== "withdraw" &&
    (!form.insured_salary ||
      Number(form.insured_salary) <= 0)
  ) {
    errors.insured_salary =
      "請輸入大於 0 的投保薪資。";
  }

  const hasSubsidy =
    !NO_SUBSIDY_VALUES.includes(
      form.subsidy_type,
    );

  if (
    operation !== "withdraw" &&
    hasSubsidy &&
    form.subsidy_rate === "" &&
    form.subsidy_amount_limit === ""
  ) {
    errors.subsidy_rate =
      "請輸入補助費率或最高補助金額。";
  }

  return errors;
}

function InsuranceDetailFields({
  form,
  errors,
  setField,
  units,
  identities,
  operation,
  currentRecord,
}) {
  const selectedUnitId =
    operation === "transfer"
      ? form.new_insurance_unit_id
      : form.insurance_unit_id;

  const selectedUnit =
    units.find(
      (unit) =>
        Number(unit.insurance_unit_id) ===
        Number(selectedUnitId),
    ) || null;

  const selectedIdentity =
    identities.find(
      (identity) =>
        Number(
          identity.insurance_identity_id,
        ) ===
        Number(form.insurance_identity_id),
    ) || null;

  const hasSubsidy =
    !NO_SUBSIDY_VALUES.includes(
      form.subsidy_type,
    );

  return (
    <>
      {operation === "adjust" ? (
        <TextField
          label="投保單位"
          value={
            [
              currentRecord?.insurance_unit_code,
              currentRecord?.insurance_unit_name,
            ]
              .filter(Boolean)
              .join("｜") || "--"
          }
          size="small"
          disabled
        />
      ) : (
        <Autocomplete
          options={
            operation === "transfer"
              ? units.filter(
                  (unit) =>
                    Number(
                      unit.insurance_unit_id,
                    ) !==
                    Number(
                      currentRecord
                        ?.insurance_unit_id,
                    ),
                )
              : units
          }
          value={selectedUnit}
          isOptionEqualToValue={(
            option,
            value,
          ) =>
            Number(option.insurance_unit_id) ===
            Number(value.insurance_unit_id)
          }
          getOptionLabel={getUnitLabel}
          noOptionsText="找不到啟用中的投保單位"
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
                  operation === "transfer"
                    ? "新投保單位"
                    : "投保單位"
                }
                size="small"
                required
                error={Boolean(
                  errors[fieldName],
                )}
                helperText={
                  errors[fieldName]
                }
              />
            );
          }}
        />
      )}

      <TextField
        select
        label="籍別"
        size="small"
        value={form.nationality_type}
        onChange={(event) =>
          setField(
            "nationality_type",
            event.target.value,
          )
        }
      >
        {NATIONALITY_OPTIONS.map((option) => (
          <MenuItem
            key={option}
            value={option}
          >
            {option}
          </MenuItem>
        ))}
      </TextField>

      <Autocomplete
        options={identities}
        value={selectedIdentity}
        isOptionEqualToValue={(
          option,
          value,
        ) =>
          Number(
            option.insurance_identity_id,
          ) ===
          Number(value.insurance_identity_id)
        }
        getOptionLabel={(identity) =>
          identity?.identity_name || ""
        }
        noOptionsText="找不到適用的投保身分"
        onChange={(_, identity) =>
          setField(
            "insurance_identity_id",
            identity?.insurance_identity_id ||
              "",
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="投保身分"
            size="small"
            required
            error={Boolean(
              errors.insurance_identity_id,
            )}
            helperText={
              errors.insurance_identity_id
            }
          />
        )}
      />

      <TextField
        label="投保薪資"
        type="number"
        size="small"
        required
        value={form.insured_salary}
        onChange={(event) =>
          setField(
            "insured_salary",
            event.target.value,
          )
        }
        inputProps={{
          min: 0,
          step: 1,
        }}
        error={Boolean(
          errors.insured_salary,
        )}
        helperText={errors.insured_salary}
      />

      <TextField
        select
        label="減免身分"
        size="small"
        value={form.subsidy_type}
        onChange={(event) =>
          setField(
            "subsidy_type",
            event.target.value,
          )
        }
      >
        {["否", "有", "全額"].map(
          (option) => (
            <MenuItem
              key={option}
              value={option}
            >
              {option}
            </MenuItem>
          ),
        )}
      </TextField>

      {hasSubsidy && (
        <>
          <TextField
            label="補助費率（%）"
            type="number"
            size="small"
            value={form.subsidy_rate}
            onChange={(event) =>
              setField(
                "subsidy_rate",
                event.target.value,
              )
            }
            inputProps={{
              min: 0,
              max: 100,
              step: 0.01,
            }}
            error={Boolean(
              errors.subsidy_rate,
            )}
            helperText={errors.subsidy_rate}
          />

          <TextField
            label="最高補助金額"
            type="number"
            size="small"
            value={
              form.subsidy_amount_limit
            }
            onChange={(event) =>
              setField(
                "subsidy_amount_limit",
                event.target.value,
              )
            }
            inputProps={{
              min: 0,
              step: 1,
            }}
          />
        </>
      )}

      <Box
        sx={{
          gridColumn: {
            xs: "auto",
            sm: "1 / -1",
          },
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 18px",
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={
                form.employer_fee_cancelled
              }
              onChange={(event) =>
                setField(
                  "employer_fee_cancelled",
                  event.target.checked,
                )
              }
            />
          }
          label="雇主負擔費用取消"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={
                form.employee_fee_cancelled
              }
              onChange={(event) =>
                setField(
                  "employee_fee_cancelled",
                  event.target.checked,
                )
              }
            />
          }
          label="員工負擔費用取消"
        />
      </Box>
    </>
  );
}

export default function InsuranceRecordOperationDialog({
  open,
  operation,
  type,
  employee,
  currentRecord,
  onClose,
  onSuccess,
}) {
  const config = TYPE_CONFIG[type];

  const [form, setForm] = useState(() =>
    createInitialForm(
      operation,
      currentRecord,
    ),
  );

  const [units, setUnits] = useState([]);

  const [identities, setIdentities] =
    useState([]);

  const [errors, setErrors] = useState({});

  const [requestError, setRequestError] =
    useState("");

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setForm(
      createInitialForm(
        operation,
        currentRecord,
      ),
    );

    setErrors({});
    setRequestError("");

    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);

      try {
        const [
          unitResult,
          identityResult,
        ] = await Promise.all([
          getInsuranceUnits({
            status: "啟用",
          }),
          getInsuranceIdentities({
            status: "啟用",
          }),
        ]);

        if (!active) {
          return;
        }

        setUnits(
          Array.isArray(unitResult)
            ? unitResult
            : [],
        );

        setIdentities(
          Array.isArray(identityResult)
            ? identityResult.filter(
                (identity) =>
                  Number(
                    identity[
                      config.identityFlag
                    ] || 0,
                  ) === 1,
              )
            : [],
        );
      } catch (error) {
        if (active) {
          setRequestError(
            getErrorMessage(
              error,
              "無法載入投保單位或投保身分。",
            ),
          );
        }
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    if (operation === "withdraw") {
      setLoadingOptions(false);
    } else {
      loadOptions();
    }

    return () => {
      active = false;
    };
  }, [
    config.identityFlag,
    currentRecord,
    open,
    operation,
  ]);

  const dialogTitle = useMemo(
    () =>
      `${config.label}${OPERATION_LABELS[operation]}`,
    [config.label, operation],
  );

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = {
        ...current,
      };

      delete nextErrors[field];

      return nextErrors;
    });
  }

  async function handleSubmit() {
    const nextErrors = validateForm(
      operation,
      form,
      currentRecord,
    );

    if (
      Object.keys(nextErrors).length > 0
    ) {
      setErrors(nextErrors);
      return;
    }

    const employeeId = Number(
      employee?.employee_id || 0,
    );

    if (!employeeId) {
      setRequestError(
        "找不到目前選擇的員工。",
      );
      return;
    }

    setSubmitting(true);
    setRequestError("");

    try {
      if (operation === "withdraw") {
        await config.create({
          employee_id: employeeId,
          effective_date:
            form.effective_date,
          action_type: "退保",
          remarks: form.remarks.trim(),
        });
      } else if (
        operation === "transfer"
      ) {
        await config.transfer({
          employee_id: employeeId,
          withdrawal_effective_date:
            form.withdrawal_effective_date,
          enrollment_effective_date:
            form.enrollment_effective_date,
          new_insurance_unit_id: Number(
            form.new_insurance_unit_id,
          ),
          nationality_type:
            form.nationality_type,
          insurance_identity_id: Number(
            form.insurance_identity_id,
          ),
          insured_salary: Number(
            form.insured_salary,
          ),
          employer_fee_cancelled:
            form.employer_fee_cancelled,
          employee_fee_cancelled:
            form.employee_fee_cancelled,
          subsidy_type:
            form.subsidy_type,
          subsidy_rate: nullableNumber(
            form.subsidy_rate,
          ),
          subsidy_amount_limit:
            nullableNumber(
              form.subsidy_amount_limit,
            ),
          withdrawal_remarks:
            form.withdrawal_remarks.trim(),
          remarks: form.remarks.trim(),
        });
      } else {
        await config.create({
          employee_id: employeeId,
          effective_date:
            form.effective_date,
          action_type: "加保",
          insurance_unit_id: Number(
            operation === "adjust"
              ? currentRecord
                  ?.insurance_unit_id
              : form.insurance_unit_id,
          ),
          nationality_type:
            form.nationality_type,
          insurance_identity_id: Number(
            form.insurance_identity_id,
          ),
          insured_salary: Number(
            form.insured_salary,
          ),
          employer_fee_cancelled:
            form.employer_fee_cancelled,
          employee_fee_cancelled:
            form.employee_fee_cancelled,
          subsidy_type:
            form.subsidy_type,
          subsidy_rate: nullableNumber(
            form.subsidy_rate,
          ),
          subsidy_amount_limit:
            nullableNumber(
              form.subsidy_amount_limit,
            ),
          remarks: form.remarks.trim(),
        });
      }

      await onSuccess(
        `${dialogTitle}已完成。`,
      );
    } catch (error) {
      setRequestError(
        getErrorMessage(
          error,
          `${dialogTitle}失敗。`,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={
        submitting ? undefined : onClose
      }
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {dialogTitle}
      </DialogTitle>

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
            `員工 #${
              employee?.employee_id || "--"
            }`}
        </Typography>

        {requestError && (
          <Alert
            severity="error"
            sx={{ mb: "16px" }}
          >
            {requestError}
          </Alert>
        )}

        {operation === "adjust" && (
          <Alert
            severity="info"
            sx={{ mb: "16px" }}
          >
            投保薪資調整會新增一筆同投保單位的加保異動，生效日必須是每月一號。
          </Alert>
        )}

        {operation === "transfer" && (
          <Alert
            severity="info"
            sx={{ mb: "16px" }}
          >
            系統會在同一筆交易中建立原單位退保及新單位加保紀錄。
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
                  label="原單位退保生效日"
                  type="date"
                  size="small"
                  required
                  value={
                    form.withdrawal_effective_date
                  }
                  onChange={(event) => {
                    const nextDate =
                      event.target.value;

                    setField(
                      "withdrawal_effective_date",
                      nextDate,
                    );

                    if (
                      !form.enrollment_effective_date ||
                      form.enrollment_effective_date <=
                        nextDate
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
                  error={Boolean(
                    errors.withdrawal_effective_date,
                  )}
                  helperText={
                    errors.withdrawal_effective_date
                  }
                />

                <TextField
                  label="新單位加保生效日"
                  type="date"
                  size="small"
                  required
                  value={
                    form.enrollment_effective_date
                  }
                  onChange={(event) =>
                    setField(
                      "enrollment_effective_date",
                      event.target.value,
                    )
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={Boolean(
                    errors.enrollment_effective_date,
                  )}
                  helperText={
                    errors.enrollment_effective_date
                  }
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
                  setField(
                    "effective_date",
                    event.target.value,
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
                error={Boolean(
                  errors.effective_date,
                )}
                helperText={
                  errors.effective_date
                }
              />
            )}

            {operation !== "withdraw" && (
              <InsuranceDetailFields
                form={form}
                errors={errors}
                setField={setField}
                units={units}
                identities={identities}
                operation={operation}
                currentRecord={
                  currentRecord
                }
              />
            )}

            {operation === "transfer" && (
              <TextField
                label="原單位退保備註"
                value={
                  form.withdrawal_remarks
                }
                onChange={(event) =>
                  setField(
                    "withdrawal_remarks",
                    event.target.value,
                  )
                }
                multiline
                minRows={2}
                inputProps={{
                  maxLength: 250,
                }}
                sx={{
                  gridColumn: {
                    xs: "auto",
                    sm: "1 / -1",
                  },
                }}
              />
            )}

            <TextField
              label={
                operation === "transfer"
                  ? "新單位加保備註"
                  : "備註"
              }
              value={form.remarks}
              onChange={(event) =>
                setField(
                  "remarks",
                  event.target.value,
                )
              }
              multiline
              minRows={2}
              inputProps={{
                maxLength: 250,
              }}
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

      <DialogActions
        sx={{ p: "14px 20px" }}
      >
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
          disabled={
            loadingOptions || submitting
          }
          onClick={handleSubmit}
        >
          {submitting ? (
            <CircularProgress
              size={20}
              color="inherit"
            />
          ) : (
            `確認${OPERATION_LABELS[operation]}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}