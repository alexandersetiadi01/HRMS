import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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

function isEmployeeSelectable(employee) {
  if (
    Object.prototype.hasOwnProperty.call(
      employee,
      "can_select",
    )
  ) {
    return Boolean(employee.can_select);
  }

  return Boolean(employee.is_ready);
}

function getEmployeeMessages(
  employee,
  primaryKey,
  fallbackKey,
) {
  if (Array.isArray(employee?.[primaryKey])) {
    return employee[primaryKey];
  }

  if (Array.isArray(employee?.[fallbackKey])) {
    return employee[fallbackKey];
  }

  return [];
}

function getTaxMethodLabel(employee) {
  const method =
    String(employee.withholding_method || "").trim() ||
    "未設定";

  const profile = [
    employee.taxpayer_type,
    employee.residency_status,
  ]
    .filter(Boolean)
    .join("／");

  return profile
    ? `所得稅：${method}（${profile}）`
    : `所得稅：${method}`;
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

function EmployeeReadinessRow({
  employee,
  selected,
  canCalculate,
  onToggle,
}) {
  const employeeName =
    employee.employee_name ||
    employee.display_name ||
    employee.english_name ||
    `員工 #${employee.employee_id}`;

  const canSelect = isEmployeeSelectable(employee);

  const blockingMessages = getEmployeeMessages(
    employee,
    "blocking_messages",
    "blocking_issues",
  );

  const warningMessages = getEmployeeMessages(
    employee,
    "warning_messages",
    "warnings",
  );

  return (
    <Box
      sx={{
        p: {
          xs: "12px",
          sm: "15px",
        },
        border: "1px solid #e5e7eb",
        borderRadius: "5px",
        bgcolor: canSelect
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
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <Checkbox
            checked={selected}
            disabled={
              !canSelect ||
              !canCalculate
            }
            onChange={() =>
              onToggle(employee.employee_id)
            }
            inputProps={{
              "aria-label": `選擇 ${employeeName}`,
            }}
            sx={{
              p: "2px",
              mt: "-1px",
              color: "#94a3b8",
              "&.Mui-checked": {
                color: "#1f9bd1",
              },
            }}
          />

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
        </Box>

        <Chip
          label={
            canSelect
              ? selected
                ? "已選取"
                : "可以選取"
              : "不可選取"
          }
          size="small"
          sx={{
            flexShrink: 0,
            bgcolor: canSelect
              ? "#eaf8ef"
              : "#feecec",
            color: canSelect
              ? "#15803d"
              : "#c62828",
            border: canSelect
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
          ready={employee.shift_ready}
          readyLabel={`班別 ${employee.schedule_count || 0} 筆`}
          missingLabel="尚未設定班別"
        />

        <ReadinessStatus
          ready={employee.attendance_ready}
          readyLabel={`出勤 ${employee.attendance_count || 0} 筆`}
          missingLabel="尚無出勤紀錄"
        />

        <ReadinessStatus
          ready={employee.insurance_ready}
          readyLabel="保險級距已設定"
          missingLabel="保險級距未設定"
        />

        <ReadinessStatus
          ready={employee.tax_ready}
          readyLabel={getTaxMethodLabel(employee)}
          missingLabel="員工稅務設定未完成"
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

      {blockingMessages.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gap: "4px",
            mt: "10px",
          }}
        >
          {blockingMessages.map(
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

      {warningMessages.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gap: "4px",
            mt: "8px",
          }}
        >
          {warningMessages.map(
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
  canCalculate = false,
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

  const [
    selectedEmployeeIds,
    setSelectedEmployeeIds,
  ] = useState([]);

  const loadReadiness = useCallback(async () => {
    if (!payrollRunId) return;

    setLoading(true);
    setError("");

    try {
      const data = await getPayrollRunReadiness(
        payrollRunId,
      );

      const normalizedEmployees = Array.isArray(
        data?.employees,
      )
        ? data.employees
        : [];

      setReadiness({
        ...data,
        summary: data?.summary || {},
        employees: normalizedEmployees,
      });

      const selectableIds = normalizedEmployees
        .filter(isEmployeeSelectable)
        .map((employee) =>
          Number(employee.employee_id),
        )
        .filter((employeeId) => employeeId > 0);

      const savedSelectedIds = normalizedEmployees
        .filter(
          (employee) =>
            isEmployeeSelectable(employee) &&
            Boolean(employee.is_selected),
        )
        .map((employee) =>
          Number(employee.employee_id),
        )
        .filter((employeeId) => employeeId > 0);

      setSelectedEmployeeIds(
        savedSelectedIds.length > 0
          ? savedSelectedIds
          : selectableIds,
      );
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
    setSelectedEmployeeIds([]);
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

  const selectableEmployees = employees.filter(
    isEmployeeSelectable,
  );

  const blockedEmployees = employees.filter(
    (employee) => !isEmployeeSelectable(employee),
  );

  const selectableEmployeeIds =
    selectableEmployees.map((employee) =>
      Number(employee.employee_id),
    );

  const selectedCount = selectedEmployeeIds.length;

  const allSelectableSelected =
    selectableEmployeeIds.length > 0 &&
    selectableEmployeeIds.every((employeeId) =>
      selectedEmployeeIds.includes(employeeId),
    );

  const someSelectableSelected =
    selectedCount > 0 && !allSelectableSelected;

  const calculationEnabled =
    canCalculate &&
    selectedCount > 0 &&
    !loading &&
    !calculating;

  function handleToggleEmployee(employeeId) {
    if (!canCalculate) return;

    const normalizedId = Number(employeeId);

    if (normalizedId <= 0) return;

    setSelectedEmployeeIds((current) => {
      return current.includes(normalizedId)
        ? current.filter((id) => id !== normalizedId)
        : [...current, normalizedId];
    });
  }

  function handleToggleAll() {
    if (!canCalculate) return;

    setSelectedEmployeeIds(
      allSelectableSelected
        ? []
        : selectableEmployeeIds,
    );
  }

  async function handleCalculate() {
    if (!calculationEnabled) return;

    const confirmed = window.confirm(
      `確定要計算此薪資批次嗎？系統將計算 ${selectedCount} 位已選員工的薪資。`,
    );

    if (!confirmed) return;

    setCalculating(true);
    setError("");
    setResultMessage("");

    try {
      const result = await calculatePayrollRun(
        payrollRunId,
        selectedEmployeeIds,
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
        onClick={() =>
          setExpanded((value) => !value)
        }
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
                  label="符合選取資格"
                  value={
                    summary.eligible_count ??
                    selectableEmployees.length
                  }
                  color="#15803d"
                  background="#f2fbf5"
                />

                <ReadinessSummaryCard
                  label="不可選取"
                  value={blockedEmployees.length}
                  color="#c62828"
                  background="#fff7f7"
                />

                <ReadinessSummaryCard
                  label="本次已選取"
                  value={selectedCount}
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
                    md: "repeat(5, minmax(0, 1fr))",
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
                      summary.shift_ready_count,
                    ) === employeeCount
                  }
                  readyLabel={`班別設定 ${summary.shift_ready_count || 0}/${employeeCount}`}
                  missingLabel={`班別設定 ${summary.shift_ready_count || 0}/${employeeCount}`}
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
                      summary.tax_ready_count,
                    ) === employeeCount
                  }
                  readyLabel={`稅務設定 ${summary.tax_ready_count || 0}/${employeeCount}`}
                  missingLabel={`稅務設定 ${summary.tax_ready_count || 0}/${employeeCount}`}
                />
              </Box>

              {employeeCount === 0 ? (
                <Alert
                  severity="warning"
                  sx={{ mt: "14px" }}
                >
                  此薪資範圍目前沒有可計算的員工。請先確認員工的薪資範圍與薪資設定。
                </Alert>
              ) : selectableEmployees.length === 0 ? (
                <Alert
                  severity="error"
                  sx={{ mt: "14px" }}
                >
                  此計薪期間目前沒有符合計薪資格的員工。請先完成薪資、班別、出勤、保險及稅務設定。
                </Alert>
              ) : blockedEmployees.length > 0 ? (
                <Alert
                  severity="warning"
                  sx={{ mt: "14px" }}
                >
                  有 {blockedEmployees.length} 位員工不可選取；其阻擋原因顯示於下方。您仍可計算其他符合資格且已選取的員工。
                </Alert>
              ) : (
                <Alert
                  severity="success"
                  sx={{ mt: "14px" }}
                >
                  所有候選員工均符合資格。請確認本次要計算的員工。
                </Alert>
              )}

              <Divider sx={{ my: "16px" }} />

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
                  gap: "8px",
                  mb: "10px",
                }}
              >
                <Typography
                  sx={{
                    color: "#334155",
                    fontSize: {
                      xs: "14px",
                      sm: "15px",
                    },
                    fontWeight: 700,
                  }}
                >
                  可選擇員工（已選 {selectedCount}／
                  {selectableEmployees.length}）
                </Typography>

                <Box
                  component="label"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "#475569",
                    fontSize: "13px",
                    cursor:
                      selectableEmployees.length > 0
                        ? "pointer"
                        : "default",
                  }}
                >
                  <Checkbox
                    checked={allSelectableSelected}
                    indeterminate={someSelectableSelected}
                    onChange={handleToggleAll}
                    disabled={
                      !canCalculate ||
                      selectableEmployees.length === 0
                    }
                    size="small"
                    sx={{
                      color: "#94a3b8",
                      "&.Mui-checked": {
                        color: "#1f9bd1",
                      },
                      "&.MuiCheckbox-indeterminate": {
                        color: "#1f9bd1",
                      },
                    }}
                  />

                  全選符合資格員工
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: "10px",
                }}
              >
                {selectableEmployees.map(
                  (employee) => (
                    <EmployeeReadinessRow
                      key={employee.employee_id}
                      employee={employee}
                      selected={selectedEmployeeIds.includes(
                        Number(
                          employee.employee_id,
                        ),
                      )}
                      canCalculate={
                        canCalculate
                      }
                      onToggle={
                        handleToggleEmployee
                      }
                    />
                  ),
                )}
              </Box>

              {blockedEmployees.length > 0 ? (
                <>
                  <Typography
                    sx={{
                      mt: "18px",
                      mb: "10px",
                      color: "#c62828",
                      fontSize: {
                        xs: "14px",
                        sm: "15px",
                      },
                      fontWeight: 700,
                    }}
                  >
                    不可選擇員工（
                    {blockedEmployees.length}）
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    {blockedEmployees.map(
                      (employee) => (
                        <EmployeeReadinessRow
                          key={employee.employee_id}
                          employee={employee}
                          selected={false}
                          canCalculate={
                            false
                          }
                          onToggle={() => {}}
                        />
                      ),
                    )}
                  </Box>
                </>
              ) : null}

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

                {canCalculate ? (
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
                    disabled={
                      !calculationEnabled
                    }
                    sx={{
                      bgcolor: "#1f9bd1",
                      "&:hover": {
                        bgcolor: "#168dc5",
                      },
                    }}
                  >
                    {calculating
                      ? "計算中..."
                      : `計算已選員工（${selectedCount}）`}
                  </Button>
                ) : null}
              </Box>
            </>
          ) : null}
        </Box>
      </Collapse>
    </Box>
  );
}