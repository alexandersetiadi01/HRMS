import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  InputAdornment,
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
  createTaxTableRow,
  deleteTaxTableRow,
  getTaxTableRows,
  updateTaxTableRow,
} from "../../API/payroll";

const EMPTY_FORM = {
  dependent_count: "0",
  monthly_salary_from: "",
  monthly_salary_to: "",
  withholding_amount: "",
  status: "啟用",
  remarks: "",
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

function formatAmount(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "--";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 2,
  }).format(number);
}

function rowToForm(row) {
  return {
    dependent_count: String(
      row?.dependent_count ?? 0,
    ),

    monthly_salary_from: String(
      row?.monthly_salary_from ?? "",
    ),

    monthly_salary_to:
      row?.monthly_salary_to === null ||
      row?.monthly_salary_to === undefined
        ? ""
        : String(row.monthly_salary_to),

    withholding_amount: String(
      row?.withholding_amount ?? "",
    ),

    status: String(
      row?.status || "啟用",
    ),

    remarks: String(
      row?.remarks || "",
    ),
  };
}

function buildPayload(form) {
  return {
    dependent_count: Number(
      form.dependent_count,
    ),

    monthly_salary_from: Number(
      form.monthly_salary_from,
    ),

    monthly_salary_to:
      form.monthly_salary_to === ""
        ? null
        : Number(form.monthly_salary_to),

    withholding_amount: Number(
      form.withholding_amount,
    ),

    status: form.status,

    remarks: form.remarks.trim(),
  };
}

function StatusChip({ status }) {
  const enabled = status === "啟用";

  return (
    <Chip
      label={enabled ? "啟用" : "停用"}
      size="small"
      color={enabled ? "success" : "default"}
      variant="outlined"
    />
  );
}

function UsageChip({ row }) {
  const count = Number(
    row?.payroll_usage_count || 0,
  );

  if (
    !toBoolean(row?.is_payroll_used) &&
    count <= 0
  ) {
    return (
      <Chip
        label="未使用"
        size="small"
        variant="outlined"
      />
    );
  }

  return (
    <Chip
      label={`已使用 ${count} 次`}
      size="small"
      color="warning"
      variant="outlined"
    />
  );
}

function TaxTableRowFormDialog({
  open,
  row,
  taxParameterId,
  initialDependentCount,
  onClose,
  onSaved,
}) {
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    if (row) {
      setForm(rowToForm(row));
    } else {
      setForm({
        ...EMPTY_FORM,
        dependent_count:
          initialDependentCount === ""
            ? "0"
            : String(
                initialDependentCount,
              ),
      });
    }

    setSubmitting(false);
    setError("");
  }, [
    initialDependentCount,
    open,
    row,
  ]);

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function validateForm() {
    const dependentCount = Number(
      form.dependent_count,
    );

    if (
      !Number.isInteger(dependentCount) ||
      dependentCount < 0 ||
      dependentCount > 99
    ) {
      return "扶養人數必須介於 0 至 99 人。";
    }

    const salaryFrom = Number(
      form.monthly_salary_from,
    );

    if (
      form.monthly_salary_from === "" ||
      !Number.isFinite(salaryFrom) ||
      salaryFrom < 0
    ) {
      return "薪資級距下限不可小於 0。";
    }

    let salaryTo = null;

    if (form.monthly_salary_to !== "") {
      salaryTo = Number(
        form.monthly_salary_to,
      );

      if (
        !Number.isFinite(salaryTo) ||
        salaryTo < 0
      ) {
        return "薪資級距上限不可小於 0。";
      }

      if (salaryTo < salaryFrom) {
        return "薪資級距上限不可小於薪資級距下限。";
      }
    }

    const withholdingAmount = Number(
      form.withholding_amount,
    );

    if (
      form.withholding_amount === "" ||
      !Number.isFinite(
        withholdingAmount,
      ) ||
      withholdingAmount < 0
    ) {
      return "扣繳稅額不可小於 0。";
    }

    if (
      !["啟用", "停用"].includes(
        form.status,
      )
    ) {
      return "請選擇正確的狀態。";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (row?.tax_table_row_id) {
        await updateTaxTableRow(
          row.tax_table_row_id,
          buildPayload(form),
        );
      } else {
        await createTaxTableRow(
          taxParameterId,
          buildPayload(form),
        );
      }

      await onSaved(
        row
          ? "所得稅額表級距已更新。"
          : "所得稅額表級距已新增。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          row
            ? "更新所得稅額表級距失敗。"
            : "新增所得稅額表級距失敗。",
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
      maxWidth="sm"
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
        {row
          ? "編輯所得稅額表級距"
          : "新增所得稅額表級距"}
      </DialogTitle>

      <DialogContent dividers>
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
          {error && (
            <Alert
              severity="error"
              sx={{
                gridColumn: "1 / -1",
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            label="扶養人數"
            type="number"
            size="small"
            required
            value={form.dependent_count}
            onChange={(event) =>
              setField(
                "dependent_count",
                event.target.value,
              )
            }
            inputProps={{
              min: 0,
              max: 99,
              step: 1,
            }}
          />

          <TextField
            label="薪資級距下限"
            type="number"
            size="small"
            required
            value={
              form.monthly_salary_from
            }
            onChange={(event) =>
              setField(
                "monthly_salary_from",
                event.target.value,
              )
            }
            inputProps={{
              min: 0,
              step: 0.01,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  NT$
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="薪資級距上限"
            type="number"
            size="small"
            value={form.monthly_salary_to}
            onChange={(event) =>
              setField(
                "monthly_salary_to",
                event.target.value,
              )
            }
            helperText="留空代表無上限"
            inputProps={{
              min: 0,
              step: 0.01,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  NT$
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="扣繳稅額"
            type="number"
            size="small"
            required
            value={form.withholding_amount}
            onChange={(event) =>
              setField(
                "withholding_amount",
                event.target.value,
              )
            }
            inputProps={{
              min: 0,
              step: 0.01,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  NT$
                </InputAdornment>
              ),
            }}
          />

          <FormControl
            size="small"
            fullWidth
          >
            <InputLabel>狀態</InputLabel>

            <Select
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

          <TextField
            label="備註"
            value={form.remarks}
            onChange={(event) =>
              setField(
                "remarks",
                event.target.value,
              )
            }
            multiline
            minRows={3}
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
          p: "14px 20px",
        }}
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
          type="submit"
          variant="contained"
          disabled={submitting}
        >
          {submitting ? (
            <CircularProgress
              size={20}
              color="inherit"
            />
          ) : row ? (
            "儲存變更"
          ) : (
            "確認新增"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TaxTableRowsManagementDialog({
  open,
  taxParameter,
  onClose,
}) {
  const [rows, setRows] =
    useState([]);

  const [dependentCount, setDependentCount] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [formDialog, setFormDialog] =
    useState(null);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const taxParameterId =
    Number(
      taxParameter?.tax_parameter_id,
    ) || 0;

  const loadRows =
    useCallback(async () => {
      if (!open || taxParameterId <= 0) {
        setRows([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result =
          await getTaxTableRows(
            taxParameterId,
            {
              dependent_count:
                dependentCount,
              status,
            },
          );

        setRows(
          Array.isArray(result)
            ? result
            : [],
        );
      } catch (requestError) {
        setRows([]);

        setError(
          getErrorMessage(
            requestError,
            "無法載入所得稅額表級距。",
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [
      dependentCount,
      open,
      status,
      taxParameterId,
    ]);

  useEffect(() => {
    if (!open) {
      setRows([]);
      setDependentCount("");
      setStatus("");
      setFormDialog(null);
      setDeleteTarget(null);
      setError("");
      setSuccess("");
      return;
    }

    loadRows();
  }, [loadRows, open]);

  const dependentCountOptions =
    useMemo(() => {
      const values = new Set();

      rows.forEach((row) => {
        const value = Number(
          row?.dependent_count,
        );

        if (
          Number.isInteger(value) &&
          value >= 0
        ) {
          values.add(value);
        }
      });

      for (let index = 0; index <= 6; index += 1) {
        values.add(index);
      }

      return Array.from(values).sort(
        (left, right) => left - right,
      );
    }, [rows]);

  function handleOpenCreate() {
    setError("");
    setSuccess("");

    setFormDialog({
      row: {
        tax_parameter_id:
          taxParameterId,
      },
      isCreate: true,
    });
  }

  function handleOpenEdit(row) {
    setError("");
    setSuccess("");

    setFormDialog({
      row,
      isCreate: false,
    });
  }

  async function handleSaved(message) {
    setFormDialog(null);
    setSuccess(message);

    await loadRows();
  }

  async function handleDelete() {
    if (
      !deleteTarget?.tax_table_row_id
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result =
        await deleteTaxTableRow(
          deleteTarget.tax_table_row_id,
        );

      setDeleteTarget(null);

      setSuccess(
        result?.message ||
          (result?.disabled
            ? "所得稅額表級距已停用。"
            : "所得稅額表級距已刪除。"),
      );

      await loadRows();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "刪除所得稅額表級距失敗。",
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  const createDialogRow =
    formDialog?.isCreate
      ? null
      : formDialog?.row || null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle
          sx={{
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          所得稅額表級距管理
        </DialogTitle>

        <DialogContent dividers>
          <Box>
            <Typography
              sx={{
                color: "#1f2937",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              {taxParameter?.parameter_name ||
                "--"}
            </Typography>

            <Typography
              sx={{
                mt: "4px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              生效年度：
              {taxParameter?.effective_year ||
                "--"}
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mt: "16px" }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{ mt: "16px" }}
              onClose={() =>
                setSuccess("")
              }
            >
              {success}
            </Alert>
          )}

          <Paper
            variant="outlined"
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "180px 180px auto auto",
              },
              gap: "12px",
              mt: "18px",
              p: "14px",
              borderColor: "#dfe4e8",
              boxShadow: "none",
            }}
          >
            <FormControl
              size="small"
              fullWidth
            >
              <InputLabel>
                扶養人數
              </InputLabel>

              <Select
                label="扶養人數"
                value={dependentCount}
                onChange={(event) =>
                  setDependentCount(
                    event.target.value,
                  )
                }
              >
                <MenuItem value="">
                  全部
                </MenuItem>

                {dependentCountOptions.map(
                  (count) => (
                    <MenuItem
                      key={count}
                      value={String(count)}
                    >
                      {count} 人
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>

            <FormControl
              size="small"
              fullWidth
            >
              <InputLabel>狀態</InputLabel>

              <Select
                label="狀態"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value,
                  )
                }
              >
                <MenuItem value="">
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
              type="button"
              variant="outlined"
              startIcon={<RefreshIcon />}
              disabled={loading}
              onClick={loadRows}
              sx={{
                fontWeight: 700,
              }}
            >
              重新整理
            </Button>

            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                fontWeight: 700,
              }}
            >
              新增級距
            </Button>
          </Paper>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              mt: "16px",
            }}
          >
            <Chip
              label={`共 ${rows.length} 筆`}
              size="small"
              variant="outlined"
            />
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                minHeight: "240px",
              }}
            >
              <CircularProgress size={24} />

              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                載入所得稅額表級距中...
              </Typography>
            </Box>
          ) : rows.length === 0 ? (
            <Alert
              severity="info"
              sx={{ mt: "18px" }}
            >
              尚未建立符合條件的所得稅額表級距。
            </Alert>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                mt: "18px",
                borderColor: "#dfe4e8",
                boxShadow: "none",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: "#f8fafc",
                    }}
                  >
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      扶養人數
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      薪資下限
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      薪資上限
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      扣繳稅額
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      狀態
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      計薪使用
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        width: "116px",
                        minWidth: "116px",
                        fontWeight: 700,
                      }}
                    >
                      操作
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row) => {
                    const isUsed =
                      toBoolean(
                        row.is_payroll_used,
                      ) ||
                      Number(
                        row.payroll_usage_count ||
                          0,
                      ) > 0;

                    return (
                      <TableRow
                        key={
                          row.tax_table_row_id
                        }
                        hover
                        sx={{
                          "&:last-child td":
                            {
                              borderBottom: 0,
                            },
                        }}
                      >
                        <TableCell align="center">
                          {row.dependent_count ??
                            0}
                          {" 人"}
                        </TableCell>

                        <TableCell align="center">
                          NT${" "}
                          {formatAmount(
                            row.monthly_salary_from,
                          )}
                        </TableCell>

                        <TableCell align="center">
                          {row.monthly_salary_to ===
                          null
                            ? "無上限"
                            : `NT$ ${formatAmount(
                                row.monthly_salary_to,
                              )}`}
                        </TableCell>

                        <TableCell align="center">
                          NT${" "}
                          {formatAmount(
                            row.withholding_amount,
                          )}
                        </TableCell>

                        <TableCell align="center">
                          <StatusChip
                            status={row.status}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <UsageChip row={row} />
                        </TableCell>

                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              gap: "6px",
                            }}
                          >
                            <Tooltip
                              title={
                                isUsed
                                  ? "已被計薪使用，不能直接編輯"
                                  : "編輯"
                              }
                              arrow
                            >
                              <span>
                                <IconButton
                                  type="button"
                                  size="small"
                                  aria-label="編輯"
                                  disabled={isUsed}
                                  onClick={() =>
                                    handleOpenEdit(
                                      row,
                                    )
                                  }
                                >
                                  <EditOutlinedIcon
                                    sx={{
                                      fontSize:
                                        "20px",
                                    }}
                                  />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip
                              title={
                                isUsed
                                  ? "停用"
                                  : "刪除"
                              }
                              arrow
                            >
                              <IconButton
                                type="button"
                                size="small"
                                color="error"
                                aria-label={
                                  isUsed
                                    ? "停用"
                                    : "刪除"
                                }
                                onClick={() =>
                                  setDeleteTarget(
                                    row,
                                  )
                                }
                              >
                                <DeleteOutlineOutlinedIcon
                                  sx={{
                                    fontSize:
                                      "20px",
                                  }}
                                />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: "14px 20px",
          }}
        >
          <Button
            type="button"
            color="inherit"
            onClick={onClose}
          >
            關閉
          </Button>
        </DialogActions>
      </Dialog>

      <TaxTableRowFormDialog
        open={Boolean(formDialog)}
        row={createDialogRow}
        taxParameterId={taxParameterId}
        initialDependentCount={
          dependentCount
        }
        onClose={() =>
          setFormDialog(null)
        }
        onSaved={handleSaved}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={
          deleting
            ? undefined
            : () =>
                setDeleteTarget(null)
        }
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{ fontWeight: 700 }}
        >
          {toBoolean(
            deleteTarget?.is_payroll_used,
          ) ||
          Number(
            deleteTarget?.payroll_usage_count ||
              0,
          ) > 0
            ? "停用所得稅額表級距"
            : "刪除所得稅額表級距"}
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="warning">
            {toBoolean(
              deleteTarget?.is_payroll_used,
            ) ||
            Number(
              deleteTarget?.payroll_usage_count ||
                0,
            ) > 0
              ? "此級距已被計薪結果使用，無法永久刪除。確認後將改為停用並保留歷史資料。"
              : "確定要刪除這筆所得稅額表級距嗎？"}
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            p: "14px 20px",
          }}
        >
          <Button
            type="button"
            color="inherit"
            disabled={deleting}
            onClick={() =>
              setDeleteTarget(null)
            }
          >
            取消
          </Button>

          <Button
            type="button"
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <CircularProgress
                size={20}
                color="inherit"
              />
            ) : toBoolean(
                deleteTarget?.is_payroll_used,
              ) ||
              Number(
                deleteTarget?.payroll_usage_count ||
                  0,
              ) > 0 ? (
              "確認停用"
            ) : (
              "確認刪除"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}