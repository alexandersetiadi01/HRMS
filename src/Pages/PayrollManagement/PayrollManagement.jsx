import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getPayrollPeriods,
  getPayrollRanges,
  getPayrollRuns,
} from "../../API/payroll";
import CreatePayrollDialog from "./CreatePayrollDialog";
import PayrollReadinessPanel from "./PayrollReadinessPanel";
import PayrollCalculationPanel from "./PayrollCalculationPanel";
import PayrollCompletionPanel from "./PayrollCompletionPanel";

const STAGES = ["資料確認", "資料計算", "計算完成"];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  if (!value) return "--";

  const [date] = String(value).split(" ");
  return date.replaceAll("-", "/");
}

function formatDateTime(value) {
  if (!value) return "--";

  return String(value).replaceAll("-", "/");
}

function getRunStage(run) {
  const status = String(run?.status || "");

  if (status.includes("完成") || status.includes("關帳") || run?.closed_at) {
    return 2;
  }

  if (status.includes("已計算") || run?.calculated_at) {
    return 1;
  }

  return 0;
}

function getStatusColor(stage) {
  if (stage === 2) return "#159447";
  if (stage === 1) return "#ef8b18";

  return "#64748b";
}

function SummaryItem({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          mb: "4px",
          color: "#94a3b8",
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
          color: "#334155",
          fontSize: {
            xs: "14px",
            sm: "15px",
          },
          lineHeight: 1.5,
          overflowWrap: "anywhere",
        }}
      >
        {value || "--"}
      </Typography>
    </Box>
  );
}

function PayrollStageBar({ activeStage }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        borderBottom: "1px solid #e5e7eb",
        bgcolor: "#f8fafc",
      }}
    >
      {STAGES.map((stage, index) => {
        const isReached = index <= activeStage;
        const isActive = index === activeStage;

        return (
          <Box
            key={stage}
            sx={{
              position: "relative",
              minWidth: 0,
              py: {
                xs: "13px",
                sm: "16px",
              },
              px: {
                xs: "4px",
                sm: "12px",
              },
              textAlign: "center",
              color: isReached ? "#168dc5" : "#a8b0ba",
              fontSize: {
                xs: "13px",
                sm: "15px",
              },
              fontWeight: isActive ? 700 : 500,
              "&::after": isActive
                ? {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "3px",
                    bgcolor: "#1f9bd1",
                  }
                : undefined,
            }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: {
                  xs: "20px",
                  sm: "24px",
                },
                height: {
                  xs: "20px",
                  sm: "24px",
                },
                mr: {
                  xs: "4px",
                  sm: "7px",
                },
                borderRadius: "50%",
                bgcolor: isReached ? "#1f9bd1" : "#d7dce1",
                color: "#ffffff",
                fontSize: {
                  xs: "11px",
                  sm: "12px",
                },
              }}
            >
              {index + 1}
            </Box>

            {stage}
          </Box>
        );
      })}
    </Box>
  );
}

function PayrollRunCard({ run, onReload }) {
  const activeStage = getRunStage(run);
  const statusColor = getStatusColor(activeStage);

  const title =
    run.run_name || `${run.year || "--"} 年 ${run.month || "--"} 月薪資`;

  return (
    <Box
      sx={{
        border: "1px solid #dfe4e8",
        borderRadius: "5px",
        bgcolor: "#ffffff",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
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
          px: {
            xs: "12px",
            sm: "18px",
          },
          py: {
            xs: "13px",
            sm: "15px",
          },
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#1f2937",
              fontSize: {
                xs: "16px",
                sm: "18px",
              },
              fontWeight: 700,
              lineHeight: 1.45,
              overflowWrap: "anywhere",
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: "3px",
              color: "#7b8794",
              fontSize: {
                xs: "12px",
                sm: "13px",
              },
            }}
          >
            {run.range_name || run.range_code || "未命名薪資範圍"}
            {"　"}批次 #{run.payroll_run_id}
          </Typography>
        </Box>

        <Chip
          label={run.status || STAGES[activeStage]}
          size="small"
          sx={{
            height: "26px",
            flexShrink: 0,
            bgcolor: `${statusColor}14`,
            color: statusColor,
            border: `1px solid ${statusColor}40`,
            fontWeight: 700,
            fontSize: "13px",
          }}
        />
      </Box>

      <PayrollStageBar activeStage={activeStage} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "190px minmax(0, 1fr)",
          },
        }}
      >
        <Box
          sx={{
            display: {
              xs: "grid",
              md: "block",
            },
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            borderRight: {
              md: "1px solid #e5e7eb",
            },
            borderBottom: {
              xs: "1px solid #e5e7eb",
              md: "none",
            },
            bgcolor: "#fbfcfd",
          }}
        >
          {STAGES.map((stage, index) => (
            <Box
              key={stage}
              sx={{
                px: {
                  xs: "4px",
                  md: "18px",
                },
                py: {
                  xs: "11px",
                  md: "13px",
                },
                borderBottom: {
                  md: "1px solid #edf0f2",
                },
                borderRight: {
                  xs: index < STAGES.length - 1 ? "1px solid #edf0f2" : "none",
                  md: "none",
                },
                bgcolor: index === activeStage ? "#eaf7fd" : "transparent",
                color: index === activeStage ? "#168dc5" : "#7b8794",
                fontSize: {
                  xs: "12px",
                  sm: "14px",
                },
                fontWeight: index === activeStage ? 700 : 500,
                textAlign: {
                  xs: "center",
                  md: "left",
                },
              }}
            >
              {stage}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            px: {
              xs: "12px",
              sm: "20px",
            },
            py: {
              xs: "16px",
              sm: "20px",
            },
          }}
        >
          <Typography
            sx={{
              mb: "16px",
              color: "#334155",
              fontSize: {
                xs: "15px",
                sm: "16px",
              },
              fontWeight: 700,
            }}
          >
            {STAGES[activeStage]}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
              },
              columnGap: {
                xs: "14px",
                sm: "28px",
              },
              rowGap: {
                xs: "14px",
                sm: "18px",
              },
            }}
          >
            <SummaryItem
              label="計薪期間"
              value={`${formatDate(run.period_start)} ～ ${formatDate(run.period_end)}`}
            />

            <SummaryItem
              label="預定發薪日"
              value={formatDate(run.actual_pay_date || run.period_pay_date)}
            />

            <SummaryItem label="薪資類型" value={run.run_type} />

            <SummaryItem
              label="所得稅計算"
              value={Number(run.include_income_tax) === 1 ? "包含" : "不包含"}
            />

            <SummaryItem
              label="通知時間"
              value={formatDateTime(run.notification_at)}
            />

            <SummaryItem
              label="最後計算時間"
              value={formatDateTime(run.calculated_at)}
            />
          </Box>

          {activeStage === 0 ? (
            <PayrollReadinessPanel
              payrollRunId={run.payroll_run_id}
              onCalculated={onReload}
            />
          ) : null}

          {activeStage === 1 ? (
            <PayrollCalculationPanel
              payrollRunId={run.payroll_run_id}
              onReload={onReload}
            />
          ) : null}

          {activeStage === 2 ? (
            <PayrollCompletionPanel
              payrollRunId={run.payroll_run_id}
              onReload={onReload}
            />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

export default function PayrollManagement() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(currentMonth));
  const [rangeId, setRangeId] = useState("all");

  const [ranges, setRanges] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadPayrollData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [rangeRows, periodRows, runRows] = await Promise.all([
        getPayrollRanges(),
        getPayrollPeriods(),
        getPayrollRuns(),
      ]);

      setRanges(Array.isArray(rangeRows) ? rangeRows : []);

      setPeriods(Array.isArray(periodRows) ? periodRows : []);

      setRuns(Array.isArray(runRows) ? runRows : []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "無法載入薪資結算資料。"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  const years = useMemo(() => {
    const values = new Set([currentYear]);

    periods.forEach((period) => {
      values.add(Number(period.year));
    });

    runs.forEach((run) => {
      values.add(Number(run.year));
    });

    return [...values]
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => b - a);
  }, [currentYear, periods, runs]);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const matchesYear = String(run.year) === year;

      const matchesMonth = String(Number(run.month)) === String(Number(month));

      const matchesRange =
        rangeId === "all" || String(run.payroll_range_id) === rangeId;

      return matchesYear && matchesMonth && matchesRange;
    });
  }, [month, rangeId, runs, year]);

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
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
          mb: "18px",
        }}
      >
        <Box>
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
            薪資結算作業
          </Typography>

          <Typography
            sx={{
              mt: "4px",
              color: "#7b8794",
              fontSize: "13px",
            }}
          >
            依月份建立、計算與確認員工薪資
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: "8px",
            width: {
              xs: "100%",
              sm: "auto",
            },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPayrollData}
            disabled={loading}
            sx={{
              height: "36px",
              flex: {
                xs: 1,
                sm: "initial",
              },
              borderColor: "#c7d0d9",
              color: "#475569",
              fontSize: "14px",
            }}
          >
            重新整理
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            disabled={loading || ranges.length === 0}
            sx={{
              height: "36px",
              flex: {
                xs: 1,
                sm: "initial",
              },
              bgcolor: "#1f9bd1",
              fontSize: "14px",
              "&:hover": {
                bgcolor: "#168dc5",
              },
            }}
          >
            建立薪資
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "140px 140px minmax(180px, 240px)",
          },
          gap: "10px",
          alignItems: "center",
          p: {
            xs: "12px",
            sm: "14px",
          },
          mb: "16px",
          border: "1px solid #dfe4e8",
          borderRadius: "5px",
          bgcolor: "#ffffff",
        }}
      >
        <FormControl size="small" fullWidth>
          <Select
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            {years.map((value) => (
              <MenuItem key={value} value={String(value)}>
                {value} 年
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <Select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map(
              (value) => (
                <MenuItem key={value} value={String(value)}>
                  {value} 月
                </MenuItem>
              ),
            )}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          fullWidth
          sx={{
            gridColumn: {
              xs: "1 / -1",
              sm: "auto",
            },
          }}
        >
          <Select
            value={rangeId}
            onChange={(event) => setRangeId(event.target.value)}
          >
            <MenuItem value="all">全部薪資範圍</MenuItem>

            {ranges.map((range) => (
              <MenuItem
                key={range.payroll_range_id}
                value={String(range.payroll_range_id)}
              >
                {range.range_name ||
                  range.range_code ||
                  `薪資範圍 ${range.payroll_range_id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: "16px" }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box
          sx={{
            minHeight: "260px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={32} />
        </Box>
      ) : filteredRuns.length === 0 ? (
        <Box
          sx={{
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: "16px",
            border: "1px solid #dfe4e8",
            borderRadius: "5px",
            bgcolor: "#ffffff",
          }}
        >
          <Typography
            sx={{
              color: "#7b8794",
              fontSize: "15px",
              textAlign: "center",
            }}
          >
            此月份尚未建立薪資結算批次
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: "16px",
          }}
        >
          {filteredRuns.map((run) => (
            <PayrollRunCard
              key={run.payroll_run_id}
              run={run}
              onReload={loadPayrollData}
            />
          ))}
        </Box>
      )}

      <CreatePayrollDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        ranges={ranges}
        periods={periods}
        initialYear={year}
        initialMonth={month}
        initialRangeId={rangeId === "all" ? "" : rangeId}
        onCreated={async (created) => {
          setCreateDialogOpen(false);
          setYear(String(created.year));
          setMonth(String(created.month));
          setRangeId(String(created.payrollRangeId));
          await loadPayrollData();
        }}
      />
    </Box>
  );
}
