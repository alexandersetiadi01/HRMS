import { useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  createInsuranceGradeVersion,
  updateInsuranceGradeVersion,
} from "../../API/payroll";

const INSURANCE_TYPES = [
  { key: "labor", label: "勞保" },
  { key: "health", label: "健保" },
  { key: "pension", label: "勞退" },
];

const EMPTY_ROW = {
  salary_lower_bound: "",
  salary_upper_bound: "",
  monthly_insured_amount: "",
  remarks: "",
};

function createEmptyGrades() {
  return {
    labor: [{ ...EMPTY_ROW }],
    health: [{ ...EMPTY_ROW }],
    pension: [{ ...EMPTY_ROW }],
  };
}

function getToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 10);
}

function createEmptyForm() {
  return {
    version_code: "",
    version_name: "",
    effective_from: getToday(),
    effective_to: "",
    source_name: "",
    remarks: "",
    grades: createEmptyGrades(),
  };
}

function valueToInput(value) {
  return value === null || value === undefined ? "" : String(value);
}

function normalizeRow(row) {
  return {
    salary_lower_bound: valueToInput(row?.salary_lower_bound),
    salary_upper_bound: valueToInput(row?.salary_upper_bound),
    monthly_insured_amount: valueToInput(row?.monthly_insured_amount),
    remarks: String(row?.remarks || ""),
  };
}

function normalizeRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [{ ...EMPTY_ROW }];
  }

  return [...rows]
    .sort(
      (left, right) =>
        Number(left?.display_order ?? left?.grade_number ?? 0) -
        Number(right?.display_order ?? right?.grade_number ?? 0),
    )
    .map(normalizeRow);
}

function payloadToForm(payload) {
  return {
    version_code: String(payload?.version_code || ""),
    version_name: String(payload?.version_name || ""),
    effective_from: String(payload?.effective_from || ""),
    effective_to: String(payload?.effective_to || ""),
    source_name: String(payload?.source_name || ""),
    remarks: String(payload?.remarks || ""),
    grades: {
      labor: normalizeRows(payload?.grades?.labor),
      health: normalizeRows(payload?.grades?.health),
      pension: normalizeRows(payload?.grades?.pension),
    },
  };
}

function nullableNumber(value) {
  return value === "" || value === null ? null : Number(value);
}

function buildPayload(form) {
  const grades = {};

  for (const type of INSURANCE_TYPES) {
    grades[type.key] = form.grades[type.key].map((row, index) => ({
      grade_number: index + 1,
      salary_lower_bound: nullableNumber(row.salary_lower_bound),
      salary_upper_bound: nullableNumber(row.salary_upper_bound),
      monthly_insured_amount: nullableNumber(row.monthly_insured_amount),
      remarks: row.remarks.trim(),
    }));
  }

  return {
    version_code: form.version_code.trim(),
    version_name: form.version_name.trim(),
    effective_from: form.effective_from,
    effective_to: form.effective_to || null,
    source_name: form.source_name.trim(),
    remarks: form.remarks.trim(),
    grades,
  };
}

function validatePayloadShape(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "匯入內容必須是完整的 JSON 物件。";
  }

  if (!String(payload.version_code || "").trim()) {
    return "請輸入版本代碼。";
  }

  if (!String(payload.version_name || "").trim()) {
    return "請輸入版本名稱。";
  }

  if (!String(payload.effective_from || "")) {
    return "請選擇生效日。";
  }

  if (payload.effective_to && payload.effective_to < payload.effective_from) {
    return "失效日不得早於生效日。";
  }

  if (
    !payload.grades ||
    typeof payload.grades !== "object" ||
    Array.isArray(payload.grades)
  ) {
    return "grades 必須包含 labor、health、pension 三組資料。";
  }

  for (const type of INSURANCE_TYPES) {
    if (
      !Array.isArray(payload.grades[type.key]) ||
      payload.grades[type.key].length === 0
    ) {
      return `${type.label}至少需要一筆投保級距。`;
    }
  }

  return "";
}

function getRequestMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function getValidationErrors(error) {
  const candidates = [
    error?.response?.data?.data?.errors,
    error?.response?.data?.errors,
    error?.response?.data?.data?.data?.errors,
  ];

  const errors = candidates.find(Array.isArray);

  if (!errors) {
    return [];
  }

  return errors.map((item, index) => ({
    field: String(item?.field || `validation.${index + 1}`),
    message: String(item?.message || "資料格式不正確。"),
  }));
}

function parseImportJson(jsonText) {
  try {
    const payload = JSON.parse(jsonText);

    const shapeError = validatePayloadShape(payload);

    if (shapeError) {
      return {
        payload: null,
        error: shapeError,
      };
    }

    return {
      payload,
      error: "",
    };
  } catch {
    return {
      payload: null,
      error: "JSON 格式不正確，請檢查逗號、括號及引號。",
    };
  }
}

function GradeEditor({ type, rows, disabled, onChange, onAdd, onRemove }) {
  return (
    <Box
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          px: {
            xs: "12px",
            sm: "16px",
          },
          py: "12px",
          backgroundColor: "#f8fafc",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#1f2937",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            {type.label}投保級距
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            共 {rows.length} 級
          </Typography>
        </Box>

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
          disabled={disabled}
        >
          新增級距
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: "12px",
          p: {
            xs: "12px",
            sm: "16px",
          },
        }}
      >
        {rows.map((row, index) => (
          <Box
            key={`${type.key}-${index}`}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr) minmax(0, 1fr)",
                md: "70px repeat(3, minmax(0, 1fr)) minmax(120px, 1fr) 40px",
              },
              gap: "10px",
              alignItems: "start",
              p: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <TextField
              label="級數"
              size="small"
              value={index + 1}
              disabled
            //   helperText="系統排序"
            />

            <TextField
              label="薪資下限（含）"
              type="number"
              size="small"
              value={row.salary_lower_bound}
              onChange={(event) =>
                onChange(index, "salary_lower_bound", event.target.value)
              }
              disabled={disabled}
              placeholder="例如：28590"
              helperText={
                index === 0
                  ? "新台幣／月；第一級可留空"
                  : "新台幣／月；例如：28,590"
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">元／月</InputAdornment>
                ),
              }}
              inputProps={{
                min: 0,
                step: "0.01",
              }}
            />

            <TextField
              label="薪資上限（不含）"
              type="number"
              size="small"
              value={row.salary_upper_bound}
              onChange={(event) =>
                onChange(index, "salary_upper_bound", event.target.value)
              }
              disabled={disabled}
              placeholder="例如：30300"
              helperText={
                index === rows.length - 1
                  ? "新台幣／月；最後一級可留空"
                  : "新台幣／月；例如：30,300"
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">元／月</InputAdornment>
                ),
              }}
              inputProps={{
                min: 0,
                step: "0.01",
              }}
            />

            <TextField
              label="月投保金額"
              type="number"
              size="small"
              required
              value={row.monthly_insured_amount}
              onChange={(event) =>
                onChange(index, "monthly_insured_amount", event.target.value)
              }
              disabled={disabled}
              placeholder="例如：30300"
              helperText="新台幣／月；例如：30,300"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">元／月</InputAdornment>
                ),
              }}
              inputProps={{
                min: 0,
                step: "0.01",
              }}
            />

            <TextField
              label="級距備註"
              size="small"
              value={row.remarks}
              onChange={(event) =>
                onChange(index, "remarks", event.target.value)
              }
              disabled={disabled}
              placeholder="例如：基本工資級距"
              helperText="選填文字，無單位"
            />

            <IconButton
              aria-label={`刪除${type.label}第 ${index + 1} 級`}
              color="error"
              onClick={() => onRemove(index)}
              disabled={disabled || rows.length === 1}
              sx={{
                justifySelf: "center",
                gridColumn: {
                  xs: "2",
                  md: "auto",
                },
              }}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function InsuranceGradeVersionFormDialog({
  open,
  version,
  onClose,
  onSaved,
}) {
  const editing = Boolean(version?.insurance_grade_version_id);

  const [mode, setMode] = useState("manual");

  const [form, setForm] = useState(createEmptyForm);

  const [jsonText, setJsonText] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [validationErrors, setValidationErrors] = useState([]);

  const dialogTitle = editing ? "編輯投保金額分級表草稿" : "新增投保金額分級表";

  const manualPayload = useMemo(() => buildPayload(form), [form]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextForm = editing ? payloadToForm(version) : createEmptyForm();

    setForm(nextForm);

    setJsonText(JSON.stringify(buildPayload(nextForm), null, 2));

    setMode("manual");
    setSubmitting(false);
    setError("");
    setValidationErrors([]);
  }, [editing, open, version]);

  function clearErrors() {
    setError("");
    setValidationErrors([]);
  }

  function setField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    clearErrors();
  }

  function changeRow(type, index, field, value) {
    setForm((previous) => ({
      ...previous,
      grades: {
        ...previous.grades,
        [type]: previous.grades[type].map((row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                [field]: value,
              }
            : row,
        ),
      },
    }));

    clearErrors();
  }

  function addRow(type) {
    setForm((previous) => ({
      ...previous,
      grades: {
        ...previous.grades,
        [type]: [...previous.grades[type], { ...EMPTY_ROW }],
      },
    }));

    clearErrors();
  }

  function removeRow(type, index) {
    setForm((previous) => ({
      ...previous,
      grades: {
        ...previous.grades,
        [type]: previous.grades[type].filter(
          (_, rowIndex) => rowIndex !== index,
        ),
      },
    }));

    clearErrors();
  }

  function handleModeChange(_, nextMode) {
    if (nextMode === "json" && mode !== "json") {
      setJsonText(JSON.stringify(manualPayload, null, 2));
    }

    setMode(nextMode);
    clearErrors();
  }

  function handleLoadJsonIntoEditor() {
    const parsed = parseImportJson(jsonText);

    if (parsed.error) {
      setError(parsed.error);
      setValidationErrors([]);
      return;
    }

    setForm(payloadToForm(parsed.payload));

    setMode("manual");
    clearErrors();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    let payload = manualPayload;

    if (mode === "json") {
      const parsed = parseImportJson(jsonText);

      if (parsed.error) {
        setError(parsed.error);
        setValidationErrors([]);
        return;
      }

      payload = parsed.payload;
    } else {
      const shapeError = validatePayloadShape(payload);

      if (shapeError) {
        setError(shapeError);
        setValidationErrors([]);
        return;
      }
    }

    setSubmitting(true);
    clearErrors();

    try {
      const savedVersion = editing
        ? await updateInsuranceGradeVersion(
            version.insurance_grade_version_id,
            payload,
          )
        : await createInsuranceGradeVersion(payload);

      onSaved(
        editing ? "投保金額分級表草稿已更新。" : "投保金額分級表草稿已建立。",
        savedVersion,
      );
    } catch (requestError) {
      setError(
        getRequestMessage(
          requestError,
          editing
            ? "更新投保金額分級表草稿失敗。"
            : "建立投保金額分級表草稿失敗。",
        ),
      );

      setValidationErrors(getValidationErrors(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
        sx: {
          width: {
            xs: "100%",
            sm: "calc(100% - 48px)",
          },
          maxHeight: {
            xs: "100%",
            sm: "calc(100% - 48px)",
          },
          m: {
            xs: 0,
            sm: "24px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: "10px",
          fontSize: {
            xs: "18px",
            sm: "20px",
          },
          fontWeight: 700,
        }}
      >
        {dialogTitle}
      </DialogTitle>

      <Tabs
        value={mode}
        onChange={handleModeChange}
        variant="fullWidth"
        sx={{
          px: {
            xs: "8px",
            sm: "24px",
          },
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Tab value="manual" label="手動編輯" />

        <Tab value="json" label="JSON 匯入" />
      </Tabs>

      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gap: "16px",
          }}
        >
          {error ? (
            <Alert severity="error">
              <Typography component="div" sx={{ fontWeight: 700 }}>
                {error}
              </Typography>

              {validationErrors.length > 0 ? (
                <Box
                  component="ul"
                  sx={{
                    mt: "8px",
                    mb: 0,
                    pl: "20px",
                  }}
                >
                  {validationErrors.map((item, index) => (
                    <li key={`${item.field}-${index}`}>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: "13px",
                        }}
                      >
                        <Box
                          component="code"
                          sx={{
                            mr: "6px",
                            fontWeight: 700,
                          }}
                        >
                          {item.field}
                        </Box>

                        {item.message}
                      </Typography>
                    </li>
                  ))}
                </Box>
              ) : null}
            </Alert>
          ) : null}

          {mode === "manual" ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: "14px",
                }}
              >
                <Typography
                  sx={{
                    gridColumn: "1 / -1",
                    color: "#1f2937",
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  版本資料
                </Typography>

                <TextField
                  label="版本代碼"
                  size="small"
                  required
                  value={form.version_code}
                  onChange={(event) =>
                    setField("version_code", event.target.value)
                  }
                  disabled={submitting}
                  placeholder="例如：2026-TW-01"
                  helperText="版本的唯一識別碼；文字，無單位"
                  inputProps={{
                    maxLength: 50,
                  }}
                />

                <TextField
                  label="版本名稱"
                  size="small"
                  required
                  value={form.version_name}
                  onChange={(event) =>
                    setField("version_name", event.target.value)
                  }
                  disabled={submitting}
                  placeholder="例如：2026 年投保級距"
                  helperText="顯示給使用者辨識的版本名稱"
                  inputProps={{
                    maxLength: 150,
                  }}
                />

                <TextField
                  label="資料來源"
                  size="small"
                  value={form.source_name}
                  onChange={(event) =>
                    setField("source_name", event.target.value)
                  }
                  placeholder="例如：勞動部／衛福部公告"
                  helperText="此版本數據的來源；選填文字"
                  disabled={submitting}
                />

                <TextField
                  label="生效日"
                  type="date"
                  size="small"
                  required
                  value={form.effective_from}
                  onChange={(event) =>
                    setField("effective_from", event.target.value)
                  }
                  helperText="格式：年／月／日；例如：2026/01/01"
                  disabled={submitting}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="失效日"
                  type="date"
                  size="small"
                  value={form.effective_to}
                  onChange={(event) =>
                    setField("effective_to", event.target.value)
                  }
                  disabled={submitting}
                  helperText="格式：年／月／日；留空代表未設定"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="版本備註"
                  size="small"
                  value={form.remarks}
                  onChange={(event) => setField("remarks", event.target.value)}
                  disabled={submitting}
                  placeholder="例如：依 2026 年公告建立"
                  helperText="整個版本的補充說明；選填文字"
                />
              </Box>

              <Divider />

              <Alert severity="info">
                所有金額單位均為新台幣／月，不是百分比。級距採用「下限包含、上限不包含」的連續區間：前一級薪資上限必須等於下一級薪資下限。只有第一級可不填下限，只有最後一級可不填上限。例如：薪資
                28,590（含）至 30,300（不含），月投保金額為 30,300 元。
              </Alert>

              {INSURANCE_TYPES.map((type) => (
                <GradeEditor
                  key={type.key}
                  type={type}
                  rows={form.grades[type.key]}
                  disabled={submitting}
                  onChange={(index, field, value) =>
                    changeRow(type.key, index, field, value)
                  }
                  onAdd={() => addRow(type.key)}
                  onRemove={(index) => removeRow(type.key, index)}
                />
              ))}
            </>
          ) : (
            <>
              <Alert severity="info">
                請貼上包含版本資料及 labor、health、pension 三組級距的完整
                JSON。儲存時仍會由後端執行所有級數、日期、缺口及重疊驗證。
              </Alert>

              <TextField
                label="完整 JSON"
                multiline
                minRows={18}
                maxRows={30}
                value={jsonText}
                onChange={(event) => {
                  setJsonText(event.target.value);
                  clearErrors();
                }}
                disabled={submitting}
                InputProps={{
                  sx: {
                    alignItems: "flex-start",
                    fontFamily: "Consolas, Monaco, monospace",
                    fontSize: "13px",
                  },
                }}
              />

              <Box>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleLoadJsonIntoEditor}
                  disabled={submitting}
                >
                  載入至手動編輯
                </Button>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: {
            xs: "16px",
            sm: "24px",
          },
          py: "14px",
        }}
      >
        <Button onClick={onClose} disabled={submitting}>
          取消
        </Button>

        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "儲存中…" : editing ? "更新草稿" : "建立草稿"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
