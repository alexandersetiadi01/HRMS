import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";

import Breadcrumb from "../../../../Utils/Breadcrumb";
import { apiAttendanceAdminMeta } from "../../../../API/attendance";
import { getProbationCase, updateProbation } from "../../../../API/probation";
import { EVALUATION_STATUS, PROBATION_STATUS } from "./probationConstants";
import ProbationInformationDialog, {
  buildProbationForm,
  buildProbationPayload,
  EMPTY_PROBATION_FORM,
} from "./ProbationInformationDialog";

const EVALUATION_STATUS_LABELS = {
  [EVALUATION_STATUS.NOT_STARTED]: "尚未開始",
  [EVALUATION_STATUS.IN_PROGRESS]: "進行中",
  [EVALUATION_STATUS.COMPLETED]: "已完成",
};

const PROBATION_STATUS_LABELS = {
  [PROBATION_STATUS.NOT_STARTED]: "尚未開始",
  [PROBATION_STATUS.IN_PROGRESS]: "試用中",
  [PROBATION_STATUS.FOLLOW_UP]: "待改善追蹤",
  [PROBATION_STATUS.COMPLETED]: "已完成",
};

function formatDate(value) {
  const text = String(value || "").trim();
  if (!text) return "-";

  const [year, month, day] = text.split("-");
  if (!year || !month || !day) return text;

  return `${year}/${month}/${day}`;
}

function getEvaluationStatusSx(status) {
  switch (status) {
    case EVALUATION_STATUS.COMPLETED:
      return {
        bgcolor: "#dcfce7",
        color: "#166534",
        borderColor: "#bbf7d0",
      };

    case EVALUATION_STATUS.IN_PROGRESS:
      return {
        bgcolor: "#fef3c7",
        color: "#92400e",
        borderColor: "#fde68a",
      };

    default:
      return {
        bgcolor: "#f3f4f6",
        color: "#4b5563",
        borderColor: "#e5e7eb",
      };
  }
}

function getProbationStatusSx(status) {
  switch (status) {
    case PROBATION_STATUS.COMPLETED:
      return {
        bgcolor: "#dcfce7",
        color: "#166534",
        borderColor: "#bbf7d0",
      };

    case PROBATION_STATUS.FOLLOW_UP:
      return {
        bgcolor: "#fee2e2",
        color: "#991b1b",
        borderColor: "#fecaca",
      };

    case PROBATION_STATUS.IN_PROGRESS:
      return {
        bgcolor: "#dbeafe",
        color: "#1d4ed8",
        borderColor: "#bfdbfe",
      };

    default:
      return {
        bgcolor: "#f3f4f6",
        color: "#4b5563",
        borderColor: "#e5e7eb",
      };
  }
}

function StatusChip({ label, sx = {} }) {
  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{
        height: "26px",
        fontSize: "13px",
        fontWeight: 600,
        "& .MuiChip-label": {
          px: "9px",
        },
        ...sx,
      }}
    />
  );
}

function InfoItem({ label, value }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        px: { xs: "10px", sm: "14px" },
        py: { xs: "10px", sm: "12px" },
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        bgcolor: "#ffffff",
      }}
    >
      <Typography
        sx={{
          mb: "4px",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: { xs: "14px", sm: "15px" },
          fontWeight: 600,
          color: "#111827",
          overflowWrap: "anywhere",
        }}
      >
        {value || "-"}
      </Typography>
    </Box>
  );
}

function MonthCard({ monthData, onOpen }) {
  const {
    month,
    title,
    status,
    score,
    result,
    evaluationDate,
    supervisorDecision,
    actionLabel,
  } = monthData;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: "16px", sm: "18px" },
        borderColor: "#d1d5db",
        borderRadius: "8px",
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          mb: "14px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            第{month}個月
          </Typography>

          <Typography
            sx={{
              mt: "2px",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            {title}
          </Typography>
        </Box>

        <StatusChip
          label={EVALUATION_STATUS_LABELS[status] || status || "-"}
          sx={getEvaluationStatusSx(status)}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
          },
          gap: "10px",
        }}
      >
        <InfoItem label="評核日期" value={formatDate(evaluationDate)} />

        <InfoItem label="本月總分" value={score === "" ? "-" : `${score} 分`} />

        <InfoItem label="評核結果" value={result} />

        <InfoItem label="主管決定" value={supervisorDecision} />
      </Box>

      <Box
        sx={{
          mt: "16px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="contained"
          size="small"
          startIcon={<EditNoteOutlinedIcon />}
          onClick={() => onOpen(month)}
          sx={{
            minHeight: "36px",
            textTransform: "none",
          }}
        >
          {actionLabel}
        </Button>
      </Box>
    </Paper>
  );
}

export default function ProbationDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    ...EMPTY_PROBATION_FORM,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const [data, meta] = await Promise.all([
          getProbationCase(caseId),
          apiAttendanceAdminMeta(),
        ]);

        if (!active) return;

        setEmployeeOptions(
          Array.isArray(meta?.employeeOptions) ? meta.employeeOptions : [],
        );

        if (!data) {
          setCaseData(null);
          setErrorText("找不到指定的試用期資料。");
          return;
        }

        setCaseData(data);
      } catch (error) {
        console.error(error);

        if (active) {
          setCaseData(null);
          setErrorText(error?.message || "載入試用期資料失敗。");
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
  }, [caseId]);

  const reloadCase = async () => {
    const data = await getProbationCase(caseId);

    setCaseData(data);

    return data;
  };

  const handleOpenEdit = () => {
    if (!caseData) return;

    setEditForm(buildProbationForm(caseData));
    setEditError("");
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    if (editSubmitting) return;

    setEditOpen(false);
    setEditError("");
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditSubmit = async () => {
    const payload = buildProbationPayload(editForm);

    if (!payload.probation_start_date || !payload.probation_end_date) {
      setEditError("請填寫試用開始日與試用結束日。");
      return;
    }

    if (payload.probation_start_date > payload.probation_end_date) {
      setEditError("試用結束日不可早於試用開始日。");
      return;
    }

    if (!payload.work_content) {
      setEditError("請填寫工作內容。");
      return;
    }

    if (!payload.core_work_ability) {
      setEditError("請填寫核心工作能力。");
      return;
    }

    setEditSubmitting(true);
    setEditError("");

    try {
      const { employee_id, ...updatePayload } = payload;

      await updateProbation(caseId, updatePayload);

      await reloadCase();

      setEditOpen(false);
    } catch (error) {
      console.error(error);

      setEditError(
        error?.response?.data?.message ||
          error?.message ||
          "更新試用期資料失敗。",
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const monthCards = useMemo(() => {
    if (!caseData) return [];

    return [1, 2, 3].map((month) => {
      const evaluation = caseData?.evaluations?.[month] || {};
      const summary = evaluation?.summary || {
        completed_count: 0,
        item_count: 0,
        total_score: "",
        result: "尚未完成評分",
      };
      const status = evaluation.status || EVALUATION_STATUS.NOT_STARTED;

      const completed = status === EVALUATION_STATUS.COMPLETED;

      let actionLabel = "開始評核";

      if (status === EVALUATION_STATUS.IN_PROGRESS) {
        actionLabel = "繼續填寫";
      }

      if (status === EVALUATION_STATUS.COMPLETED) {
        actionLabel = "編輯評核";
      }

      return {
        month,
        title: month === 3 ? "試用期最終評核" : `第${month}個月工作評核`,
        status,
        score: completed ? summary.total_score : "",
        result: completed ? summary.result : "-",
        evaluationDate: evaluation.evaluation_date || "",
        supervisorDecision: evaluation.supervisor_decision || "-",
        actionLabel,
      };
    });
  }, [caseData]);

  const handleOpenEvaluation = (month) => {
    navigate(`/attendance/admin/probation/${caseId}/evaluation/${month}`);
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

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      <Breadcrumb
        rootLabel="試用期管理"
        rootTo="/attendance/admin/probation"
        currentLabel={
          caseData
            ? `${caseData.employee_no || "-"} / ${caseData.display_name || "-"}`
            : "試用期詳情"
        }
        mb="14px"
      />

      <Box
        sx={{
          mb: "18px",
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: "12px",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: "22px", sm: "25px", md: "28px" },
              fontWeight: 700,
              color: "#111827",
            }}
          >
            員工試用期詳情
          </Typography>

          {caseData ? (
            <Typography
              sx={{
                mt: "4px",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              {caseData.employee_no || "-"} / {caseData.display_name || "-"}
            </Typography>
          ) : null}
        </Box>

        <Button
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate("/attendance/admin/probation")}
          sx={{
            alignSelf: { xs: "flex-start", sm: "center" },
            textTransform: "none",
          }}
        >
          返回試用期管理
        </Button>
      </Box>

      {errorText ? <Alert severity="error">{errorText}</Alert> : null}

      {!caseData ? null : (
        <>
          <Paper
            variant="outlined"
            sx={{
              mb: "18px",
              p: { xs: "16px", sm: "20px" },
              borderColor: "#d1d5db",
              borderRadius: "8px",
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                mb: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Typography
                sx={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                基本資料
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                  onClick={handleOpenEdit}
                  sx={{
                    minHeight: "34px",
                    textTransform: "none",
                  }}
                >
                  修改
                </Button>

                <StatusChip
                  label={
                    PROBATION_STATUS_LABELS[caseData.status] ||
                    caseData.status ||
                    "-"
                  }
                  sx={getProbationStatusSx(caseData.status)}
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: "10px",
              }}
            >
              <InfoItem
                label="員工"
                value={`${caseData.employee_no || "-"} / ${caseData.display_name || "-"}`}
              />

              <InfoItem label="部門" value={caseData.unit_name} />

              <InfoItem label="職稱" value={caseData.position_name} />

              <InfoItem label="直屬主管" value={caseData.supervisor_name} />

              <InfoItem label="到職日" value={formatDate(caseData.hire_date)} />

              <InfoItem
                label="試用開始日"
                value={formatDate(caseData.probation_start_date)}
              />

              <InfoItem
                label="試用結束日"
                value={formatDate(caseData.probation_end_date)}
              />

              <InfoItem
                label="目前階段"
                value={`第${caseData.current_month || 1}個月`}
              />
            </Box>

            <Box
              sx={{
                mt: "10px",
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                },
                gap: "10px",
              }}
            >
              <InfoItem label="工作內容" value={caseData.work_content} />

              <InfoItem
                label="核心工作能力"
                value={caseData.core_work_ability || "-"}
              />
            </Box>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              mb: "18px",
              p: { xs: "16px", sm: "20px" },
              borderColor: "#d1d5db",
              borderRadius: "8px",
              boxShadow: "none",
            }}
          >
            <Typography
              sx={{
                mb: "16px",
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              試用期進度
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: "12px",
                "& > :last-child": {
                  gridColumn: {
                    xs: "1 / -1",
                    md: "auto",
                  },
                },
              }}
            >
              {[1, 2, 3].map((month) => {
                const monthData = monthCards.find(
                  (item) => item.month === month,
                );

                const completed =
                  monthData?.status === EVALUATION_STATUS.COMPLETED;

                const active =
                  Number(caseData.current_month || 1) === month &&
                  caseData.status !== PROBATION_STATUS.COMPLETED;

                return (
                  <Box
                    key={month}
                    sx={{
                      position: "relative",
                      px: "14px",
                      py: "14px",
                      border: "1px solid",
                      borderColor: active
                        ? "#60a5fa"
                        : completed
                          ? "#86efac"
                          : "#d1d5db",
                      borderRadius: "8px",
                      bgcolor: active
                        ? "#eff6ff"
                        : completed
                          ? "#f0fdf4"
                          : "#ffffff",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#6b7280",
                      }}
                    >
                      STEP {month}
                    </Typography>

                    <Typography
                      sx={{
                        mt: "3px",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      第{month}個月評核
                    </Typography>

                    <Typography
                      sx={{
                        mt: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color:
                          getEvaluationStatusSx(
                            monthData?.status,
                          ).color,  
                      }}
                    >
                      {EVALUATION_STATUS_LABELS[monthData?.status] || "-"}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            {monthCards.map((monthData) => (
              <MonthCard
                key={monthData.month}
                monthData={monthData}
                onOpen={handleOpenEvaluation}
              />
            ))}
          </Box>
        </>
      )}

      <ProbationInformationDialog
        open={editOpen}
        editing
        form={editForm}
        employeeOptions={employeeOptions}
        submitting={editSubmitting}
        errorText={editError}
        onChange={handleEditFormChange}
        onClose={handleCloseEdit}
        onSubmit={handleEditSubmit}
      />
    </Box>
  );
}
