import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  Divider,
  Typography,
} from "@mui/material";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  closePayrollRun,
  getPayrollRunResults,
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
  }).format(Math.abs(Number(value || 0)));
}

function formatDateTime(value) {
  if (!value) return "--";

  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function SummaryCard({
  label,
  value,
  color,
  background,
  icon,
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: {
          xs: "13px",
          sm: "16px",
        },
        border: "1px solid #e5e7eb",
        borderRadius: "5px",
        bgcolor: background,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          mb: "6px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            color,
          }}
        >
          {icon}
        </Box>

        <Typography
          sx={{
            color: "#64748b",
            fontSize: {
              xs: "12px",
              sm: "13px",
            },
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      </Box>

      <Typography
        sx={{
          color,
          fontSize: {
            xs: "19px",
            sm: "24px",
          },
          fontWeight: 700,
          lineHeight: 1.2,
          overflowWrap: "anywhere",
        }}
      >
        NT$ {formatNumber(value)}
      </Typography>
    </Box>
  );
}

function EmployeeReviewRow({ result }) {
  const employeeName =
    result.display_name ||
    result.english_name ||
    `員工 #${result.employee_id}`;

  const isClosed =
    result.status === "已關帳" ||
    result.status === "closed";

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr) auto",
          md: "minmax(180px, 1fr) repeat(3, 130px) 90px",
        },
        alignItems: "center",
        gap: {
          xs: "10px",
          md: "14px",
        },
        p: {
          xs: "13px",
          sm: "15px",
        },
        borderBottom: "1px solid #edf0f3",
        "&:last-child": {
          borderBottom: 0,
        },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: "#1f2937",
            fontSize: {
              xs: "13px",
              sm: "14px",
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
            fontSize: "11px",
          }}
        >
          員工編號：{result.employee_no || "--"}
        </Typography>
      </Box>

      <Box
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
          textAlign: "right",
        }}
      >
        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: "11px",
          }}
        >
          應發
        </Typography>

        <Typography
          sx={{
            mt: "2px",
            color: "#15803d",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          NT$ {formatNumber(result.gross_pay)}
        </Typography>
      </Box>

      <Box
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
          textAlign: "right",
        }}
      >
        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: "11px",
          }}
        >
          扣款
        </Typography>

        <Typography
          sx={{
            mt: "2px",
            color: "#c62828",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          NT$ {formatNumber(result.total_deduction)}
        </Typography>
      </Box>

      <Box
        sx={{
          textAlign: "right",
        }}
      >
        <Typography
          sx={{
            display: {
              xs: "none",
              md: "block",
            },
            color: "#94a3b8",
            fontSize: "11px",
          }}
        >
          實發
        </Typography>

        <Typography
          sx={{
            mt: {
              xs: 0,
              md: "2px",
            },
            color: "#168dc5",
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          NT$ {formatNumber(result.net_pay)}
        </Typography>
      </Box>

      <Chip
        size="small"
        icon={
          isClosed ? (
            <LockOutlinedIcon />
          ) : (
            <CheckCircleOutlineIcon />
          )
        }
        label={result.status || "已核准"}
        sx={{
          display: {
            xs: "none",
            md: "inline-flex",
          },
          justifySelf: "end",
          bgcolor: isClosed ? "#f1f5f9" : "#eaf8ef",
          color: isClosed ? "#475569" : "#15803d",
          border: isClosed
            ? "1px solid #cbd5e1"
            : "1px solid #b9e5c8",
          fontWeight: 700,
          "& .MuiChip-icon": {
            color: "inherit",
            fontSize: "15px",
          },
        }}
      />

      <Box
        sx={{
          display: {
            xs: "grid",
            md: "none",
          },
          gridColumn: "1 / -1",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "8px",
          p: "10px",
          bgcolor: "#f8fafc",
          borderRadius: "5px",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "10px",
            }}
          >
            應發
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#15803d",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            NT$ {formatNumber(result.gross_pay)}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "10px",
            }}
          >
            扣款
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#c62828",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            NT$ {formatNumber(result.total_deduction)}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: "10px",
            }}
          >
            狀態
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: isClosed
                ? "#475569"
                : "#15803d",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {result.status || "已核准"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function PayrollCompletionPanel({
  payrollRunId,
  onReload,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] =
    useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadResults = useCallback(async () => {
    if (!payrollRunId) return;

    setLoading(true);
    setError("");

    try {
      const result = await getPayrollRunResults(
        payrollRunId,
      );

      setData({
        ...result,
        summary: result?.summary || {},
        missing_employees: Array.isArray(
          result?.missing_employees,
        )
          ? result.missing_employees
          : [],
        results: Array.isArray(result?.results)
          ? result.results
          : [],
      });
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          "無法載入薪資完成確認資料。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [payrollRunId]);

  useEffect(() => {
    setData(null);
    setError("");
    setMessage("");
    loadResults();
  }, [loadResults]);

  const summary = data?.summary || {};
  const results = data?.results || [];
  const missingEmployees =
    data?.missing_employees || [];

  const isClosed = useMemo(
    () =>
      ["已關帳", "已通知"].includes(
        String(data?.run_status || ""),
      ),
    [data?.run_status],
  );

  const allResultsApproved =
    results.length > 0 &&
    results.every((result) =>
      ["已核准", "已關帳", "approved", "closed"].includes(
        String(result.status || ""),
      ),
    );

  const countsMatch =
    Number(summary.expected_count || 0) > 0 &&
    Number(summary.expected_count || 0) ===
      Number(summary.result_count || 0);

  const canClose =
    !isClosed &&
    data?.run_status === "計算完成" &&
    countsMatch &&
    missingEmployees.length === 0 &&
    allResultsApproved &&
    Boolean(data?.notification_at);

  async function handleClose() {
    setCloseDialogOpen(false);
    setClosing(true);
    setError("");
    setMessage("");

    try {
      const result = await closePayrollRun(
        payrollRunId,
      );

      if (result?.already_closed) {
        setMessage("此薪資批次已經完成關帳。");
      } else {
        setMessage(
          `薪資批次關帳完成，共鎖定 ${
            Number(result?.closed_count || 0)
          } 位員工的薪資結果。`,
        );
      }

      await loadResults();
      await onReload?.();
    } catch (closeError) {
      setError(
        getErrorMessage(
          closeError,
          "薪資批次關帳失敗。",
        ),
      );
    } finally {
      setClosing(false);
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
      <Typography
        sx={{
          mb: "14px",
          color: "#334155",
          fontSize: {
            xs: "15px",
            sm: "16px",
          },
          fontWeight: 700,
        }}
      >
        完成確認
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {message ? (
        <Alert severity="success" sx={{ mb: "14px" }}>
          {message}
        </Alert>
      ) : null}

      {loading ? (
        <Box
          sx={{
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={30} />
        </Box>
      ) : data ? (
        <>
          {isClosed ? (
            <Alert
              severity="success"
              icon={<LockOutlinedIcon />}
              sx={{ mb: "14px" }}
            >
              此薪資批次已完成關帳，所有薪資結果均已鎖定。
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: "14px" }}>
              請完成最後確認。關帳後無法重新計算此薪資批次。
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },
              gap: "10px",
            }}
          >
            <SummaryCard
              label="應發總額"
              value={summary.gross_pay_total}
              color="#15803d"
              background="#f2fbf5"
              icon={
                <PaymentsOutlinedIcon fontSize="small" />
              }
            />

            <SummaryCard
              label="扣款總額"
              value={summary.deduction_total}
              color="#c62828"
              background="#fff7f7"
              icon={
                <AccountBalanceWalletOutlinedIcon fontSize="small" />
              }
            />

            <SummaryCard
              label="實發總額"
              value={summary.net_pay_total}
              color="#168dc5"
              background="#f2fbff"
              icon={<TaskAltIcon fontSize="small" />}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "10px",
              mt: "12px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                p: "13px",
                border: "1px solid #e5e7eb",
                borderRadius: "5px",
                bgcolor: "#ffffff",
              }}
            >
              <EventOutlinedIcon
                sx={{
                  color: "#168dc5",
                  fontSize: "21px",
                }}
              />

              <Box>
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: "11px",
                  }}
                >
                  薪資通知時間
                </Typography>

                <Typography
                  sx={{
                    mt: "2px",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {formatDateTime(data.notification_at)}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                p: "13px",
                border: "1px solid #e5e7eb",
                borderRadius: "5px",
                bgcolor: "#ffffff",
              }}
            >
              <LockOutlinedIcon
                sx={{
                  color: isClosed
                    ? "#15803d"
                    : "#64748b",
                  fontSize: "21px",
                }}
              />

              <Box>
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: "11px",
                  }}
                >
                  關帳時間
                </Typography>

                <Typography
                  sx={{
                    mt: "2px",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {formatDateTime(data.closed_at)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {!data.notification_at ? (
            <Alert severity="error" sx={{ mt: "14px" }}>
              此薪資批次尚未設定通知時間，無法完成關帳。
            </Alert>
          ) : null}

          {missingEmployees.length > 0 ? (
            <Alert severity="error" sx={{ mt: "14px" }}>
              尚有 {missingEmployees.length} 位員工沒有薪資結果，無法完成關帳。
            </Alert>
          ) : null}

          {!allResultsApproved && !isClosed ? (
            <Alert severity="warning" sx={{ mt: "14px" }}>
              尚有員工薪資結果未核准，請返回資料計算階段確認。
            </Alert>
          ) : null}

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
              最終員工薪資確認
            </Typography>

            <Chip
              size="small"
              label={`${results.length} 位員工`}
              sx={{
                bgcolor: "#edf8fd",
                color: "#168dc5",
                fontWeight: 700,
              }}
            />
          </Box>

          {results.length > 0 ? (
            <Box
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: "5px",
                bgcolor: "#ffffff",
                overflow: "hidden",
              }}
            >
              {results.map((result) => (
                <EmployeeReviewRow
                  key={result.payroll_result_id}
                  result={result}
                />
              ))}
            </Box>
          ) : (
            <Alert severity="warning">
              此薪資批次目前沒有薪資結果。
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: "16px",
            }}
          >
            <Button
              variant="contained"
              startIcon={
                closing ? (
                  <CircularProgress
                    size={17}
                    color="inherit"
                  />
                ) : isClosed ? (
                  <LockOutlinedIcon />
                ) : (
                  <TaskAltIcon />
                )
              }
              onClick={() => setCloseDialogOpen(true)}
              disabled={!canClose || closing}
              sx={{
                width: {
                  xs: "100%",
                  sm: "auto",
                },
                bgcolor: isClosed
                  ? "#64748b"
                  : "#1f9bd1",
                "&:hover": {
                  bgcolor: isClosed
                    ? "#64748b"
                    : "#168dc5",
                },
              }}
            >
              {closing
                ? "關帳中..."
                : isClosed
                  ? "已完成關帳"
                  : "確認並完成關帳"}
            </Button>
          </Box>
        </>
      ) : null}

      <Dialog
        open={closeDialogOpen}
        onClose={
          closing
            ? undefined
            : () => setCloseDialogOpen(false)
        }
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            width: {
              xs: "calc(100% - 24px)",
              sm: "100%",
            },
            m: {
              xs: "12px",
              sm: "32px",
            },
            borderRadius: "6px",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: {
              xs: "16px",
              sm: "22px",
            },
            py: "16px",
            borderBottom: "1px solid #e5e7eb",
            color: "#1f2937",
            fontSize: {
              xs: "18px",
              sm: "20px",
            },
            fontWeight: 700,
          }}
        >
          確認完成關帳
        </DialogTitle>

        <DialogContent
          sx={{
            px: {
              xs: "16px",
              sm: "22px",
            },
            py: "20px !important",
          }}
        >
          <Alert severity="warning">
            確定要完成關帳嗎？關帳後薪資結果將被鎖定，無法再重新計算或修改。
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            px: {
              xs: "16px",
              sm: "22px",
            },
            py: "14px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setCloseDialogOpen(false)}
            disabled={closing}
            sx={{
              color: "#475569",
              borderColor: "#cbd5e1",
            }}
          >
            取消
          </Button>

          <Button
            variant="contained"
            onClick={handleClose}
            disabled={closing}
            startIcon={
              closing ? (
                <CircularProgress
                  size={17}
                  color="inherit"
                />
              ) : (
                <TaskAltIcon />
              )
            }
            sx={{
              bgcolor: "#1f9bd1",
              "&:hover": {
                bgcolor: "#168dc5",
              },
            }}
          >
            {closing ? "關帳中..." : "確認關帳"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}