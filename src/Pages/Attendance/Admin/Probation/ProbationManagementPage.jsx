import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import Breadcrumb from "../../../../Utils/Breadcrumb";
import {
  apiAttendanceAdminMeta,
} from "../../../../API/attendance";
import {
  createProbation,
  getProbationCases,
} from "../../../../API/probation";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";
import {
  EVALUATION_STATUS,
  PROBATION_STATUS,
} from "./probationConstants";
import ProbationInformationDialog, {
  buildProbationPayload,
  EMPTY_PROBATION_FORM,
} from "./ProbationInformationDialog";

const INITIAL_FILTERS = {
  unit_name: "",
  employee_id: "",
  probation_status: "",
  evaluation_status: "",
  search: "",
};

const TABLE_COLUMNS = [
  { key: "employee", label: "員工", width: "1.4fr" },
  { key: "unit_name", label: "部門", width: "1fr" },
  { key: "position_name", label: "職稱", width: "1fr" },
  { key: "probation_period", label: "試用期間", width: "1.4fr" },
  { key: "current_status", label: "目前狀態", width: "1fr" },
  { key: "actions", label: "操作", width: "76px", hideOnMobile: true },
];

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

function getProbationStatusColor(status) {
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
        maxWidth: "100%",
        fontSize: "13px",
        fontWeight: 600,
        "& .MuiChip-label": {
          px: "9px",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        ...sx,
      }}
    />
  );
}

function SummaryCard({ label, value, description }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        minWidth: 0,
        p: "16px",
        borderColor: "#d1d5db",
        borderRadius: "8px",
        boxShadow: "none",
      }}
    >
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#6b7280",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: "4px",
          fontSize: { xs: "24px", md: "28px" },
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1.2,
        }}
      >
        {value}
      </Typography>

      <Typography
        sx={{
          mt: "5px",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >
        {description}
      </Typography>
    </Paper>
  );
}

function buildTableRow(caseData) {
  return {
    ...caseData,
    employee: `${caseData.employee_no || "-"} / ${caseData.display_name || "-"}`,
    probation_period: `${formatDate(caseData.probation_start_date)} ～ ${formatDate(caseData.probation_end_date)}`,
    current_status:
      PROBATION_STATUS_LABELS[caseData.status] || caseData.status || "-",
  };
}

export default function ProbationManagementPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [cases, setCases] = useState([]);
  const [createEmployeeOptions, setCreateEmployeeOptions] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    ...EMPTY_PROBATION_FORM,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const loadCases = async () => {
    setLoading(true);
    setErrorText("");

    try {
      const data =
        await getProbationCases();

      setCases(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error) {
      console.error(error);

      setCases([]);
      setErrorText(
        error?.response?.data?.message ||
          error?.message ||
          "載入試用期資料失敗。",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const [data, meta] =
          await Promise.all([
            getProbationCases(),
            apiAttendanceAdminMeta(),
          ]);

        if (!active) return;

        setCases(
          Array.isArray(data)
            ? data
            : [],
        );

        setCreateEmployeeOptions(
          Array.isArray(
            meta?.employeeOptions,
          )
            ? meta.employeeOptions
            : [],
        );
      } catch (error) {
        console.error(error);

        if (!active) return;

        setCases([]);
        setCreateEmployeeOptions([]);
        setErrorText(
          error?.response?.data?.message ||
            error?.message ||
            "載入試用期資料失敗。",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      active = false;
    };
  }, []);

  const tableRows = useMemo(
    () => cases.map((item) => buildTableRow(item)),
    [cases],
  );

  const unitOptions = useMemo(() => {
    const units = Array.from(
      new Set(
        cases
          .map((item) => String(item.unit_name || "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "zh-Hant"));

    return [
      { value: "", label: "全部部門" },
      ...units.map((unit) => ({
        value: unit,
        label: unit,
      })),
    ];
  }, [cases]);

  const employeeOptions = useMemo(() => {
    const availableCases = filters.unit_name
      ? cases.filter(
          (item) =>
            String(item.unit_name || "") === String(filters.unit_name || ""),
        )
      : cases;

    return [
      { value: "", label: "全部員工" },
      ...availableCases.map((item) => ({
        value: String(item.employee_id),
        label: `${item.employee_no || "-"} / ${item.display_name || "-"}`,
      })),
    ];
  }, [cases, filters.unit_name]);

  const filteredRows = useMemo(() => {
    const keyword = String(appliedFilters.search || "")
      .trim()
      .toLowerCase();

    return tableRows.filter((row) => {
      if (
        appliedFilters.unit_name &&
        String(row.unit_name || "") !== String(appliedFilters.unit_name)
      ) {
        return false;
      }

      if (
        appliedFilters.employee_id &&
        String(row.employee_id || "") !== String(appliedFilters.employee_id)
      ) {
        return false;
      }

      if (
        appliedFilters.probation_status &&
        String(row.status || "") !== String(appliedFilters.probation_status)
      ) {
        return false;
      }

      if (appliedFilters.evaluation_status) {
        const evaluationStatuses = [
          row.evaluations?.[1]?.status,
          row.evaluations?.[2]?.status,
          row.evaluations?.[3]?.status,
        ];

        if (!evaluationStatuses.includes(appliedFilters.evaluation_status)) {
          return false;
        }
      }

      if (keyword) {
        const searchable = [
          row.employee_no,
          row.display_name,
          row.unit_name,
          row.position_name,
          row.supervisor_name,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        if (!searchable.includes(keyword)) {
          return false;
        }
      }

      return true;
    });
  }, [tableRows, appliedFilters]);

  const summary = useMemo(() => {
    const inProgress = cases.filter(
      (item) =>
        item.status === PROBATION_STATUS.IN_PROGRESS ||
        item.status === PROBATION_STATUS.FOLLOW_UP,
    ).length;

    const pendingEvaluation = cases.filter((item) =>
      [1, 2, 3].some((month) => {
        const status = item?.evaluations?.[month]?.status;

        return (
          month <= Number(item.current_month || 1) &&
          (status === EVALUATION_STATUS.NOT_STARTED ||
            status === EVALUATION_STATUS.IN_PROGRESS)
        );
      }),
    ).length;

    const followUp = cases.filter(
      (item) => item.status === PROBATION_STATUS.FOLLOW_UP,
    ).length;

    const finalMonth = cases.filter(
      (item) =>
        item.status !== PROBATION_STATUS.COMPLETED &&
        Number(item.current_month || 1) === 3,
    ).length;

    return {
      inProgress,
      pendingEvaluation,
      followUp,
      finalMonth,
    };
  }, [cases]);

  const handleOpenCreate = () => {
    setCreateForm({
      ...EMPTY_PROBATION_FORM,
    });
    setCreateError("");
    setCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (createSubmitting) return;

    setCreateOpen(false);
    setCreateError("");
  };

  const handleCreateFormChange = (
    field,
    value,
  ) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateSubmit = async () => {
    const payload =
      buildProbationPayload(
        createForm,
      );

    if (!payload.employee_id) {
      setCreateError("請選擇員工。");
      return;
    }

    if (
      !payload.probation_start_date ||
      !payload.probation_end_date
    ) {
      setCreateError(
        "請填寫試用開始日與試用結束日。",
      );
      return;
    }

    if (
      payload.probation_start_date >
      payload.probation_end_date
    ) {
      setCreateError(
        "試用結束日不可早於試用開始日。",
      );
      return;
    }

    if (!payload.work_content) {
      setCreateError(
        "請填寫工作內容。",
      );
      return;
    }

    if (!payload.core_work_ability) {
      setCreateError(
        "請填寫核心工作能力。",
      );
      return;
    }

    setCreateSubmitting(true);
    setCreateError("");

    try {
      const created =
        await createProbation(
          payload,
        );

      setCreateOpen(false);
      setCreateForm({
        ...EMPTY_PROBATION_FORM,
      });

      await loadCases();

      if (created?.id) {
        navigate(
          `/attendance/admin/probation/${created.id}`,
        );
      }
    } catch (error) {
      console.error(error);

      setCreateError(
        error?.response?.data?.message ||
          error?.message ||
          "新增試用期資料失敗。",
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "unit_name") {
        next.employee_id = "";
      }

      return next;
    });
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
  };

  const renderValue = (row, column) => {
    if (column.key === "current_status") {
      return (
        <StatusChip
          label={row.current_status}
          sx={getProbationStatusColor(row.status)}
        />
      );
    }

    if (column.key === "actions") {
      return (
        <Tooltip title="查看">
          <IconButton
            size="small"
            onClick={() =>
              navigate(`/attendance/admin/probation/${row.id}`)
            }
            aria-label="查看"
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }

    return row?.[column.key] || "-";
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      <Breadcrumb
        rootLabel="管理者專區"
        rootTo="/attendance"
        currentLabel="試用期管理"
        mb="14px"
      />

      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
          justifyContent:
            "space-between",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: "10px",
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: {
              xs: "22px",
              sm: "25px",
              md: "28px",
            },
            fontWeight: 700,
            color: "#111827",
          }}
        >
          試用期管理
        </Typography>

        <Button
          variant="contained"
          startIcon={
            <AddOutlinedIcon />
          }
          onClick={handleOpenCreate}
          disabled={loading}
          sx={{
            alignSelf: {
              xs: "stretch",
              sm: "center",
            },
            minHeight: "38px",
            textTransform: "none",
          }}
        >
          新增試用期
        </Button>
      </Box>

      <Box
        sx={{
          mb: "18px",
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: "12px",
        }}
      >
        <SummaryCard
          label="試用中"
          value={summary.inProgress}
          description="目前仍在試用期間"
        />

        <SummaryCard
          label="本期待評核"
          value={summary.pendingEvaluation}
          description="目前階段尚未完成"
        />

        <SummaryCard
          label="待改善追蹤"
          value={summary.followUp}
          description="已有改善追蹤事項"
        />

        <SummaryCard
          label="第3個月進行中"
          value={summary.finalMonth}
          description="即將完成試用期"
        />
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: "14px", sm: "18px" },
          borderColor: "#d1d5db",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
            "& > :last-child": {
              gridColumn: {
                xs: "1 / -1",
                lg: "auto",
              },
            },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              部門
            </Typography>

            <SelectField
              value={filters.unit_name}
              onChange={(value) => handleFilterChange("unit_name", value)}
              options={unitOptions}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              員工
            </Typography>

            <SelectField
              value={filters.employee_id}
              onChange={(value) => handleFilterChange("employee_id", value)}
              options={employeeOptions}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              試用期狀態
            </Typography>

            <SelectField
              value={filters.probation_status}
              onChange={(value) =>
                handleFilterChange("probation_status", value)
              }
              options={[
                { value: "", label: "全部狀態" },
                {
                  value: PROBATION_STATUS.NOT_STARTED,
                  label: "尚未開始",
                },
                {
                  value: PROBATION_STATUS.IN_PROGRESS,
                  label: "試用中",
                },
                {
                  value: PROBATION_STATUS.FOLLOW_UP,
                  label: "待改善追蹤",
                },
                {
                  value: PROBATION_STATUS.COMPLETED,
                  label: "已完成",
                },
              ]}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              評核進度
            </Typography>

            <SelectField
              value={filters.evaluation_status}
              onChange={(value) =>
                handleFilterChange("evaluation_status", value)
              }
              options={[
                { value: "", label: "全部進度" },
                {
                  value: EVALUATION_STATUS.NOT_STARTED,
                  label: "尚未開始",
                },
                {
                  value: EVALUATION_STATUS.IN_PROGRESS,
                  label: "進行中",
                },
                {
                  value: EVALUATION_STATUS.COMPLETED,
                  label: "已完成",
                },
              ]}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              搜尋
            </Typography>

            <TextField
              size="small"
              value={filters.search}
              placeholder="員工編號、姓名、部門或職稱"
              onChange={(event) =>
                handleFilterChange("search", event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              fullWidth
              disabled={loading}
              sx={{
                "& .MuiInputBase-root": {
                  height: "38px",
                  fontSize: "15px",
                  bgcolor: "#ffffff",
                },
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            mt: "14px",
            mb: "24px",
            display: "flex",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: "10px",
          }}
        >
          <ActionButtons
            onClear={handleClear}
            onSearch={handleSearch}
            disabled={loading}
          />
        </Box>

        {errorText ? (
          <Alert severity="error" sx={{ mb: "16px" }}>
            {errorText}
          </Alert>
        ) : null}

        {loading ? (
          <Box
            sx={{
              py: "48px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : (
          <ResponsiveAttendanceTable
            columns={TABLE_COLUMNS}
            rows={filteredRows}
            getRowKey={(row) => row.id}
            mobileCardTitleKey="employee"
            mobileCardEndKey="current_status"
            emptyText="查無符合條件的試用期資料"
            renderValue={renderValue}
            desktopMinWidth="900px"
            pagination
            rowsPerPage={10}
            onRowClick={(row) =>
              navigate(`/attendance/admin/probation/${row.id}`)
            }
          />
        )}
      </Paper>

      <ProbationInformationDialog
        open={createOpen}
        form={createForm}
        employeeOptions={
          createEmployeeOptions
        }
        submitting={
          createSubmitting
        }
        errorText={createError}
        onChange={
          handleCreateFormChange
        }
        onClose={
          handleCloseCreate
        }
        onSubmit={
          handleCreateSubmit
        }
      />
    </Box>
  );
}