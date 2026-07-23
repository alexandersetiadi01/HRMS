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
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
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
import SearchIcon from "@mui/icons-material/Search";
import {
  createPayrollRange,
  deletePayrollRange,
  getPayrollRange,
  getPayrollRanges,
  updatePayrollRange,
} from "../../API/payroll";

const EMPTY_FORM = {
  range_code: "",
  range_name: "",
  salary_calculation_enabled: true,
  bank_transfer_enabled: false,
  attendance_detail_enabled: false,
  show_leave_balance_enabled: false,
  period_start_day: "",
  period_end_day: "",
  pay_day: "",
  holiday_pay_date_rule: "",
  status: "啟用",
};

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

function rangeToForm(range) {
  return {
    range_code: String(range?.range_code || ""),
    range_name: String(range?.range_name || ""),
    salary_calculation_enabled: toBoolean(
      range?.salary_calculation_enabled,
    ),
    bank_transfer_enabled: toBoolean(
      range?.bank_transfer_enabled,
    ),
    attendance_detail_enabled: toBoolean(
      range?.attendance_detail_enabled,
    ),
    show_leave_balance_enabled: toBoolean(
      range?.show_leave_balance_enabled,
    ),
    period_start_day:
      range?.period_start_day === null ||
      range?.period_start_day === undefined
        ? ""
        : String(range.period_start_day),
    period_end_day:
      range?.period_end_day === null ||
      range?.period_end_day === undefined
        ? ""
        : String(range.period_end_day),
    pay_day:
      range?.pay_day === null ||
      range?.pay_day === undefined
        ? ""
        : String(range.pay_day),
    holiday_pay_date_rule: String(
      range?.holiday_pay_date_rule || "",
    ),
    status:
      range?.status === "停用" ? "停用" : "啟用",
  };
}

function buildPayload(form) {
  const nullableDay = (value) => {
    return value === "" ? null : Number(value);
  };

  return {
    range_code: form.range_code.trim(),
    range_name: form.range_name.trim(),
    salary_calculation_enabled:
      form.salary_calculation_enabled,
    bank_transfer_enabled:
      form.bank_transfer_enabled,
    attendance_detail_enabled:
      form.attendance_detail_enabled,
    show_leave_balance_enabled:
      form.show_leave_balance_enabled,
    period_start_day: nullableDay(
      form.period_start_day,
    ),
    period_end_day: nullableDay(
      form.period_end_day,
    ),
    pay_day: nullableDay(form.pay_day),
    holiday_pay_date_rule:
      form.holiday_pay_date_rule,
    status: form.status,
  };
}

function validateForm(form) {
  if (!form.range_code.trim()) {
    return "請輸入薪資範圍代碼。";
  }

  if (!form.range_name.trim()) {
    return "請輸入薪資範圍名稱。";
  }

  for (const value of [
    form.period_start_day,
    form.period_end_day,
    form.pay_day,
  ]) {
    if (value === "") {
      continue;
    }

    const day = Number(value);

    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 31
    ) {
      return "計薪週期與發薪日必須介於 1 到 31。";
    }
  }

  return "";
}

function BooleanLabel({ value }) {
  return (
    <Typography
      component="span"
      sx={{
        fontSize: "13px",
        color: "#475569",
      }}
    >
      {toBoolean(value) ? "是" : "否"}
    </Typography>
  );
}

function RangeFormDialog({
  open,
  rangeId,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
    setSubmitting(false);

    if (!rangeId) {
      setForm(EMPTY_FORM);
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);

    getPayrollRange(rangeId)
      .then((range) => {
        if (active) {
          setForm(rangeToForm(range));
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            getErrorMessage(
              requestError,
              "讀取薪資範圍失敗。",
            ),
          );
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
  }, [open, rangeId]);

  function setField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
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
      if (rangeId) {
        await updatePayrollRange(
          rangeId,
          buildPayload(form),
        );
      } else {
        await createPayrollRange(
          buildPayload(form),
        );
      }

      onSaved(
        rangeId
          ? "薪資範圍已更新。"
          : "薪資範圍已新增。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          rangeId
            ? "更新薪資範圍失敗。"
            : "新增薪資範圍失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const dayFieldProps = {
    type: "number",
    size: "small",
    inputProps: {
      min: 1,
      max: 31,
      step: 1,
    },
  };

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
        {rangeId
          ? "編輯薪資範圍"
          : "新增薪資範圍"}
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
                sm: "repeat(2, 1fr)",
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

            <TextField
              label="薪資範圍代碼"
              value={form.range_code}
              onChange={(event) =>
                setField(
                  "range_code",
                  event.target.value,
                )
              }
              required
              size="small"
              inputProps={{ maxLength: 50 }}
            />

            <TextField
              label="薪資範圍名稱"
              value={form.range_name}
              onChange={(event) =>
                setField(
                  "range_name",
                  event.target.value,
                )
              }
              required
              size="small"
              inputProps={{ maxLength: 255 }}
            />

            <FormControl size="small">
              <InputLabel id="range-status-label">
                狀態
              </InputLabel>

              <Select
                labelId="range-status-label"
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

            <FormControl size="small">
              <InputLabel id="holiday-rule-label">
                發薪日遇假日規則
              </InputLabel>

              <Select
                labelId="holiday-rule-label"
                label="發薪日遇假日規則"
                value={
                  form.holiday_pay_date_rule
                }
                onChange={(event) =>
                  setField(
                    "holiday_pay_date_rule",
                    event.target.value,
                  )
                }
              >
                <MenuItem value="">
                  不調整
                </MenuItem>

                <MenuItem value="提前">
                  提前
                </MenuItem>

                <MenuItem value="延後">
                  延後
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              {...dayFieldProps}
              label="計薪開始日"
              value={form.period_start_day}
              onChange={(event) =>
                setField(
                  "period_start_day",
                  event.target.value,
                )
              }
            />

            <TextField
              {...dayFieldProps}
              label="計薪結束日"
              value={form.period_end_day}
              onChange={(event) =>
                setField(
                  "period_end_day",
                  event.target.value,
                )
              }
            />

            <TextField
              {...dayFieldProps}
              label="發薪日"
              value={form.pay_day}
              onChange={(event) =>
                setField(
                  "pay_day",
                  event.target.value,
                )
              }
            />

            <Box
              sx={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                },
                gap: {
                  xs: "4px",
                  sm: "8px 20px",
                },
                p: "12px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "5px",
                bgcolor: "#f8fafc",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      form.salary_calculation_enabled
                    }
                    onChange={(event) =>
                      setField(
                        "salary_calculation_enabled",
                        event.target.checked,
                      )
                    }
                  />
                }
                label="結算薪資"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={
                      form.bank_transfer_enabled
                    }
                    onChange={(event) =>
                      setField(
                        "bank_transfer_enabled",
                        event.target.checked,
                      )
                    }
                  />
                }
                label="銀行轉帳"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={
                      form.attendance_detail_enabled
                    }
                    onChange={(event) =>
                      setField(
                        "attendance_detail_enabled",
                        event.target.checked,
                      )
                    }
                  />
                }
                label="顯示出勤明細"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={
                      form.show_leave_balance_enabled
                    }
                    onChange={(event) =>
                      setField(
                        "show_leave_balance_enabled",
                        event.target.checked,
                      )
                    }
                  />
                }
                label="顯示假別餘額"
              />
            </Box>
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
          onClick={onClose}
          disabled={submitting}
        >
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

function RangeMobileCard({
  range,
  onEdit,
  onDelete,
}) {
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
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#1f2937",
            }}
          >
            {range.range_name || "-"}
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            {range.range_code || "-"}
          </Typography>
        </Box>

        <Chip
          label={range.status || "啟用"}
          size="small"
          color={
            range.status === "停用"
              ? "default"
              : "success"
          }
          variant="outlined"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
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
            計薪週期
          </Typography>

          <Typography
            sx={{
              fontSize: "13px",
              color: "#334155",
            }}
          >
            {range.period_start_day || "-"} 日 ～{" "}
            {range.period_end_day || "-"} 日
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            發薪設定
          </Typography>

          <Typography
            sx={{
              fontSize: "13px",
              color: "#334155",
            }}
          >
            {range.pay_day
              ? `${range.pay_day} 日`
              : "-"}
            {range.holiday_pay_date_rule
              ? `（${range.holiday_pay_date_rule}）`
              : ""}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            結算薪資
          </Typography>

          <BooleanLabel
            value={
              range.salary_calculation_enabled
            }
          />
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            銀行轉帳
          </Typography>

          <BooleanLabel
            value={range.bank_transfer_enabled}
          />
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
          onClick={() => onEdit(range)}
        >
          編輯
        </Button>

        <Button
          size="small"
          color="error"
          startIcon={
            <DeleteOutlineOutlinedIcon />
          }
          onClick={() => onDelete(range)}
        >
          刪除
        </Button>
      </Box>
    </Paper>
  );
}

export default function PayrollRangesPage() {
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("全部");
  const [formOpen, setFormOpen] =
    useState(false);
  const [editingId, setEditingId] =
    useState(null);
  const [deleteTarget, setDeleteTarget] =
    useState(null);
  const [deleting, setDeleting] =
    useState(false);

  async function loadRanges() {
    setLoading(true);
    setError("");

    try {
      const data = await getPayrollRanges();

      setRanges(
        Array.isArray(data) ? data : [],
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "讀取薪資範圍失敗。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRanges();
  }, []);

  const filteredRanges = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return ranges.filter((range) => {
      const matchesStatus =
        status === "全部" ||
        range.status === status;

      const matchesSearch =
        !keyword ||
        String(range.range_code || "")
          .toLowerCase()
          .includes(keyword) ||
        String(range.range_name || "")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [ranges, search, status]);

  function openCreateDialog() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditDialog(range) {
    setEditingId(
      Number(range.payroll_range_id),
    );
    setFormOpen(true);
  }

  async function handleSaved(successMessage) {
    setFormOpen(false);
    setMessage(successMessage);

    await loadRanges();
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result = await deletePayrollRange(
        deleteTarget.payroll_range_id,
      );

      setDeleteTarget(null);

      setMessage(
        result?.message ||
          (result?.disabled
            ? "此薪資範圍已被使用，已改為停用。"
            : "薪資範圍已刪除。"),
      );

      await loadRanges();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "刪除薪資範圍失敗。",
        ),
      );
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
            薪資範圍
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            維護公司計薪範圍、計薪日期及薪資單顯示設定
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          新增薪資範圍
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "minmax(0, 1fr) 160px auto",
          },
          gap: "10px",
          mb: "16px",
        }}
      >
        <TextField
          size="small"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="搜尋代碼或名稱"
          InputProps={{
            startAdornment: (
              <SearchIcon
                sx={{
                  mr: "8px",
                  color: "#94a3b8",
                }}
              />
            ),
          }}
        />

        <FormControl size="small">
          <InputLabel id="range-filter-status-label">
            狀態
          </InputLabel>

          <Select
            labelId="range-filter-status-label"
            label="狀態"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <MenuItem value="全部">
              全部
            </MenuItem>

            <MenuItem value="啟用">
              啟用
            </MenuItem>

            <MenuItem value="停用">
              停用
            </MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadRanges}
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
      ) : filteredRanges.length === 0 ? (
        <Alert severity="info">
          沒有符合條件的薪資範圍。
        </Alert>
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
            {filteredRanges.map((range) => (
              <RangeMobileCard
                key={range.payroll_range_id}
                range={range}
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
                <TableRow
                  sx={{ bgcolor: "#f8fafc" }}
                >
                  <TableCell
                    sx={{ fontWeight: 700 }}
                  >
                    代碼／名稱
                  </TableCell>

                  <TableCell
                    sx={{ fontWeight: 700 }}
                  >
                    計薪週期
                  </TableCell>

                  <TableCell
                    sx={{ fontWeight: 700 }}
                  >
                    發薪設定
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700 }}
                  >
                    結算薪資
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700 }}
                  >
                    銀行轉帳
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700 }}
                  >
                    狀態
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700 }}
                  >
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRanges.map((range) => (
                  <TableRow
                    key={
                      range.payroll_range_id
                    }
                    hover
                  >
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: "#1f2937",
                        }}
                      >
                        {range.range_name || "-"}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        {range.range_code || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {range.period_start_day ||
                        "-"}{" "}
                      日 ～{" "}
                      {range.period_end_day ||
                        "-"}{" "}
                      日
                    </TableCell>

                    <TableCell>
                      {range.pay_day
                        ? `${range.pay_day} 日`
                        : "-"}

                      {range.holiday_pay_date_rule
                        ? `（${range.holiday_pay_date_rule}）`
                        : ""}
                    </TableCell>

                    <TableCell align="center">
                      <BooleanLabel
                        value={
                          range.salary_calculation_enabled
                        }
                      />
                    </TableCell>

                    <TableCell align="center">
                      <BooleanLabel
                        value={
                          range.bank_transfer_enabled
                        }
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={
                          range.status || "啟用"
                        }
                        size="small"
                        color={
                          range.status === "停用"
                            ? "default"
                            : "success"
                        }
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="編輯">
                        <IconButton
                          size="small"
                          onClick={() =>
                            openEditDialog(range)
                          }
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="刪除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            setDeleteTarget(range)
                          }
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

      <RangeFormDialog
        open={formOpen}
        rangeId={editingId}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={
          deleting
            ? undefined
            : () => setDeleteTarget(null)
        }
      >
        <DialogTitle
          sx={{
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          刪除薪資範圍
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#475569",
              fontSize: "14px",
            }}
          >
            確定要刪除「
            {deleteTarget?.range_name}
            」嗎？若此範圍已被薪資資料或計薪週期使用，系統會改為停用而不會刪除。
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            pb: "18px",
          }}
        >
          <Button
            onClick={() =>
              setDeleteTarget(null)
            }
            disabled={deleting}
          >
            取消
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? "處理中…"
              : "確認刪除"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}