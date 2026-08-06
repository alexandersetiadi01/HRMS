import { useCallback, useEffect, useState } from "react";

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
  MenuItem,
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

import {
  getMonthlyWithholdingTaxReport,
  getTaxDeclarationUnits,
} from "../../../API/payroll";
import { exportMonthlyWithholdingTaxReport } from "../../../Utils/payrollReportDefinitions";

import ReportDetailField from "./Components/ReportDetailField";
import ReportLoadingState from "./Components/ReportLoadingState";
import ReportSummaryCard from "./Components/ReportSummaryCard";

import {
  CURRENT_MONTH_NUMBER,
  CURRENT_YEAR,
  MONTH_OPTIONS,
} from "../../../Utils/reportConstants";

import {
  formatPayrollMonth,
  formatReportAmount,
  formatReportDate,
  getReportErrorMessage,
  validateInsuranceReportMonth,
} from "../../../Utils/ReportFormatters";

function normalizeDeclarationUnits(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.rows)) {
    return result.rows;
  }

  return [];
}

function MonthlyWithholdingTaxMobileCard({ row, onView }) {
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

        <Chip
          size="small"
          variant="outlined"
          label={row.income_format || "--"}
        />
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
          label="所得年月"
          value={formatPayrollMonth(row.income_year, row.income_month)}
        />

        <ReportDetailField
          label="給付日期"
          value={formatReportDate(row.pay_date)}
        />

        <ReportDetailField
          label="所得金額"
          value={`NT$ ${formatReportAmount(row.taxable_amount)}`}
        />

        <ReportDetailField
          label="扣繳稅額"
          value={`NT$ ${formatReportAmount(row.withholding_tax)}`}
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

function MonthlyWithholdingTaxDetailDialog({
  open,
  row,
  declarationUnit,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        每月薪資所得扣繳明細
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

              <Chip label={row.status || "--"} variant="outlined" />
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
              所得資料
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
                label="所得年月"
                value={formatPayrollMonth(row.income_year, row.income_month)}
              />

              <ReportDetailField
                label="所得格式"
                value={row.income_format || "--"}
              />

              <ReportDetailField
                label="給付日期"
                value={formatReportDate(row.pay_date)}
              />

              <ReportDetailField
                label="薪資批次"
                value={row.run_name || "--"}
              />

              <ReportDetailField
                label="發放類型"
                value={row.run_type || "--"}
              />

              <ReportDetailField
                label="扣繳結果狀態"
                value={row.status || "--"}
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
              稅務身分
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
                bgcolor: "#ffffff",
              }}
            >
              <ReportDetailField
                label="納稅義務人類型"
                value={row.taxpayer_type || "--"}
              />

              <ReportDetailField
                label="居住狀態"
                value={row.residency_status || "--"}
              />

              <ReportDetailField
                label="扣繳方式"
                value={row.withholding_method || "--"}
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
              扣繳金額
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
                label="所得金額"
                value={`NT$ ${formatReportAmount(row.taxable_amount)}`}
              />

              <ReportDetailField
                label="扣繳稅額"
                value={`NT$ ${formatReportAmount(row.withholding_tax)}`}
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
              申報單位
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
                bgcolor: "#ffffff",
              }}
            >
              <ReportDetailField
                label="申報單位"
                value={declarationUnit?.declaration_unit_name || "--"}
              />

              <ReportDetailField
                label="統一編號"
                value={declarationUnit?.business_registration_no || "--"}
              />

              <ReportDetailField
                label="扣繳單位編號"
                value={declarationUnit?.withholding_tax_unit_no || "--"}
              />
            </Box>
          </>
        ) : (
          <Alert severity="info">找不到每月薪資所得扣繳明細。</Alert>
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

export default function MonthlyWithholdingTaxReport() {
  const [incomeYear, setIncomeYear] = useState(CURRENT_YEAR);

  const [incomeMonth, setIncomeMonth] = useState(CURRENT_MONTH_NUMBER);

  const [taxDeclarationUnitId, setTaxDeclarationUnitId] = useState("");

  const [taxDeclarationUnits, setTaxDeclarationUnits] = useState([]);

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(false);

  const [loadingUnits, setLoadingUnits] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [detailRow, setDetailRow] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const rows = Array.isArray(report?.rows) ? report.rows : [];

  const summary = report?.summary || {};

  const loadTaxDeclarationUnits = useCallback(async () => {
    setLoadingUnits(true);

    try {
      const result = await getTaxDeclarationUnits({
        status: "啟用",
      });

      const normalizedRows = normalizeDeclarationUnits(result);

      setTaxDeclarationUnits(normalizedRows);

      setTaxDeclarationUnitId((currentValue) => {
        if (currentValue) {
          return currentValue;
        }

        const firstUnitId = normalizedRows[0]?.tax_declaration_unit_id;

        return firstUnitId ? String(firstUnitId) : "";
      });
    } catch (requestError) {
      setTaxDeclarationUnits([]);

      setTaxDeclarationUnitId("");

      setError(getReportErrorMessage(requestError, "無法載入所得稅申報單位。"));
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  useEffect(() => {
    loadTaxDeclarationUnits();
  }, [loadTaxDeclarationUnits]);

  function validateFilters() {
    const monthError = validateInsuranceReportMonth({
      year: incomeYear,

      month: incomeMonth,
    });

    if (monthError) {
      return monthError;
    }

    if (
      !Number.isInteger(Number(taxDeclarationUnitId)) ||
      Number(taxDeclarationUnitId) <= 0
    ) {
      return "請選擇所得稅申報單位。";
    }

    return "";
  }

  async function handleSearch(event) {
    event.preventDefault();

    const validationError = validateFilters();

    if (validationError) {
      setError(validationError);

      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    setReport(null);

    try {
      const result = await getMonthlyWithholdingTaxReport({
        year: Number(incomeYear),

        month: Number(incomeMonth),

        tax_declaration_unit_id: Number(taxDeclarationUnitId),
      });

      setReport(result);
    } catch (requestError) {
      setReport(null);

      setError(
        getReportErrorMessage(requestError, "無法載入每月薪資所得扣繳稅額。"),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (rows.length === 0) {
      setError("目前沒有可下載的薪資所得扣繳資料。");

      return;
    }

    setExporting(true);
    setError("");
    setSuccessMessage("");

    try {
      exportMonthlyWithholdingTaxReport({
        report,
      });

      setSuccessMessage("每月薪資所得扣繳稅額已開始下載。");
    } catch (exportError) {
      setError(
        getReportErrorMessage(
          exportError,
          "無法產生每月薪資所得扣繳稅額 Excel。",
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
          每月薪資所得扣繳稅額
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            color: "#64748b",
            fontSize: "12px",
            lineHeight: 1.6,
          }}
        >
          依所得年度、月份與申報單位查詢每月扣繳稅額。
        </Typography>

        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "minmax(0, 1fr) minmax(0, 1fr) minmax(220px, 1.5fr) auto",
            },
            gap: "10px",
            mt: "17px",
            alignItems: "center",
          }}
        >
          <TextField
            type="number"
            size="small"
            label="所得年度"
            value={incomeYear}
            disabled={loading}
            inputProps={{
              min: 1900,
              max: 9999,
              step: 1,
            }}
            onChange={(event) => setIncomeYear(event.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            select
            size="small"
            label="月份"
            value={incomeMonth}
            disabled={loading}
            onChange={(event) => setIncomeMonth(event.target.value)}
          >
            {MONTH_OPTIONS.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="申報單位"
            value={taxDeclarationUnitId}
            disabled={loading || loadingUnits}
            onChange={(event) => setTaxDeclarationUnitId(event.target.value)}
          >
            {taxDeclarationUnits.length === 0 ? (
              <MenuItem value="" disabled>
                {loadingUnits ? "載入申報單位中..." : "目前沒有啟用的申報單位"}
              </MenuItem>
            ) : (
              taxDeclarationUnits.map((unit) => (
                <MenuItem
                  key={unit.tax_declaration_unit_id}
                  value={String(unit.tax_declaration_unit_id)}
                >
                  {unit.declaration_unit_name || "--"}
                </MenuItem>
              ))
            )}
          </TextField>

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
            disabled={
              loading || loadingUnits || taxDeclarationUnits.length === 0
            }
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
        <ReportLoadingState message="載入每月薪資所得扣繳稅額中..." />
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
              所得年月：{report.report_month || "--"}
              {"／"}
              申報單位：
              {report.tax_declaration_unit?.declaration_unit_name || "--"}
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
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: "10px",
              mb: "16px",
            }}
          >
            <ReportSummaryCard
              label="資料筆數"
              value={summary.record_count}
              description="符合條件的薪資所得扣繳結果"
              amount={false}
            />

            <ReportSummaryCard
              label="員工人數"
              value={summary.employee_count}
              description="具有扣繳結果的不重複員工"
              amount={false}
            />

            <ReportSummaryCard
              label="所得金額合計"
              value={summary.taxable_amount_total}
              description="本月薪資所得金額合計"
            />

            <ReportSummaryCard
              label="扣繳稅額合計"
              value={summary.withholding_tax_total}
              description="本月薪資所得扣繳稅額合計"
            />
          </Box>

          {rows.length === 0 ? (
            <Alert severity="info">
              此所得年月與申報單位沒有可顯示的薪資所得扣繳資料。
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
                {rows.map((row) => (
                  <MonthlyWithholdingTaxMobileCard
                    key={row.withholding_result_id}
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
                        "所得年月",
                        "員工",
                        "所得格式",
                        "所得金額",
                        "扣繳稅額",
                        "給付日期",
                        "操作",
                      ].map((label) => (
                        <TableCell
                          key={label}
                          align={
                            label === "所得金額" || label === "扣繳稅額"
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
                    {rows.map((row) => (
                      <TableRow key={row.withholding_result_id} hover>
                        <TableCell
                          sx={{
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatPayrollMonth(
                            row.income_year,
                            row.income_month,
                          )}
                        </TableCell>

                        <TableCell
                          sx={{
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.employee_no || "--"}
                          {"／"}
                          {row.employee_name || "--"}
                        </TableCell>

                        <TableCell>{row.income_format || "--"}</TableCell>

                        <TableCell align="right">
                          NT$ {formatReportAmount(row.taxable_amount)}
                        </TableCell>

                        <TableCell align="right">
                          NT$ {formatReportAmount(row.withholding_tax)}
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
          請選擇所得年度、月份與申報單位後按下查詢。
        </Alert>
      )}

      <MonthlyWithholdingTaxDetailDialog
        open={detailOpen}
        row={detailRow}
        declarationUnit={report?.tax_declaration_unit}
        onClose={handleCloseDetail}
      />
    </>
  );
}
