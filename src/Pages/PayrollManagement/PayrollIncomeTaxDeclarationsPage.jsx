import { useCallback, useEffect, useMemo, useState } from "react";

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
  Pagination,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  cancelIncomeTaxDeclaration,
  confirmIncomeTaxDeclaration,
  createIncomeTaxDeclaration,
  getIncomeTaxDeclaration,
  getIncomeTaxDeclarations,
  getTaxDeclarationUnits,
  previewIncomeTaxDeclaration,
  submitIncomeTaxDeclaration,
} from "../../API/payroll";

const CURRENT_YEAR = new Date().getFullYear();

const PER_PAGE = 20;

const EMPTY_FILTERS = {
  declaration_year: String(CURRENT_YEAR),

  tax_declaration_unit_id: "",

  declaration_type: "",

  status: "",

  keyword: "",
};

const EMPTY_CREATE_FORM = {
  declaration_year: String(CURRENT_YEAR),

  tax_declaration_unit_id: "",

  declaration_type: "年度申報",

  remarks: "",
};

const DECLARATION_ACTIONS = {
  confirm: {
    title: "確認所得稅申報",

    message: "確認後，此申報將進入已確認狀態。請確認申報明細與金額正確。",

    confirmLabel: "確認申報",

    successMessage: "所得稅申報已確認。",

    color: "success",

    icon: CheckCircleOutlineIcon,

    request: confirmIncomeTaxDeclaration,
  },

  submit: {
    title: "完成所得稅申報",

    message: "完成後，此申報將標記為已申報，且無法再取消。",

    confirmLabel: "完成申報",

    successMessage: "所得稅申報已完成。",

    color: "primary",

    icon: PublishOutlinedIcon,

    request: submitIncomeTaxDeclaration,
  },

  cancel: {
    title: "取消所得稅申報",

    message: "取消後，此申報內的扣繳結果將可重新建立新的申報版本。",

    confirmLabel: "確認取消",

    successMessage: "所得稅申報已取消。",

    color: "error",

    icon: CancelOutlinedIcon,

    request: cancelIncomeTaxDeclaration,
  },
};

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatAmount(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 2,
  }).format(number);
}

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  const normalized = String(value).trim();

  if (!normalized) {
    return "--";
  }

  return normalized.replace("T", " ").replaceAll("-", "/").slice(0, 16);
}

function getTaxDeclarationUnitLabel(unit) {
  const name = String(unit?.declaration_unit_name || "").trim();

  const registrationNo = String(unit?.business_registration_no || "").trim();

  if (name && registrationNo) {
    return `${name}／${registrationNo}`;
  }

  return (
    name ||
    registrationNo ||
    `申報單位 #${unit?.tax_declaration_unit_id || "--"}`
  );
}

function StatusChip({ status }) {
  const normalizedStatus = String(status || "").trim();

  const colorMap = {
    草稿: "default",
    已確認: "success",
    已申報: "primary",
    取消: "error",
  };

  return (
    <Chip
      label={normalizedStatus || "--"}
      size="small"
      color={colorMap[normalizedStatus] || "default"}
      variant="outlined"
      sx={{
        fontWeight: 700,
      }}
    />
  );
}

function SummaryCard({ label, value, description, prefix = "" }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "13px",
          sm: "15px",
        },
        borderColor: "#e2e8f0",
        borderRadius: "5px",
        bgcolor: "#f8fafc",
        boxShadow: "none",
      }}
    >
      <Typography
        sx={{
          color: "#64748b",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "4px",
          color: "#111827",
          fontSize: {
            xs: "22px",
            sm: "25px",
          },
          fontWeight: 700,
          lineHeight: 1.25,
          overflowWrap: "anywhere",
        }}
      >
        {prefix}
        {formatAmount(value)}
      </Typography>

      <Typography
        sx={{
          mt: "5px",
          color: "#94a3b8",
          fontSize: "11px",
        }}
      >
        {description}
      </Typography>
    </Paper>
  );
}

function DetailField({ label, value, fullWidth = false }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        gridColumn: fullWidth ? "1 / -1" : "auto",
      }}
    >
      <Typography
        sx={{
          color: "#7b8794",
          fontSize: "11px",
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "3px",
          color: "#1f2937",
          fontSize: "14px",
          fontWeight: 600,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {value ?? "--"}
      </Typography>
    </Box>
  );
}

function DeclarationItemTable({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <Alert severity="info">此申報目前沒有明細資料。</Alert>;
  }

  return (
    <>
      <Box
        sx={{
          display: {
            xs: "grid",
            md: "none",
          },
          gap: "10px",
        }}
      >
        {items.map((item, index) => (
          <Paper
            key={`${item.employee_no}-${item.income_year}-${item.income_month}-${index}`}
            variant="outlined"
            sx={{
              p: "12px",
              borderColor: "#e2e8f0",
              borderRadius: "5px",
              bgcolor: "#f8fafc",
              boxShadow: "none",
            }}
          >
            <Typography
              sx={{
                color: "#111827",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {item.employee_no || "--"}
              {"／"}
              {item.employee_name || "--"}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px",
                mt: "12px",
              }}
            >
              <DetailField
                label="所得期間"
                value={`${item.income_year || "--"} 年 ${item.income_month || "--"} 月`}
              />

              <DetailField
                label="所得格式"
                value={item.income_format || "--"}
              />

              <DetailField
                label="應稅所得"
                value={`NT$ ${formatAmount(item.taxable_amount)}`}
              />

              <DetailField
                label="扣繳稅額"
                value={`NT$ ${formatAmount(item.withholding_tax)}`}
              />

              <DetailField
                label="納稅義務人類型"
                value={item.taxpayer_type || "--"}
              />

              <DetailField
                label="居留狀態"
                value={item.residency_status || "--"}
              />
            </Box>
          </Paper>
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
          width: "100%",
          maxWidth: "100%",
          borderColor: "#dfe4e8",
          borderRadius: "5px",
          boxShadow: "none",
          overflowX: "auto",
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
                sx={{
                  fontWeight: 700,
                }}
              >
                員工
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                所得期間
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                }}
              >
                所得格式
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                }}
              >
                納稅義務人類型
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                }}
              >
                居留狀態
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                應稅所得
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                扣繳稅額
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item, index) => (
              <TableRow
                key={`${item.employee_no}-${item.income_year}-${item.income_month}-${index}`}
                hover
              >
                <TableCell>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {item.employee_no || "--"}
                  </Typography>

                  <Typography
                    sx={{
                      mt: "2px",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {item.employee_name || "--"}
                  </Typography>
                </TableCell>

                <TableCell>
                  {item.income_year || "--"} 年 {item.income_month || "--"} 月
                </TableCell>

                <TableCell>{item.income_format || "--"}</TableCell>

                <TableCell>{item.taxpayer_type || "--"}</TableCell>

                <TableCell>{item.residency_status || "--"}</TableCell>

                <TableCell align="right">
                  NT$ {formatAmount(item.taxable_amount)}
                </TableCell>

                <TableCell align="right">
                  NT$ {formatAmount(item.withholding_tax)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function DeclarationDetailDialog({
  open,
  record,
  loading,
  error,
  onClose,
  onAction,
}) {
  const declarationUnit = record?.declaration_unit || {};

  const summary = record?.summary || {};

  const workflow = record?.workflow || {};

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        所得稅申報明細
      </DialogTitle>

      <DialogContent dividers>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : loading ? (
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
              載入所得稅申報明細中...
            </Typography>
          </Box>
        ) : record ? (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },
                justifyContent: "space-between",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                gap: "10px",
              }}
            >
              <Box
                sx={{
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    color: "#111827",
                    fontSize: "18px",
                    fontWeight: 700,
                    overflowWrap: "anywhere",
                  }}
                >
                  {record.declaration_year || "--"} 年{" "}
                  {record.declaration_type || "所得稅申報"}
                </Typography>

                <Typography
                  sx={{
                    mt: "3px",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  版本：
                  {record.version_no || "--"}
                </Typography>
              </Box>

              <StatusChip status={record.status} />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: "16px",
                mt: "20px",
                p: {
                  xs: "14px",
                  sm: "16px",
                },
                border: "1px solid #e2e8f0",
                borderRadius: "5px",
                bgcolor: "#f8fafc",
              }}
            >
              <DetailField
                label="所得稅申報單位"
                value={declarationUnit.declaration_unit_name || "--"}
              />

              <DetailField
                label="統一編號"
                value={declarationUnit.business_registration_no || "--"}
              />

              <DetailField
                label="扣繳單位稅籍編號"
                value={declarationUnit.withholding_tax_unit_no || "--"}
              />

              <DetailField
                label="負責人"
                value={declarationUnit.responsible_person || "--"}
              />

              <DetailField
                label="聯絡人"
                value={declarationUnit.contact_person || "--"}
              />

              <DetailField
                label="聯絡電話"
                value={declarationUnit.contact_phone || "--"}
              />

              <DetailField
                label="申報地址"
                value={declarationUnit.declaration_address || "--"}
                fullWidth
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: "12px",
                mt: "16px",
              }}
            >
              <SummaryCard
                label="申報筆數"
                value={summary.record_count}
                description="本申報包含的所得資料"
              />

              <SummaryCard
                label="應稅所得總額"
                value={summary.taxable_amount_total}
                prefix="NT$ "
                description="本申報明細應稅所得合計"
              />

              <SummaryCard
                label="扣繳稅額總額"
                value={summary.withholding_tax_total}
                prefix="NT$ "
                description="本申報明細扣繳稅額合計"
              />
            </Box>

            <Typography
              sx={{
                mt: "22px",
                mb: "10px",
                color: "#111827",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              申報流程
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: "16px",
                p: {
                  xs: "14px",
                  sm: "16px",
                },
                border: "1px solid #e2e8f0",
                borderRadius: "5px",
                bgcolor: "#ffffff",
              }}
            >
              <DetailField
                label="建立時間"
                value={formatDateTime(workflow.generated_at)}
              />

              <DetailField
                label="建立人員"
                value={workflow.generated_by_name || "--"}
              />

              <DetailField
                label="確認時間"
                value={formatDateTime(workflow.confirmed_at)}
              />

              <DetailField
                label="確認人員"
                value={workflow.confirmed_by_name || "--"}
              />

              <DetailField
                label="完成申報時間"
                value={formatDateTime(workflow.submitted_at)}
              />

              <DetailField
                label="完成申報人員"
                value={workflow.submitted_by_name || "--"}
              />

              <DetailField
                label="取消時間"
                value={formatDateTime(workflow.cancelled_at)}
              />

              <DetailField
                label="取消人員"
                value={workflow.cancelled_by_name || "--"}
              />
            </Box>

            {record.remarks ? (
              <>
                <Typography
                  sx={{
                    mt: "22px",
                    mb: "10px",
                    color: "#111827",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  備註
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{
                    p: "14px",
                    borderColor: "#e2e8f0",
                    borderRadius: "5px",
                    boxShadow: "none",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#374151",
                      fontSize: "13px",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {record.remarks}
                  </Typography>
                </Paper>
              </>
            ) : null}

            <Typography
              sx={{
                mt: "22px",
                mb: "10px",
                color: "#111827",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              申報明細
            </Typography>

            <DeclarationItemTable items={record.items} />
          </>
        ) : (
          <Alert severity="info">找不到所得稅申報明細。</Alert>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          display: "flex",
          alignItems: "center",
          p: "14px 20px",
          gap: "8px",
        }}
      >
        {!loading && record ? (
          <DeclarationActionButtons record={record} onAction={onAction} />
        ) : null}

        <Box
          sx={{
            flex: 1,
          }}
        />
        <Button
          type="button"
          color="inherit"
          disabled={loading}
          onClick={onClose}
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeclarationMobileCard({ record, onView, onAction }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "13px",
          sm: "15px",
        },
        borderColor: "#e2e8f0",
        borderRadius: "5px",
        bgcolor: "#f8fafc",
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
        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              color: "#1f2937",
              fontSize: "15px",
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {record.declaration_year || "--"} 年{" "}
            {record.declaration_type || "所得稅申報"}
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            {record.declaration_unit_name || "--"}
            {"／版本 "}
            {record.version_no || "--"}
          </Typography>
        </Box>

        <StatusChip status={record.status} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          mt: "14px",
          p: "12px",
          borderRadius: "5px",
          bgcolor: "#ffffff",
        }}
      >
        <DetailField
          label="申報筆數"
          value={`${record.record_count || 0} 筆`}
        />

        <DetailField
          label="建立時間"
          value={formatDateTime(record.generated_at)}
        />

        <DetailField
          label="應稅所得總額"
          value={`NT$ ${formatAmount(record.taxable_amount_total)}`}
        />

        <DetailField
          label="扣繳稅額總額"
          value={`NT$ ${formatAmount(record.withholding_tax_total)}`}
        />
      </Box>

      <Button
        type="button"
        variant="outlined"
        fullWidth
        startIcon={<VisibilityOutlinedIcon />}
        onClick={() => onView(record)}
        sx={{
          mt: "14px",
          fontWeight: 700,
        }}
      >
        檢視明細
      </Button>
      <DeclarationActionButtons record={record} onAction={onAction} />
    </Paper>
  );
}

function DeclarationPreviewRow({ row }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "12px",
          sm: "14px",
        },
        borderColor: "#e2e8f0",
        borderRadius: "5px",
        bgcolor: "#f8fafc",
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
        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              color: "#111827",
              fontSize: "14px",
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {row.employee_no || "--"}
            {"／"}
            {row.employee_name || "--"}
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            {row.income_month || "--"} 月{"／"}
            {row.run_name || "--"}
          </Typography>
        </Box>

        <Chip
          size="small"
          variant="outlined"
          label={row.income_format || "未設定"}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
          },
          gap: "12px",
          mt: "13px",
        }}
      >
        <DetailField label="納稅義務人類型" value={row.taxpayer_type || "--"} />

        <DetailField label="居留狀態" value={row.residency_status || "--"} />

        <DetailField
          label="應稅所得"
          value={`NT$ ${formatAmount(row.taxable_amount)}`}
        />

        <DetailField
          label="扣繳稅額"
          value={`NT$ ${formatAmount(row.withholding_tax)}`}
        />
      </Box>
    </Paper>
  );
}

function DeclarationCreateDialog({
  open,
  taxDeclarationUnits,
  loadingUnits,
  yearOptions,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState(EMPTY_CREATE_FORM);

  const [preview, setPreview] = useState(null);

  const [previewLoading, setPreviewLoading] = useState(false);

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_CREATE_FORM);

      setPreview(null);
      setPreviewLoading(false);
      setCreating(false);
      setError("");
    }
  }, [open]);

  function setFormField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (field !== "remarks" && preview) {
      setPreview(null);
    }
  }

  function buildPayload() {
    return {
      declaration_year: Number(form.declaration_year),

      tax_declaration_unit_id: Number(form.tax_declaration_unit_id),

      declaration_type: form.declaration_type,

      remarks: form.remarks.trim(),
    };
  }

  function validateForm() {
    if (!form.declaration_year) {
      return "請選擇申報年度。";
    }

    if (!form.tax_declaration_unit_id) {
      return "請選擇所得稅申報單位。";
    }

    return "";
  }

  async function handlePreview() {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);

      return;
    }

    setPreviewLoading(true);
    setError("");

    try {
      const result = await previewIncomeTaxDeclaration(buildPayload());

      setPreview(result);
    } catch (requestError) {
      setPreview(null);

      setError(getErrorMessage(requestError, "無法產生所得稅申報預覽。"));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCreate() {
    if (!preview || Number(preview?.summary?.record_count || 0) <= 0) {
      setError("目前沒有可建立申報的扣繳結果。");

      return;
    }

    setCreating(true);
    setError("");

    try {
      const result = await createIncomeTaxDeclaration(buildPayload());

      await onCreated(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "無法建立所得稅申報。"));
    } finally {
      setCreating(false);
    }
  }

  const busy = previewLoading || creating;

  const previewRows = Array.isArray(preview?.rows) ? preview.rows : [];

  const previewSummary = preview?.summary || {};

  const previewUnit = preview?.declaration_unit || {};

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        建立所得稅申報
      </DialogTitle>

      <DialogContent dividers>
        {error ? (
          <Alert
            severity="error"
            sx={{
              mb: "16px",
            }}
          >
            {error}
          </Alert>
        ) : null}

        {!preview ? (
          <>
            <Typography
              sx={{
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.7,
              }}
            >
              選擇申報年度與所得稅申報單位後，先產生預覽確認申報資料。
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                gap: "14px",
                mt: "18px",
              }}
            >
              <FormControl size="small" fullWidth>
                <InputLabel>申報年度</InputLabel>

                <Select
                  label="申報年度"
                  value={form.declaration_year}
                  disabled={busy}
                  onChange={(event) =>
                    setFormField("declaration_year", event.target.value)
                  }
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year} value={String(year)}>
                      {year} 年
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                fullWidth
                disabled={loadingUnits || busy}
              >
                <InputLabel>所得稅申報單位</InputLabel>

                <Select
                  label="所得稅申報單位"
                  value={form.tax_declaration_unit_id}
                  onChange={(event) =>
                    setFormField("tax_declaration_unit_id", event.target.value)
                  }
                >
                  {taxDeclarationUnits.map((unit) => (
                    <MenuItem
                      key={unit.tax_declaration_unit_id}
                      value={String(unit.tax_declaration_unit_id)}
                    >
                      {getTaxDeclarationUnitLabel(unit)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>申報類型</InputLabel>

                <Select
                  label="申報類型"
                  value={form.declaration_type}
                  disabled={busy}
                  onChange={(event) =>
                    setFormField("declaration_type", event.target.value)
                  }
                >
                  <MenuItem value="年度申報">年度申報</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                fullWidth
                multiline
                minRows={3}
                label="備註"
                value={form.remarks}
                disabled={busy}
                onChange={(event) =>
                  setFormField("remarks", event.target.value)
                }
                sx={{
                  gridColumn: {
                    xs: "auto",
                    sm: "1 / -1",
                  },
                }}
              />
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },
                justifyContent: "space-between",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                gap: "12px",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#111827",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  {preview.declaration_year || "--"} 年{" "}
                  {preview.declaration_type || "年度申報"}
                </Typography>

                <Typography
                  sx={{
                    mt: "3px",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  預計建立版本：
                  {preview.next_version_no || "--"}
                </Typography>
              </Box>

              <Chip
                color="primary"
                variant="outlined"
                label={previewUnit.declaration_unit_name || "未設定申報單位"}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: "12px",
                mt: "18px",
              }}
            >
              <SummaryCard
                label="申報筆數"
                value={previewSummary.record_count}
                description="本次將建立的申報明細數"
              />

              <SummaryCard
                label="應稅所得總額"
                value={previewSummary.taxable_amount_total}
                prefix="NT$ "
                description="本次申報應稅所得合計"
              />

              <SummaryCard
                label="扣繳稅額總額"
                value={previewSummary.withholding_tax_total}
                prefix="NT$ "
                description="本次申報扣繳稅額合計"
              />
            </Box>

            <Typography
              sx={{
                mt: "22px",
                mb: "10px",
                color: "#111827",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              預覽明細
            </Typography>

            {previewRows.length === 0 ? (
              <Alert severity="info">目前沒有可建立申報的扣繳結果。</Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: "10px",
                  maxHeight: "440px",
                  overflowY: "auto",
                  pr: "2px",
                }}
              >
                {previewRows.map((row, index) => (
                  <DeclarationPreviewRow
                    key={`${row.employee_no}-${row.income_month}-${index}`}
                    row={row}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: "14px 20px",
          gap: "8px",
        }}
      >
        {preview ? (
          <Button
            type="button"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            disabled={busy}
            onClick={() => {
              setPreview(null);
              setError("");
            }}
          >
            返回修改
          </Button>
        ) : null}

        <Box
          sx={{
            flex: 1,
          }}
        />

        <Button type="button" color="inherit" disabled={busy} onClick={onClose}>
          取消
        </Button>

        {!preview ? (
          <Button
            type="button"
            variant="contained"
            startIcon={
              previewLoading ? (
                <CircularProgress size={17} color="inherit" />
              ) : (
                <SearchIcon />
              )
            }
            disabled={busy}
            onClick={handlePreview}
          >
            產生預覽
          </Button>
        ) : (
          <Button
            type="button"
            variant="contained"
            startIcon={
              creating ? (
                <CircularProgress size={17} color="inherit" />
              ) : (
                <CheckCircleOutlineIcon />
              )
            }
            disabled={busy || previewRows.length === 0}
            onClick={handleCreate}
          >
            建立申報
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

function DeclarationActionDialog({
  open,
  action,
  record,
  loading,
  error,
  onClose,
  onConfirm,
}) {
  const configuration = DECLARATION_ACTIONS[action];

  if (!configuration) {
    return null;
  }

  const ActionIcon = configuration.icon;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "19px",
          fontWeight: 700,
        }}
      >
        <ActionIcon />

        {configuration.title}
      </DialogTitle>

      <DialogContent dividers>
        {error ? (
          <Alert
            severity="error"
            sx={{
              mb: "16px",
            }}
          >
            {error}
          </Alert>
        ) : null}

        <Typography
          sx={{
            color: "#374151",
            fontSize: "14px",
            lineHeight: 1.75,
          }}
        >
          {configuration.message}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            mt: "18px",
            p: "14px",
            borderColor: "#e2e8f0",
            borderRadius: "5px",
            bgcolor: "#f8fafc",
            boxShadow: "none",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <DetailField
              label="申報年度"
              value={
                record?.declaration_year
                  ? `${record.declaration_year} 年`
                  : "--"
              }
            />

            <DetailField
              label="申報類型"
              value={record?.declaration_type || "--"}
            />

            <DetailField
              label="所得稅申報單位"
              value={record?.declaration_unit_name || "--"}
            />

            <DetailField label="版本" value={record?.version_no || "--"} />

            <DetailField label="目前狀態" value={record?.status || "--"} />

            <DetailField
              label="申報筆數"
              value={`${record?.record_count || 0} 筆`}
            />
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          p: "14px 20px",
          gap: "8px",
        }}
      >
        <Button
          type="button"
          color="inherit"
          disabled={loading}
          onClick={onClose}
        >
          返回
        </Button>

        <Button
          type="button"
          variant="contained"
          color={configuration.color}
          startIcon={
            loading ? (
              <CircularProgress size={17} color="inherit" />
            ) : (
              <ActionIcon />
            )
          }
          disabled={loading}
          onClick={onConfirm}
        >
          {configuration.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeclarationActionButtons({ record, onAction, compact = false }) {
  const status = String(record?.status || "");

  const actions = [];

  if (status === "草稿") {
    actions.push({
      action: "confirm",

      label: "確認",

      icon: CheckCircleOutlineIcon,

      color: "success",
    });

    actions.push({
      action: "cancel",

      label: "取消",

      icon: CancelOutlinedIcon,

      color: "error",
    });
  }

  if (status === "已確認") {
    actions.push({
      action: "submit",

      label: "完成申報",

      icon: PublishOutlinedIcon,

      color: "primary",
    });

    actions.push({
      action: "cancel",

      label: "取消",

      icon: CancelOutlinedIcon,

      color: "error",
    });
  }

  if (actions.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: "4px",
          whiteSpace: "nowrap",
        }}
      >
        {actions.map(({ action, label, icon: ActionIcon, color }) => (
          <Tooltip key={action} title={label}>
            <IconButton
              size="small"
              color={color}
              onClick={() => onAction(action, record)}
            >
              <ActionIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns:
          actions.length > 1 ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
        gap: "8px",
        mt: "8px",
      }}
    >
      {actions.map(({ action, label, icon: ActionIcon, color }) => (
        <Button
          key={action}
          type="button"
          variant="outlined"
          color={color}
          startIcon={<ActionIcon />}
          onClick={() => onAction(action, record)}
          sx={{
            minWidth: 0,
            fontWeight: 700,
          }}
        >
          {label}
        </Button>
      ))}
    </Box>
  );
}

export default function PayrollIncomeTaxDeclarationsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const [rows, setRows] = useState([]);

  const [summary, setSummary] = useState({
    record_count_total: 0,

    taxable_amount_total: 0,

    withholding_tax_total: 0,
  });

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(0);

  const [taxDeclarationUnits, setTaxDeclarationUnits] = useState([]);

  const [loading, setLoading] = useState(false);

  const [loadingUnits, setLoadingUnits] = useState(false);

  const [error, setError] = useState("");

  const [detailRecord, setDetailRecord] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);

  const [detailError, setDetailError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [actionDialog, setActionDialog] = useState({
    open: false,

    action: "",

    record: null,
  });

  const [actionLoading, setActionLoading] = useState(false);

  const [actionError, setActionError] = useState("");

  const yearOptions = useMemo(() => {
    const years = [];

    for (let year = CURRENT_YEAR + 1; year >= CURRENT_YEAR - 6; year -= 1) {
      years.push(year);
    }

    return years;
  }, []);

  const loadTaxDeclarationUnits = useCallback(async () => {
    setLoadingUnits(true);

    try {
      const result = await getTaxDeclarationUnits({
        status: "啟用",
      });

      const normalizedRows = Array.isArray(result)
        ? result
        : Array.isArray(result?.rows)
          ? result.rows
          : [];

      setTaxDeclarationUnits(normalizedRows);
    } catch {
      setTaxDeclarationUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const loadDeclarations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getIncomeTaxDeclarations({
        ...appliedFilters,
        page,
        per_page: PER_PAGE,
      });

      setRows(Array.isArray(result?.rows) ? result.rows : []);

      setSummary({
        record_count_total: Number(result?.summary?.record_count_total || 0),

        taxable_amount_total: Number(
          result?.summary?.taxable_amount_total || 0,
        ),

        withholding_tax_total: Number(
          result?.summary?.withholding_tax_total || 0,
        ),
      });

      setTotal(Number(result?.total || 0));

      setTotalPages(Number(result?.total_pages || 0));
    } catch (requestError) {
      setRows([]);
      setTotal(0);
      setTotalPages(0);

      setSummary({
        record_count_total: 0,

        taxable_amount_total: 0,

        withholding_tax_total: 0,
      });

      setError(getErrorMessage(requestError, "無法載入所得稅申報資料。"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadTaxDeclarationUnits();
  }, [loadTaxDeclarationUnits]);

  useEffect(() => {
    loadDeclarations();
  }, [loadDeclarations]);

  function setFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSearch(event) {
    event.preventDefault();

    setPage(1);

    setAppliedFilters({
      ...filters,
      keyword: filters.keyword.trim(),
    });
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);

    setAppliedFilters(EMPTY_FILTERS);

    setPage(1);
  }

  async function handleOpenDetail(record) {
    const declarationId = Number(record?.income_tax_declaration_id);

    if (declarationId <= 0) {
      return;
    }

    setDetailOpen(true);
    setDetailRecord(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const result = await getIncomeTaxDeclaration(declarationId);

      setDetailRecord(result);
    } catch (requestError) {
      setDetailError(getErrorMessage(requestError, "無法載入所得稅申報明細。"));
    } finally {
      setDetailLoading(false);
    }
  }

  function handleCloseDetail() {
    if (detailLoading) {
      return;
    }

    setDetailOpen(false);
    setDetailRecord(null);
    setDetailError("");
  }

  function handleOpenCreate() {
    setSuccessMessage("");
    setCreateOpen(true);
  }

  function handleCloseCreate() {
    setCreateOpen(false);
  }

  async function handleCreated(result) {
    setCreateOpen(false);

    setSuccessMessage(`所得稅申報版本 ${result?.version_no || "--"} 已建立。`);

    setPage(1);

    await loadDeclarations();
  }

  function handleOpenAction(action, record) {
    if (!DECLARATION_ACTIONS[action]) {
      return;
    }

    setSuccessMessage("");
    setActionError("");

    setActionDialog({
      open: true,

      action,

      record,
    });
  }

  function handleCloseAction() {
    if (actionLoading) {
      return;
    }

    setActionDialog({
      open: false,

      action: "",

      record: null,
    });

    setActionError("");
  }

  async function handleConfirmAction() {
    const configuration = DECLARATION_ACTIONS[actionDialog.action];

    const declarationId = Number(
      actionDialog.record?.income_tax_declaration_id,
    );

    if (!configuration || declarationId <= 0) {
      setActionError("所得稅申報資料不正確。");

      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      await configuration.request(declarationId);

      setActionDialog({
        open: false,

        action: "",

        record: null,
      });

      setSuccessMessage(configuration.successMessage);

      await loadDeclarations();

      if (
        detailOpen &&
        Number(detailRecord?.income_tax_declaration_id) === declarationId
      ) {
        const refreshedDetail = await getIncomeTaxDeclaration(declarationId);

        setDetailRecord(refreshedDetail);
      }
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "無法更新所得稅申報狀態。"));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        minHeight: "360px",
        p: {
          xs: "14px",
          sm: "18px",
          md: "22px",
        },
        border: "1px solid #dfe4e8",
        borderRadius: "5px",
        bgcolor: "#ffffff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
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
        <Box
          sx={{
            minWidth: 0,
          }}
        >
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
            所得稅申報
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#7b8794",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            查詢並管理員工所得稅申報批次
          </Typography>
        </Box>

        <Button
          type="button"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            width: {
              xs: "100%",
              sm: "auto",
            },
            whiteSpace: "nowrap",
            fontWeight: 700,
          }}
        >
          建立所得稅申報
        </Button>
      </Box>
      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: "10px",
          mb: "16px",
          p: {
            xs: "13px",
            sm: "15px",
          },
          border: "1px solid #e2e8f0",
          borderRadius: "5px",
          bgcolor: "#f8fafc",
          minWidth: 0,
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <FormControl
          size="small"
          fullWidth
          sx={{
            minWidth: 0,
          }}
        >
          <InputLabel>申報年度</InputLabel>

          <Select
            label="申報年度"
            value={filters.declaration_year}
            onChange={(event) =>
              setFilter("declaration_year", event.target.value)
            }
          >
            <MenuItem value="">全部年度</MenuItem>

            {yearOptions.map((year) => (
              <MenuItem key={year} value={String(year)}>
                {year} 年
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          fullWidth
          disabled={loadingUnits}
          sx={{
            minWidth: 0,
          }}
        >
          <InputLabel>所得稅申報單位</InputLabel>

          <Select
            label="所得稅申報單位"
            value={filters.tax_declaration_unit_id}
            onChange={(event) =>
              setFilter("tax_declaration_unit_id", event.target.value)
            }
          >
            <MenuItem value="">全部申報單位</MenuItem>

            {taxDeclarationUnits.map((unit) => (
              <MenuItem
                key={unit.tax_declaration_unit_id}
                value={String(unit.tax_declaration_unit_id)}
              >
                {getTaxDeclarationUnitLabel(unit)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          fullWidth
          sx={{
            minWidth: 0,
          }}
        >
          <InputLabel>申報類型</InputLabel>

          <Select
            label="申報類型"
            value={filters.declaration_type}
            onChange={(event) =>
              setFilter("declaration_type", event.target.value)
            }
          >
            <MenuItem value="">全部類型</MenuItem>

            <MenuItem value="年度申報">年度申報</MenuItem>
          </Select>
        </FormControl>

        <FormControl
          size="small"
          fullWidth
          sx={{
            minWidth: 0,
          }}
        >
          <InputLabel>狀態</InputLabel>

          <Select
            label="狀態"
            value={filters.status}
            onChange={(event) => setFilter("status", event.target.value)}
          >
            <MenuItem value="">全部狀態</MenuItem>

            <MenuItem value="草稿">草稿</MenuItem>

            <MenuItem value="已確認">已確認</MenuItem>

            <MenuItem value="已申報">已申報</MenuItem>

            <MenuItem value="取消">取消</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="關鍵字搜尋"
          placeholder="申報單位、統一編號、檔名或備註"
          value={filters.keyword}
          onChange={(event) => setFilter("keyword", event.target.value)}
          sx={{
            minWidth: 0,
            gridColumn: {
              xs: "auto",
              sm: "1 / -1",
              md: "1 / span 3",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "8px",
            minWidth: 0,
            gridColumn: {
              xs: "auto",
              sm: "1 / -1",
              md: "4 / span 1",
            },
          }}
        >
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={loading}
            sx={{
              minWidth: 0,
              whiteSpace: "nowrap",
              fontWeight: 700,
            }}
          >
            查詢
          </Button>

          <Button
            type="button"
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={loading}
            onClick={handleReset}
            sx={{
              minWidth: 0,
              whiteSpace: "nowrap",
              fontWeight: 700,
            }}
          >
            重設
          </Button>
        </Box>
      </Box>
      <DeclarationCreateDialog
        open={createOpen}
        taxDeclarationUnits={taxDeclarationUnits}
        loadingUnits={loadingUnits}
        yearOptions={yearOptions}
        onClose={handleCloseCreate}
        onCreated={handleCreated}
      />
      {successMessage ? (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{
            mb: "16px",
          }}
        >
          {successMessage}
        </Alert>
      ) : null}

      {error ? (
        <Alert
          severity="error"
          sx={{
            mb: "16px",
          }}
        >
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(3, minmax(0, 1fr))",
          },
          gap: "12px",
          mb: "18px",
        }}
      >
        <SummaryCard
          label="申報資料筆數"
          value={summary.record_count_total}
          description="目前查詢條件下的申報明細總數"
        />

        <SummaryCard
          label="應稅所得總額"
          value={summary.taxable_amount_total}
          prefix="NT$ "
          description="目前查詢條件下的全部申報"
        />

        <SummaryCard
          label="扣繳稅額總額"
          value={summary.withholding_tax_total}
          prefix="NT$ "
          description="目前查詢條件下的全部申報"
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          justifyContent: "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: "10px",
          mb: "12px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <Typography
            sx={{
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            共 {total} 筆所得稅申報
          </Typography>

          {totalPages > 1 ? (
            <Chip
              label={`第 ${page}／${totalPages} 頁`}
              size="small"
              variant="outlined"
            />
          ) : null}
        </Box>

        <Button
          type="button"
          variant="outlined"
          startIcon={<RefreshIcon />}
          disabled={loading}
          onClick={loadDeclarations}
          sx={{
            whiteSpace: "nowrap",
          }}
        >
          重新
        </Button>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            minHeight: "280px",
          }}
        >
          <CircularProgress size={25} />

          <Typography
            sx={{
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            載入所得稅申報資料中...
          </Typography>
        </Box>
      ) : rows.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            mt: "18px",
          }}
        >
          目前查詢條件下沒有所得稅申報資料。
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
            {rows.map((record) => (
              <DeclarationMobileCard
                key={record.income_tax_declaration_id}
                record={record}
                onView={handleOpenDetail}
                onAction={handleOpenAction}
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
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              borderColor: "#dfe4e8",
              borderRadius: "5px",
              boxShadow: "none",
              overflowX: "auto",
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
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    申報年度
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    申報類型
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    所得稅申報單位
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    版本
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    申報筆數
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    應稅所得總額
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    扣繳稅額總額
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    狀態
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      width: "138px",
                      minWidth: "138px",
                      fontWeight: 700,
                    }}
                  >
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((record) => (
                  <TableRow key={record.income_tax_declaration_id} hover>
                    <TableCell>{record.declaration_year || "--"} 年</TableCell>

                    <TableCell>{record.declaration_type || "--"}</TableCell>

                    <TableCell>
                      {record.declaration_unit_name || "--"}
                    </TableCell>

                    <TableCell align="center">
                      {record.version_no || "--"}
                    </TableCell>

                    <TableCell align="right">
                      {formatAmount(record.record_count)}
                    </TableCell>

                    <TableCell align="right">
                      NT$ {formatAmount(record.taxable_amount_total)}
                    </TableCell>

                    <TableCell align="right">
                      NT$ {formatAmount(record.withholding_tax_total)}
                    </TableCell>

                    <TableCell align="center">
                      <StatusChip status={record.status} />
                    </TableCell>

                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Tooltip title="檢視明細">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetail(record)}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <DeclarationActionButtons
                          record={record}
                          onAction={handleOpenAction}
                          compact
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: "18px",
              }}
            >
              <Pagination
                page={page}
                count={totalPages}
                color="primary"
                onChange={(_event, nextPage) => setPage(nextPage)}
              />
            </Box>
          ) : null}
        </>
      )}

      <DeclarationDetailDialog
        open={detailOpen}
        record={detailRecord}
        loading={detailLoading}
        error={detailError}
        onClose={handleCloseDetail}
        onAction={handleOpenAction}
      />

      <DeclarationActionDialog
        open={actionDialog.open}
        action={actionDialog.action}
        record={actionDialog.record}
        loading={actionLoading}
        error={actionError}
        onClose={handleCloseAction}
        onConfirm={handleConfirmAction}
      />
    </Box>
  );
}
