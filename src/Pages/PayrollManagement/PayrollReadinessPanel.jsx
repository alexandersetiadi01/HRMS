import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  calculatePayrollRun,
  getPayrollRunReadiness,
} from "../../API/payroll";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function ReadinessSummaryCard({
  label,
  value,
  color,
  background,
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: {
          xs: "12px",
          sm: "14px",
        },
        border: "1px solid #e5e7eb",
        borderRadius: "5px",
        bgcolor: background,
      }}
    >
      <Typography
        sx={{
          mb: "4px",
          color: "#64748b",
          fontSize: {
            xs: "12px",
            sm: "13px",
          },
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          color,
          fontSize: {
            xs: "20px",
            sm: "24px",
          },
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {formatNumber(value)}
      </Typography>
    </Box>
  );
}

function ReadinessStatus({
  ready,
  readyLabel,
  missingLabel,
}) {
  return (
    <Chip
      size="small"
      icon={
        ready ? (
          <CheckCircleOutlineIcon />
        ) : (
          <ErrorOutlineIcon />
        )
      }
      label={ready ? readyLabel : missingLabel}
      sx={{
        height: "26px",
        bgcolor: ready ? "#eaf8ef" : "#fff3e8",
        color: ready ? "#15803d" : "#c26708",
        border: ready
          ? "1px solid #b9e5c8"
          : "1px solid #f4cfaa",
        fontSize: "12px",
        fontWeight: 600,
        "& .MuiChip-icon": {
          color: "inherit",
          fontSize: "16px",
        },
      }}
    />
  );
}

function EmployeeReadinessRow({ employee }) {
  const employeeName =
    employee.display_name ||
    employee.english_name ||
    `員工 #${employee.employee_id}`;

  return (
    <Box
      sx={{
        p: {
          xs: "12px",
          sm: "15px",
        },
        border: "1px solid #e5e7eb",
        borderRadius: "5px",
        bgcolor: employee.is_ready
          ? "#ffffff"
          : "#fffafa",
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
          gap: "10px",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#1f2937",
              fontSize: {
                xs: "14px",
                sm: "15px",
              },
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {employeeName}
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#7b8794",
              fontSize: "12px",
            }}
          >
            員工編號：
            {employee.employee_no || "--"}
          </Typography>
        </Box>

        <Chip
          label={
            employee.is_ready
              ? "可以計算"
              : "需要處理"
          }
          size="small"
          sx={{
            flexShrink: 0,
            bgcolor: employee.is_ready
              ? "#eaf8ef"
              : "#feecec",
            color: employee.is_ready
              ? "#15803d"
              : "#c62828",
            border: employee.is_ready
              ? "1px solid #b9e5c8"
              : "1px solid #f2b8b5",
            fontWeight: 700,
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: "7px",
          mt: "12px",
        }}
      >
        <ReadinessStatus
          ready={employee.salary_ready}
          readyLabel={`薪資設定 ${employee.salary_item_count || 0} 項`}
          missingLabel="薪資設定未完成"
        />

        <ReadinessStatus
          ready={employee.insurance_ready}
          readyLabel="保險級距已設定"
          missingLabel="保險級距未設定"
        />

        <ReadinessStatus
          ready={employee.attendance_ready}
          readyLabel={`出勤 ${employee.attendance_count || 0} 筆`}
          missingLabel="尚無出勤紀錄"
        />

        <Chip
          size="small"
          label={`手動加扣項 ${employee.extra_item_count || 0} 筆`}
          sx={{
            height: "26px",
            bgcolor: "#f1f5f9",
            color: "#475569",
            border: "1px solid #dbe2ea",
            fontSize: "12px",
            fontWeight: 600,
          }}
        />
      </Box>

      <Typography
        sx={{
          mt: "10px",
          color: "#64748b",
          fontSize: "12px",
        }}
      >
        本薪：NT$ {formatNumber(employee.base_salary)}
      </Typography>

      {Array.isArray(employee.blocking_issues) &&
      employee.blocking_issues.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gap: "4px",
            mt: "10px",
          }}
        >
          {employee.blocking_issues.map(
            (message, index) => (
              <Typography
                key={`${message}-${index}`}
                sx={{
                  color: "#c62828",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                • {message}
              </Typography>
            ),
          )}
        </Box>
      ) : null}

      {Array.isArray(employee.warnings) &&
      employee.warnings.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gap: "4px",
            mt: "8px",
          }}
        >
          {employee.warnings.map(
            (message, index) => (
              <Typography
                key={`${message}-${index}`}
                sx={{
                  color: "#c26708",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                • {message}
              </Typography>
            ),
          )}
        </Box>
      ) : null}
    </Box>
  );
}

export default function PayrollReadinessPanel({
  payrollRunId,
  onCalculated,
}) {
  const [expanded, setExpanded] = useState(false);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] =
    useState(false);
  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] =
    useState("");
  const [resultSeverity, setResultSeverity] =
    useState("success");

  const loadReadiness = useCallback(async () => {
    if (!payrollRunId) return;

    setLoading(true);
    setError("");

    try {
      const data = await getPayrollRunReadiness(
        payrollRunId,
      );

      setReadiness({
        ...data,
        summary: data?.summary || {},
        employees: Array.isArray(data?.employees)
          ? data.employees
          : [],
      });
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          "無法載入薪資資料確認結果。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [payrollRunId]);

  useEffect(() => {
    setExpanded(false);
    setReadiness(null);
    setError("");
    setResultMessage("");
  }, [payrollRunId]);

  useEffect(() => {
    if (expanded && !readiness && !loading) {
      loadReadiness();
    }
  }, [
    expanded,
    loadReadiness,
    loading,
    readiness,
  ]);

  const summary = readiness?.summary || {};
  const employees = readiness?.employees || [];

  const employeeCount = Number(
    summary.employee_count || 0,
  );
  const needsAttentionCount = Number(
    summary.needs_attention_count || 0,
  );

  const canCalculate =
    employeeCount > 0 &&
    needsAttentionCount === 0 &&
    !loading &&
    !calculating;

  async function handleCalculate() {
    if (!canCalculate) return;

    const confirmed = window.confirm(
      `確定要計算此薪資批次嗎？系統將計算 ${employeeCount} 位員工的薪資。`,
    );

    if (!confirmed) return;

    setCalculating(true);
    setError("");
    setResultMessage("");

    try {
      const result = await calculatePayrollRun(
        payrollRunId,
      );

      const calculatedCount = Number(
        result?.calculated_count || 0,
      );
      const calculationErrors = Array.isArray(
        result?.errors,
      )
        ? result.errors
        : [];

      if (calculationErrors.length > 0) {
        setResultSeverity("warning");
        setResultMessage(
          `已完成 ${calculatedCount} 位員工的計算，但有 ${calculationErrors.length} 位員工計算失敗。`,
        );
      } else {
        setResultSeverity("success");
        setResultMessage(
          `薪資計算完成，共計算 ${calculatedCount} 位員工。`,
        );
      }

      await onCalculated?.(result);
    } catch (calculateError) {
      setError(
        getErrorMessage(
          calculateError,
          "薪資計算失敗。",
        ),
      );
    } finally {
      setCalculating(false);
    }
  }

  return (
    <Box
      sx={{
        mt: "20px",
        pt: "18px",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <Button
        variant="outlined"
        fullWidth
        onClick={() => setExpanded((value) => !value)}
        endIcon={
          expanded ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )
        }
        sx={{
          justifyContent: "space-between",
          minHeight: "42px",
          px: "14px",
          color: "#168dc5",
          borderColor: "#a9d8ed",
          fontSize: {
            xs: "13px",
            sm: "14px",
          },
          fontWeight: 700,
          "&:hover": {
            borderColor: "#1f9bd1",
            bgcolor: "#f2fbff",
          },
        }}
      >
        查看員工資料確認
      </Button>

      <Collapse in={expanded}>
        <Box sx={{ pt: "16px" }}>
          {error ? (
            <Alert
              severity="error"
              sx={{ mb: "14px" }}
            >
              {error}
            </Alert>
          ) : null}

          {resultMessage ? (
            <Alert
              severity={resultSeverity}
              sx={{ mb: "14px" }}
            >
              {resultMessage}
            </Alert>
          ) : null}

          {loading ? (
            <Box
              sx={{
                minHeight: "150px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : readiness ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: "10px",
                }}
              >
                <ReadinessSummaryCard
                  label="薪資範圍員工"
                  value={summary.employee_count}
                  color="#334155"
                  background="#f8fafc"
                />

                <ReadinessSummaryCard
                  label="可以計算"
                  value={summary.ready_count}
                  color="#15803d"
                  background="#f2fbf5"
                />

                <ReadinessSummaryCard
                  label="需要處理"
                  value={
                    summary.needs_attention_count
                  }
                  color="#c62828"
                  background="#fff7f7"
                />

                <ReadinessSummaryCard
                  label="手動加扣項"
                  value={summary.extra_item_count}
                  color="#168dc5"
                  background="#f2fbff"
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: "8px",
                  mt: "10px",
                }}
              >
                <ReadinessStatus
                  ready={
                    Number(
                      summary.salary_ready_count,
                    ) === employeeCount
                  }
                  readyLabel={`薪資設定 ${summary.salary_ready_count || 0}/${employeeCount}`}
                  missingLabel={`薪資設定 ${summary.salary_ready_count || 0}/${employeeCount}`}
                />

                <ReadinessStatus
                  ready={
                    Number(
                      summary.insurance_ready_count,
                    ) === employeeCount
                  }
                  readyLabel={`保險級距 ${summary.insurance_ready_count || 0}/${employeeCount}`}
                  missingLabel={`保險級距 ${summary.insurance_ready_count || 0}/${employeeCount}`}
                />

                <ReadinessStatus
                  ready={
                    Number(
                      summary.attendance_ready_count,
                    ) === employeeCount
                  }
                  readyLabel={`出勤紀錄 ${summary.attendance_ready_count || 0}/${employeeCount}`}
                  missingLabel={`出勤紀錄 ${summary.attendance_ready_count || 0}/${employeeCount}`}
                />
              </Box>

              {employeeCount === 0 ? (
                <Alert
                  severity="warning"
                  sx={{ mt: "14px" }}
                >
                  此薪資範圍目前沒有可計算的員工。請先確認員工的薪資範圍與薪資設定。
                </Alert>
              ) : needsAttentionCount > 0 ? (
                <Alert
                  severity="error"
                  sx={{ mt: "14px" }}
                >
                  尚有 {needsAttentionCount} 位員工存在阻擋問題。完成薪資與保險設定後，重新整理資料才能開始計算。
                </Alert>
              ) : Number(
                  summary.attendance_ready_count,
                ) < employeeCount ? (
                <Alert
                  severity="warning"
                  sx={{ mt: "14px" }}
                >
                  部分員工尚無出勤紀錄。這不會阻止計算，但可能影響缺勤、請假與加班金額。
                </Alert>
              ) : (
                <Alert
                  severity="success"
                  sx={{ mt: "14px" }}
                >
                  所有員工的必要薪資資料均已完成，可以開始計算。
                </Alert>
              )}

              <Divider sx={{ my: "16px" }} />

              <Typography
                sx={{
                  mb: "10px",
                  color: "#334155",
                  fontSize: {
                    xs: "14px",
                    sm: "15px",
                  },
                  fontWeight: 700,
                }}
              >
                員工確認結果
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gap: "10px",
                }}
              >
                {employees.map((employee) => (
                  <EmployeeReadinessRow
                    key={employee.employee_id}
                    employee={employee}
                  />
                ))}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },
                  gap: "8px",
                  mt: "16px",
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadReadiness}
                  disabled={loading || calculating}
                  sx={{
                    color: "#475569",
                    borderColor: "#cbd5e1",
                  }}
                >
                  重新確認資料
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    calculating ? (
                      <CircularProgress
                        size={17}
                        color="inherit"
                      />
                    ) : (
                      <PlayArrowIcon />
                    )
                  }
                  onClick={handleCalculate}
                  disabled={!canCalculate}
                  sx={{
                    bgcolor: "#1f9bd1",
                    "&:hover": {
                      bgcolor: "#168dc5",
                    },
                  }}
                >
                  {calculating
                    ? "計算中..."
                    : "開始薪資計算"}
                </Button>
              </Box>
            </>
          ) : null}
        </Box>
      </Collapse>
    </Box>
  );
}