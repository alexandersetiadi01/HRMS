import { useMemo, useState } from "react";

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
  IconButton,
  Paper,
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

import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { getSalaryBonusPaymentRegister } from "../../API/payroll";

import { exportSalaryBonusPaymentRegister } from "../../Utils/payrollReportDefinitions";

const CURRENT_DATE = new Date();

const CURRENT_MONTH =
  `${CURRENT_DATE.getFullYear()}-` +
  String(CURRENT_DATE.getMonth() + 1).padStart(2, "0");

const APOLLO_REPORTS = [
  {
    id: "salary-bonus-payment-register",

    label: "薪資／獎金發放清冊",

    description: "依薪資年月期間查詢已關帳的薪資與獎金發放資料。",

    implemented: true,
  },
  {
    id: "monthly-insurance-status",

    label: "每月各式保險投保狀況",

    description: "依年度與月份查詢員工各式保險投保狀況。",

    implemented: false,
  },
  {
    id: "monthly-withholding-tax",

    label: "每月薪資所得扣繳稅額",

    description: "依所得年度、月份與申報單位查詢每月扣繳稅額。",

    implemented: false,
  },
  {
    id: "tax-dependent-details",

    label: "所得稅扶養親屬明細",

    description: "查詢並下載員工所得稅扶養親屬資料。",

    implemented: false,
  },
];

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

function formatDate(value) {
  if (!value) {
    return "--";
  }

  return String(value).slice(0, 10).replaceAll("-", "/");
}

function formatPayrollMonth(year, month) {
  if (!year || !month) {
    return "--";
  }

  return `${year}/` + String(month).padStart(2, "0");
}

function buildBankAccount(row) {
  const parts = [row?.bank_code, row?.bank_branch_code, row?.bank_account_no]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return parts.join("-") || "--";
}

function SummaryCard({ label, value, description, amount = true }) {
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
            xs: "21px",
            sm: "24px",
          },
          fontWeight: 700,
          lineHeight: 1.25,
          overflowWrap: "anywhere",
        }}
      >
        {amount ? "NT$ " : ""}

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

function ReportCatalog({ selectedReportId, onSelect }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
        gap: "10px",
        width: "100%",
        minWidth: 0,
      }}
    >
      {APOLLO_REPORTS.map((report) => {
        const selected = report.id === selectedReportId;

        return (
          <Paper
            key={report.id}
            component="button"
            type="button"
            variant="outlined"
            disabled={!report.implemented}
            onClick={() => onSelect(report.id)}
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              minWidth: 0,
              height: "100%",
              p: "14px",
              borderColor: selected ? "#1f9bd1" : "#e2e8f0",
              borderRadius: "5px",
              bgcolor: selected ? "#f0f9ff" : "#ffffff",
              boxShadow: "none",
              color: "inherit",
              font: "inherit",
              textAlign: "left",
              cursor: report.implemented ? "pointer" : "default",
              opacity: report.implemented ? 1 : 0.68,
              "&:hover": report.implemented
                ? {
                    borderColor: "#1f9bd1",
                    bgcolor: "#f8fcff",
                  }
                : {},
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <Typography
                sx={{
                  color: selected ? "#168dc5" : "#1f2937",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {report.label}
              </Typography>

              {!report.implemented ? (
                <Chip label="尚未開放" size="small" variant="outlined" />
              ) : null}
            </Box>

            <Typography
              sx={{
                mt: "5px",
                color: "#64748b",
                fontSize: "12px",
                lineHeight: 1.6,
              }}
            >
              {report.description}
            </Typography>
          </Paper>
        );
      })}
    </Box>
  );
}

function SalaryBonusMobileCard({ row, onView }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: "13px",
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
              overflowWrap: "anywhere",
            }}
          >
            {row.run_name || "--"}
          </Typography>
        </Box>

        <Chip size="small" variant="outlined" label={row.run_type || "--"} />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          mt: "13px",
          p: "12px",
          borderRadius: "5px",
          bgcolor: "#ffffff",
        }}
      >
        <DetailField
          label="薪資年月"
          value={formatPayrollMonth(row.payroll_year, row.payroll_month)}
        />

        <DetailField label="發薪日" value={formatDate(row.pay_date)} />

        <DetailField
          label="實發金額"
          value={`NT$ ${formatAmount(row.net_pay)}`}
          fullWidth
        />
      </Box>

      <Button
        type="button"
        variant="outlined"
        fullWidth
        startIcon={<VisibilityOutlinedIcon />}
        onClick={() => onView(row)}
        sx={{
          mt: "13px",
          fontWeight: 700,
        }}
      >
        檢視明細
      </Button>
    </Paper>
  );
}

function SalaryBonusDetailDialog({ open, row, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        薪資／獎金發放明細
      </DialogTitle>

      <DialogContent dividers>
        {row ? (
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
                  {row.employee_no || "--"}
                  {"／"}
                  {row.employee_name || "--"}
                </Typography>

                <Typography
                  sx={{
                    mt: "3px",
                    color: "#64748b",
                    fontSize: "12px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.run_name || "--"}
                </Typography>
              </Box>

              <Chip label={row.run_type || "--"} variant="outlined" />
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
              發放資料
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: "16px",
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
                label="薪資年月"
                value={formatPayrollMonth(row.payroll_year, row.payroll_month)}
              />

              <DetailField label="批次名稱" value={row.run_name || "--"} />

              <DetailField label="發放類型" value={row.run_type || "--"} />

              <DetailField label="員工編號" value={row.employee_no || "--"} />

              <DetailField label="員工姓名" value={row.employee_name || "--"} />

              <DetailField label="發薪日" value={formatDate(row.pay_date)} />
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
              金額資料
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
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
                label="應發金額"
                value={`NT$ ${formatAmount(row.gross_pay)}`}
              />

              <DetailField
                label="應扣金額"
                value={`NT$ ${formatAmount(row.total_deduction)}`}
              />

              <DetailField
                label="實發金額"
                value={`NT$ ${formatAmount(row.net_pay)}`}
              />

              <DetailField
                label="銀行轉帳金額"
                value={`NT$ ${formatAmount(row.bank_transfer_amount)}`}
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
              銀行帳戶
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
                bgcolor: "#f8fafc",
              }}
            >
              <DetailField label="薪資銀行" value={row.bank_name || "--"} />

              <DetailField label="銀行代碼" value={row.bank_code || "--"} />

              <DetailField
                label="分行代碼"
                value={row.bank_branch_code || "--"}
              />

              <DetailField
                label="銀行帳號"
                value={row.bank_account_no || "--"}
              />
            </Box>
          </>
        ) : (
          <Alert severity="info">找不到薪資／獎金發放明細。</Alert>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: "14px 20px",
        }}
      >
        <Button type="button" color="inherit" onClick={onClose}>
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PayrollReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState(
    "salary-bonus-payment-register",
  );

  const [startMonth, setStartMonth] = useState(CURRENT_MONTH);

  const [endMonth, setEndMonth] = useState(CURRENT_MONTH);

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [detailRow, setDetailRow] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const selectedReport = useMemo(
    () =>
      APOLLO_REPORTS.find((item) => item.id === selectedReportId) ||
      APOLLO_REPORTS[0],
    [selectedReportId],
  );

  const rows = Array.isArray(report?.rows) ? report.rows : [];

  const summary = report?.summary || {};

  function validateMonthRange() {
    if (!startMonth || !endMonth) {
      return "請選擇起始與結束薪資年月。";
    }

    if (startMonth > endMonth) {
      return "起始薪資年月不可晚於結束薪資年月。";
    }

    return "";
  }

  async function handleSearch(event) {
    event.preventDefault();

    const validationError = validateMonthRange();

    if (validationError) {
      setError(validationError);

      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await getSalaryBonusPaymentRegister({
        start_month: startMonth,

        end_month: endMonth,
      });

      setReport(result);
    } catch (requestError) {
      setReport(null);

      setError(getErrorMessage(requestError, "無法載入薪資／獎金發放清冊。"));
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (rows.length === 0) {
      setError("目前沒有可下載的薪資／獎金發放資料。");

      return;
    }

    setExporting(true);
    setError("");
    setSuccessMessage("");

    try {
      exportSalaryBonusPaymentRegister({
        startMonth,
        endMonth,
        report,
      });

      setSuccessMessage("薪資／獎金發放清冊已開始下載。");
    } catch (exportError) {
      setError(
        getErrorMessage(exportError, "無法產生薪資／獎金發放清冊 Excel。"),
      );
    } finally {
      setExporting(false);
    }
  }

  function handleSelectReport(reportId) {
    if (reportId === selectedReportId) {
      return;
    }

    setSelectedReportId(reportId);

    setReport(null);
    setError("");
    setSuccessMessage("");
  }
  function handleOpenDetail(row) {
    setDetailRow(row);

    setDetailOpen(true);
  }

  function handleCloseDetail() {
    setDetailOpen(false);

    setDetailRow(null);
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
          gap: "11px",
          mb: "18px",
        }}
      >
        <AssessmentOutlinedIcon
          sx={{
            color: "#1f9bd1",
            fontSize: {xs: "25px", md: "50px"}
          }}
        />

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
            報表中心
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#7b8794",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            依各報表的查詢條件產生並下載薪資報表
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: "100%",
            mb: "16px",
          }}
        >
          <Typography
            sx={{
              mb: "9px",
              color: "#475569",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            報表項目
          </Typography>

          <ReportCatalog
            selectedReportId={selectedReportId}
            onSelect={handleSelectReport}
          />
        </Box>

        <Box
          sx={{
            width: "100%",
            minWidth: 0,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: {
                xs: "14px",
                sm: "16px",
              },
              borderColor: "#e2e8f0",
              borderRadius: "5px",
              bgcolor: "#ffffff",
              boxShadow: "none",
            }}
          >
            <Typography
              sx={{
                color: "#111827",
                fontSize: "17px",
                fontWeight: 700,
              }}
            >
              {selectedReport.label}
            </Typography>

            <Typography
              sx={{
                mt: "4px",
                color: "#64748b",
                fontSize: "12px",
                lineHeight: 1.6,
              }}
            >
              {selectedReport.description}
            </Typography>

            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr)) auto",
                },
                gap: "10px",
                mt: "17px",
                alignItems: "center",
              }}
            >
              <TextField
                type="month"
                size="small"
                label="起始薪資年月"
                value={startMonth}
                disabled={loading}
                onChange={(event) => setStartMonth(event.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                type="month"
                size="small"
                label="結束薪資年月"
                value={endMonth}
                disabled={loading}
                onChange={(event) => setEndMonth(event.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <Button
                type="submit"
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress size={17} color="inherit" />
                  ) : (
                    <SearchIcon />
                  )
                }
                disabled={loading}
                sx={{
                  minHeight: "40px",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                }}
              >
                查詢
              </Button>
            </Box>
          </Paper>

          {error ? (
            <Alert
              severity="error"
              sx={{
                mt: "14px",
              }}
            >
              {error}
            </Alert>
          ) : null}

          {successMessage ? (
            <Alert
              severity="success"
              onClose={() => setSuccessMessage("")}
              sx={{
                mt: "14px",
              }}
            >
              {successMessage}
            </Alert>
          ) : null}

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
                載入薪資／獎金發放清冊中...
              </Typography>
            </Box>
          ) : report ? (
            <>
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
                  gap: "10px",
                  mt: "16px",
                  mb: "12px",
                }}
              >
                <Typography
                  sx={{
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  查詢期間：
                  {report.start_month || startMonth}
                  {" ～ "}
                  {report.end_month || endMonth}
                </Typography>

                <Button
                  type="button"
                  variant="contained"
                  color="success"
                  startIcon={
                    exporting ? (
                      <CircularProgress size={17} color="inherit" />
                    ) : (
                      <DownloadOutlinedIcon />
                    )
                  }
                  disabled={exporting || rows.length === 0}
                  onClick={handleExport}
                  sx={{
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                  }}
                >
                  下載 Excel
                </Button>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: "10px",
                  mb: "16px",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "minmax(0, 1fr)",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: "10px",
                  }}
                >
                  <SummaryCard
                    label="資料筆數"
                    value={summary.record_count}
                    description="符合條件的已關帳薪資結果"
                    amount={false}
                  />

                  <SummaryCard
                    label="應發金額合計"
                    value={summary.gross_pay_total}
                    description="薪資與獎金應發金額"
                  />

                  <SummaryCard
                    label="應扣金額合計"
                    value={summary.total_deduction_total}
                    description="薪資與獎金應扣金額"
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "minmax(0, 1fr)",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: "10px",
                  }}
                >
                  <SummaryCard
                    label="實發金額合計"
                    value={summary.net_pay_total}
                    description="薪資與獎金實發金額"
                  />

                  <SummaryCard
                    label="銀行轉帳合計"
                    value={summary.bank_transfer_total}
                    description="預計銀行轉帳金額"
                  />
                </Box>
              </Box>

              {rows.length === 0 ? (
                <Alert severity="info">
                  此薪資年月期間沒有已關帳且具備發放資料的薪資或獎金結果。
                </Alert>
              ) : (
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
                    {rows.map((row, index) => (
                      <SalaryBonusMobileCard
                        key={`${row.employee_no}-${row.payroll_year}-${row.payroll_month}-${row.run_name}-${index}`}
                        row={row}
                        onView={handleOpenDetail}
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
                          {[
                            "薪資年月",
                            "批次名稱",
                            "發放類型",
                            "員工",
                            "實發金額",
                            "發薪日",
                            "操作",
                          ].map((label) => (
                            <TableCell
                              key={label}
                              align={
                                label === "實發金額"
                                  ? "right"
                                  : label === "操作"
                                    ? "center"
                                    : "left"
                              }
                              sx={{
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {rows.map((row, index) => (
                          <TableRow
                            key={`${row.employee_no}-${row.payroll_year}-${row.payroll_month}-${row.run_name}-${index}`}
                            hover
                          >
                            <TableCell
                              sx={{
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatPayrollMonth(
                                row.payroll_year,
                                row.payroll_month,
                              )}
                            </TableCell>

                            <TableCell>{row.run_name || "--"}</TableCell>

                            <TableCell>{row.run_type || "--"}</TableCell>

                            <TableCell
                              sx={{
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.employee_no || "--"}
                              {"／"}
                              {row.employee_name || "--"}
                            </TableCell>

                            <TableCell align="right">
                              NT$ {formatAmount(row.net_pay)}
                            </TableCell>

                            <TableCell
                              sx={{
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatDate(row.pay_date)}
                            </TableCell>

                            <TableCell
                              align="center"
                              sx={{
                                width: "76px",
                                minWidth: "76px",
                              }}
                            >
                              <Tooltip title="檢視明細">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDetail(row)}
                                >
                                  <VisibilityOutlinedIcon fontSize="small" />
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
            </>
          ) : (
            <Alert
              severity="info"
              sx={{
                mt: "16px",
              }}
            >
              請選擇薪資年月期間後按下查詢。
            </Alert>
          )}
        </Box>
      </Box>
      <SalaryBonusDetailDialog
        open={detailOpen}
        row={detailRow}
        onClose={handleCloseDetail}
      />
    </Box>
  );
}
