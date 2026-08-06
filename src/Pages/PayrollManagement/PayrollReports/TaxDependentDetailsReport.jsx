import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Autocomplete,
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
  getPayrollEmployees,
  getTaxDependentDetailsReport,
} from "../../../API/payroll";
import { exportTaxDependentDetailsReport } from "../../../Utils/payrollReportDefinitions";

import ReportDetailField from "./Components/ReportDetailField";
import ReportLoadingState from "./Components/ReportLoadingState";
import ReportSummaryCard from "./Components/ReportSummaryCard";

import {
  formatReportDate,
  getReportErrorMessage,
} from "../../../Utils/ReportFormatters";

const STATUS_OPTIONS = [
  {
    value: "",
    label: "全部狀態",
  },
  {
    value: "啟用",
    label: "啟用",
  },
  {
    value: "停用",
    label: "停用",
  },
];

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEmployeeName(employee) {
  return (
    employee?.display_name ||
    employee?.employee_name ||
    employee?.english_name ||
    employee?.email ||
    `員工 #${employee?.employee_id || "--"}`
  );
}

function getEmployeeLabel(employee) {
  const employeeNo = String(employee?.employee_no || "").trim();
  const employeeName = getEmployeeName(employee);

  return employeeNo ? `${employeeNo}｜${employeeName}` : employeeName;
}

function normalizeEmployees(result) {
  const rows = Array.isArray(result)
    ? result
    : Array.isArray(result?.rows)
      ? result.rows
      : [];

  return [...rows].sort((left, right) =>
    getEmployeeLabel(left).localeCompare(getEmployeeLabel(right), "zh-Hant"),
  );
}

function validateEffectiveDate(value) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "請選擇生效基準日。";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return "生效基準日格式不正確。";
  }

  const parsedDate = new Date(`${normalizedValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "生效基準日格式不正確。";
  }

  return "";
}

function formatCertificateType(value) {
  const normalizedValue = String(value ?? "").trim();

  const labels = {
    0: "0｜本國個人",
    3: "3｜境內住滿 183 天之外僑或大陸居民",
    5: "5｜境內未住滿 183 天之大陸地區人民",
    7: "7｜境內未住滿 183 天之外僑",
  };

  return labels[normalizedValue] || normalizedValue || "--";
}

function formatEffectivePeriod(row) {
  const effectiveFrom = formatReportDate(row?.effective_from);
  const effectiveTo = row?.effective_to
    ? formatReportDate(row.effective_to)
    : "--";

  return `${effectiveFrom} ～ ${effectiveTo}`;
}

function getEffectiveStatusColor(status) {
  return status === "生效中" ? "success" : "default";
}

function TaxDependentMobileCard({ row, onView }) {
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
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#111827",
              fontSize: "14px",
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {row.dependent_name || "--"}
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#64748b",
              fontSize: "12px",
              overflowWrap: "anywhere",
            }}
          >
            {row.employee_no || "--"}
            {"／"}
            {row.employee_name || "--"}
          </Typography>
        </Box>

        <Chip
          size="small"
          label={row.effective_status || "--"}
          color={getEffectiveStatusColor(row.effective_status)}
          variant={row.effective_status === "生效中" ? "filled" : "outlined"}
          sx={{ fontWeight: 700 }}
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
        <ReportDetailField label="關係" value={row.relationship_type || "--"} />

        <ReportDetailField
          label="出生日期"
          value={formatReportDate(row.birth_date)}
        />

        <ReportDetailField
          label="證號別"
          value={formatCertificateType(row.certificate_type)}
        />

        <ReportDetailField label="資料狀態" value={row.status || "--"} />

        <Box sx={{ gridColumn: "1 / -1" }}>
          <ReportDetailField
            label="生效期間"
            value={formatEffectivePeriod(row)}
          />
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

function TaxDependentDetailDialog({ open, row, effectiveDate, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        所得稅扶養親屬明細
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
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "#111827",
                    fontSize: "18px",
                    fontWeight: 700,
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.dependent_name || "--"}
                </Typography>

                <Typography
                  sx={{
                    mt: "3px",
                    color: "#64748b",
                    fontSize: "12px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.employee_no || "--"}
                  {"／"}
                  {row.employee_name || "--"}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Chip label={row.status || "--"} variant="outlined" />

                <Chip
                  label={row.effective_status || "--"}
                  color={getEffectiveStatusColor(row.effective_status)}
                  variant={
                    row.effective_status === "生效中" ? "filled" : "outlined"
                  }
                />
              </Box>
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
              扶養親屬資料
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
                label="扶養親屬姓名"
                value={row.dependent_name || "--"}
              />

              <ReportDetailField
                label="關係"
                value={row.relationship_type || "--"}
              />

              <ReportDetailField
                label="出生日期"
                value={formatReportDate(row.birth_date)}
              />

              <ReportDetailField
                label="身分證號／居留證號"
                value={row.identity_number || "--"}
              />

              <ReportDetailField
                label="證號別"
                value={formatCertificateType(row.certificate_type)}
              />

              <ReportDetailField
                label="國籍類型"
                value={row.nationality_type || "--"}
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
              生效資料
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
                label="生效基準日"
                value={formatReportDate(effectiveDate)}
              />

              <ReportDetailField
                label="生效開始日"
                value={formatReportDate(row.effective_from)}
              />

              <ReportDetailField
                label="生效結束日"
                value={
                  row.effective_to ? formatReportDate(row.effective_to) : "--"
                }
              />

              <ReportDetailField
                label="生效狀態"
                value={row.effective_status || "--"}
              />

              <ReportDetailField label="資料狀態" value={row.status || "--"} />
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
              備註
            </Typography>

            <Box
              sx={{
                p: {
                  xs: "14px",
                  sm: "16px",
                },
                border: "1px solid #e2e8f0",
                borderRadius: "5px",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography
                sx={{
                  color: row.remarks ? "#111827" : "#94a3b8",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {row.remarks || "無備註"}
              </Typography>
            </Box>
          </>
        ) : (
          <Alert severity="info">找不到所得稅扶養親屬明細。</Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: "14px 20px" }}>
        <Button type="button" color="inherit" onClick={onClose}>
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TaxDependentDetailsReport() {
  const [effectiveDate, setEffectiveDate] = useState(getTodayDate());

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [status, setStatus] = useState("啟用");

  const [employees, setEmployees] = useState([]);

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(false);

  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [detailRow, setDetailRow] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const rows = Array.isArray(report?.rows) ? report.rows : [];

  const summary = report?.summary || {};

  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true);

    try {
      const result = await getPayrollEmployees({
        page: 1,
        per_page: 100,
      });

      setEmployees(normalizeEmployees(result));
    } catch (requestError) {
      setEmployees([]);

      setError(getReportErrorMessage(requestError, "無法載入員工資料。"));
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  function validateFilters() {
    return validateEffectiveDate(effectiveDate);
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
      const result = await getTaxDependentDetailsReport({
        effective_date: effectiveDate,
        employee_id: selectedEmployee?.employee_id || "",
        status,
      });

      setReport(result);
    } catch (requestError) {
      setReport(null);

      setError(
        getReportErrorMessage(requestError, "無法載入所得稅扶養親屬明細。"),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!report || rows.length === 0) {
      setError("目前沒有可下載的所得稅扶養親屬資料。");
      return;
    }

    setExporting(true);
    setError("");
    setSuccessMessage("");

    try {
      exportTaxDependentDetailsReport({ report });

      setSuccessMessage("所得稅扶養親屬明細已開始下載。");
    } catch (exportError) {
      setError(
        getReportErrorMessage(
          exportError,
          "無法產生所得稅扶養親屬明細 Excel。",
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
          所得稅扶養親屬明細
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            color: "#64748b",
            fontSize: "12px",
            lineHeight: 1.6,
          }}
        >
          依生效基準日、員工與狀態查詢所得稅扶養親屬資料。
        </Typography>

        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "minmax(190px, 0.8fr) minmax(260px, 1.5fr) minmax(150px, 0.7fr) auto",
            },
            gap: "10px",
            mt: "17px",
            alignItems: "center",
          }}
        >
          <TextField
            type="date"
            size="small"
            label="生效基準日"
            value={effectiveDate}
            disabled={loading}
            onChange={(event) => setEffectiveDate(event.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Autocomplete
            size="small"
            options={employees}
            value={selectedEmployee}
            loading={loadingEmployees}
            disabled={loading || loadingEmployees}
            getOptionLabel={getEmployeeLabel}
            isOptionEqualToValue={(option, value) =>
              Number(option?.employee_id) === Number(value?.employee_id)
            }
            onChange={(_event, newValue) => setSelectedEmployee(newValue)}
            noOptionsText={
              loadingEmployees ? "載入員工中..." : "找不到員工資料"
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="員工"
                placeholder="全部員工"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingEmployees ? (
                        <CircularProgress color="inherit" size={17} />
                      ) : null}

                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <TextField
            select
            size="small"
            label="狀態"
            value={status}
            disabled={loading}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value || "all"} value={option.value}>
                {option.label}
              </MenuItem>
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
            disabled={loading || loadingEmployees}
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
        <ReportLoadingState message="載入所得稅扶養親屬明細中..." />
      ) : report ? (
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
              生效基準日：{report.effective_date || "--"}
              {"／"}
              員工：
              {selectedEmployee ? getEmployeeLabel(selectedEmployee) : "全部員工"}
              {"／"}
              狀態：
              {status || "全部狀態"}
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
              label="扶養親屬筆數"
              value={summary.record_count}
              description="符合查詢條件的扶養親屬資料"
              amount={false}
            />

            <ReportSummaryCard
              label="員工人數"
              value={summary.employee_count}
              description="具有扶養親屬資料的不重複員工"
              amount={false}
            />

            <ReportSummaryCard
              label="生效中"
              value={summary.active_count}
              description="於生效基準日有效的扶養親屬資料"
              amount={false}
            />

            <ReportSummaryCard
              label="未生效"
              value={summary.inactive_count}
              description="尚未生效或已結束的扶養親屬資料"
              amount={false}
            />
          </Box>

          {rows.length === 0 ? (
            <Alert severity="info">
              此查詢條件沒有可顯示的所得稅扶養親屬資料。
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
                  <TaxDependentMobileCard
                    key={row.tax_dependent_id}
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
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      {[
                        "員工",
                        "扶養親屬",
                        "關係",
                        "生效期間",
                        "生效狀態",
                        "操作",
                      ].map((label) => (
                        <TableCell
                          key={label}
                          align={
                            label === "生效狀態" || label === "操作"
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
                      <TableRow key={row.tax_dependent_id} hover>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {row.employee_no || "--"}
                          {"／"}
                          {row.employee_name || "--"}
                        </TableCell>

                        <TableCell>
                          <Typography
                            sx={{
                              color: "#111827",
                              fontSize: "14px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {row.dependent_name || "--"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {row.relationship_type || "--"}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatEffectivePeriod(row)}
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={row.effective_status || "--"}
                            color={getEffectiveStatusColor(
                              row.effective_status,
                            )}
                            variant={
                              row.effective_status === "生效中"
                                ? "filled"
                                : "outlined"
                            }
                            sx={{ fontWeight: 700 }}
                          />
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
          請選擇生效基準日，並視需要選擇員工與狀態後按下查詢。
        </Alert>
      )}
      <TaxDependentDetailDialog
        open={detailOpen}
        row={detailRow}
        effectiveDate={report?.effective_date}
        onClose={handleCloseDetail}
      />
    </>
  );
}
