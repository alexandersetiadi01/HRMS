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

import { getMonthlyInsuranceStatusReport } from "../../../API/payroll";

import { exportMonthlyInsuranceStatusReport } from "../../../Utils/payrollReportDefinitions";

import ReportDetailField from "./Components/ReportDetailField";
import ReportLoadingState from "./Components/ReportLoadingState";
import ReportSummaryCard from "./Components/ReportSummaryCard";

import {
  CURRENT_MONTH_NUMBER,
  CURRENT_YEAR,
  MONTH_OPTIONS,
} from "../../../Utils/reportConstants";

import {
  formatReportAmount,
  formatReportDate,
  formatReportPercentage,
  getInsuranceStatusColor,
  getReportErrorMessage,
  validateInsuranceReportMonth,
} from "../../../Utils/ReportFormatters";

function InsuranceStatusChip({ record }) {
  if (!record) {
    return <Chip label="無資料" size="small" variant="outlined" />;
  }

  return (
    <Chip
      label={record.status || "無資料"}
      size="small"
      color={getInsuranceStatusColor(record.status)}
      variant="outlined"
      sx={{
        fontWeight: 700,
      }}
    />
  );
}

function InsuranceStatusMobileCard({ row, onView }) {
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
        <Box>
          <Typography
            sx={{
              mb: "5px",
              color: "#7b8794",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            勞保
          </Typography>

          <InsuranceStatusChip record={row.labor} />
        </Box>

        <Box>
          <Typography
            sx={{
              mb: "5px",
              color: "#7b8794",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            職保
          </Typography>

          <InsuranceStatusChip record={row.occupational} />
        </Box>

        <Box>
          <Typography
            sx={{
              mb: "5px",
              color: "#7b8794",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            健保
          </Typography>

          <InsuranceStatusChip record={row.health} />
        </Box>

        <Box>
          <Typography
            sx={{
              mb: "5px",
              color: "#7b8794",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            勞退
          </Typography>

          <InsuranceStatusChip record={row.pension} />
        </Box>
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

function InsuranceDetailSection({
  title,
  record,
  pension = false,
}) {
  return (
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
        {title}
      </Typography>

      {record ? (
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
            label="目前狀態"
            value={record.status || "--"}
          />

          <ReportDetailField
            label="異動類型"
            value={record.action_type || "--"}
          />

          <ReportDetailField
            label="生效日期"
            value={formatReportDate(record.effective_date)}
          />

          <ReportDetailField
            label="投保／提繳單位"
            value={record.insurance_unit_name || "--"}
          />

          {pension ? (
            <ReportDetailField
              label="勞退類型"
              value={record.pension_type || "--"}
            />
          ) : (
            <ReportDetailField
              label="投保身分"
              value={record.insurance_identity_name || "--"}
            />
          )}

          <ReportDetailField
            label={pension ? "提繳工資" : "投保薪資"}
            value={`NT$ ${formatReportAmount(record.insured_salary)}`}
          />

          {pension ? (
            <>
              <ReportDetailField
                label="雇主提繳率"
                value={formatReportPercentage(
                  record.employer_contribution_rate,
                )}
              />

              <ReportDetailField
                label="員工自提率"
                value={formatReportPercentage(
                  record.employee_contribution_rate,
                )}
              />
            </>
          ) : null}
        </Box>
      ) : (
        <Alert severity="info">
          此員工在查詢月份尚無{title}資料。
        </Alert>
      )}
    </>
  );
}

function InsuranceStatusDetailDialog({
  open,
  row,
  reportMonth,
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
        每月各式保險投保狀況明細
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
              <Box>
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
                  }}
                >
                  報表月份：{reportMonth || "--"}
                </Typography>
              </Box>
            </Box>

            <InsuranceDetailSection title="勞保" record={row.labor} />

            <InsuranceDetailSection
              title="職保"
              record={row.occupational}
            />

            <InsuranceDetailSection title="健保" record={row.health} />

            <InsuranceDetailSection
              title="勞退"
              record={row.pension}
              pension
            />
          </>
        ) : (
          <Alert severity="info">找不到員工保險投保狀況。</Alert>
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

export default function MonthlyInsuranceStatusReport() {
  const [insuranceYear, setInsuranceYear] = useState(CURRENT_YEAR);

  const [insuranceMonth, setInsuranceMonth] = useState(
    CURRENT_MONTH_NUMBER,
  );

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

    const validationError = validateInsuranceReportMonth({
      year: insuranceYear,
      month: insuranceMonth,
    });

    if (validationError) {
      setError(validationError);

      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await getMonthlyInsuranceStatusReport({
        year: Number(insuranceYear),
        month: Number(insuranceMonth),
      });

      setReport(result);
    } catch (requestError) {
      setReport(null);

      setError(
        getReportErrorMessage(
          requestError,
          "無法載入每月各式保險投保狀況。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (rows.length === 0) {
      setError("目前沒有可下載的保險投保資料。");

      return;
    }

    setExporting(true);
    setError("");
    setSuccessMessage("");

    try {
      exportMonthlyInsuranceStatusReport({
        report,
      });

      setSuccessMessage("每月各式保險投保狀況已開始下載。");
    } catch (exportError) {
      setError(
        getReportErrorMessage(
          exportError,
          "無法產生每月各式保險投保狀況 Excel。",
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
          每月各式保險投保狀況
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            color: "#64748b",
            fontSize: "12px",
            lineHeight: 1.6,
          }}
        >
          依年度與月份查詢員工各式保險投保狀況。
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
            type="number"
            size="small"
            label="年度"
            value={insuranceYear}
            disabled={loading}
            inputProps={{
              min: 1900,
              max: 9999,
            }}
            onChange={(event) => setInsuranceYear(event.target.value)}
          />

          <TextField
            select
            size="small"
            label="月份"
            value={insuranceMonth}
            disabled={loading}
            onChange={(event) => setInsuranceMonth(event.target.value)}
            SelectProps={{
              native: true,
            }}
          >
            {MONTH_OPTIONS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
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
        <ReportLoadingState message="載入每月各式保險投保狀況中..." />
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
              報表月份：{report.report_month || "--"}
              {"／"}
              統計日期：{formatReportDate(report.report_date)}
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
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: "10px",
              mb: "16px",
            }}
          >
            <ReportSummaryCard
              label="員工人數"
              value={summary.employee_count}
              description="具備至少一項保險歷程的員工"
              amount={false}
            />

            <ReportSummaryCard
              label="勞保投保中"
              value={summary.labor_insured_count}
              description="報表月份仍在勞保投保中"
              amount={false}
            />

            <ReportSummaryCard
              label="職保投保中"
              value={summary.occupational_insured_count}
              description="報表月份仍在職保投保中"
              amount={false}
            />

            <ReportSummaryCard
              label="健保投保中"
              value={summary.health_insured_count}
              description="報表月份仍在健保投保中"
              amount={false}
            />

            <ReportSummaryCard
              label="勞退提繳中"
              value={summary.pension_contributing_count}
              description="報表月份仍在勞退提繳中"
              amount={false}
            />
          </Box>

          {rows.length === 0 ? (
            <Alert severity="info">
              此月份沒有可顯示的員工保險投保資料。
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
                  <InsuranceStatusMobileCard
                    key={row.employee_id}
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
                      {["員工", "勞保", "職保", "健保", "勞退", "操作"].map(
                        (label) => (
                          <TableCell
                            key={label}
                            align={label === "操作" ? "center" : "left"}
                            sx={{
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {label}
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.employee_id} hover>
                        <TableCell
                          sx={{
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.employee_no || "--"}
                          {"／"}
                          {row.employee_name || "--"}
                        </TableCell>

                        <TableCell>
                          <InsuranceStatusChip record={row.labor} />
                        </TableCell>

                        <TableCell>
                          <InsuranceStatusChip record={row.occupational} />
                        </TableCell>

                        <TableCell>
                          <InsuranceStatusChip record={row.health} />
                        </TableCell>

                        <TableCell>
                          <InsuranceStatusChip record={row.pension} />
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
          請選擇年度與月份後按下查詢。
        </Alert>
      )}

      <InsuranceStatusDetailDialog
        open={detailOpen}
        row={detailRow}
        reportMonth={report?.report_month}
        onClose={handleCloseDetail}
      />
    </>
  );
}