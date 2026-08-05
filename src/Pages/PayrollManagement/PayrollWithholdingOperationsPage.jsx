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

import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  getPayrollWithholdingResult,
  getPayrollWithholdingResults,
  getTaxDeclarationUnits,
} from "../../API/payroll";

const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1;
const PER_PAGE = 20;

const EMPTY_FILTERS = {
  income_year: String(CURRENT_YEAR),
  income_month: String(CURRENT_MONTH),
  tax_declaration_unit_id: "",
  status: "",
  keyword: "",
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

function formatDate(value) {
  if (!value) {
    return "--";
  }

  return String(value).slice(0, 10).replaceAll("-", "/");
}

function getEmployeeName(record) {
  return record?.display_name || record?.english_name || "--";
}

function getEmployeeLabel(record) {
  const employeeNo = String(record?.employee_no || "").trim();

  const employeeName = String(getEmployeeName(record)).trim();

  if (employeeNo && employeeName && employeeName !== "--") {
    return `${employeeNo}／${employeeName}`;
  }

  return employeeNo || employeeName || `員工 #${record?.employee_id || "--"}`;
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

function getWithholdingMethodLabel(value) {
  const labels = {
    依照所得稅額表扣繳: "依照所得稅額表扣繳",

    不扣繳: "不扣繳（舊版）",

    依年度參數: "依年度參數（舊版固定稅率）",

    固定稅率: "固定稅率（舊版）",

    手動金額: "手動金額（舊版）",
  };

  return labels[value] || value || "--";
}

function StatusChip({ status }) {
  const normalizedStatus = String(status || "").trim();

  const successStatuses = ["已計算", "已確認", "有效", "啟用"];

  const color = successStatuses.includes(normalizedStatus)
    ? "success"
    : "default";

  return (
    <Chip
      label={normalizedStatus || "--"}
      size="small"
      color={color}
      variant="outlined"
      sx={{
        fontWeight: 700,
      }}
    />
  );
}

function SummaryCard({ label, value, description }) {
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
        NT$ {formatAmount(value)}
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

function WithholdingDetailDialog({ open, record, loading, error, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle
        sx={{
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        扣繳結果明細
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
              minHeight: "220px",
            }}
          >
            <CircularProgress size={24} />

            <Typography
              sx={{
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              載入扣繳結果明細中...
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
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: "#111827",
                    fontSize: "18px",
                    fontWeight: 700,
                    overflowWrap: "anywhere",
                  }}
                >
                  {getEmployeeLabel(record)}
                </Typography>

                <Typography
                  sx={{
                    mt: "3px",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  所得期間：
                  {record.income_year || "--"} 年 {record.income_month || "--"}{" "}
                  月
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
                label="薪資批次"
                value={
                  record.run_name || `批次 #${record.payroll_run_id || "--"}`
                }
              />

              <DetailField
                label="薪資批次類型"
                value={record.run_type || "--"}
              />

              <DetailField
                label="計薪期間"
                value={`${formatDate(record.period_start)} ～ ${formatDate(
                  record.period_end,
                )}`}
              />

              <DetailField
                label="發薪日"
                value={formatDate(record.actual_pay_date || record.pay_date)}
              />

              <DetailField
                label="所得稅申報單位"
                value={record.declaration_unit_name || "--"}
              />

              <DetailField
                label="統一編號"
                value={record.business_registration_no || "--"}
              />

              <DetailField
                label="扣繳單位稅籍編號"
                value={record.withholding_tax_unit_no || "--"}
              />

              <DetailField
                label="所得格式"
                value={record.income_format || "--"}
              />

              <DetailField
                label="扣繳方式"
                value={getWithholdingMethodLabel(
                  record.withholding_method_snapshot,
                )}
              />

              <DetailField
                label="計算時居留狀態"
                value={record.residency_status_snapshot || "--"}
              />

              <DetailField
                label="應稅所得"
                value={`NT$ ${formatAmount(record.taxable_amount)}`}
              />

              <DetailField
                label="扣繳稅額"
                value={`NT$ ${formatAmount(record.withholding_tax)}`}
              />

              <DetailField
                label="所得稅額表扶養人數"
                value={
                  record.dependent_count_snapshot === null ||
                  record.dependent_count_snapshot === undefined
                    ? "--"
                    : `${record.dependent_count_snapshot} 人`
                }
              />

              <DetailField
                label="所得稅額表級距"
                value={
                  record.tax_table_row_id
                    ? `NT$ ${formatAmount(
                        record.monthly_salary_from_snapshot,
                      )} ～ ${
                        record.monthly_salary_to_snapshot === null ||
                        record.monthly_salary_to_snapshot === undefined
                          ? "無上限"
                          : `NT$ ${formatAmount(
                              record.monthly_salary_to_snapshot,
                            )}`
                      }`
                    : "--"
                }
              />

              <DetailField
                label="級距扣繳稅額快照"
                value={
                  record.table_withholding_amount_snapshot === null ||
                  record.table_withholding_amount_snapshot === undefined
                    ? "--"
                    : `NT$ ${formatAmount(
                        record.table_withholding_amount_snapshot,
                      )}`
                }
              />

              <DetailField
                label="進位方式"
                value={record.rounding_method_snapshot || "--"}
              />
            </Box>
          </>
        ) : (
          <Alert severity="info">找不到扣繳結果明細。</Alert>
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
          disabled={loading}
          onClick={onClose}
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function WithholdingMobileCard({ record, onView }) {
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
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#1f2937",
              fontSize: "15px",
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {getEmployeeLabel(record)}
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            {record.income_year || "--"} 年 {record.income_month || "--"} 月
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
          bgcolor: "#f8fafc",
        }}
      >
        <DetailField
          label="應稅所得"
          value={`NT$ ${formatAmount(record.taxable_amount)}`}
        />

        <DetailField
          label="扣繳稅額"
          value={`NT$ ${formatAmount(record.withholding_tax)}`}
        />

        <DetailField
          label="所得稅申報單位"
          value={record.declaration_unit_name || "--"}
        />

        <DetailField label="薪資批次" value={record.run_name || "--"} />
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
    </Paper>
  );
}

export default function PayrollWithholdingOperationsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const [rows, setRows] = useState([]);

  const [summary, setSummary] = useState({
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

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getPayrollWithholdingResults({
        ...appliedFilters,
        page,
        per_page: PER_PAGE,
      });

      setRows(Array.isArray(result?.rows) ? result.rows : []);

      setSummary({
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
        taxable_amount_total: 0,
        withholding_tax_total: 0,
      });

      setError(getErrorMessage(requestError, "無法載入扣繳作業資料。"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadTaxDeclarationUnits();
  }, [loadTaxDeclarationUnits]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

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
    const withholdingResultId = Number(record?.withholding_result_id);

    if (withholdingResultId <= 0) {
      return;
    }

    setDetailOpen(true);
    setDetailRecord(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const result = await getPayrollWithholdingResult(withholdingResultId);

      setDetailRecord(result);
    } catch (requestError) {
      setDetailError(getErrorMessage(requestError, "無法載入扣繳結果明細。"));
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
      <Box sx={{ mb: "18px" }}>
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
          扣繳作業
        </Typography>

        <Typography
          sx={{
            mt: "3px",
            color: "#7b8794",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          查詢薪資作業產生的員工所得稅扣繳結果
        </Typography>
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
          sx={{ minWidth: 0 }}
        >
          <InputLabel>所得年度</InputLabel>

          <Select
            label="所得年度"
            value={filters.income_year}
            onChange={(event) =>
              setFilter(
                "income_year",
                event.target.value,
              )
            }
          >
            {yearOptions.map((year) => (
              <MenuItem
                key={year}
                value={String(year)}
              >
                {year} 年
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          fullWidth
          sx={{ minWidth: 0 }}
        >
          <InputLabel>所得月份</InputLabel>

          <Select
            label="所得月份"
            value={filters.income_month}
            onChange={(event) =>
              setFilter(
                "income_month",
                event.target.value,
              )
            }
          >
            <MenuItem value="">
              全部月份
            </MenuItem>

            {Array.from(
              { length: 12 },
              (_, index) => index + 1,
            ).map((month) => (
              <MenuItem
                key={month}
                value={String(month)}
              >
                {month} 月
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          fullWidth
          disabled={loadingUnits}
          sx={{ minWidth: 0 }}
        >
          <InputLabel>
            所得稅申報單位
          </InputLabel>

          <Select
            label="所得稅申報單位"
            value={
              filters.tax_declaration_unit_id
            }
            onChange={(event) =>
              setFilter(
                "tax_declaration_unit_id",
                event.target.value,
              )
            }
          >
            <MenuItem value="">
              全部申報單位
            </MenuItem>

            {taxDeclarationUnits.map(
              (unit) => (
                <MenuItem
                  key={
                    unit.tax_declaration_unit_id
                  }
                  value={String(
                    unit.tax_declaration_unit_id,
                  )}
                >
                  {getTaxDeclarationUnitLabel(
                    unit,
                  )}
                </MenuItem>
              ),
            )}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          fullWidth
          sx={{ minWidth: 0 }}
        >
          <InputLabel>狀態</InputLabel>

          <Select
            label="狀態"
            value={filters.status}
            onChange={(event) =>
              setFilter(
                "status",
                event.target.value,
              )
            }
          >
            <MenuItem value="">
              全部狀態
            </MenuItem>

            <MenuItem value="已計算">
              已計算
            </MenuItem>

            <MenuItem value="已確認">
              已確認
            </MenuItem>

            <MenuItem value="取消">
              取消
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="員工搜尋"
          placeholder="員工編號、姓名或 Email"
          value={filters.keyword}
          onChange={(event) =>
            setFilter(
              "keyword",
              event.target.value,
            )
          }
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
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
            startIcon={
              <SearchIcon
                sx={{
                  fontSize: "19px",
                }}
              />
            }
            disabled={loading}
            sx={{
              width: "100%",
              minWidth: 0,
              px: "8px",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            查詢
          </Button>

          <Button
            type="button"
            variant="outlined"
            startIcon={
              <RefreshIcon
                sx={{
                  fontSize: "19px",
                }}
              />
            }
            disabled={loading}
            onClick={handleReset}
            sx={{
              width: "100%",
              minWidth: 0,
              px: "8px",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            重設
          </Button>
        </Box>
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
          },
          gap: "12px",
          mb: "16px",
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        <SummaryCard
          label="應稅所得總額"
          value={summary.taxable_amount_total}
          description="目前查詢條件下的全部資料"
        />

        <SummaryCard
          label="扣繳稅額總額"
          value={summary.withholding_tax_total}
          description="目前查詢條件下的全部資料"
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
            共 {total} 筆扣繳結果
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
          onClick={loadResults}
          sx={{
            whiteSpace: "nowrap",
          }}
        >
          重新整理
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
            載入扣繳作業資料中...
          </Typography>
        </Box>
      ) : rows.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            mt: "18px",
          }}
        >
          目前查詢條件下沒有扣繳結果。
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
              <WithholdingMobileCard
                key={record.withholding_result_id}
                record={record}
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
                    所得期間
                  </TableCell>

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
                    }}
                  >
                    所得稅申報單位
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    薪資批次
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
                      width: "82px",
                      minWidth: "82px",
                      fontWeight: 700,
                    }}
                  >
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((record) => (
                  <TableRow
                    key={record.withholding_result_id}
                    hover
                    sx={{
                      "&:last-child td": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                      }}
                    >
                      {record.income_year || "--"}年{" "}
                      {record.income_month || "--"}月
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#1f2937",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        {getEmployeeName(record)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: "2px",
                          color: "#64748b",
                          fontSize: "11px",
                        }}
                      >
                        {record.employee_no ||
                          `員工 #${record.employee_id || "--"}`}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {record.declaration_unit_name || "--"}
                    </TableCell>

                    <TableCell>{record.run_name || "--"}</TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                      }}
                    >
                      NT$ {formatAmount(record.taxable_amount)}
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        whiteSpace: "nowrap",
                        fontWeight: 700,
                      }}
                    >
                      NT$ {formatAmount(record.withholding_tax)}
                    </TableCell>

                    <TableCell align="center">
                      <StatusChip status={record.status} />
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="檢視明細" arrow>
                        <IconButton
                          type="button"
                          aria-label="檢視扣繳結果明細"
                          onClick={() => handleOpenDetail(record)}
                          sx={{
                            width: "40px",
                            height: "40px",
                            border: "1px solid #93c5fd",
                            borderRadius: "6px",
                            color: "#1976d2",
                            bgcolor: "#eff6ff",
                            "&:hover": {
                              bgcolor: "#dbeafe",
                            },
                          }}
                        >
                          <VisibilityOutlinedIcon
                            sx={{
                              fontSize: "20px",
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: "20px",
              }}
            >
              <Pagination
                page={page}
                count={totalPages}
                color="primary"
                onChange={(_event, nextPage) => {
                  setPage(nextPage);
                }}
              />
            </Box>
          )}
        </>
      )}

      <WithholdingDetailDialog
        open={detailOpen}
        record={detailRecord}
        loading={detailLoading}
        error={detailError}
        onClose={handleCloseDetail}
      />
    </Box>
  );
}
