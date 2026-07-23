import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  createPayrollPeriod,
  deletePayrollPeriod,
  getPayrollPeriod,
  getPayrollPeriods,
  getPayrollRanges,
  updatePayrollPeriod,
} from "../../API/payroll";

const NOW = new Date();

const EMPTY_FORM = {
  payroll_range_id: "",
  year: String(NOW.getFullYear()),
  month: String(NOW.getMonth() + 1),
  period_start: "",
  period_end: "",
  pay_date: "",
  close_status: "開放",
  status: "開放",
};

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function createClampedDate(year, month, day) {
  const normalizedMonth = new Date(Number(year), Number(month) - 1, 1);

  const targetYear = normalizedMonth.getFullYear();
  const targetMonth = normalizedMonth.getMonth() + 1;

  const finalDay = new Date(targetYear, targetMonth, 0).getDate();

  const targetDay = Math.min(Math.max(Number(day), 1), finalDay);

  return `${targetYear}-${padNumber(targetMonth)}-${padNumber(targetDay)}`;
}

function addMonth(year, month, amount) {
  const date = new Date(Number(year), Number(month) - 1 + amount, 1);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

function derivePeriodDates(range, year, month) {
  const startDay = Number(range?.period_start_day);
  const endDay = Number(range?.period_end_day);
  const payDay = Number(range?.pay_day);

  if (!range || !Number(year) || !Number(month) || !startDay || !endDay) {
    return {
      period_start: "",
      period_end: "",
      pay_date: "",
    };
  }

  const startMonth =
    startDay > endDay
      ? addMonth(year, month, -1)
      : {
          year: Number(year),
          month: Number(month),
        };

  const periodStart = createClampedDate(
    startMonth.year,
    startMonth.month,
    startDay,
  );

  const periodEnd = createClampedDate(year, month, endDay);

  let payDate = "";

  if (payDay) {
    payDate = createClampedDate(year, month, payDay);

    if (payDate < periodEnd) {
      const nextMonth = addMonth(year, month, 1);

      payDate = createClampedDate(nextMonth.year, nextMonth.month, payDay);
    }
  }

  return {
    period_start: periodStart,
    period_end: periodEnd,
    pay_date: payDate,
  };
}

function periodToForm(period) {
  return {
    payroll_range_id: String(period?.payroll_range_id || ""),
    year: String(period?.year || NOW.getFullYear()),
    month: String(period?.month || NOW.getMonth() + 1),
    period_start: String(period?.period_start || ""),
    period_end: String(period?.period_end || ""),
    pay_date: String(period?.pay_date || ""),
    close_status: period?.close_status === "關閉" ? "關閉" : "開放",
    status: period?.status === "關閉" ? "關閉" : "開放",
  };
}

function buildPayload(form) {
  return {
    payroll_range_id: Number(form.payroll_range_id),
    year: Number(form.year),
    month: Number(form.month),
    period_start: form.period_start,
    period_end: form.period_end,
    pay_date: form.pay_date || null,
    close_status: form.close_status,
    status: form.status,
  };
}

function validateForm(form) {
  if (!Number(form.payroll_range_id)) {
    return "請選擇薪資範圍。";
  }

  const year = Number(form.year);
  const month = Number(form.month);

  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    return "請輸入正確的年度。";
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "請選擇正確的月份。";
  }

  if (!form.period_start || !form.period_end) {
    return "請輸入完整的計薪期間。";
  }

  if (form.period_end < form.period_start) {
    return "計薪期間結束日期不可早於開始日期。";
  }

  return "";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return String(value).replaceAll("-", "/");
}

function StatusChip({ value }) {
  const closed = value === "關閉";

  return (
    <Chip
      label={closed ? "關閉" : "開放"}
      size="small"
      color={closed ? "default" : "success"}
      variant="outlined"
    />
  );
}

function PeriodFormDialog({ open, periodId, ranges, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setSubmitting(false);

    if (!periodId) {
      setForm({
        ...EMPTY_FORM,
        year: String(new Date().getFullYear()),
        month: String(new Date().getMonth() + 1),
      });
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);

    getPayrollPeriod(periodId)
      .then((period) => {
        if (active) {
          setForm(periodToForm(period));
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(getErrorMessage(requestError, "讀取計薪週期失敗。"));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, periodId]);

  function setField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function setRuleField(field, value) {
    setForm((previous) => {
      const next = {
        ...previous,
        [field]: value,
      };

      const selectedRange = ranges.find(
        (range) =>
          String(range.payroll_range_id) === String(next.payroll_range_id),
      );

      return {
        ...next,
        ...derivePeriodDates(selectedRange, next.year, next.month),
      };
    });
  }

  function regenerateDates() {
    setForm((previous) => {
      const selectedRange = ranges.find(
        (range) =>
          String(range.payroll_range_id) === String(previous.payroll_range_id),
      );

      return {
        ...previous,
        ...derivePeriodDates(selectedRange, previous.year, previous.month),
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (periodId) {
        await updatePayrollPeriod(periodId, buildPayload(form));
      } else {
        await createPayrollPeriod(buildPayload(form));
      }

      onSaved(periodId ? "計薪週期已更新。" : "計薪週期已新增。");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          periodId ? "更新計薪週期失敗。" : "新增計薪週期失敗。",
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
        {periodId ? "編輯計薪週期" : "新增計薪週期"}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: "48px",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : (
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
              <Alert severity="error" sx={{ gridColumn: "1 / -1" }}>
                {error}
              </Alert>
            ) : null}

            <FormControl size="small" required sx={{ gridColumn: "1 / -1" }}>
              <InputLabel id="period-range-label">薪資範圍</InputLabel>

              <Select
                labelId="period-range-label"
                label="薪資範圍"
                value={form.payroll_range_id}
                onChange={(event) =>
                  setRuleField("payroll_range_id", event.target.value)
                }
              >
                {ranges.map((range) => (
                  <MenuItem
                    key={range.payroll_range_id}
                    value={String(range.payroll_range_id)}
                  >
                    {range.range_name}（{range.range_code}）
                    {range.status === "停用" ? "－停用" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="年度"
              type="number"
              size="small"
              required
              value={form.year}
              onChange={(event) => setRuleField("year", event.target.value)}
              inputProps={{
                min: 1900,
                max: 9999,
                step: 1,
              }}
            />

            <FormControl size="small" required>
              <InputLabel id="period-month-label">月份</InputLabel>

              <Select
                labelId="period-month-label"
                label="月份"
                value={form.month}
                onChange={(event) => setRuleField("month", event.target.value)}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (month) => (
                    <MenuItem key={month} value={String(month)}>
                      {month} 月
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>

            <Box
              sx={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="button"
                size="small"
                variant="outlined"
                onClick={regenerateDates}
                disabled={!form.payroll_range_id || !form.year || !form.month}
              >
                依薪資範圍重新產生日期
              </Button>
            </Box>

            <TextField
              label="計薪開始日期"
              type="date"
              size="small"
              required
              value={form.period_start}
              onChange={(event) => setField("period_start", event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="計薪結束日期"
              type="date"
              size="small"
              required
              value={form.period_end}
              onChange={(event) => setField("period_end", event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="發薪日期"
              type="date"
              size="small"
              value={form.pay_date}
              onChange={(event) => setField("pay_date", event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <FormControl size="small">
              <InputLabel id="close-status-label">關帳狀態</InputLabel>

              <Select
                labelId="close-status-label"
                label="關帳狀態"
                value={form.close_status}
                onChange={(event) =>
                  setField("close_status", event.target.value)
                }
              >
                <MenuItem value="開放">開放</MenuItem>

                <MenuItem value="關閉">關閉</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel id="period-status-label">週期狀態</InputLabel>

              <Select
                labelId="period-status-label"
                label="週期狀態"
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
              >
                <MenuItem value="開放">開放</MenuItem>

                <MenuItem value="關閉">關閉</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ gridColumn: "1 / -1" }}>
              日期會依薪資範圍自動產生，但仍可手動調整。發薪日遇假日的提前或延後規則，需配合公司假日資料才能實際移動日期。
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: "24px",
          py: "14px",
        }}
      >
        <Button onClick={onClose} disabled={submitting}>
          取消
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={loading || submitting}
        >
          {submitting ? "儲存中…" : "儲存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PeriodMobileCard({ period, onEdit, onDelete }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: "16px",
        borderColor: "#dfe4e8",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1f2937",
            }}
          >
            {period.year} 年 {period.month} 月
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            {period.range_name || "-"} · {period.range_code || "-"}
          </Typography>
        </Box>

        <StatusChip value={period.status} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          mt: "16px",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            計薪開始
          </Typography>

          <Typography
            sx={{
              fontSize: "13px",
              color: "#334155",
            }}
          >
            {formatDate(period.period_start)}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            計薪結束
          </Typography>

          <Typography
            sx={{
              fontSize: "13px",
              color: "#334155",
            }}
          >
            {formatDate(period.period_end)}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            發薪日期
          </Typography>

          <Typography
            sx={{
              fontSize: "13px",
              color: "#334155",
            }}
          >
            {formatDate(period.pay_date)}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            關帳狀態
          </Typography>

          <StatusChip value={period.close_status} />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "6px",
          mt: "12px",
        }}
      >
        <Button
          size="small"
          startIcon={<EditOutlinedIcon />}
          onClick={() => onEdit(period)}
        >
          編輯
        </Button>

        <Button
          size="small"
          color="error"
          startIcon={<DeleteOutlineOutlinedIcon />}
          onClick={() => onDelete(period)}
        >
          刪除
        </Button>
      </Box>
    </Paper>
  );
}

export default function PayrollPeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [rangeFilter, setRangeFilter] = useState("全部");
  const [yearFilter, setYearFilter] = useState("全部");
  const [monthFilter, setMonthFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [periodData, rangeData] = await Promise.all([
        getPayrollPeriods(),
        getPayrollRanges(),
      ]);

      setPeriods(Array.isArray(periodData) ? periodData : []);

      setRanges(Array.isArray(rangeData) ? rangeData : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "讀取計薪週期資料失敗。"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(periods.map((period) => Number(period.year)).filter(Boolean)),
    ).sort((left, right) => right - left);
  }, [periods]);

  const filteredPeriods = useMemo(() => {
    return periods.filter((period) => {
      const matchesRange =
        rangeFilter === "全部" ||
        String(period.payroll_range_id) === rangeFilter;

      const matchesYear =
        yearFilter === "全部" || String(period.year) === yearFilter;

      const matchesMonth =
        monthFilter === "全部" || String(period.month) === monthFilter;

      const matchesStatus =
        statusFilter === "全部" || period.status === statusFilter;

      return matchesRange && matchesYear && matchesMonth && matchesStatus;
    });
  }, [periods, rangeFilter, yearFilter, monthFilter, statusFilter]);

  function openCreateDialog() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditDialog(period) {
    setEditingId(Number(period.payroll_period_id));
    setFormOpen(true);
  }

  async function handleSaved(successMessage) {
    setFormOpen(false);
    setMessage(successMessage);

    await loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result = await deletePayrollPeriod(deleteTarget.payroll_period_id);

      setDeleteTarget(null);

      setMessage(
        result?.message ||
          (result?.closed
            ? "此週期已有薪資批次，已改為關閉。"
            : "計薪週期已刪除。"),
      );

      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "刪除計薪週期失敗。"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "360px",
        p: {
          xs: "14px",
          sm: "18px",
          md: "22px",
        },
        border: "1px solid #dfe4e8",
        borderRadius: "5px",
        bgcolor: "#ffffff",
      }}
    >
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
          gap: "12px",
          mb: "18px",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#111827",
              fontSize: {
                xs: "18px",
                sm: "20px",
              },
              fontWeight: 700,
            }}
          >
            計薪週期維護
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            維護各薪資範圍的計薪期間、發薪日期及關帳狀態
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
          disabled={ranges.length === 0}
        >
          新增計薪週期
        </Button>
      </Box>

      {error ? (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: "14px" }}
        >
          {error}
        </Alert>
      ) : null}

      {message ? (
        <Alert
          severity="success"
          onClose={() => setMessage("")}
          sx={{ mb: "14px" }}
        >
          {message}
        </Alert>
      ) : null}

      {!loading && ranges.length === 0 ? (
        <Alert severity="warning" sx={{ mb: "14px" }}>
          尚未建立薪資範圍。請先到「薪資範圍」新增至少一筆資料。
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "2fr repeat(3, minmax(120px, 1fr)) auto",
          },
          gap: "10px",
          mb: "16px",
        }}
      >
        <FormControl size="small">
          <InputLabel id="period-filter-range-label">薪資範圍</InputLabel>

          <Select
            labelId="period-filter-range-label"
            label="薪資範圍"
            value={rangeFilter}
            onChange={(event) => setRangeFilter(event.target.value)}
          >
            <MenuItem value="全部">全部</MenuItem>

            {ranges.map((range) => (
              <MenuItem
                key={range.payroll_range_id}
                value={String(range.payroll_range_id)}
              >
                {range.range_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="period-filter-year-label">年度</InputLabel>

          <Select
            labelId="period-filter-year-label"
            label="年度"
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
          >
            <MenuItem value="全部">全部</MenuItem>

            {availableYears.map((year) => (
              <MenuItem key={year} value={String(year)}>
                {year} 年
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="period-filter-month-label">月份</InputLabel>

          <Select
            labelId="period-filter-month-label"
            label="月份"
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
          >
            <MenuItem value="全部">全部</MenuItem>

            {Array.from({ length: 12 }, (_, index) => index + 1).map(
              (month) => (
                <MenuItem key={month} value={String(month)}>
                  {month} 月
                </MenuItem>
              ),
            )}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="period-filter-status-label">狀態</InputLabel>

          <Select
            labelId="period-filter-status-label"
            label="狀態"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <MenuItem value="全部">全部</MenuItem>

            <MenuItem value="開放">開放</MenuItem>

            <MenuItem value="關閉">關閉</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          disabled={loading}
        >
          重新整理
        </Button>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: "56px",
          }}
        >
          <CircularProgress size={34} />
        </Box>
      ) : filteredPeriods.length === 0 ? (
        <Alert severity="info">沒有符合條件的計薪週期。</Alert>
      ) : (
        <>
          <Box
            sx={{
              display: {
                xs: "grid",
                md: "none",
              },
              gap: "12px",
            }}
          >
            {filteredPeriods.map((period) => (
              <PeriodMobileCard
                key={period.payroll_period_id}
                period={period}
                onEdit={openEditDialog}
                onDelete={setDeleteTarget}
              />
            ))}
          </Box>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
              borderColor: "#dfe4e8",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700 }}>年度月份</TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>薪資範圍</TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>計薪期間</TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>發薪日期</TableCell>

                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    關帳狀態
                  </TableCell>

                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    週期狀態
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredPeriods.map((period) => (
                  <TableRow key={period.payroll_period_id} hover>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#1f2937",
                        }}
                      >
                        {period.year} 年 {period.month} 月
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {period.range_name || "-"}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        {period.range_code || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {formatDate(period.period_start)} ～{" "}
                      {formatDate(period.period_end)}
                    </TableCell>

                    <TableCell>{formatDate(period.pay_date)}</TableCell>

                    <TableCell align="center">
                      <StatusChip value={period.close_status} />
                    </TableCell>

                    <TableCell align="center">
                      <StatusChip value={period.status} />
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="編輯">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(period)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="刪除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteTarget(period)}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <PeriodFormDialog
        open={formOpen}
        periodId={editingId}
        ranges={ranges}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={deleting ? undefined : () => setDeleteTarget(null)}
      >
        <DialogTitle
          sx={{
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          刪除計薪週期
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#475569",
              fontSize: "14px",
            }}
          >
            確定要刪除「
            {deleteTarget?.year} 年 {deleteTarget?.month} 月－
            {deleteTarget?.range_name}
            」嗎？若此週期已有薪資批次，系統會將週期關閉，而不會刪除歷史資料。
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            pb: "18px",
          }}
        >
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            取消
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "處理中…" : "確認刪除"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
