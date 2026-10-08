import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import Breadcrumb from "../../../../Utils/Breadcrumb";
import { apiAttendanceAdminMeta } from "../../../../API/attendance";
import {
  getProbationEvaluation,
  saveProbationDraft,
  submitProbationEvaluation,
} from "../../../../API/probation";
import { EVALUATION_STATUS } from "./probationConstants";
import { calculateEvaluationSummary } from "./probationUtils";

const BLUE = "#159dca";
const DARK_BLUE = "#176886";
const LIGHT_BLUE = "#dbeaf6";
const LIGHT_ORANGE = "#fbe4d5";
const BORDER = "#9ca3af";

function createEmptyItem() {
  return {
    item_id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: "",
    item_name: "",
    description: "",
    weight: "",
    score: "",
    example_comment: "",
    improvement_direction: "",
  };
}

function formatDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const [year, month, day] = text.split("-");
  if (!year || !month || !day) return text;

  return `${year}/${month}/${day}`;
}

function validateFinishForm(form) {
  if (!form?.evaluator_employee_id) {
    return "完成本次評核前，請選擇評核人員。";
  }

  if (!form?.evaluation_date) {
    return "完成本次評核前，請填寫評核日期。";
  }

  const items = Array.isArray(form?.items) ? form.items : [];

  if (!items.length) {
    return "至少需要一個評核項目才能標記為已完成。";
  }

  let weightTotal = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const rowNumber = index + 1;

    if (!String(item.category || "").trim()) {
      return `第 ${rowNumber} 項評核項目尚未填寫類別。`;
    }

    if (!String(item.item_name || "").trim()) {
      return `第 ${rowNumber} 項評核項目尚未填寫評核項目。`;
    }

    if (!String(item.description || "").trim()) {
      return `第 ${rowNumber} 項評核項目尚未填寫評核重點／行為說明。`;
    }

    if (
      item.weight === "" ||
      item.weight === null ||
      item.weight === undefined ||
      !Number.isFinite(Number(item.weight))
    ) {
      return `第 ${rowNumber} 項評核項目尚未填寫有效權重。`;
    }

    const weight = Number(item.weight);

    if (weight <= 0 || weight > 100) {
      return `第 ${rowNumber} 項評核項目的權重必須大於 0 且不得超過 100。`;
    }

    weightTotal += weight;

    if (
      item.score === "" ||
      item.score === null ||
      item.score === undefined ||
      ![1, 2, 3, 4, 5].includes(Number(item.score))
    ) {
      return `第 ${rowNumber} 項評核項目尚未完成 1 至 5 分評分。`;
    }
  }

  if (Math.abs(weightTotal - 100) > 0.001) {
    return "完成本次評核前，評核項目的權重合計必須為 100。";
  }

  if (!String(form.overall_comment || "").trim()) {
    return "完成本次評核前，請填寫整體評語。";
  }

  if (!String(form.supervisor_decision || "").trim()) {
    return "完成本次評核前，請填寫主管決定。";
  }

  return "";
}

function createFormState(data) {
  const savedItems = (data?.summary?.items || []).map((item) => ({
    item_id: item.performance_item_id || item.id,
    category: item.category || "",
    item_name: item.item_name || "",
    description: item.description || "",
    weight: item.weight ?? "",
    score: item.score ?? "",
    example_comment: item.example_comment || "",
    improvement_direction: item.improvement_direction || "",
  }));

  return {
    evaluation_date: data?.evaluation?.evaluation_date || "",
    evaluator_employee_id: data?.evaluation?.evaluator_employee_id || "",
    evaluator_name: data?.evaluation?.evaluator_name || "",
    overall_comment: data?.evaluation?.overall_comment || "",
    supervisor_decision: data?.evaluation?.supervisor_decision || "",
    improvement_due_date: data?.evaluation?.improvement_due_date || "",
    follow_up_date: data?.evaluation?.follow_up_date || "",
    items: savedItems.length > 0 ? savedItems : [createEmptyItem()],
  };
}

function LabelCell({ children, sx = {} }) {
  return (
    <Box
      sx={{
        px: "9px",
        py: "8px",
        bgcolor: LIGHT_BLUE,
        borderRight: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "center",
        fontSize: "13px",
        fontWeight: 700,
        color: "#064b76",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function ValueCell({ children, sx = {} }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        px: "9px",
        py: "7px",
        borderRight: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "center",
        bgcolor: "#ffffff",
        fontSize: "13px",
        color: "#111827",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function SheetInput({
  value,
  onChange,
  multiline = false,
  minRows,
  disabled = false,
  type = "text",
  placeholder = "",
}) {
  return (
    <TextField
      value={value}
      onChange={onChange}
      multiline={multiline}
      minRows={minRows}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      fullWidth
      variant="standard"
      InputProps={{
        disableUnderline: true,
      }}
      sx={{
        "& .MuiInputBase-root": {
          p: 0,
          fontSize: "13px",
          bgcolor: "transparent",
        },
        "& .MuiInputBase-input": {
          p: 0,
        },
        "& .MuiInputBase-inputMultiline": {
          lineHeight: 1.55,
        },
      }}
    />
  );
}

function SummaryValue({ children, emphasis = false }) {
  return (
    <Box
      sx={{
        minHeight: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: "8px",
        py: "4px",
        borderRight: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        bgcolor: "#ffffff",
        fontSize: emphasis ? "16px" : "14px",
        fontWeight: emphasis ? 700 : 600,
        color: "#0f4c75",
        textAlign: "center",
      }}
    >
      {children}
    </Box>
  );
}

function MobileField({ label, children, fullWidth = false }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        gridColumn: fullWidth ? "1 / -1" : "auto",
        border: `1px solid ${BORDER}`,
        borderRadius: "6px",
        overflow: "hidden",
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          px: "9px",
          py: "6px",
          bgcolor: LIGHT_BLUE,
          color: "#064b76",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {label}
      </Box>

      <Box
        sx={{
          minHeight: "40px",
          px: "9px",
          py: "8px",
          display: "flex",
          alignItems: "center",
          color: "#111827",
          fontSize: "13px",
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default function ProbationEvaluationPage() {
  const { caseId, month } = useParams();
  const navigate = useNavigate();

  const evaluationMonth = Number(month);

  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [expandedMobileItemId, setExpandedMobileItemId] = useState("");
  const [evaluatorOptions, setEvaluatorOptions] = useState([]);
  const [savedFormSnapshot, setSavedFormSnapshot] = useState("");
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const hasUnsavedChangesRef = useRef(false);
  const allowNavigationRef = useRef(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const [result, adminMeta] = await Promise.all([
          getProbationEvaluation(caseId, evaluationMonth),
          apiAttendanceAdminMeta().catch(() => ({
            employeeOptions: [],
          })),
        ]);

        if (!active) return;

        setEvaluatorOptions(
          Array.isArray(adminMeta?.employeeOptions)
            ? adminMeta.employeeOptions
            : [],
        );

        if (!result) {
          setErrorText("找不到指定的試用期評核資料。");
          setData(null);
          setForm(null);
          return;
        }

        const initialForm = createFormState(result);

        setData(result);
        setForm(initialForm);
        setSavedFormSnapshot(JSON.stringify(initialForm));
        setExpandedMobileItemId(initialForm.items?.[0]?.item_id || "");
      } catch (error) {
        console.error(error);

        if (active) {
          setErrorText(
            error?.response?.data?.message ||
              error?.message ||
              "載入試用期評核資料失敗。",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [caseId, evaluationMonth]);

  const calculatedEvaluation = useMemo(() => {
    if (!data || !form) return null;

    return {
      ...data.evaluation,
      ...form,
    };
  }, [data, form]);

  const summary = useMemo(() => {
    if (!calculatedEvaluation) return null;

    return calculateEvaluationSummary(evaluationMonth, calculatedEvaluation);
  }, [evaluationMonth, calculatedEvaluation]);

  const evaluationStatusLabel =
    data?.evaluation?.status === EVALUATION_STATUS.COMPLETED
      ? "已完成"
      : data?.evaluation?.status === EVALUATION_STATUS.IN_PROGRESS
        ? "進行中"
        : "尚未開始";

  const serializedForm = useMemo(
    () => (form ? JSON.stringify(form) : ""),
    [form],
  );

  const hasUnsavedChanges =
    Boolean(form) &&
    Boolean(savedFormSnapshot) &&
    serializedForm !== savedFormSnapshot;

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChangesRef.current || allowNavigationRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleMobileItemToggle = (itemId) => {
    setExpandedMobileItemId((current) => (current === itemId ? "" : itemId));
  };

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (
        !hasUnsavedChangesRef.current ||
        allowNavigationRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest?.("a[href]");

      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);

      if (destination.href === current.href) return;

      event.preventDefault();
      event.stopPropagation();

      setPendingNavigation(
        destination.origin === current.origin
          ? `${destination.pathname}${destination.search}${destination.hash}`
          : destination.href,
      );
      setLeaveDialogOpen(true);
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  const handleFieldChange = (field, value) => {
    setSuccessText("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleItemChange = (itemId, field, value) => {
    if (field === "weight") {
      if (
        value !== "" &&
        (!Number.isFinite(Number(value)) ||
          Number(value) < 0 ||
          Number(value) > 100)
      ) {
        setErrorText("單一評核項目的權重必須介於 0 至 100。");
        return;
      }

      const nextWeightTotal = form.items.reduce(
        (sum, item) =>
          sum +
          (item.item_id === itemId
            ? Number(value || 0)
            : Number(item.weight || 0)),
        0,
      );

      if (nextWeightTotal > 100) {
        setErrorText("評核項目的權重合計不可超過 100。");
        return;
      }
    }

    setErrorText("");
    setSuccessText("");

    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.item_id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  const handleAddItem = () => {
    const newItem = createEmptyItem();

    setErrorText("");
    setSuccessText("");

    setForm((current) => ({
      ...current,
      items: [...current.items, newItem],
    }));

    setExpandedMobileItemId(newItem.item_id);
  };

  const handleDeleteItem = (itemId) => {
    if (form.items.length <= 1) {
      return;
    }

    setErrorText("");
    setSuccessText("");

    setForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.item_id !== itemId),
    }));

    if (expandedMobileItemId === itemId) {
      const remaining = form.items.filter((item) => item.item_id !== itemId);

      setExpandedMobileItemId(remaining[0]?.item_id || "");
    }
  };

  const buildPayload = () => ({
    ...form,
    evaluation_date: form.evaluation_date,
    evaluator_employee_id: form.evaluator_employee_id || "",
  });

  const persistDraft = async ({ showSuccess = true } = {}) => {
    if (!form) return false;

    setSaving(true);
    setErrorText("");

    if (showSuccess) {
      setSuccessText("");
    }

    try {
      const result = await saveProbationDraft(
        caseId,
        evaluationMonth,
        buildPayload(),
      );

      const savedForm = createFormState(result);

      const savedSnapshot = JSON.stringify(savedForm);

      hasUnsavedChangesRef.current = false;

      setData(result);
      setForm(savedForm);
      setSavedFormSnapshot(savedSnapshot);

      if (showSuccess) {
        setSuccessText("資料已儲存，可稍後繼續填寫。");
      }

      return true;
    } catch (error) {
      console.error(error);

      setErrorText(
        error?.response?.data?.message ||
          error?.message ||
          "儲存評核資料失敗。",
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    await persistDraft();
  };

  const requestNavigation = (to) => {
    if (!hasUnsavedChangesRef.current) {
      navigate(to);
      return;
    }

    setPendingNavigation(to);
    setLeaveDialogOpen(true);
  };

  const handleStayOnPage = () => {
    setLeaveDialogOpen(false);
    setPendingNavigation(null);
  };

  const continuePendingNavigation = () => {
    if (!pendingNavigation) return;

    const destination = pendingNavigation;

    allowNavigationRef.current = true;
    setLeaveDialogOpen(false);
    setPendingNavigation(null);

    if (
      destination.startsWith("http://") ||
      destination.startsWith("https://")
    ) {
      window.location.assign(destination);
      return;
    }

    navigate(destination);
  };

  const handleLeaveWithoutSaving = () => {
    hasUnsavedChangesRef.current = false;

    continuePendingNavigation();
  };

  const handleSaveAndLeave = async () => {
    const saved = await persistDraft({
      showSuccess: false,
    });

    if (!saved) return;

    hasUnsavedChangesRef.current = false;

    continuePendingNavigation();
  };

  const handleSubmit = () => {
    if (!form) return;

    setSubmitDialogOpen(true);
  };

  const handleSubmitSaveLater = async () => {
    setSubmitDialogOpen(false);

    await persistDraft({
      showSuccess: true,
    });
  };

  const handleFinishEvaluation = async () => {
    if (!form) return;

    const validationError = validateFinishForm(form);

    if (validationError) {
      setSubmitDialogOpen(false);
      setErrorText(validationError);
      return;
    }

    setSaving(true);
    setErrorText("");
    setSuccessText("");

    try {
      const result = await submitProbationEvaluation(
        caseId,
        evaluationMonth,
        buildPayload(),
      );

      const submittedForm = createFormState(result);

      const submittedSnapshot = JSON.stringify(submittedForm);

      hasUnsavedChangesRef.current = false;

      setData(result);
      setForm(submittedForm);
      setSavedFormSnapshot(submittedSnapshot);
      setSubmitDialogOpen(false);
      setSuccessText("本次評核已標記為已完成。");
    } catch (error) {
      console.error(error);

      setErrorText(
        error?.response?.data?.message || error?.message || "完成評核失敗。",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          py: "80px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (!data || !form || !summary) {
    return (
      <Box
        sx={{
          px: { xs: 1.5, sm: 2, md: 3 },
          py: 3,
        }}
      >
        {errorText ? <Alert severity="error">{errorText}</Alert> : null}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1680px",
        mx: "auto",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      <Breadcrumb
        rootLabel="試用期管理"
        rootTo="/attendance/admin/probation"
        currentLabel={`第${evaluationMonth}個月評核`}
        mb="14px"
      />

      <Box
        sx={{
          mb: "16px",
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: "10px",
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "21px", sm: "25px" },
            fontWeight: 700,
            color: "#111827",
          }}
        >
          第{evaluationMonth}個月試用期工作評核
        </Typography>

        <Button
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() =>
            requestNavigation(`/attendance/admin/probation/${caseId}`)
          }
          sx={{
            alignSelf: { xs: "flex-start", sm: "center" },
          }}
        >
          返回試用期詳情
        </Button>
      </Box>

      {errorText ? (
        <Alert severity="error" sx={{ mb: "12px" }}>
          {errorText}
        </Alert>
      ) : null}

      {successText ? (
        <Alert severity="success" sx={{ mb: "12px" }}>
          {successText}
        </Alert>
      ) : null}

      <Paper
        variant="outlined"
        sx={{
          width: {
            xs: "calc(100% + 24px)",
            sm: "calc(100% + 32px)",
            md: "calc(100% + 48px)",
          },
          mx: {
            xs: "-12px",
            sm: "-16px",
            md: "-24px",
          },
          overflow: "hidden",
          borderColor: BORDER,
          borderRadius: { xs: 0, sm: "4px" },
          boxShadow: "none",
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            width: "100%",
            borderTop: `1px solid ${BORDER}`,
            borderLeft: `1px solid ${BORDER}`,
          }}
        >
          {/* Title */}
          <Box
            sx={{
              minHeight: "44px",
              px: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: BLUE,
              borderRight: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
              color: "#ffffff",
              fontSize: "20px",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {data.template.title}
          </Box>

          {/* Employee information - desktop */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "0.8fr 2.4fr 0.9fr 1.8fr 0.8fr 1.8fr 0.95fr 1.4fr",
              }}
            >
              <LabelCell>姓名／編號</LabelCell>

              <ValueCell>
                {data.display_name} / {data.employee_no}
              </ValueCell>

              <LabelCell sx={{ justifyContent: "center" }}>部門</LabelCell>

              <ValueCell>{data.unit_name}</ValueCell>

              <LabelCell sx={{ justifyContent: "center" }}>職稱</LabelCell>

              <ValueCell>{data.position_name}</ValueCell>

              <LabelCell sx={{ justifyContent: "center" }}>評核人員</LabelCell>

              <ValueCell>
                <Select
                  value={String(form.evaluator_employee_id || "")}
                  onChange={(event) =>
                    handleFieldChange(
                      "evaluator_employee_id",
                      event.target.value,
                    )
                  }
                  displayEmpty
                  size="small"
                  fullWidth
                  sx={{
                    height: "32px",
                    fontSize: "13px",
                  }}
                >
                  <MenuItem value="">
                    <em>請選擇評核人員</em>
                  </MenuItem>

                  {evaluatorOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </ValueCell>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "0.8fr 2.4fr 0.9fr 1.8fr 0.8fr 1.8fr 0.95fr 1.4fr",
              }}
            >
              <LabelCell>到職日期</LabelCell>

              <ValueCell>{formatDate(data.hire_date)}</ValueCell>

              <LabelCell sx={{ justifyContent: "center" }}>評核日期</LabelCell>

              <ValueCell>
                <SheetInput
                  type="date"
                  value={form.evaluation_date}
                  onChange={(event) =>
                    handleFieldChange("evaluation_date", event.target.value)
                  }
                />
              </ValueCell>

              <LabelCell sx={{ justifyContent: "center" }}>試用期間</LabelCell>

              <ValueCell sx={{ gridColumn: "span 3" }}>
                {formatDate(data.probation_start_date)} ～{" "}
                {formatDate(data.probation_end_date)}
              </ValueCell>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "0.8fr 10.05fr",
              }}
            >
              <LabelCell>工作內容</LabelCell>

              <ValueCell
                sx={{
                  minHeight: "50px",
                  whiteSpace: "pre-wrap",
                  alignItems: "flex-start",
                  lineHeight: 1.55,
                }}
              >
                {data.work_content || "-"}
              </ValueCell>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "0.8fr 10.05fr",
              }}
            >
              <LabelCell>核心工作能力</LabelCell>

              <ValueCell
                sx={{
                  minHeight: "50px",
                  whiteSpace: "pre-wrap",
                  alignItems: "flex-start",
                  lineHeight: 1.55,
                }}
              >
                {data.core_work_ability || "-"}
              </ValueCell>
            </Box>
          </Box>

          {/* Employee information - mobile */}
          <Box
            sx={{
              display: { xs: "grid", md: "none" },
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              p: "10px",
              borderRight: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <MobileField label="姓名／編號">
              {data.display_name} / {data.employee_no}
            </MobileField>

            <MobileField label="部門">{data.unit_name}</MobileField>

            <MobileField label="職稱">{data.position_name}</MobileField>

            <MobileField label="評核人員">
              <Select
                value={String(form.evaluator_employee_id || "")}
                onChange={(event) =>
                  handleFieldChange("evaluator_employee_id", event.target.value)
                }
                displayEmpty
                size="small"
                fullWidth
                sx={{
                  height: "32px",
                  fontSize: "13px",
                }}
              >
                <MenuItem value="">
                  <em>請選擇評核人員</em>
                </MenuItem>

                {evaluatorOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </MobileField>

            <MobileField label="到職日期">
              {formatDate(data.hire_date)}
            </MobileField>

            <MobileField label="評核日期">
              <SheetInput
                type="date"
                value={form.evaluation_date}
                onChange={(event) =>
                  handleFieldChange("evaluation_date", event.target.value)
                }
              />
            </MobileField>

            <MobileField label="試用期間" fullWidth>
              {formatDate(data.probation_start_date)} ～{" "}
              {formatDate(data.probation_end_date)}
            </MobileField>

            <MobileField label="工作內容" fullWidth>
              <Typography
                sx={{
                  whiteSpace: "pre-wrap",
                  fontSize: "13px",
                  lineHeight: 1.55,
                }}
              >
                {data.work_content || "-"}
              </Typography>
            </MobileField>

            <MobileField label="核心工作能力" fullWidth>
              <Typography
                sx={{
                  whiteSpace: "pre-wrap",
                  fontSize: "13px",
                  lineHeight: 1.55,
                }}
              >
                {data.core_work_ability || "-"}
              </Typography>
            </MobileField>
          </Box>

          {/* Focus */}
          <Box
            sx={{
              px: "10px",
              py: "6px",
              bgcolor: LIGHT_ORANGE,
              borderRight: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
              fontSize: "13px",
              fontWeight: 600,
              color: "#713f12",
            }}
          >
            {data.template.focus}
          </Box>

          {/* Summary headings */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            {["權重合計", "評核完成度", "本月總分", "評核結果"].map((label) => (
              <Box
                key={label}
                sx={{
                  px: "8px",
                  py: "5px",
                  bgcolor: LIGHT_BLUE,
                  borderRight: `1px solid ${BORDER}`,
                  borderBottom: `1px solid ${BORDER}`,
                  color: "#064b76",
                  fontSize: "13px",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {label}
              </Box>
            ))}
          </Box>

          {/* Summary values */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            <SummaryValue emphasis>{summary.weight_total} / 100</SummaryValue>

            <SummaryValue emphasis>{summary.completion_text}</SummaryValue>

            <SummaryValue emphasis>
              {summary.completed_count > 0 ? summary.total_score : "-"}
            </SummaryValue>

            <SummaryValue>{evaluationStatusLabel}</SummaryValue>
          </Box>

          {/* Evaluation table - desktop */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "0.75fr 1.45fr 2.8fr 0.7fr 0.65fr 0.75fr 1.6fr 1.6fr 0.65fr",
              }}
            >
              {[
                "類別",
                "評核項目",
                "評核重點／行為說明",
                "權重",
                "評分\n1–5分",
                "加權得分",
                "具體事例／評語",
                "後續改善或培訓方向",
                "操作",
              ].map((label) => (
                <Box
                  key={label}
                  sx={{
                    minHeight: "46px",
                    px: "6px",
                    py: "5px",
                    bgcolor: BLUE,
                    borderRight: `1px solid ${BORDER}`,
                    borderBottom: `1px solid ${BORDER}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    whiteSpace: "pre-line",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {label}
                </Box>
              ))}
            </Box>

            {summary.items.map((item) => {
              const formItem =
                form.items.find((current) => current.item_id === item.id) || {};

              return (
                <Box
                  key={item.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "0.75fr 1.45fr 2.8fr 0.7fr 0.65fr 0.75fr 1.6fr 1.6fr 0.65fr",
                  }}
                >
                  <ValueCell sx={{ alignItems: "stretch", p: "6px" }}>
                    <SheetInput
                      value={formItem.category || ""}
                      onChange={(event) =>
                        handleItemChange(
                          item.id,
                          "category",
                          event.target.value,
                        )
                      }
                      multiline
                      minRows={2}
                      placeholder="輸入類別"
                    />
                  </ValueCell>

                  <ValueCell sx={{ alignItems: "stretch", p: "6px" }}>
                    <SheetInput
                      value={formItem.item_name || ""}
                      onChange={(event) =>
                        handleItemChange(
                          item.id,
                          "item_name",
                          event.target.value,
                        )
                      }
                      multiline
                      minRows={2}
                      placeholder="輸入評核項目"
                    />
                  </ValueCell>

                  <ValueCell sx={{ alignItems: "stretch", p: "6px" }}>
                    <SheetInput
                      value={formItem.description || ""}
                      onChange={(event) =>
                        handleItemChange(
                          item.id,
                          "description",
                          event.target.value,
                        )
                      }
                      multiline
                      minRows={3}
                      placeholder="輸入評核重點／行為說明"
                    />
                  </ValueCell>

                  <ValueCell sx={{ p: "6px" }}>
                    <SheetInput
                      type="number"
                      value={formItem.weight ?? ""}
                      onChange={(event) =>
                        handleItemChange(item.id, "weight", event.target.value)
                      }
                      placeholder="0"
                    />
                  </ValueCell>

                  <ValueCell sx={{ justifyContent: "center", p: "4px" }}>
                    <Select
                      value={formItem.score ?? ""}
                      onChange={(event) =>
                        handleItemChange(item.id, "score", event.target.value)
                      }
                      displayEmpty
                      size="small"
                      fullWidth
                      sx={{
                        height: "32px",
                        fontSize: "13px",
                        "& .MuiSelect-select": {
                          py: "5px",
                          textAlign: "center",
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>-</em>
                      </MenuItem>

                      {[1, 2, 3, 4, 5].map((score) => (
                        <MenuItem key={score} value={score}>
                          {score}
                        </MenuItem>
                      ))}
                    </Select>
                  </ValueCell>

                  <ValueCell
                    sx={{
                      justifyContent: "center",
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.weighted_score === "" ? "-" : item.weighted_score}
                  </ValueCell>

                  <ValueCell sx={{ alignItems: "stretch", p: "6px" }}>
                    <SheetInput
                      value={formItem.example_comment || ""}
                      onChange={(event) =>
                        handleItemChange(
                          item.id,
                          "example_comment",
                          event.target.value,
                        )
                      }
                      multiline
                      minRows={2}
                    />
                  </ValueCell>

                  <ValueCell sx={{ alignItems: "stretch", p: "6px" }}>
                    <SheetInput
                      value={formItem.improvement_direction || ""}
                      onChange={(event) =>
                        handleItemChange(
                          item.id,
                          "improvement_direction",
                          event.target.value,
                        )
                      }
                      multiline
                      minRows={2}
                    />
                  </ValueCell>

                  <ValueCell
                    sx={{
                      justifyContent: "center",
                      p: "4px",
                    }}
                  >
                    <Button
                      size="small"
                      color="error"
                      disabled={form.items.length <= 1}
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      刪除
                    </Button>
                  </ValueCell>
                </Box>
              );
            })}
          </Box>

          {/* Evaluation table - mobile */}
          <Box
            sx={{
              display: { xs: "block", md: "none" },
              p: "10px",
              bgcolor: "#f8fafc",
              borderRight: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            {summary.items.map((item, index) => {
              const formItem =
                form.items.find((current) => current.item_id === item.id) || {};

              const expanded = expandedMobileItemId === item.id;
              const hasWeightedScore =
                item.weighted_score !== "" &&
                item.weighted_score !== null &&
                item.weighted_score !== undefined;

              return (
                <Box
                  key={item.id}
                  sx={{
                    mb: index === summary.items.length - 1 ? 0 : "10px",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "6px",
                    overflow: "hidden",
                    bgcolor: "#ffffff",
                  }}
                >
                  <ButtonBase
                    onClick={() => handleMobileItemToggle(item.id)}
                    sx={{
                      width: "100%",
                      px: "10px",
                      py: "10px",
                      bgcolor: BLUE,
                      color: "#ffffff",
                      textAlign: "left",
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 700,
                          opacity: 0.9,
                        }}
                      >
                        {formItem.category || "未填類別"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: "2px",
                          fontSize: "15px",
                          fontWeight: 700,
                          lineHeight: 1.35,
                        }}
                      >
                        {formItem.item_name || "未填評核項目"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        minWidth: "64px",
                        px: "8px",
                        py: "5px",
                        border: "2px solid rgba(255,255,255,0.85)",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      {hasWeightedScore
                        ? item.weighted_score
                        : 0}
                      /{formItem.weight || 0}
                    </Box>

                    <ExpandMoreRoundedIcon
                      sx={{
                        fontSize: "30px",
                        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </ButtonBase>

                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Box sx={{ p: "12px" }}>
                      <Typography
                        sx={{
                          mt: "10px",
                          mb: "6px",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        評核重點／行為說明
                      </Typography>

                      <Box sx={{ mb: "14px" }}>
                        <MobileField label="評核重點／行為說明" fullWidth>
                          <SheetInput
                            value={formItem.description || ""}
                            onChange={(event) =>
                              handleItemChange(
                                item.id,
                                "description",
                                event.target.value,
                              )
                            }
                            multiline
                            minRows={3}
                            placeholder="輸入評核重點／行為說明"
                          />
                        </MobileField>
                      </Box>

                      <Box
                        sx={{
                          mb: "10px",
                          border: `1px solid ${BORDER}`,
                          borderRadius: "6px",
                          overflow: "hidden",
                          bgcolor: "#ffffff",
                        }}
                      >
                        <Box
                          sx={{
                            px: "9px",
                            py: "6px",
                            bgcolor: LIGHT_BLUE,
                            color: "#064b76",
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          評分 1–5分
                        </Box>

                        <Box
                          sx={{
                            px: "10px",
                            py: "12px",
                            display: "grid",
                            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                            gap: "4px",
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((score) => {
                            const selected = Number(formItem.score) === score;

                            return (
                              <ButtonBase
                                key={score}
                                onClick={() =>
                                  handleItemChange(item.id, "score", score)
                                }
                                sx={{
                                  minWidth: 0,
                                  py: "2px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  borderRadius: "6px",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "50%",
                                    border: selected
                                      ? `1px solid ${BLUE}`
                                      : "1px solid #6b7280",
                                    bgcolor: selected
                                      ? BLUE
                                      : "#ffffff",
                                  }}
                                />

                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    fontWeight: selected ? 700 : 500,
                                    color: "#111827",
                                  }}
                                >
                                  {score}
                                </Typography>
                              </ButtonBase>
                            );
                          })}
                        </Box>
                      </Box>

                      <MobileField label="具體事例／評語" fullWidth>
                        <SheetInput
                          value={formItem.example_comment || ""}
                          onChange={(event) =>
                            handleItemChange(
                              item.id,
                              "example_comment",
                              event.target.value,
                            )
                          }
                          multiline
                          minRows={3}
                        />
                      </MobileField>

                      <Box sx={{ mt: "10px" }}>
                        <MobileField label="後續改善或培訓方向" fullWidth>
                          <SheetInput
                            value={formItem.improvement_direction || ""}
                            onChange={(event) =>
                              handleItemChange(
                                item.id,
                                "improvement_direction",
                                event.target.value,
                              )
                            }
                            multiline
                            minRows={3}
                          />
                        </MobileField>
                      </Box>

                      <Box
                        sx={{
                          mt: "12px",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          disabled={form.items.length <= 1}
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          刪除此評核項目
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              px: "10px",
              py: "10px",
              borderRight: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
              display: "flex",
              justifyContent: "flex-start",
              bgcolor: "#ffffff",
            }}
          >
            <Button variant="outlined" onClick={handleAddItem}>
              ＋ 新增評核項目
            </Button>
          </Box>

          {/* Conclusion title */}
          <Box
            sx={{
              px: "10px",
              py: "5px",
              bgcolor: DARK_BLUE,
              borderRight: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {data.template.conclusionTitle}
          </Box>

          {/* Overall comment - desktop */}
          <Box
            sx={{
              display: { xs: "none", md: "grid" },
              gridTemplateColumns: "1fr 3fr",
            }}
          >
            <LabelCell
              sx={{
                minHeight: "72px",
                justifyContent: "center",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              <Box>
                整體評語
                <Typography
                  component="div"
                  sx={{
                    mt: "2px",
                    fontSize: "12px",
                    color: "#075985",
                  }}
                >
                  （具體表現、優點及待改善事項）
                </Typography>
              </Box>
            </LabelCell>

            <ValueCell
              sx={{
                minHeight: "72px",
                alignItems: "stretch",
              }}
            >
              <SheetInput
                value={form.overall_comment}
                onChange={(event) =>
                  handleFieldChange("overall_comment", event.target.value)
                }
                multiline
                minRows={3}
              />
            </ValueCell>
          </Box>

          {/* Overall comment - mobile */}
          <Box
            sx={{
              display: { xs: "block", md: "none" },
              p: "10px",
              borderRight: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <MobileField
              label="整體評語（具體表現、優點及待改善事項）"
              fullWidth
            >
              <SheetInput
                value={form.overall_comment}
                onChange={(event) =>
                  handleFieldChange("overall_comment", event.target.value)
                }
                multiline
                minRows={4}
              />
            </MobileField>
          </Box>

          {/* Decision section - desktop */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              }}
            >
              {[
                "自動判定",
                data.template.decisionLabel,
                "預計改善期限",
                data.template.followUpLabel,
              ].map((label) => (
                <Box
                  key={label}
                  sx={{
                    px: "8px",
                    py: "8px",
                    bgcolor: LIGHT_BLUE,
                    borderRight: `1px solid ${BORDER}`,
                    borderBottom: `1px solid ${BORDER}`,
                    color: "#075985",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {label}
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              }}
            >
              <ValueCell
                sx={{
                  minHeight: "48px",
                  justifyContent: "center",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {summary.result}
              </ValueCell>

              <ValueCell sx={{ minHeight: "48px" }}>
                <SheetInput
                  value={form.supervisor_decision}
                  onChange={(event) =>
                    handleFieldChange("supervisor_decision", event.target.value)
                  }
                  placeholder="請輸入主管決定"
                />
              </ValueCell>

              <ValueCell>
                <SheetInput
                  type="date"
                  value={form.improvement_due_date}
                  onChange={(event) =>
                    handleFieldChange(
                      "improvement_due_date",
                      event.target.value,
                    )
                  }
                />
              </ValueCell>

              <ValueCell>
                <SheetInput
                  type="date"
                  value={form.follow_up_date}
                  onChange={(event) =>
                    handleFieldChange("follow_up_date", event.target.value)
                  }
                />
              </ValueCell>
            </Box>
          </Box>

          {/* Decision section - mobile */}
          <Box
            sx={{
              display: { xs: "grid", md: "none" },
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              p: "10px",
              borderRight: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <MobileField label="自動判定">{summary.result}</MobileField>

            <MobileField label={data.template.decisionLabel}>
              <SheetInput
                value={form.supervisor_decision}
                onChange={(event) =>
                  handleFieldChange("supervisor_decision", event.target.value)
                }
                placeholder="請輸入主管決定"
              />
            </MobileField>

            <MobileField label="預計改善期限">
              <SheetInput
                type="date"
                value={form.improvement_due_date}
                onChange={(event) =>
                  handleFieldChange("improvement_due_date", event.target.value)
                }
              />
            </MobileField>

            <MobileField label={data.template.followUpLabel}>
              <SheetInput
                type="date"
                value={form.follow_up_date}
                onChange={(event) =>
                  handleFieldChange("follow_up_date", event.target.value)
                }
              />
            </MobileField>
          </Box>

          {/* Signature area */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            {["評核人員簽名", "部門主管簽名", "人事簽名", "總經理簽名"].map(
              (label) => (
                <Box
                  key={label}
                  sx={{
                    minWidth: 0,
                    borderRight: `1px solid ${BORDER}`,
                    borderBottom: `1px solid ${BORDER}`,
                    bgcolor: "#ffffff",
                  }}
                >
                  <Box
                    sx={{
                      minHeight: "34px",
                      px: "8px",
                      py: "7px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderBottom: `1px solid ${BORDER}`,
                      bgcolor: LIGHT_BLUE,
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                      textAlign: "center",
                    }}
                  >
                    {label}
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) 112px",
                      minHeight: "82px",
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 0,
                        minHeight: "82px",
                        bgcolor: "#ffffff",
                      }}
                    />

                    <Box
                      sx={{
                        minWidth: 0,
                        p: "6px",
                        display: "flex",
                        alignItems: "center",
                        borderLeft: `1px solid ${BORDER}`,
                        bgcolor: "#ffffff",
                      }}
                    >
                      <SheetInput
                        type="date"
                        value=""
                        onChange={() => {}}
                      />
                    </Box>
                  </Box>
                </Box>
              ),
            )}
          </Box>

          {/* Reminder */}
          <Box
            sx={{
              px: "10px",
              py: "5px",
              bgcolor: LIGHT_ORANGE,
              borderRight: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
              color: "#b45309",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            使用提醒：評分須附具體事例；若有重大誠信、紀律或安全事件，不應僅依總分判定，請於整體評語中說明並由主管決議。
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 5,
          mt: "14px",
          mx: { xs: -1.5, sm: -2, md: -3 },
          px: { xs: 1.5, sm: 2, md: 3 },
          py: "10px",
          bgcolor: "rgba(248,250,252,0.96)",
          borderTop: "1px solid #d1d5db",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "10px",
          backdropFilter: "blur(6px)",
        }}
      >
        <Button
          variant="outlined"
          disabled={saving}
          onClick={() =>
            requestNavigation(`/attendance/admin/probation/${caseId}`)
          }
        >
          返回
        </Button>

        <Button
          variant="outlined"
          startIcon={<SaveOutlinedIcon />}
          disabled={saving}
          onClick={handleSaveDraft}
        >
          儲存草稿
        </Button>

        <Button
          variant="contained"
          startIcon={<SendOutlinedIcon />}
          disabled={saving}
          onClick={handleSubmit}
        >
          送出
        </Button>
      </Box>

      <Dialog
        open={submitDialogOpen}
        onClose={saving ? undefined : () => setSubmitDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          是否完成本次評核？
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              fontSize: "14px",
              color: "#4b5563",
              lineHeight: 1.65,
            }}
          >
            若本月評核尚未完成，可選擇「儲存稍後繼續」保存目前內容；若已完成本次評核，請選擇「完成本次評核」。標記為已完成後仍可再次開啟及修改。
          </Typography>

          <Typography
            sx={{
              mt: "10px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            儲存稍後繼續不要求所有資料完成；完成本次評核時，權重合計必須為
            100，且所有評核項目均須完成評分。
          </Typography>

          <Typography
            sx={{
              mt: "6px",
              fontSize: "13px",
              fontWeight: 700,
              color:
                Number(summary.weight_total || 0) === 100
                  ? "#166534"
                  : "#92400e",
            }}
          >
            目前權重合計：{summary.weight_total} / 100
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            disabled={saving}
            onClick={() => setSubmitDialogOpen(false)}
          >
            取消
          </Button>

          <Button
            variant="outlined"
            startIcon={<SaveOutlinedIcon />}
            disabled={saving}
            onClick={handleSubmitSaveLater}
          >
            儲存稍後繼續
          </Button>

          <Button
            variant="contained"
            startIcon={<SendOutlinedIcon />}
            disabled={saving}
            onClick={handleFinishEvaluation}
          >
            完成本次評核
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={leaveDialogOpen}
        onClose={saving ? undefined : handleStayOnPage}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontSize: "18px",
            fontWeight: 700,
          }}
        >
          尚有未儲存的評核資料
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              fontSize: "14px",
              color: "#4b5563",
              lineHeight: 1.65,
            }}
          >
            您目前的修改尚未儲存。您可以先儲存草稿後離開，或不儲存直接離開。
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            disabled={saving}
            onClick={handleStayOnPage}
          >
            留在此頁
          </Button>

          <Button
            variant="outlined"
            color="error"
            disabled={saving}
            onClick={handleLeaveWithoutSaving}
          >
            不儲存並離開
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            disabled={saving}
            onClick={handleSaveAndLeave}
          >
            儲存後離開
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
