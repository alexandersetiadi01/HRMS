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
  FormControlLabel,
  IconButton,
  InputAdornment,
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
  createTaxParameter,
  deleteTaxParameter,
  getTaxParameters,
  updateTaxParameter,
} from "../../API/payroll";

const CURRENT_YEAR = new Date().getFullYear();

const ROUNDING_METHODS = [
  "四捨五入",
  "無條件捨去",
  "無條件進位",
];

const EMPTY_FORM = {
  parameter_name: "",
  effective_year: String(CURRENT_YEAR),
  resident_default_rate: "",
  nonresident_default_rate: "",
  monthly_exemption_threshold: "",
  rounding_method: "四捨五入",
  is_default: false,
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

function formatRate(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "--";
  }

  return `${number.toLocaleString("zh-TW", {
    maximumFractionDigits: 4,
  })}%`;
}

function formatAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 2,
  }).format(number);
}

function parameterToForm(parameter) {
  return {
    parameter_name: String(
      parameter?.parameter_name || "",
    ),

    effective_year: String(
      parameter?.effective_year ||
        CURRENT_YEAR,
    ),

    resident_default_rate: String(
      parameter?.resident_default_rate ?? "",
    ),

    nonresident_default_rate: String(
      parameter?.nonresident_default_rate ?? "",
    ),

    monthly_exemption_threshold: String(
      parameter?.monthly_exemption_threshold ??
        "",
    ),

    rounding_method: String(
      parameter?.rounding_method ||
        "四捨五入",
    ),

    is_default: toBoolean(
      parameter?.is_default,
    ),

    status: String(
      parameter?.status || "啟用",
    ),

    remarks: String(
      parameter?.remarks || "",
    ),
  };
}

function buildPayload(form) {
  return {
    parameter_name:
      form.parameter_name.trim(),

    effective_year: Number(
      form.effective_year,
    ),

    resident_default_rate: Number(
      form.resident_default_rate,
    ),

    nonresident_default_rate: Number(
      form.nonresident_default_rate,
    ),

    monthly_exemption_threshold: Number(
      form.monthly_exemption_threshold,
    ),

    rounding_method:
      form.rounding_method,

    is_default:
      form.is_default ? 1 : 0,

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

function DefaultChip({ value }) {
  if (!toBoolean(value)) {
    return null;
  }

  return (
    <Chip
      label="年度預設"
      size="small"
      color="primary"
    />
  );
}

function TaxParameterFormDialog({
  open,
  parameter,
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

    setForm(
      parameter
        ? parameterToForm(parameter)
        : { ...EMPTY_FORM },
    );

    setSubmitting(false);
    setError("");
  }, [open, parameter]);

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function handleStatusChange(status) {
    setForm((current) => ({
      ...current,
      status,
      is_default:
        status === "停用"
          ? false
          : current.is_default,
    }));

    setError("");
  }

  function validateForm() {
    if (!form.parameter_name.trim()) {
      return "請輸入參數名稱。";
    }

    const year = Number(
      form.effective_year,
    );

    if (
      !Number.isInteger(year) ||
      year < 1900 ||
      year > 2200
    ) {
      return "生效年度必須介於 1900 至 2200 年。";
    }

    const residentRate = Number(
      form.resident_default_rate,
    );

    if (
      form.resident_default_rate === "" ||
      !Number.isFinite(residentRate) ||
      residentRate < 0 ||
      residentRate > 100
    ) {
      return "居民預設扣繳率必須介於 0% 至 100%。";
    }

    const nonresidentRate = Number(
      form.nonresident_default_rate,
    );

    if (
      form.nonresident_default_rate === "" ||
      !Number.isFinite(nonresidentRate) ||
      nonresidentRate < 0 ||
      nonresidentRate > 100
    ) {
      return "非居民預設扣繳率必須介於 0% 至 100%。";
    }

    const threshold = Number(
      form.monthly_exemption_threshold,
    );

    if (
      form.monthly_exemption_threshold === "" ||
      !Number.isFinite(threshold) ||
      threshold < 0
    ) {
      return "每月免扣繳門檻不可小於 0。";
    }

    if (
      !ROUNDING_METHODS.includes(
        form.rounding_method,
      )
    ) {
      return "請選擇正確的所得稅進位方式。";
    }

    if (
      form.is_default &&
      form.status !== "啟用"
    ) {
      return "只有啟用中的所得稅參數可以設為年度預設。";
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
      if (parameter?.tax_parameter_id) {
        await updateTaxParameter(
          parameter.tax_parameter_id,
          buildPayload(form),
        );
      } else {
        await createTaxParameter(
          buildPayload(form),
        );
      }

      await onSaved(
        parameter
          ? "所得稅參數已更新。"
          : "所得稅參數已新增。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          parameter
            ? "更新所得稅參數失敗。"
            : "新增所得稅參數失敗。",
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
        {parameter
          ? "編輯所得稅參數"
          : "新增所得稅參數"}
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
            label="參數名稱"
            size="small"
            required
            value={form.parameter_name}
            onChange={(event) =>
              setField(
                "parameter_name",
                event.target.value,
              )
            }
            inputProps={{
              maxLength: 255,
            }}
            sx={{
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
            }}
          />

          <TextField
            label="生效年度"
            type="number"
            size="small"
            required
            value={form.effective_year}
            onChange={(event) =>
              setField(
                "effective_year",
                event.target.value,
              )
            }
            inputProps={{
              min: 1900,
              max: 2200,
              step: 1,
            }}
          />

          <FormControl
            size="small"
            fullWidth
          >
            <InputLabel>
              進位方式
            </InputLabel>

            <Select
              label="進位方式"
              value={form.rounding_method}
              onChange={(event) =>
                setField(
                  "rounding_method",
                  event.target.value,
                )
              }
            >
              {ROUNDING_METHODS.map(
                (method) => (
                  <MenuItem
                    key={method}
                    value={method}
                  >
                    {method}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>

          <TextField
            label="居民預設扣繳率"
            type="number"
            size="small"
            required
            value={
              form.resident_default_rate
            }
            onChange={(event) =>
              setField(
                "resident_default_rate",
                event.target.value,
              )
            }
            inputProps={{
              min: 0,
              max: 100,
              step: 0.0001,
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  %
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="非居民預設扣繳率"
            type="number"
            size="small"
            required
            value={
              form.nonresident_default_rate
            }
            onChange={(event) =>
              setField(
                "nonresident_default_rate",
                event.target.value,
              )
            }
            inputProps={{
              min: 0,
              max: 100,
              step: 0.0001,
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  %
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="每月免扣繳門檻"
            type="number"
            size="small"
            required
            value={
              form.monthly_exemption_threshold
            }
            onChange={(event) =>
              setField(
                "monthly_exemption_threshold",
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
                handleStatusChange(
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

          <Paper
            variant="outlined"
            sx={{
              display: "flex",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent:
                "space-between",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              gap: "10px",
              gridColumn: {
                xs: "auto",
                sm: "1 / -1",
              },
              p: "14px",
              borderColor: "#dfe4e8",
              boxShadow: "none",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#334155",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                年度預設參數
              </Typography>

              <Typography
                sx={{
                  mt: "3px",
                  color: "#7b8794",
                  fontSize: "12px",
                }}
              >
                同一年度只能有一個預設參數版本。
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_default}
                  disabled={
                    form.status !== "啟用"
                  }
                  onChange={(event) =>
                    setField(
                      "is_default",
                      event.target.checked,
                    )
                  }
                />
              }
              label={
                form.is_default
                  ? "已設為預設"
                  : "設為預設"
              }
              sx={{
                m: 0,
              }}
            />
          </Paper>

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
          ) : parameter ? (
            "儲存變更"
          ) : (
            "確認新增"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TaxParameterMobileCard({
  parameter,
  onEdit,
  onDelete,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "14px",
          sm: "18px",
        },
        borderColor: "#dfe4e8",
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#1f2937",
              fontSize: {
                xs: "16px",
                sm: "17px",
              },
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {parameter.parameter_name ||
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
            {parameter.effective_year ||
              "--"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "5px",
          }}
        >
          <StatusChip
            status={parameter.status}
          />

          <DefaultChip
            value={parameter.is_default}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "14px 12px",
          mt: "16px",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            居民扣繳率
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            {formatRate(
              parameter.resident_default_rate,
            )}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            非居民扣繳率
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            {formatRate(
              parameter.nonresident_default_rate,
            )}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            免扣繳門檻
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "13px",
            }}
          >
            NT${" "}
            {formatAmount(
              parameter.monthly_exemption_threshold,
            )}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            進位方式
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "13px",
            }}
          >
            {parameter.rounding_method ||
              "--"}
          </Typography>
        </Box>
      </Box>

      {parameter.remarks && (
        <Box sx={{ mt: "14px" }}>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            備註
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#334155",
              fontSize: "13px",
              overflowWrap: "anywhere",
            }}
          >
            {parameter.remarks}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "6px",
          mt: "16px",
          pt: "12px",
          borderTop:
            "1px solid #e5e7eb",
        }}
      >
        <Button
          type="button"
          size="small"
          startIcon={
            <EditOutlinedIcon />
          }
          onClick={() =>
            onEdit(parameter)
          }
        >
          編輯
        </Button>

        <Button
          type="button"
          size="small"
          color="error"
          startIcon={
            <DeleteOutlineOutlinedIcon />
          }
          onClick={() =>
            onDelete(parameter)
          }
        >
          刪除
        </Button>
      </Box>
    </Paper>
  );
}

export default function PayrollTaxParametersPage() {
  const [parameters, setParameters] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [effectiveYear, setEffectiveYear] =
    useState("");

  const [loading, setLoading] =
    useState(true);

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

  const loadParameters =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await getTaxParameters({
            search: search.trim(),
            status,
            effective_year:
              effectiveYear,
          });

        setParameters(
          Array.isArray(result)
            ? result
            : [],
        );
      } catch (requestError) {
        setParameters([]);

        setError(
          getErrorMessage(
            requestError,
            "無法載入所得稅參數。",
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [
      effectiveYear,
      search,
      status,
    ]);

  useEffect(() => {
    loadParameters();
  }, [loadParameters]);

  const years = useMemo(() => {
    const result = new Set([
      CURRENT_YEAR,
      CURRENT_YEAR - 1,
      CURRENT_YEAR + 1,
    ]);

    parameters.forEach((parameter) => {
      const year = Number(
        parameter.effective_year,
      );

      if (Number.isInteger(year)) {
        result.add(year);
      }
    });

    return Array.from(result).sort(
      (left, right) => right - left,
    );
  }, [parameters]);

  const enabledCount = useMemo(
    () =>
      parameters.filter(
        (parameter) =>
          parameter.status === "啟用",
      ).length,
    [parameters],
  );

  const defaultCount = useMemo(
    () =>
      parameters.filter((parameter) =>
        toBoolean(
          parameter.is_default,
        ),
      ).length,
    [parameters],
  );

  function handleOpenCreate() {
    setError("");
    setSuccess("");

    setFormDialog({
      parameter: null,
    });
  }

  function handleOpenEdit(parameter) {
    setError("");
    setSuccess("");

    setFormDialog({
      parameter,
    });
  }

  async function handleSaved(message) {
    setFormDialog(null);
    setSuccess(message);

    await loadParameters();
  }

  async function handleDelete() {
    if (
      !deleteTarget?.tax_parameter_id
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result =
        await deleteTaxParameter(
          deleteTarget.tax_parameter_id,
        );

      setDeleteTarget(null);

      setSuccess(
        result?.message ||
          "所得稅參數已刪除。",
      );

      await loadParameters();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "刪除所得稅參數失敗。",
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "280px",
        p: {
          xs: "16px",
          sm: "22px",
        },
        border:
          "1px solid #dfe4e8",
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
          justifyContent:
            "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: "12px",
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              color: "#111827",
              fontSize: {
                xs: "18px",
                sm: "20px",
              },
              fontWeight: 700,
            }}
          >
            所得稅參數
          </Typography>

          <Typography
            sx={{
              mt: "5px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            管理各年度薪資所得扣繳使用的稅率、門檻與進位方式
          </Typography>
        </Box>

        <Button
          type="button"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            minWidth: {
              xs: "100%",
              sm: "158px",
            },
            fontWeight: 700,
          }}
        >
          新增所得稅參數
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: "18px" }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mt: "18px" }}
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
            md: "minmax(0, 1fr) 150px 150px auto",
          },
          gap: "12px",
          mt: "20px",
          p: {
            xs: "14px",
            sm: "18px",
          },
          borderColor: "#dfe4e8",
          boxShadow: "none",
        }}
      >
        <TextField
          label="搜尋所得稅參數"
          placeholder="輸入參數名稱或備註"
          size="small"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    color: "#94a3b8",
                    fontSize: "20px",
                  }}
                />
              </InputAdornment>
            ),
          }}
        />

        <FormControl
          size="small"
          fullWidth
        >
          <InputLabel>
            生效年度
          </InputLabel>

          <Select
            label="生效年度"
            value={effectiveYear}
            onChange={(event) =>
              setEffectiveYear(
                event.target.value,
              )
            }
          >
            <MenuItem value="">
              全部年度
            </MenuItem>

            {years.map((year) => (
              <MenuItem
                key={year}
                value={String(year)}
              >
                {year}
              </MenuItem>
            ))}
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
          onClick={loadParameters}
          sx={{
            minWidth: {
              xs: "100%",
              md: "96px",
            },
            fontWeight: 700,
          }}
        >
          重新整理
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
          label={`共 ${parameters.length} 筆`}
          size="small"
          variant="outlined"
        />

        <Chip
          label={`啟用 ${enabledCount} 筆`}
          size="small"
          color="success"
          variant="outlined"
        />

        <Chip
          label={`年度預設 ${defaultCount} 筆`}
          size="small"
          color="primary"
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
            minHeight: "260px",
          }}
        >
          <CircularProgress size={24} />

          <Typography
            sx={{
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            載入所得稅參數中...
          </Typography>
        </Box>
      ) : parameters.length === 0 ? (
        <Alert
          severity="info"
          sx={{ mt: "18px" }}
        >
          找不到符合條件的所得稅參數。
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
              mt: "18px",
            }}
          >
            {parameters.map(
              (parameter) => (
                <TaxParameterMobileCard
                  key={
                    parameter.tax_parameter_id
                  }
                  parameter={parameter}
                  onEdit={
                    handleOpenEdit
                  }
                  onDelete={
                    setDeleteTarget
                  }
                />
              ),
            )}
          </Box>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
              mt: "18px",
              borderColor: "#dfe4e8",
              boxShadow: "none",
              overflowX: "hidden",
            }}
          >
            <Table
              size="small"
              sx={{
                width: "100%",

                "& th, & td": {
                  px: {
                    md: "9px",
                    lg: "13px",
                  },
                  py: "12px",
                  verticalAlign: "middle",
                },

                "& th": {
                  color: "#334155",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>
                    參數名稱
                  </TableCell>

                  <TableCell align="center">
                    年度
                  </TableCell>

                  <TableCell align="center">
                    居民稅率
                  </TableCell>

                  <TableCell align="center">
                    非居民稅率
                  </TableCell>

                  <TableCell align="center">
                    免扣繳門檻
                  </TableCell>

                  <TableCell align="center">
                    進位方式
                  </TableCell>

                  <TableCell align="center">
                    狀態
                  </TableCell>

                  <TableCell align="center">
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {parameters.map(
                  (parameter) => (
                    <TableRow
                      key={
                        parameter.tax_parameter_id
                      }
                      hover
                    >
                      <TableCell>
                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "5px",
                            }}
                          >
                            <Typography
                              sx={{
                                minWidth: 0,
                                color: "#1f2937",
                                fontSize: "13px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {parameter.parameter_name ||
                                "--"}
                            </Typography>

                            <DefaultChip
                              value={
                                parameter.is_default
                              }
                            />
                          </Box>

                          <Typography
                            sx={{
                              mt: "3px",
                              color: "#7b8794",
                              fontSize: "12px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {parameter.remarks ||
                              "--"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        {parameter.effective_year ||
                          "--"}
                      </TableCell>

                      <TableCell align="center">
                        {formatRate(
                          parameter.resident_default_rate,
                        )}
                      </TableCell>

                      <TableCell align="center">
                        {formatRate(
                          parameter.nonresident_default_rate,
                        )}
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          whiteSpace: "nowrap",
                        }}
                      >
                        NT${" "}
                        {formatAmount(
                          parameter.monthly_exemption_threshold,
                        )}
                      </TableCell>

                      <TableCell align="center">
                        {parameter.rounding_method ||
                          "--"}
                      </TableCell>

                      <TableCell align="center">
                        <StatusChip
                          status={
                            parameter.status
                          }
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Box
                          sx={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            flexWrap:
                              "nowrap",
                            gap: "2px",
                          }}
                        >
                          <Tooltip
                            title="編輯"
                            arrow
                          >
                            <IconButton
                              type="button"
                              size="small"
                              aria-label="編輯"
                              onClick={() =>
                                handleOpenEdit(
                                  parameter,
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
                          </Tooltip>

                          <Tooltip
                            title="刪除"
                            arrow
                          >
                            <IconButton
                              type="button"
                              size="small"
                              color="error"
                              aria-label="刪除"
                              onClick={() =>
                                setDeleteTarget(
                                  parameter,
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
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <TaxParameterFormDialog
        open={Boolean(formDialog)}
        parameter={
          formDialog?.parameter ||
          null
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
          刪除所得稅參數
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="warning">
            確定要刪除「
            {deleteTarget?.parameter_name ||
              "--"}
            」嗎？
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
            ) : (
              "確認刪除"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}