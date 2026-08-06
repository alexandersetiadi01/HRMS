import { useState } from "react";

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

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { getSalaryBonusPaymentRegister } from "../../../API/payroll";

import { exportSalaryBonusPaymentRegister } from "../../../Utils/payrollReportDefinitions";

import ReportDetailField from "./Components/ReportDetailField";
import ReportLoadingState from "./Components/ReportLoadingState";
import ReportSummaryCard from "./Components/ReportSummaryCard";

import { CURRENT_MONTH } from "../../../Utils/reportConstants";

import {
  buildSalaryBankAccount,
  formatPayrollMonth,
  formatReportAmount,
  formatReportDate,
  getReportErrorMessage,
  validateSalaryMonthRange,
} from "../../../Utils/ReportFormatters";

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
        <ReportDetailField
          label="薪資年月"
          value={formatPayrollMonth(row.payroll_year, row.payroll_month)}
        />

        <ReportDetailField
          label="發薪日"
          value={formatReportDate(row.pay_date)}
        />

        <ReportDetailField
          label="實發金額"
          value={`NT$ ${formatReportAmount(row.net_pay)}`}
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
              <ReportDetailField
                label="薪資年月"
                value={formatPayrollMonth(row.payroll_year, row.payroll_month)}
              />

              <ReportDetailField
                label="批次名稱"
                value={row.run_name || "--"}
              />

              <ReportDetailField
                label="發放類型"
                value={row.run_type || "--"}
              />

              <ReportDetailField
                label="員工編號"
                value={row.employee_no || "--"}
              />

              <ReportDetailField
                label="員工姓名"
                value={row.employee_name || "--"}
              />

              <ReportDetailField
                label="發薪日"
                value={formatReportDate(row.pay_date)}
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
              <ReportDetailField
                label="應發金額"
                value={`NT$ ${formatReportAmount(row.gross_pay)}`}
              />

              <ReportDetailField
                label="應扣金額"
                value={`NT$ ${formatReportAmount(row.total_deduction)}`}
              />

              <ReportDetailField
                label="實發金額"
                value={`NT$ ${formatReportAmount(row.net_pay)}`}
              />

              <ReportDetailField
                label="銀行轉帳金額"
                value={`NT$ ${formatReportAmount(row.bank_transfer_amount)}`}
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
              <ReportDetailField
                label="薪資銀行"
                value={row.bank_name || "--"}
              />

              <ReportDetailField
                label="銀行代碼"
                value={row.bank_code || "--"}
              />

              <ReportDetailField
                label="分行代碼"
                value={row.bank_branch_code || "--"}
              />

              <ReportDetailField
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

export default function SalaryBonusPaymentRegisterReport() {
  const [startMonth, setStartMonth] = useState(CURRENT_MONTH);

  const [endMonth, setEndMonth] = useState(CURRENT_MONTH);

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [detailRow, setDetailRow] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const rows = Array.isArray(report?.rows) ? report.rows : [];

  const summary = report?.summary || {};

  async function handleSearch(event) {
    event.preventDefault();

    const validationError = validateSalaryMonthRange({
      startMonth,
      endMonth,
    });

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

      setError(
        getReportErrorMessage(
          requestError,
          "無法載入薪資／獎金發放清冊。",
        ),
      );
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
        getReportErrorMessage(
          exportError,
          "無法產生薪資／獎金發放清冊 Excel。",
        ),
      );
    } finally {
      setExporting(false);
    }
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
    <>
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
          薪資／獎金發放清冊
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            color: "#64748b",
            fontSize: "12px",
            lineHeight: 1.6,
          }}
        >
          依薪資年月期間查詢已關帳的薪資與獎金發放資料。
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
        <ReportLoadingState message="載入薪資／獎金發放清冊中..." />
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
              <ReportSummaryCard
                label="資料筆數"
                value={summary.record_count}
                description="符合條件的已關帳薪資結果"
                amount={false}
              />

              <ReportSummaryCard
                label="應發金額合計"
                value={summary.gross_pay_total}
                description="薪資與獎金應發金額"
              />

              <ReportSummaryCard
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
              <ReportSummaryCard
                label="實發金額合計"
                value={summary.net_pay_total}
                description="薪資與獎金實發金額"
              />

              <ReportSummaryCard
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
                          NT$ {formatReportAmount(row.net_pay)}
                        </TableCell>

                        <TableCell
                          sx={{
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatReportDate(row.pay_date)}
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

      <SalaryBonusDetailDialog
        open={detailOpen}
        row={detailRow}
        onClose={handleCloseDetail}
      />
    </>
  );
}