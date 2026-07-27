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
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import {
  createInsuranceUnitAccidentRate,
  deleteInsuranceUnitAccidentRate,
  getInsuranceUnit,
} from "../../API/payroll";

const EMPTY_FORM = {
  accident_rate: "",
  effective_from: "",
  effective_to: "",
};

function getLocalDate(offsetDays = 0) {
  const now = new Date();

  now.setDate(now.getDate() + offsetDays);

  const local = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60000,
  );

  return local.toISOString().slice(0, 10);
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  return value
    ? String(value).replaceAll("-", "/")
    : "無期限";
}

function formatRate(value) {
  const rate = Number(value);

  if (!Number.isFinite(rate)) {
    return "-";
  }

  return `${rate.toLocaleString("zh-TW", {
    maximumFractionDigits: 4,
  })}%`;
}

function getRateStatus(rate, today) {
  const effectiveFrom = String(
    rate?.effective_from || "",
  );
  const effectiveTo = String(
    rate?.effective_to || "",
  );

  if (effectiveFrom > today) {
    return {
      label: "尚未生效",
      color: "info",
    };
  }

  if (effectiveTo && effectiveTo < today) {
    return {
      label: "已結束",
      color: "default",
    };
  }

  return {
    label: "目前生效",
    color: "success",
  };
}

function sortRates(rates) {
  return [...rates].sort((left, right) => {
    const dateDifference = String(
      right?.effective_from || "",
    ).localeCompare(
      String(left?.effective_from || ""),
    );

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return (
      Number(right?.accident_rate_id || 0) -
      Number(left?.accident_rate_id || 0)
    );
  });
}

export default function InsuranceUnitRateHistoryDialog({
  open,
  unit,
  onClose,
  onChanged,
}) {
  const today = getLocalDate();
  const tomorrow = getLocalDate(1);

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    effective_from: tomorrow,
  });

  const [submitting, setSubmitting] =
    useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState(null);
  const [deleting, setDeleting] =
    useState(false);

  const loadDetail = useCallback(async () => {
    if (
      !open ||
      !unit?.insurance_unit_id
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getInsuranceUnit(
        unit.insurance_unit_id,
      );

      setDetail(data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "讀取職災保險費率紀錄失敗。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [open, unit]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDetail(null);
    setError("");
    setMessage("");
    setForm({
      ...EMPTY_FORM,
      effective_from: tomorrow,
    });
    setSubmitting(false);
    setDeleteTarget(null);
    setDeleting(false);

    loadDetail();
  }, [loadDetail, open, tomorrow]);

  const rates = useMemo(() => {
    return sortRates(
      Array.isArray(detail?.accident_rates)
        ? detail.accident_rates
        : [],
    );
  }, [detail]);

  const latestFutureRateId = useMemo(() => {
    const futureRate = rates.find((rate) => {
      return (
        String(rate?.effective_from || "") >
        today
      );
    });

    return (
      futureRate?.accident_rate_id || null
    );
  }, [rates, today]);

  const latestEffectiveFrom = useMemo(() => {
    return rates.reduce((latest, rate) => {
      const date = String(
        rate?.effective_from || "",
      );

      return date > latest ? date : latest;
    }, "");
  }, [rates]);

  function setField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function validateForm() {
    const rate = Number(form.accident_rate);

    if (
      form.accident_rate === "" ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      rate > 100
    ) {
      return "職災保險費率必須介於 0 至 100 之間。";
    }

    if (!form.effective_from) {
      return "請選擇費率生效日。";
    }

    if (form.effective_from <= today) {
      return "新增費率的生效日必須晚於今天。";
    }

    if (
      latestEffectiveFrom &&
      form.effective_from <=
        latestEffectiveFrom
    ) {
      return "新增費率的生效日必須晚於現有最後一筆費率。";
    }

    const unitEffectiveFrom = String(
      detail?.effective_from || "",
    );
    const unitEffectiveTo = String(
      detail?.effective_to || "",
    );

    if (
      unitEffectiveFrom &&
      form.effective_from <
        unitEffectiveFrom
    ) {
      return "費率生效日不可早於投保單位生效日。";
    }

    if (
      unitEffectiveTo &&
      form.effective_from >
        unitEffectiveTo
    ) {
      return "費率生效日不可晚於投保單位失效日。";
    }

    if (
      form.effective_to &&
      form.effective_to <
        form.effective_from
    ) {
      return "費率失效日不可早於費率生效日。";
    }

    if (
      unitEffectiveTo &&
      form.effective_to &&
      form.effective_to > unitEffectiveTo
    ) {
      return "費率失效日不可晚於投保單位失效日。";
    }

    return "";
  }

  async function handleCreate(event) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await createInsuranceUnitAccidentRate(
        unit.insurance_unit_id,
        {
          accident_rate: Number(
            form.accident_rate,
          ),
          effective_from:
            form.effective_from,
          effective_to:
            form.effective_to || null,
        },
      );

      setForm({
        ...EMPTY_FORM,
        effective_from: tomorrow,
      });

      setMessage(
        "新的職災保險費率已新增。",
      );

      await loadDetail();

      await onChanged?.(
        "職災保險費率已更新。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "新增職災保險費率失敗。",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (
      !deleteTarget?.accident_rate_id
    ) {
      return;
    }

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      await deleteInsuranceUnitAccidentRate(
        unit.insurance_unit_id,
        deleteTarget.accident_rate_id,
      );

      setDeleteTarget(null);

      setMessage(
        "未生效的職災保險費率已刪除。",
      );

      await loadDetail();

      await onChanged?.(
        "職災保險費率已更新。",
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "刪除職災保險費率失敗。",
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={
          submitting || deleting
            ? undefined
            : onClose
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          職災保險費率紀錄

          <Typography
            component="div"
            sx={{
              mt: "3px",
              color: "#64748b",
              fontSize: "13px",
              fontWeight: 400,
            }}
          >
            {unit?.unit_name || "-"}

            {unit?.unit_code
              ? `（${unit.unit_code}）`
              : ""}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {error ? (
            <Alert
              severity="error"
              onClose={() => setError("")}
              sx={{ mb: "14px" }}
            >
              {error}
            </Alert>
          ) : null}

          {message ? (
            <Alert
              severity="success"
              onClose={() =>
                setMessage("")
              }
              sx={{ mb: "14px" }}
            >
              {message}
            </Alert>
          ) : null}

          <Paper
            component="form"
            onSubmit={handleCreate}
            variant="outlined"
            sx={{
              p: {
                xs: "14px",
                sm: "18px",
              },
              borderColor: "#dfe4e8",
            }}
          >
            <Typography
              sx={{
                color: "#1f2937",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              新增未來費率
            </Typography>

            <Typography
              sx={{
                mt: "3px",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              新費率生效後，系統會依有效日期自動使用正確費率。
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm:
                    "repeat(3, minmax(0, 1fr))",
                },
                gap: "12px",
                mt: "14px",
              }}
            >
              <TextField
                label="職災保險費率（%）"
                type="number"
                size="small"
                required
                value={form.accident_rate}
                onChange={(event) =>
                  setField(
                    "accident_rate",
                    event.target.value,
                  )
                }
                inputProps={{
                  min: 0,
                  max: 100,
                  step: 0.0001,
                }}
              />

              <TextField
                label="費率生效日"
                type="date"
                size="small"
                required
                value={form.effective_from}
                onChange={(event) =>
                  setField(
                    "effective_from",
                    event.target.value,
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: tomorrow,
                }}
              />

              <TextField
                label="費率失效日"
                type="date"
                size="small"
                value={form.effective_to}
                onChange={(event) =>
                  setField(
                    "effective_to",
                    event.target.value,
                  )
                }
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min:
                    form.effective_from ||
                    tomorrow,
                }}
                helperText="留空代表持續生效"
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                mt: "14px",
              }}
            >
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={
                  loading || submitting
                }
              >
                {submitting
                  ? "新增中…"
                  : "新增費率"}
              </Button>
            </Box>
          </Paper>

          <Typography
            sx={{
              mt: "20px",
              mb: "10px",
              color: "#1f2937",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            費率歷程
          </Typography>

          {loading ? (
            <Box
              sx={{
                minHeight: "150px",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress size={30} />
            </Box>
          ) : rates.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: "24px",
                borderStyle: "dashed",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                尚無職災保險費率紀錄。
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: "10px",
              }}
            >
              {rates.map((rate) => {
                const status = getRateStatus(
                  rate,
                  today,
                );

                const canDelete =
                  String(
                    rate.effective_from ||
                      "",
                  ) > today &&
                  Number(
                    rate.accident_rate_id,
                  ) ===
                    Number(
                      latestFutureRateId,
                    );

                return (
                  <Paper
                    key={
                      rate.accident_rate_id
                    }
                    variant="outlined"
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr auto",
                        sm:
                          "140px minmax(0, 1fr) 110px 44px",
                      },
                      alignItems: "center",
                      gap: {
                        xs: "10px",
                        sm: "16px",
                      },
                      p: {
                        xs: "13px",
                        sm: "14px 16px",
                      },
                      borderColor: "#dfe4e8",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#1f2937",
                        fontSize: "16px",
                        fontWeight: 700,
                      }}
                    >
                      {formatRate(
                        rate.accident_rate,
                      )}
                    </Typography>

                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                      variant="outlined"
                      sx={{
                        display: {
                          xs: "inline-flex",
                          sm: "none",
                        },
                        justifySelf: "end",
                      }}
                    />

                    <Typography
                      sx={{
                        gridColumn: {
                          xs: "1 / -1",
                          sm: "auto",
                        },
                        color: "#475569",
                        fontSize: "13px",
                      }}
                    >
                      {formatDate(
                        rate.effective_from,
                      )}
                      {" ～ "}
                      {formatDate(
                        rate.effective_to,
                      )}
                    </Typography>

                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                      variant="outlined"
                      sx={{
                        display: {
                          xs: "none",
                          sm: "inline-flex",
                        },
                      }}
                    />

                    <Box
                      sx={{
                        gridColumn: {
                          xs: "1 / -1",
                          sm: "auto",
                        },
                        justifySelf: "end",
                      }}
                    >
                      {canDelete ? (
                        <Tooltip title="刪除此未生效費率">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteTarget(
                                rate,
                              )
                            }
                            aria-label="刪除未生效的職災保險費率"
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}

          <Alert
            severity="info"
            sx={{ mt: "14px" }}
          >
            已生效或已結束的費率會保留作為薪資計算依據。只有最後一筆且尚未生效的費率可以刪除。
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            py: "14px",
          }}
        >
          <Button
            onClick={onClose}
            disabled={
              submitting || deleting
            }
          >
            關閉
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={
          deleting
            ? undefined
            : () =>
                setDeleteTarget(null)
        }
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            fontSize: "19px",
            fontWeight: 700,
          }}
        >
          刪除未生效費率
        </DialogTitle>

        <DialogContent dividers>
          <Typography
            sx={{
              color: "#334155",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            確定要刪除自{" "}
            {formatDate(
              deleteTarget?.effective_from,
            )}{" "}
            起生效的{" "}
            {formatRate(
              deleteTarget?.accident_rate,
            )}{" "}
            職災保險費率嗎？
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: "24px",
            py: "14px",
          }}
        >
          <Button
            onClick={() =>
              setDeleteTarget(null)
            }
            disabled={deleting}
          >
            取消
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? "刪除中…"
              : "確認刪除"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}