import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  createPayrollPeriod,
  createPayrollRun,
} from "../../API/payroll";

const RUN_TYPES = [
  "薪資",
  "獎金",
  "補發",
  "離職試算",
  "離職結算",
];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function getLastDay(year, month) {
  return new Date(year, month, 0).getDate();
}

function buildDate(year, month, day) {
  const safeDay = Math.min(
    Math.max(Number(day || 1), 1),
    getLastDay(year, month),
  );

  return `${year}-${pad2(month)}-${pad2(safeDay)}`;
}

function buildPeriodDates(range, year, month) {
  const startDay = Number(range?.period_start_day || 1);
  const endDay = Number(
    range?.period_end_day ||
      getLastDay(year, month),
  );
  const payDay = Number(range?.pay_day || 5);

  let startYear = Number(year);
  let startMonth = Number(month);

  if (startDay > endDay) {
    startMonth -= 1;

    if (startMonth <= 0) {
      startMonth = 12;
      startYear -= 1;
    }
  }

  return {
    periodStart: buildDate(
      startYear,
      startMonth,
      startDay,
    ),
    periodEnd: buildDate(year, month, endDay),
    payDate: buildDate(year, month, payDay),
  };
}

function toBackendDateTime(value) {
  if (!value) return null;

  return `${value.replace("T", " ")}:00`;
}

function getDefaultRunName(year, month, runType) {
  return `${year}年${month}月${runType}`;
}

export default function CreatePayrollDialog({
  open,
  onClose,
  onCreated,
  ranges,
  periods,
  initialYear,
  initialMonth,
  initialRangeId,
}) {
  const activeRanges = useMemo(() => {
    return ranges.filter(
      (range) => range.status !== "停用",
    );
  }, [ranges]);

  const [rangeId, setRangeId] = useState("");
  const [runType, setRunType] = useState("薪資");
  const [runName, setRunName] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [notificationAt, setNotificationAt] =
    useState("");
  const [includeIncomeTax, setIncludeIncomeTax] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const year = Number(initialYear);
  const month = Number(initialMonth);

  const selectedRange = useMemo(() => {
    return (
      activeRanges.find(
        (range) =>
          String(range.payroll_range_id) ===
          String(rangeId),
      ) || null
    );
  }, [activeRanges, rangeId]);

  const existingPeriod = useMemo(() => {
    return (
      periods.find((period) => {
        return (
          String(period.payroll_range_id) ===
            String(rangeId) &&
          Number(period.year) === year &&
          Number(period.month) === month
        );
      }) || null
    );
  }, [month, periods, rangeId, year]);

  useEffect(() => {
    if (!open) return;

    const requestedRange = activeRanges.find(
      (range) =>
        String(range.payroll_range_id) ===
        String(initialRangeId),
    );

    const defaultRange =
      requestedRange || activeRanges[0] || null;

    const defaultRangeId = defaultRange
      ? String(defaultRange.payroll_range_id)
      : "";

    const dates = buildPeriodDates(
      defaultRange,
      year,
      month,
    );

    setRangeId(defaultRangeId);
    setRunType("薪資");
    setRunName(
      getDefaultRunName(year, month, "薪資"),
    );
    setPeriodStart(dates.periodStart);
    setPeriodEnd(dates.periodEnd);
    setPayDate(dates.payDate);
    setNotificationAt("");
    setIncludeIncomeTax(false);
    setSubmitting(false);
    setError("");
  }, [
    activeRanges,
    initialRangeId,
    month,
    open,
    year,
  ]);

  useEffect(() => {
    if (!open || !selectedRange) return;

    const period = periods.find((item) => {
      return (
        String(item.payroll_range_id) ===
          String(selectedRange.payroll_range_id) &&
        Number(item.year) === year &&
        Number(item.month) === month
      );
    });

    if (period) {
      setPeriodStart(period.period_start || "");
      setPeriodEnd(period.period_end || "");
      setPayDate(period.pay_date || "");
      return;
    }

    const dates = buildPeriodDates(
      selectedRange,
      year,
      month,
    );

    setPeriodStart(dates.periodStart);
    setPeriodEnd(dates.periodEnd);
    setPayDate(dates.payDate);
  }, [
    month,
    open,
    periods,
    selectedRange,
    year,
  ]);

  function handleRunTypeChange(event) {
    const nextType = event.target.value;
    const currentDefaultNames = RUN_TYPES.map((type) =>
      getDefaultRunName(year, month, type),
    );

    setRunType(nextType);

    if (
      runName === "" ||
      currentDefaultNames.includes(runName)
    ) {
      setRunName(
        getDefaultRunName(year, month, nextType),
      );
    }
  }

  async function handleSubmit() {
    if (!rangeId) {
      setError("請選擇薪資範圍。");
      return;
    }

    if (!runType) {
      setError("請選擇薪資批次類型。");
      return;
    }

    if (!runName.trim()) {
      setError("請輸入批次名稱。");
      return;
    }

    if (
      !existingPeriod &&
      (!periodStart || !periodEnd)
    ) {
      setError("請輸入完整的計薪期間。");
      return;
    }

    if (
      !existingPeriod &&
      periodEnd < periodStart
    ) {
      setError(
        "計薪期間結束日期不可早於開始日期。",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let payrollPeriodId =
        existingPeriod?.payroll_period_id;

      if (!payrollPeriodId) {
        const createdPeriod =
          await createPayrollPeriod({
            payroll_range_id: Number(rangeId),
            year,
            month,
            period_start: periodStart,
            period_end: periodEnd,
            pay_date: payDate || null,
            close_status: "開放",
            status: "開放",
          });

        payrollPeriodId =
          createdPeriod?.payroll_period_id;
      }

      if (!payrollPeriodId) {
        throw new Error(
          "計薪週期已建立，但系統未回傳週期 ID。",
        );
      }

      const createdRun = await createPayrollRun({
        payroll_period_id: Number(
          payrollPeriodId,
        ),
        run_type: runType,
        run_name: runName.trim(),
        actual_pay_date: payDate || null,
        notification_at:
          toBackendDateTime(notificationAt),
        include_income_tax: includeIncomeTax
          ? 1
          : 0,
        status: "草稿",
      });

      if (!createdRun?.payroll_run_id) {
        throw new Error(
          "薪資批次已建立，但系統未回傳批次 ID。",
        );
      }

      await onCreated?.({
        payrollRunId:
          createdRun.payroll_run_id,
        payrollPeriodId,
        payrollRangeId: Number(rangeId),
        year,
        month,
      });
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
          "建立薪資批次失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          width: {
            xs: "calc(100% - 20px)",
            sm: "100%",
          },
          m: {
            xs: "10px",
            sm: "32px",
          },
          borderRadius: "6px",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: {
            xs: "16px",
            sm: "22px",
          },
          py: "16px",
          borderBottom: "1px solid #e5e7eb",
          color: "#1f2937",
          fontSize: {
            xs: "18px",
            sm: "20px",
          },
          fontWeight: 700,
        }}
      >
        建立薪資結算
      </DialogTitle>

      <DialogContent
        sx={{
          px: {
            xs: "16px",
            sm: "22px",
          },
          py: "20px !important",
        }}
      >
        {error ? (
          <Alert
            severity="error"
            sx={{ mb: "16px" }}
          >
            {error}
          </Alert>
        ) : null}

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
          <TextField
            label="薪資月份"
            value={`${year} 年 ${month} 月`}
            size="small"
            disabled
            fullWidth
          />

          <FormControl size="small" fullWidth>
            <InputLabel id="create-payroll-range-label">
              薪資範圍
            </InputLabel>

            <Select
              labelId="create-payroll-range-label"
              label="薪資範圍"
              value={rangeId}
              onChange={(event) =>
                setRangeId(event.target.value)
              }
            >
              {activeRanges.map((range) => (
                <MenuItem
                  key={range.payroll_range_id}
                  value={String(
                    range.payroll_range_id,
                  )}
                >
                  {range.range_code
                    ? `${range.range_code} - `
                    : ""}
                  {range.range_name ||
                    `薪資範圍 ${range.payroll_range_id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ gridColumn: "1 / -1" }}>
            {existingPeriod ? (
              <Alert severity="info">
                此月份已有計薪週期，將直接使用既有週期
                #{existingPeriod.payroll_period_id}。
              </Alert>
            ) : (
              <Alert severity="warning">
                此月份尚無計薪週期。建立薪資批次時，系統會先依薪資範圍規則建立週期。
              </Alert>
            )}
          </Box>

          <TextField
            label="計薪期間開始"
            type="date"
            value={periodStart}
            onChange={(event) =>
              setPeriodStart(event.target.value)
            }
            disabled={Boolean(existingPeriod)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="計薪期間結束"
            type="date"
            value={periodEnd}
            onChange={(event) =>
              setPeriodEnd(event.target.value)
            }
            disabled={Boolean(existingPeriod)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="實際發薪日"
            type="date"
            value={payDate}
            onChange={(event) =>
              setPayDate(event.target.value)
            }
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel id="create-payroll-type-label">
              批次類型
            </InputLabel>

            <Select
              labelId="create-payroll-type-label"
              label="批次類型"
              value={runType}
              onChange={handleRunTypeChange}
            >
              {RUN_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="批次名稱"
            value={runName}
            onChange={(event) =>
              setRunName(event.target.value)
            }
            size="small"
            fullWidth
            required
            sx={{ gridColumn: "1 / -1" }}
          />

          <TextField
            label="薪資通知時間"
            type="datetime-local"
            value={notificationAt}
            onChange={(event) =>
              setNotificationAt(event.target.value)
            }
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="留空代表目前不排定通知時間"
            sx={{ gridColumn: "1 / -1" }}
          />

          <Box sx={{ gridColumn: "1 / -1" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeIncomeTax}
                  onChange={(event) =>
                    setIncludeIncomeTax(
                      event.target.checked,
                    )
                  }
                />
              }
              label="包含所得稅扣繳"
            />

            <Typography
              sx={{
                ml: "32px",
                color: "#7b8794",
                fontSize: "12px",
                lineHeight: 1.5,
              }}
            >
              啟用後，薪資計算會依員工稅務設定產生所得稅扣項。
            </Typography>
          </Box>

          {selectedRange?.holiday_pay_date_rule ? (
            <Typography
              sx={{
                gridColumn: "1 / -1",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              發薪日遇假日規則：
              {selectedRange.holiday_pay_date_rule}
            </Typography>
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: {
            xs: "16px",
            sm: "22px",
          },
          py: "14px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={submitting}
          sx={{
            color: "#475569",
            borderColor: "#cbd5e1",
          }}
        >
          取消
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            submitting ||
            activeRanges.length === 0
          }
          sx={{
            bgcolor: "#1f9bd1",
            "&:hover": {
              bgcolor: "#168dc5",
            },
          }}
        >
          {submitting
            ? "建立中..."
            : "建立薪資結算"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}