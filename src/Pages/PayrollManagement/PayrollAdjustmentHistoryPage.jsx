import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
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
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  getPayrollEmployees,
  getSalaryAdjustmentHistory,
} from "../../API/payroll";
import PayrollAdjustmentHistoryDialog from "./PayrollAdjustmentHistoryDialog";

const PER_PAGE = 20;

const EMPTY_FILTERS = {
  search: "",
  employee_id: "",
  status: "",
  date_from: "",
  date_to: "",
};

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function getEmployeeLabel(employee) {
  const employeeNo = String(employee?.employee_no || "").trim();

  const employeeName = String(
    employee?.display_name ||
      employee?.employee_name ||
      employee?.english_name ||
      "",
  ).trim();

  if (employeeNo && employeeName) {
    return `${employeeNo}／${employeeName}`;
  }

  return employeeNo || employeeName || `員工 #${employee?.employee_id || "--"}`;
}

function getOperatorLabel(operator) {
  const employeeNo = String(operator?.employee_no || "").trim();

  const employeeName = String(
    operator?.employee_name || operator?.english_name || "",
  ).trim();

  if (employeeNo && employeeName) {
    return `${employeeNo}／${employeeName}`;
  }

  return employeeNo || employeeName || "--";
}

function formatDate(value) {
  if (!value) {
    return "--";
  }

  return String(value).slice(0, 10).replaceAll("-", "/");
}

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  const normalized = String(value).replace("T", " ");

  return normalized.slice(0, 16).replaceAll("-", "/");
}

function StatusChip({ status }) {
  const applied = status === "已套用";

  return (
    <Chip
      label={status || "--"}
      size="small"
      color={applied ? "success" : "default"}
      variant={applied ? "filled" : "outlined"}
      sx={{ fontWeight: 700 }}
    />
  );
}

function SummaryItem({ label, value }) {
  return (
    <Box>
      <Typography
        sx={{
          color: "#7b8794",
          fontSize: "11px",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "2px",
          color: "#1f2937",
          fontSize: "14px",
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function HistoryMobileCard({ batch, onView }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: "14px",
          sm: "16px",
        },
        borderColor: "#dfe4e8",
        borderRadius: "5px",
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
                xs: "15px",
                sm: "16px",
              },
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {batch.batch_code || "--"}
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            生效日：
            {formatDate(batch.effective_date)}
          </Typography>
        </Box>

        <StatusChip status={batch.status} />
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
        <SummaryItem
          label="員工人數"
          value={`${Number(batch.employee_count || 0)} 位`}
        />

        <SummaryItem
          label="變更科目"
          value={`${Number(batch.changed_item_count || 0)} 個`}
        />

        <SummaryItem
          label="套用人員"
          value={getOperatorLabel(batch.applied_by)}
        />

        <SummaryItem
          label="套用時間"
          value={formatDateTime(batch.applied_at || batch.created_at)}
        />
      </Box>

      {batch.remarks ? (
        <Box
          sx={{
            mt: "12px",
            pt: "12px",
            borderTop: "1px solid #edf0f3",
          }}
        >
          <Typography
            sx={{
              color: "#7b8794",
              fontSize: "11px",
            }}
          >
            批次備註
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#475569",
              fontSize: "13px",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {batch.remarks}
          </Typography>
        </Box>
      ) : null}

      <Button
        type="button"
        variant="outlined"
        startIcon={<VisibilityIcon />}
        fullWidth
        onClick={() => onView(batch.salary_adjustment_batch_id)}
        sx={{ mt: "14px" }}
      >
        查看批次
      </Button>
    </Paper>
  );
}

export default function PayrollAdjustmentHistoryPage() {
  const [employees, setEmployees] = useState([]);

  const [rows, setRows] = useState([]);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    per_page: PER_PAGE,
    total: 0,
    total_pages: 0,
  });

  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedBatchId, setSelectedBatchId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      setLoadingEmployees(true);

      try {
        const result = await getPayrollEmployees({
          page: 1,
          per_page: 100,
          employee_status: "啟用",
        });

        if (!active) {
          return;
        }

        const employeeList = Array.isArray(result)
          ? [...result].sort((employeeA, employeeB) =>
              getEmployeeLabel(employeeA).localeCompare(
                getEmployeeLabel(employeeB),
                "zh-Hant",
              ),
            )
          : [];

        setEmployees(employeeList);
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError, "無法載入員工篩選資料。"));
        }
      } finally {
        if (active) {
          setLoadingEmployees(false);
        }
      }
    }

    loadEmployees();

    return () => {
      active = false;
    };
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getSalaryAdjustmentHistory({
        page,
        per_page: PER_PAGE,
        ...appliedFilters,
      });

      const nextRows = Array.isArray(result?.rows) ? result.rows : [];

      const nextPagination = result?.pagination || {};

      setRows(nextRows);

      setPagination({
        page: Number(nextPagination.page || page),
        per_page: Number(nextPagination.per_page || PER_PAGE),
        total: Number(nextPagination.total || 0),
        total_pages: Number(nextPagination.total_pages || 0),
      });
    } catch (requestError) {
      setRows([]);

      setPagination({
        page,
        per_page: PER_PAGE,
        total: 0,
        total_pages: 0,
      });

      setError(getErrorMessage(requestError, "無法讀取薪資異動紀錄。"));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSearch(event) {
    event.preventDefault();

    if (
      filters.date_from &&
      filters.date_to &&
      filters.date_from > filters.date_to
    ) {
      setError("開始日期不可晚於結束日期。");
      return;
    }

    setError("");
    setPage(1);
    setAppliedFilters({
      ...filters,
    });
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    setError("");
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
      <Box sx={{ mb: "18px" }}>
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
          薪資異動紀錄
        </Typography>

        <Typography
          sx={{
            mt: "3px",
            color: "#7b8794",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          查詢已套用的批次調薪、生效日期、影響人數與執行人員
        </Typography>
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
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "minmax(220px, 1.4fr) minmax(190px, 1fr) minmax(230px, 0.9fr)",
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
        }}
      >
        <TextField
          size="small"
          label="搜尋批次編號、員工或備註"
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
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

        <FormControl size="small">
          <InputLabel id="adjustment-history-employee-label">員工</InputLabel>

          <Select
            labelId="adjustment-history-employee-label"
            label="員工"
            value={filters.employee_id}
            onChange={(event) =>
              updateFilter("employee_id", event.target.value)
            }
            disabled={loadingEmployees}
          >
            <MenuItem value="">全部員工</MenuItem>

            {employees.map((employee) => (
              <MenuItem key={employee.employee_id} value={employee.employee_id}>
                {getEmployeeLabel(employee)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel id="adjustment-history-status-label">狀態</InputLabel>

          <Select
            labelId="adjustment-history-status-label"
            label="狀態"
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <MenuItem value="">全部狀態</MenuItem>

            <MenuItem value="已套用">已套用</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          type="date"
          label="生效日（開始）"
          value={filters.date_from}
          onChange={(event) => updateFilter("date_from", event.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          size="small"
          type="date"
          label="生效日（結束）"
          value={filters.date_to}
          onChange={(event) => updateFilter("date_to", event.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
        />

        <Box
          sx={{
            display: "flex",
            gap: "8px",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gridColumn: {
              xs: "auto",
              sm: "1 / -1",
              md: "auto",
            },
            justifyContent: {
              sm: "flex-end",
              md: "stretch",
            },
            minWidth: 0,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={loading}
            sx={{
              flex: {
                xs: 1,
                sm: "0 0 112px",
                md: 1,
              },
              minWidth: 0,
              whiteSpace: "nowrap",
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
              flex: {
                xs: 1,
                sm: "0 0 112px",
                md: 1,
              },
              minWidth: 0,
              whiteSpace: "nowrap",
            }}
          >
            重設
          </Button>
        </Box>
      </Box>

      {!loading ? (
        <Typography
          sx={{
            mb: "10px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          共 {pagination.total} 筆薪資異動批次
        </Typography>
      ) : null}

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
      ) : rows.length === 0 ? (
        <Alert severity="info">沒有符合條件的薪資異動紀錄。</Alert>
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
            {rows.map((batch) => (
              <HistoryMobileCard
                key={batch.salary_adjustment_batch_id}
                batch={batch}
                onView={setSelectedBatchId}
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
                  sx={{
                    bgcolor: "#f8fafc",
                  }}
                >
                  <TableCell sx={{ fontWeight: 700 }}>批次編號</TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>生效日</TableCell>

                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    員工
                  </TableCell>

                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    變更科目
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>套用人員</TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>套用時間</TableCell>

                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    狀態
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      width: "120px",
                      fontWeight: 700,
                    }}
                  >
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((batch) => (
                  <TableRow key={batch.salary_adjustment_batch_id} hover>
                    <TableCell>
                      <Typography
                        sx={{
                          color: "#1f2937",
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {batch.batch_code || "--"}
                      </Typography>

                      {batch.remarks ? (
                        <Typography
                          title={batch.remarks}
                          sx={{
                            maxWidth: "210px",
                            mt: "2px",
                            color: "#64748b",
                            fontSize: "12px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {batch.remarks}
                        </Typography>
                      ) : null}
                    </TableCell>

                    <TableCell>{formatDate(batch.effective_date)}</TableCell>

                    <TableCell align="center">
                      {Number(batch.employee_count || 0)} 位
                    </TableCell>

                    <TableCell align="center">
                      {Number(batch.changed_item_count || 0)} 個
                    </TableCell>

                    <TableCell>{getOperatorLabel(batch.applied_by)}</TableCell>

                    <TableCell>
                      {formatDateTime(batch.applied_at || batch.created_at)}
                    </TableCell>

                    <TableCell align="center">
                      <StatusChip status={batch.status} />
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        type="button"
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() =>
                          setSelectedBatchId(batch.salary_adjustment_batch_id)
                        }
                        sx={{
                          whiteSpace: "nowrap",
                        }}
                      >
                        查看批次
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {!loading && pagination.total_pages > 1 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: "18px",
          }}
        >
          <Pagination
            page={page}
            count={pagination.total_pages}
            color="primary"
            shape="rounded"
            onChange={(_event, nextPage) => setPage(nextPage)}
          />
        </Box>
      ) : null}

      <PayrollAdjustmentHistoryDialog
        open={Boolean(selectedBatchId)}
        batchId={selectedBatchId}
        onClose={() => setSelectedBatchId(null)}
      />
    </Box>
  );
}
