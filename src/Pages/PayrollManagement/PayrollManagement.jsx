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
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  deletePayrollRun,
  getPayrollPeriods,
  getPayrollRanges,
  getPayrollRuns,
} from "../../API/payroll";
import CreatePayrollDialog from "./CreatePayrollDialog";
import SuccessDialog from "../../Components/SuccessDialog";
import PayrollReadinessPanel from "./PayrollReadinessPanel";
import PayrollCalculationPanel from "./PayrollCalculationPanel";
import PayrollCompletionPanel from "./PayrollCompletionPanel";
import { getStoredAuthUser } from "../../API/auth";
import { hasPayrollPermission } from "../../Utils/PayrollPermissions";

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

function getPayrollPeriodIdentity(run) {
  const periodEnd = String(run?.period_end || "").split(" ")[0];

  const match = periodEnd.match(/^(\d{4})-(\d{2})-\d{2}$/);

  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
    };
  }

  return {
    year: Number(run?.year),
    month: Number(run?.month),
  };
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

function PayrollStageBar({
  progressStage,
  selectedStage,
  finalStageCompleted,
  onSelectStage,
}) {
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
        const isAvailable = index <= progressStage;
        const isSelected = index === selectedStage;
        const isCompleted =
          index < progressStage || (index === 2 && finalStageCompleted);

        return (
          <Box
            key={stage}
            component="button"
            type="button"
            onClick={() => onSelectStage(index)}
            disabled={!isAvailable}
            aria-current={isSelected ? "step" : undefined}
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
              color: isCompleted
                ? "#159447"
                : isAvailable
                  ? "#168dc5"
                  : "#a8b0ba",
              fontSize: {
                xs: "13px",
                sm: "15px",
              },
              fontWeight: isSelected ? 700 : 500,
              fontFamily: "inherit",
              border: 0,
              bgcolor: isSelected ? "#f2faff" : "transparent",
              cursor: isAvailable ? "pointer" : "not-allowed",
              "&:hover": isAvailable
                ? {
                    bgcolor: isSelected ? "#eaf7fd" : "#f8fbfd",
                  }
                : undefined,
              "&:focus-visible": {
                outline: "2px solid #168dc5",
                outlineOffset: "-2px",
              },
              "&::after": isSelected
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
                bgcolor: isCompleted
                  ? "#159447"
                  : isAvailable
                    ? "#1f9bd1"
                    : "#d7dce1",
                color: "#ffffff",
                fontSize: {
                  xs: "11px",
                  sm: "12px",
                },
              }}
            >
              {isCompleted ? (
                <CheckIcon sx={{ fontSize: "15px" }} />
              ) : (
                index + 1
              )}
            </Box>

            {stage}
          </Box>
        );
      })}
    </Box>
  );
}

function PayrollRunCard({
  run,
  onReload,
  onDelete,
  canCalculate,
  canApprove,
  canClose,
}) {
  const progressStage = getRunStage(run);
  const payrollPeriod = getPayrollPeriodIdentity(run);
  const [selectedStage, setSelectedStage] = useState(progressStage);
  const statusColor = getStatusColor(progressStage);

  const finalStageCompleted =
    Boolean(run?.closed_at) ||
    ["已關帳", "已通知"].includes(String(run?.status || ""));

  const canDelete =
    canCalculate &&
    String(run?.status || "") === "草稿";

  const title =
    run.run_name ||
    `${payrollPeriod.year || "--"} 年 ${payrollPeriod.month || "--"} 月薪資`;

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

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <Chip
            label={run.status || STAGES[progressStage]}
            size="small"
            sx={{
              height: "26px",
              bgcolor: `${statusColor}14`,
              color: statusColor,
              border: `1px solid ${statusColor}40`,
              fontWeight: 700,
              fontSize: "13px",
            }}
          />

          {canDelete ? (
            <Tooltip title="刪除薪資批次">
              <IconButton
                size="small"
                onClick={() => onDelete(run)}
                sx={{
                  color: "#64748b",
                  "&:hover": {
                    color: "#dc2626",
                    bgcolor: "#fef2f2",
                  },
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Box>
      </Box>

      <PayrollStageBar
        progressStage={progressStage}
        selectedStage={selectedStage}
        finalStageCompleted={finalStageCompleted}
        onSelectStage={setSelectedStage}
      />

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
          {STAGES[selectedStage]}
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
            value={`${formatDate(run.period_start)} ～ ${formatDate(
              run.period_end,
            )}`}
          />

          <SummaryItem
            label="預定發薪日"
            value={formatDate(run.actual_pay_date || run.period_pay_date)}
          />

          <SummaryItem label="薪資類型" value={run.run_type} />

          <SummaryItem label="所得稅計算" value="依員工稅務設定" />

          <SummaryItem
            label="通知時間"
            value={formatDateTime(run.notification_at)}
          />

          <SummaryItem
            label="最後計算時間"
            value={formatDateTime(run.calculated_at)}
          />
        </Box>

        {selectedStage === 0 ? (
          <PayrollReadinessPanel
            payrollRunId={run.payroll_run_id}
            canCalculate={canCalculate}
            onCalculated={onReload}
          />
        ) : null}

        {selectedStage === 1 ? (
          <PayrollCalculationPanel
            payrollRunId={run.payroll_run_id}
            canCalculate={canCalculate}
            canApprove={canApprove}
            onReload={onReload}
          />
        ) : null}

        {selectedStage === 2 ? (
          <PayrollCompletionPanel
            payrollRunId={run.payroll_run_id}
            canClose={canClose}
            onReload={onReload}
          />
        ) : null}
      </Box>
    </Box>
  );
}

export default function PayrollManagement() {
  const authUser = useMemo(() => getStoredAuthUser(), []);

  const canCalculate = hasPayrollPermission(authUser, "payroll_calculate");

  const canApprove = hasPayrollPermission(authUser, "payroll_approve");

  const canClose = hasPayrollPermission(authUser, "payroll_close");

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

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

  const handleDeletePayrollRun = async () => {
    const payrollRunId = Number(deleteTarget?.payroll_run_id || 0);

    if (payrollRunId <= 0) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deletePayrollRun(payrollRunId);

      setDeleteTarget(null);
      await loadPayrollData();

      setSuccessDialog({
        open: true,
        title: "刪除成功",
        message: "薪資批次已成功刪除。",
      });
    } catch (deleteRequestError) {
      setDeleteError(
        getErrorMessage(
          deleteRequestError,
          "刪除薪資批次失敗。",
        ),
      );
    } finally {
      setDeleting(false);
    }
  };

  const years = useMemo(() => {
    const values = new Set([currentYear]);

    periods.forEach((period) => {
      values.add(Number(period.year));
    });

    runs.forEach((run) => {
      values.add(getPayrollPeriodIdentity(run).year);
    });

    return [...values]
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => b - a);
  }, [currentYear, periods, runs]);

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const payrollPeriod = getPayrollPeriodIdentity(run);

      const matchesYear = String(payrollPeriod.year) === year;

      const matchesMonth =
        String(payrollPeriod.month) === String(Number(month));

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

          {canCalculate ? (
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
          ) : null}
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
              canCalculate={canCalculate}
              canApprove={canApprove}
              canClose={canClose}
              onDelete={(target) => {
                setDeleteTarget(target);
                setDeleteError("");
              }}
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

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={deleting ? undefined : () => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          確認刪除
        </DialogTitle>

        <DialogContent>
          {deleteError ? (
            <Alert severity="error" sx={{ mb: "14px" }}>
              {deleteError}
            </Alert>
          ) : null}

          <Typography
            sx={{
              color: "#475569",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            確定要刪除「
            {deleteTarget?.run_name ||
              `${getPayrollPeriodIdentity(deleteTarget).year || "--"} 年 ${getPayrollPeriodIdentity(deleteTarget).month || "--"} 月薪資`}
            」批次 #{deleteTarget?.payroll_run_id} 嗎？刪除後將一併清除此批次尚未鎖定的計算結果、快照及相關暫存資料。
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            pb: "18px",
          }}
        >
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            取消
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeletePayrollRun}
            disabled={deleting}
          >
            {deleting ? "處理中…" : "確認刪除"}
          </Button>
        </DialogActions>
      </Dialog>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() =>
          setSuccessDialog({
            open: false,
            title: "",
            message: "",
          })
        }
      />
    </Box>
  );
}
