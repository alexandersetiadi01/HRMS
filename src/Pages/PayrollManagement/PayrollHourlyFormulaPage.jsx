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
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  getPayrollCalculationRuleOptions,
  getPayrollCalculationRules,
  updatePayrollCalculationRule,
} from "../../API/payroll";

const RULE_CODE = "daily_work_hours";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function ruleToForm(rule) {
  return {
    dailyHours: String(rule?.rule_value ?? ""),
    enabled:
      String(rule?.status || "啟用") === "啟用",
    remarks: String(rule?.remarks || ""),
  };
}

function validateDailyHours(value) {
  const hours = Number(value);

  if (value === "" || !Number.isFinite(hours)) {
    return "請輸入每日標準工時。";
  }

  if (hours <= 0) {
    return "每日標準工時必須大於 0。";
  }

  if (
    Math.abs(
      hours * 4 - Math.round(hours * 4),
    ) > 0.000001
  ) {
    return "每日標準工時必須以 0.25 小時為單位。";
  }

  if (hours > 24) {
    return "每日標準工時不可超過 24 小時。";
  }

  return "";
}

function DetailRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: {
          xs: "flex-start",
          sm: "center",
        },
        justifyContent: "space-between",
        gap: 2,
        py: 1.5,
      }}
    >
      <Typography
        color="text.secondary"
        variant="body2"
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontWeight: 700,
          textAlign: "right",
        }}
        variant="body2"
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function PayrollHourlyFormulaPage() {
  const [rule, setRule] = useState(null);
  const [ruleOption, setRuleOption] =
    useState(null);
  const [form, setForm] = useState(
    ruleToForm(null),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] =
    useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [
    disableDialogOpen,
    setDisableDialogOpen,
  ] = useState(false);

  const loadData = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) {
        setLoading(true);
      }

      setError("");

      try {
        const [rulesPayload, optionsPayload] =
          await Promise.all([
            getPayrollCalculationRules({
              source_type: "global",
            }),
            getPayrollCalculationRuleOptions(),
          ]);

        const rules = Array.isArray(
          rulesPayload,
        )
          ? rulesPayload
          : [];

        const options = Array.isArray(
          optionsPayload,
        )
          ? optionsPayload
          : [];

        const nextRule =
          rules.find(
            (item) =>
              item?.rule_code === RULE_CODE,
          ) || null;

        const nextOption =
          options.find(
            (item) =>
              item?.rule_code === RULE_CODE,
          ) || null;

        setRule(nextRule);
        setRuleOption(nextOption);

        if (nextRule) {
          setForm(ruleToForm(nextRule));
        }
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            "載入時薪計算公式失敗，請稍後再試。",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dailyHoursError = useMemo(
    () =>
      validateDailyHours(form.dailyHours),
    [form.dailyHours],
  );

  const exampleHourlyRate = useMemo(() => {
    const hours = Number(form.dailyHours);

    if (
      !Number.isFinite(hours) ||
      hours <= 0
    ) {
      return null;
    }

    return 36000 / 30 / hours;
  }, [form.dailyHours]);

  function beginEditing() {
    setForm(ruleToForm(rule));
    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    setForm(ruleToForm(rule));
    setError("");
    setEditing(false);
  }

  async function saveRule() {
    if (!rule?.calculation_rule_id) {
      return;
    }

    const validationError =
      validateDailyHours(form.dailyHours);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updatePayrollCalculationRule(
        rule.calculation_rule_id,
        {
          rule_value: String(
            Number(form.dailyHours),
          ),
          status: form.enabled
            ? "啟用"
            : "停用",
          remarks: form.remarks.trim(),
        },
      );

      await loadData({ quiet: true });

      setEditing(false);
      setDisableDialogOpen(false);
      setSuccess(
        "時薪計算公式設定已儲存。",
      );
    } catch (saveError) {
      setDisableDialogOpen(false);

      setError(
        getErrorMessage(
          saveError,
          "儲存時薪計算公式失敗，請稍後再試。",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  function requestSave() {
    const validationError =
      validateDailyHours(form.dailyHours);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (
      String(rule?.status || "啟用") ===
        "啟用" &&
      !form.enabled
    ) {
      setDisableDialogOpen(true);
      return;
    }

    saveRule();
  }

  if (loading) {
    return (
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          minHeight: 360,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              fontSize: {
                xs: 24,
                sm: 28,
              },
              fontWeight: 700,
            }}
          >
            時薪計算公式
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.75 }}
          >
            設定月薪制員工換算時薪時所使用的每日標準工時。
          </Typography>
        </Box>

        {!editing && rule ? (
          <Button
            onClick={beginEditing}
            startIcon={<EditOutlinedIcon />}
            sx={{
              alignSelf: {
                xs: "stretch",
                sm: "center",
              },
            }}
            variant="contained"
          >
            編輯設定
          </Button>
        ) : null}
      </Stack>

      {error ? (
        <Alert
          action={
            !rule ? (
              <Button
                color="inherit"
                onClick={() => loadData()}
                startIcon={<RefreshIcon />}
                size="small"
              >
                重新載入
              </Button>
            ) : null
          }
          severity="error"
          sx={{ mb: 2.5 }}
        >
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert
          onClose={() => setSuccess("")}
          severity="success"
          sx={{ mb: 2.5 }}
        >
          {success}
        </Alert>
      ) : null}

      {!rule ? (
        <Alert
          icon={<InfoOutlinedIcon />}
          severity="warning"
        >
          找不到 `daily_work_hours`
          計算規則。請先確認後端已安裝並建立每日工時規則。
        </Alert>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md:
                "minmax(0, 1fr) minmax(360px, 0.8fr)",
            },
          }}
        >
          <Stack spacing={3}>
            <Card
              sx={{
                background:
                  "linear-gradient(135deg, #0d6a78 0%, #11869a 100%)",
                color: "common.white",
              }}
            >
              <CardContent
                sx={{
                  p: {
                    xs: 2.5,
                    sm: 3.5,
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ mb: 2 }}
                >
                  <CalculateOutlinedIcon />

                  <Typography
                    sx={{ fontWeight: 700 }}
                  >
                    目前使用的公式
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    fontSize: {
                      xs: 24,
                      sm: 32,
                    },
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    lineHeight: 1.35,
                  }}
                >
                  月薪 ÷ 30 ÷ 每日標準工時
                </Typography>

                <Divider
                  sx={{
                    borderColor:
                      "rgba(255,255,255,0.28)",
                    my: 3,
                  }}
                />

                <Typography
                  sx={{
                    mb: 1,
                    opacity: 0.82,
                  }}
                >
                  計算範例
                </Typography>

                <Typography
                  sx={{
                    fontSize: {
                      xs: 16,
                      sm: 18,
                    },
                    fontWeight: 700,
                    lineHeight: 1.8,
                  }}
                >
                  月薪 NT$36,000 ÷ 30 日 ÷{" "}
                  {form.dailyHours || "—"} 小時
                  <br />
                  ={" "}
                  {exampleHourlyRate === null
                    ? "—"
                    : `NT$${exampleHourlyRate.toLocaleString(
                        "zh-TW",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}`}
                </Typography>
              </CardContent>
            </Card>

            <Paper variant="outlined">
              <Box
                sx={{
                  p: {
                    xs: 2.5,
                    sm: 3,
                  },
                }}
              >
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1.5}
                  sx={{ mb: 1 }}
                >
                  <InfoOutlinedIcon color="primary" />

                  <Typography
                    sx={{ fontWeight: 700 }}
                  >
                    系統計算方式
                  </Typography>
                </Stack>

                <Typography
                  color="text.secondary"
                  variant="body2"
                >
                  以下項目目前由薪資計算引擎固定控制，僅供確認。
                </Typography>

                <Divider sx={{ my: 2 }} />

                <DetailRow
                  label="月薪換算天數"
                  value="固定 30 日"
                />

                <Divider />

                <DetailRow
                  label="時薪計算精度"
                  value="小數點後 2 位"
                />

                <Divider />

                <DetailRow
                  label="最終薪資金額"
                  value="四捨五入至整數"
                />
              </Box>
            </Paper>
          </Stack>

          <Paper variant="outlined">
            <Box
              sx={{
                p: {
                  xs: 2.5,
                  sm: 3,
                },
              }}
            >
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 0.75 }}
              >
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1.25}
                >
                  <AccessTimeOutlinedIcon color="primary" />

                  <Typography
                    sx={{ fontWeight: 700 }}
                  >
                    公式設定
                  </Typography>
                </Stack>

                <Chip
                  color={
                    form.enabled
                      ? "success"
                      : "default"
                  }
                  label={
                    form.enabled
                      ? "啟用"
                      : "停用"
                  }
                  size="small"
                  variant="outlined"
                />
              </Stack>

              <Typography
                color="text.secondary"
                sx={{ mb: 3 }}
                variant="body2"
              >
                {ruleOption?.remarks ||
                  "依公司規章設定每日正常工時。"}
              </Typography>

              <Stack spacing={2.5}>
                <TextField
                  disabled={!editing || saving}
                  error={
                    editing &&
                    Boolean(dailyHoursError)
                  }
                  fullWidth
                  helperText={
                    editing
                      ? dailyHoursError ||
                        "可使用 0.25 小時為調整單位。"
                      : "薪資計算會使用此數值換算時薪。"
                  }
                  inputProps={{
                    min: 0.25,
                    max: 24,
                    step: 0.25,
                  }}
                  label="每日標準工時"
                  onChange={(event) => {
                    setForm((previous) => ({
                      ...previous,
                      dailyHours:
                        event.target.value,
                    }));
                    setError("");
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Typography
                          color="text.secondary"
                          sx={{
                            whiteSpace: "nowrap",
                          }}
                          variant="body2"
                        >
                          小時／日
                        </Typography>
                      ),
                    },
                  }}
                  type="number"
                  value={form.dailyHours}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.enabled}
                      disabled={
                        !editing || saving
                      }
                      onChange={(event) =>
                        setForm(
                          (previous) => ({
                            ...previous,
                            enabled:
                              event.target
                                .checked,
                          }),
                        )
                      }
                    />
                  }
                  label="啟用此計算規則"
                  sx={{ ml: 0 }}
                />

                <TextField
                  disabled={!editing || saving}
                  fullWidth
                  label="備註"
                  minRows={4}
                  multiline
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      remarks:
                        event.target.value,
                    }))
                  }
                  placeholder="輸入此公式設定的說明"
                  value={form.remarks}
                />
              </Stack>

              {editing ? (
                <Stack
                  direction={{
                    xs: "column-reverse",
                    sm: "row",
                  }}
                  justifyContent="flex-end"
                  spacing={1.5}
                  sx={{ mt: 3 }}
                >
                  <Button
                    disabled={saving}
                    fullWidth
                    onClick={cancelEditing}
                    sx={{
                      maxWidth: {
                        sm: 120,
                      },
                    }}
                    variant="outlined"
                  >
                    取消
                  </Button>

                  <Button
                    disabled={
                      saving ||
                      Boolean(dailyHoursError)
                    }
                    fullWidth
                    onClick={requestSave}
                    startIcon={
                      saving ? (
                        <CircularProgress
                          color="inherit"
                          size={18}
                        />
                      ) : (
                        <SaveOutlinedIcon />
                      )
                    }
                    sx={{
                      maxWidth: {
                        sm: 140,
                      },
                    }}
                    variant="contained"
                  >
                    {saving
                      ? "儲存中"
                      : "儲存"}
                  </Button>
                </Stack>
              ) : null}
            </Box>
          </Paper>
        </Box>
      )}

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={
          saving
            ? undefined
            : () =>
                setDisableDialogOpen(false)
        }
        open={disableDialogOpen}
      >
        <DialogTitle>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1.5}
          >
            <WarningAmberRoundedIcon color="warning" />
            <span>
              確認停用時薪計算規則？
            </span>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Alert
            severity="warning"
            sx={{ mt: 0.5 }}
          >
            薪資計算需要「每日標準工時」。停用後，新的薪資計算可能無法完成。
          </Alert>

          <Typography sx={{ mt: 2 }}>
            確定要儲存並停用此規則嗎？
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            flexDirection: {
              xs: "column-reverse",
              sm: "row",
            },
            gap: 1,
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            disabled={saving}
            fullWidth
            onClick={() =>
              setDisableDialogOpen(false)
            }
          >
            返回設定
          </Button>

          <Button
            color="warning"
            disabled={saving}
            fullWidth
            onClick={saveRule}
            variant="contained"
          >
            {saving
              ? "儲存中"
              : "確認停用"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}