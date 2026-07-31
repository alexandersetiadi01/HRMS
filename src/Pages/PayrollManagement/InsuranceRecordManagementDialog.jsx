import {
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
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import {
  deleteEmployeeLaborInsuranceRecord,
  deleteEmployeeOccupationalInsuranceRecord,
  getEmployeeLaborInsuranceRecord,
  getEmployeeOccupationalInsuranceRecord,
  updateEmployeeLaborInsuranceRecord,
  updateEmployeeOccupationalInsuranceRecord,
} from "../../API/payroll";

const TYPE_CONFIG = {
  labor: {
    label: "勞保",
    get: getEmployeeLaborInsuranceRecord,
    update: updateEmployeeLaborInsuranceRecord,
    delete: deleteEmployeeLaborInsuranceRecord,
  },
  occupational: {
    label: "職保",
    get: getEmployeeOccupationalInsuranceRecord,
    update:
      updateEmployeeOccupationalInsuranceRecord,
    delete:
      deleteEmployeeOccupationalInsuranceRecord,
  },
};

const MODE_LABELS = {
  remarks: "修改備註",
  delete: "刪除異動紀錄",
  history: "查看異動歷程",
};

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  if (!value || value === "0000-00-00") {
    return "--";
  }

  return String(value)
    .slice(0, 10)
    .replaceAll("-", "/");
}

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  return String(value)
    .replace("T", " ")
    .replaceAll("-", "/")
    .slice(0, 19);
}

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "--";
  }

  return new Intl.NumberFormat("zh-TW").format(
    amount,
  );
}

function getRecordId(record, type) {
  return type === "labor"
    ? record?.labor_insurance_record_id
    : record?.occupational_insurance_record_id;
}

function getUnitLabel(record) {
  return [
    record?.insurance_unit_code,
    record?.insurance_unit_name,
  ]
    .filter(Boolean)
    .join("｜");
}

function getActorLabel(historyItem) {
  return (
    [
      historyItem?.actor_employee_no,
      historyItem?.actor_name ||
        historyItem?.actor_english_name,
    ]
      .filter(Boolean)
      .join("｜") || "系統"
  );
}

function RecordSummary({ record }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: "14px",
        mb: "16px",
        borderColor: "#dfe4e8",
        bgcolor: "#f8fafc",
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
          },
          gap: "10px 18px",
        }}
      >
        <Typography sx={{ fontSize: "13px" }}>
          生效日：{formatDate(record?.effective_date)}
        </Typography>

        <Typography sx={{ fontSize: "13px" }}>
          異動：{record?.action_type || "--"}
        </Typography>

        <Typography sx={{ fontSize: "13px" }}>
          投保單位：{getUnitLabel(record) || "--"}
        </Typography>

        <Typography sx={{ fontSize: "13px" }}>
          投保薪資：NT${" "}
          {formatAmount(record?.insured_salary)}
        </Typography>
      </Box>
    </Paper>
  );
}

function HistorySnapshot({ snapshot }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
        },
        gap: "7px 16px",
        mt: "11px",
      }}
    >
      <Typography sx={{ fontSize: "12px" }}>
        生效日：
        {formatDate(snapshot?.effective_date)}
      </Typography>

      <Typography sx={{ fontSize: "12px" }}>
        狀態：{snapshot?.status || "--"}
      </Typography>

      <Typography sx={{ fontSize: "12px" }}>
        異動：{snapshot?.action_type || "--"}
      </Typography>

      <Typography sx={{ fontSize: "12px" }}>
        投保薪資：NT${" "}
        {formatAmount(snapshot?.insured_salary)}
      </Typography>

      <Typography
        sx={{
          gridColumn: {
            xs: "auto",
            sm: "1 / -1",
          },
          fontSize: "12px",
          overflowWrap: "anywhere",
        }}
      >
        備註：{snapshot?.remarks || "--"}
      </Typography>
    </Box>
  );
}

export default function InsuranceRecordManagementDialog({
  open,
  mode,
  type,
  record,
  isLatest,
  onClose,
  onSuccess,
}) {
  const config = TYPE_CONFIG[type];
  const recordId = getRecordId(record, type);

  const [remarks, setRemarks] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setRemarks(record?.remarks || "");
    setDetail(null);
    setError("");

    if (mode !== "history" || !recordId) {
      return undefined;
    }

    let active = true;

    async function loadHistory() {
      setLoading(true);

      try {
        const result = await config.get(recordId);

        if (active) {
          setDetail(result);
        }
      } catch (requestError) {
        if (active) {
          setError(
            getErrorMessage(
              requestError,
              "無法載入異動歷程。",
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [
    config,
    mode,
    open,
    record,
    recordId,
  ]);

  const title = useMemo(
    () =>
      `${config.label}${MODE_LABELS[mode] || ""}`,
    [config.label, mode],
  );

  const history = Array.isArray(detail?.history)
    ? detail.history
    : [];

  async function handleSaveRemarks() {
    if (!isLatest) {
      setError(
        "只有目前最後一筆異動紀錄可以修改。",
      );
      return;
    }

    if (remarks.trim().length > 250) {
      setError("備註不可超過 250 個字。");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await config.update(recordId, {
        remarks: remarks.trim(),
      });

      await onSuccess(
        `${config.label}異動備註已更新。`,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "更新異動備註失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isLatest) {
      setError(
        "為避免破壞生效歷程，只能刪除目前最後一筆異動紀錄。",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await config.delete(recordId);

      await onSuccess(
        `${config.label}最後一筆異動紀錄已刪除。`,
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "刪除異動紀錄失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={
        submitting ? undefined : onClose
      }
      fullWidth
      maxWidth={
        mode === "history" ? "md" : "sm"
      }
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {title}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: "16px" }}
          >
            {error}
          </Alert>
        )}

        <RecordSummary record={record} />

        {mode === "remarks" && (
          <>
            <Alert
              severity="info"
              sx={{ mb: "16px" }}
            >
              只會修改備註，不會變更生效日、投保單位或投保薪資。
            </Alert>

            <TextField
              autoFocus
              fullWidth
              label="備註"
              value={remarks}
              onChange={(event) => {
                setRemarks(event.target.value);
                setError("");
              }}
              multiline
              minRows={4}
              inputProps={{ maxLength: 250 }}
              helperText={`${remarks.length}/250`}
            />
          </>
        )}

        {mode === "delete" && (
          <Alert severity="warning">
            此操作會將這筆紀錄標示為已刪除，並保留刪除前快照及操作歷程。刪除後，上一筆有效異動將成為目前狀態。
          </Alert>
        )}

        {mode === "history" &&
          (loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: "44px",
              }}
            >
              <CircularProgress size={26} />
            </Box>
          ) : history.length === 0 ? (
            <Alert severity="info">
              此紀錄尚無可顯示的操作歷程。
            </Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: "12px",
              }}
            >
              {history.map(
                (historyItem, index) => (
                  <Paper
                    key={
                      historyItem.insurance_record_audit_id ||
                      index
                    }
                    variant="outlined"
                    sx={{
                      p: {
                        xs: "13px",
                        sm: "15px",
                      },
                      borderColor: "#dfe4e8",
                      boxShadow: "none",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: {
                          xs: "flex-start",
                          sm: "center",
                        },
                        justifyContent:
                          "space-between",
                        flexDirection: {
                          xs: "column",
                          sm: "row",
                        },
                        gap: "7px 12px",
                      }}
                    >
                      <Chip
                        label={
                          historyItem.audit_action ||
                          "異動"
                        }
                        size="small"
                        color={
                          historyItem.audit_action ===
                          "刪除"
                            ? "error"
                            : historyItem.audit_action ===
                                "修改"
                              ? "primary"
                              : "success"
                        }
                        variant="outlined"
                      />

                      <Typography
                        sx={{
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        {formatDateTime(
                          historyItem.created_at,
                        )}
                        {"　"}操作人：
                        {getActorLabel(historyItem)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: "10px" }} />

                    <HistorySnapshot
                      snapshot={
                        historyItem.snapshot || {}
                      }
                    />
                  </Paper>
                ),
              )}
            </Box>
          ))}
      </DialogContent>

      <DialogActions sx={{ p: "14px 20px" }}>
        <Button
          type="button"
          color="inherit"
          disabled={submitting}
          onClick={onClose}
        >
          {mode === "history" ? "關閉" : "取消"}
        </Button>

        {mode === "remarks" && (
          <Button
            type="button"
            variant="contained"
            disabled={submitting}
            onClick={handleSaveRemarks}
          >
            {submitting ? (
              <CircularProgress
                size={20}
                color="inherit"
              />
            ) : (
              "儲存備註"
            )}
          </Button>
        )}

        {mode === "delete" && (
          <Button
            type="button"
            variant="contained"
            color="error"
            disabled={submitting}
            onClick={handleDelete}
          >
            {submitting ? (
              <CircularProgress
                size={20}
                color="inherit"
              />
            ) : (
              "確認刪除"
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}