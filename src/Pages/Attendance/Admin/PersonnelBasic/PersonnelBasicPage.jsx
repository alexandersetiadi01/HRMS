import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  apiAttendancePersonnelBasicCreate,
  apiAttendancePersonnelBasicDetail,
  apiAttendancePersonnelBasicJobChange,
  apiAttendancePersonnelBasicList,
  apiAttendancePersonnelBasicUpdate,
} from "../../../../API/attendance";
import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  ActionButtons,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";

const GENDER_OPTIONS = ["男", "女"];

const MARITAL_STATUS_OPTIONS = ["未婚", "已婚", "離婚", "喪偶", "其他"];

const COUNTRY_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
DE DJ DK DM DO DZ
EC EE EG EH ER ES ET
FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU
ID IE IL IM IN IO IQ IR IS IT
JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ
LA LB LC LI LK LR LS LT LU LV LY
MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ
OM
PA PE PF PG PH PK PL PM PN PR PS PT PW PY
QA
RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ
UA UG UM US UY UZ
VA VC VE VG VI VN VU
WF WS
YE YT
ZA ZM ZW
`
  .trim()
  .split(/\s+/);

const COUNTRY_DISPLAY_NAMES = new Intl.DisplayNames(["zh-Hant"], {
  type: "region",
});

const COUNTRY_OPTIONS = COUNTRY_CODES.map((code) => ({
  code,
  label: COUNTRY_DISPLAY_NAMES.of(code) || code,
})).sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"));

function getCountryOption(value) {
  const text = String(value || "").trim();

  if (!text) return null;

  return (
    COUNTRY_OPTIONS.find((option) => option.label === text) || {
      code: "",
      label: text,
    }
  );
}

const INITIAL_FILTERS = {
  unit_id: "",
  employee_id: "",
  status: "",
  search: "",
};

const INITIAL_CREATE_DATA = {
  employee: {
    employee_no: "",
    display_name: "",
    last_name: "",
    first_name: "",
    english_name: "",
    email: "",
    gender: "",
    nationality: "",
    birth_date: "",
    marital_status: "",
    hire_date: "",
    employee_status: "啟用",
  },
  job: {
    supervisor_employee_id: "",
    unit_id: "",
    position_id: "",
    effective_date: "",
    employee_type: "",
    remarks: "",
  },
  contact: {
    mobile_phone: "",
    home_phone: "",
    extension_no: "",
    work_mobile: "",
    personal_email: "",
    emergency_contact_name: "",
    emergency_relationship: "",
    emergency_home_phone: "",
    emergency_mobile_phone: "",
    postal_address: "",
    contact_address: "",
  },
  military: {
    military_status: "",
    service_type: "",
    service_period: "",
    entry_date: "",
    remarks: "",
  },
  account: {
    username: "",
    password: "",
    confirm_password: "",
    role_id: "",
  },
};

const TABLE_COLUMNS = [
  { key: "employee_no", label: "員工編號", width: "1fr" },
  { key: "display_name", label: "姓名", width: "1.2fr" },
  { key: "unit_name", label: "單位", width: "1.3fr" },
  { key: "position_name", label: "職稱", width: "1.2fr" },
  { key: "hire_date", label: "到職日", width: "1fr" },
  { key: "employee_status", label: "狀態", width: "0.8fr" },
  { key: "actions", label: "操作", width: "80px" },
];

function getData(response, fallback = null) {
  return response?.data?.data ?? response?.data ?? response ?? fallback;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function displayValue(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function employeeLabel(employee = {}) {
  const employeeNo = String(employee?.employee_no || "").trim();
  const displayName = String(employee?.display_name || "").trim();

  if (employeeNo && displayName) {
    return `${employeeNo}/${displayName}`;
  }

  return employeeNo || displayName || "";
}

function DetailField({ label, value }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "140px minmax(0, 1fr)" },
        gap: { xs: "4px", sm: "12px" },
        py: "8px",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>
        {label}
      </Typography>

      <Typography
        sx={{
          minWidth: 0,
          fontSize: "14px",
          color: "#111827",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {displayValue(value)}
      </Typography>
    </Box>
  );
}

function DetailSection({ title, children }) {
  return (
    <Box>
      <Typography
        sx={{
          mb: "4px",
          fontSize: "16px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        {title}
      </Typography>

      {children}
    </Box>
  );
}

export default function PersonnelBasicPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    units: [],
    positions: [],
    employees: [],
    roles: [],
  });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [detailErrorText, setDetailErrorText] = useState("");
  const [detailData, setDetailData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editErrorText, setEditErrorText] = useState("");
  const [saving, setSaving] = useState(false);
  const [createData, setCreateData] = useState(null);
  const [createErrorText, setCreateErrorText] = useState("");
  const [creating, setCreating] = useState(false);
  const [jobChangeData, setJobChangeData] = useState(null);
  const [jobChangeErrorText, setJobChangeErrorText] = useState("");
  const [jobSaving, setJobSaving] = useState(false);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const unitOptions = useMemo(
    () => [
      { value: "", label: "全部單位" },
      ...(Array.isArray(meta.units)
        ? meta.units.map((unit) => ({
            value: String(unit.unit_id || ""),
            label: unit.unit_name || unit.unit_code || `#${unit.unit_id}`,
          }))
        : []),
    ],
    [meta.units],
  );

  const employeeOptions = useMemo(() => {
    const employees = Array.isArray(meta.employees) ? meta.employees : [];

    if (!filters.unit_id) return employees;

    return employees.filter(
      (employee) =>
        String(employee.unit_id || "") === String(filters.unit_id || ""),
    );
  }, [meta.employees, filters.unit_id]);

  const loadData = useCallback(
    async (nextFilters = filters) => {
      setLoading(true);
      setErrorText("");

      try {
        const response = await apiAttendancePersonnelBasicList(nextFilters);
        const data = getData(response, {});

        setRows(Array.isArray(data?.items) ? data.items : []);

        setMeta({
          units: Array.isArray(data?.meta?.units) ? data.meta.units : [],
          positions: Array.isArray(data?.meta?.positions)
            ? data.meta.positions
            : [],
          employees: Array.isArray(data?.meta?.employees)
            ? data.meta.employees
            : [],
          roles: Array.isArray(data?.meta?.roles) ? data.meta.roles : [],
        });
      } catch (error) {
        console.error(error);
        setRows([]);
        setErrorText(getErrorMessage(error, "載入人員基本資料失敗。"));
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    loadData(INITIAL_FILTERS);
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "unit_id") {
        next.employee_id = "";
      }

      return next;
    });
  };

  const handleSearch = () => {
    loadData(filters);
  };

  const handleClear = () => {
    setFilters(INITIAL_FILTERS);
    loadData(INITIAL_FILTERS);
  };

  const handleOpenDetail = async (row) => {
    const employeeId = Number(row?.employee_id || 0);

    if (!employeeId) return;

    setDetailLoading(true);
    setDetailErrorText("");
    setDetailData({
      employee: row,
      contact: {},
      military: {},
      job: {},
    });

    try {
      const response = await apiAttendancePersonnelBasicDetail(employeeId);

      setDetailData(getData(response, {}));
    } catch (error) {
      console.error(error);
      setDetailErrorText(getErrorMessage(error, "載入人員詳細資料失敗。"));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = async (row) => {
    const employeeId = Number(row?.employee_id || 0);

    if (!employeeId) return;

    setDetailLoading(true);
    setEditErrorText("");

    try {
      const response = await apiAttendancePersonnelBasicDetail(employeeId);

      const data = getData(response, {});

      setEditData({
        employee: {
          ...(data?.employee || {}),
          employee_id: employeeId,
        },
        contact: data?.contact || {},
        military: data?.military || {},
        job: data?.job || {},
        account: {
          ...(data?.account || {}),
          role_id: String(data?.role?.role_id || ""),
          new_password: "",
          confirm_password: "",
        },
      });
    } catch (error) {
      console.error(error);
      setEditErrorText(getErrorMessage(error, "載入人員編輯資料失敗。"));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const employeeRole = (Array.isArray(meta.roles) ? meta.roles : []).find(
      (role) => role.role_code === "employee",
    );

    setCreateErrorText("");
    setCreateData({
      employee: { ...INITIAL_CREATE_DATA.employee },
      job: { ...INITIAL_CREATE_DATA.job },
      contact: { ...INITIAL_CREATE_DATA.contact },
      military: { ...INITIAL_CREATE_DATA.military },
      account: {
        ...INITIAL_CREATE_DATA.account,
        role_id: String(employeeRole?.role_id || ""),
      },
    });
  };

  const handleCreateChange = (section, field, value) => {
    setCreateData((current) => ({
      ...current,
      [section]: {
        ...(current?.[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveCreate = async () => {
    if (
      !String(createData?.employee?.employee_no || "").trim() ||
      !String(createData?.employee?.display_name || "").trim()
    ) {
      setCreateErrorText("員工編號及姓名為必填。");
      return;
    }

    if (!String(createData?.employee?.email || "").trim()) {
      setCreateErrorText("Email 為必填。");
      return;
    }

    if (!String(createData?.job?.effective_date || "").trim()) {
      setCreateErrorText("任職資料的生效日為必填。");
      return;
    }

    if (!String(createData?.account?.role_id || "").trim()) {
      setCreateErrorText("帳號角色為必填。");
      return;
    }

    if (!String(createData?.account?.username || "").trim()) {
      setCreateErrorText("HRMS 帳號的使用者名稱為必填。");
      return;
    }

    if (!String(createData?.account?.password || "")) {
      setCreateErrorText("HRMS 帳號的密碼為必填。");
      return;
    }

    if (
      createData?.account?.password !== createData?.account?.confirm_password
    ) {
      setCreateErrorText("密碼與確認密碼不一致。");
      return;
    }

    setCreating(true);
    setCreateErrorText("");

    try {
      await apiAttendancePersonnelBasicCreate({
        employee: createData.employee,
        job: createData.job,
        contact: createData.contact,
        military: createData.military,
        account: {
          username: createData.account.username,
          password: createData.account.password,
          role_id: createData.account.role_id,
        },
      });

      setCreateData(null);
      await loadData(filters);

      setSuccessDialog({
        open: true,
        title: "建立成功",
        message: "員工及 HRMS 帳號已建立。",
      });
    } catch (error) {
      console.error(error);
      setCreateErrorText(getErrorMessage(error, "建立員工失敗。"));
    } finally {
      setCreating(false);
    }
  };

  const handleEditChange = (section, field, value) => {
    setEditData((current) => ({
      ...current,
      [section]: {
        ...(current?.[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveEdit = async () => {
    const employeeId = Number(editData?.employee?.employee_id || 0);

    if (!employeeId) return;

    if (
      !String(editData?.employee?.employee_no || "").trim() ||
      !String(editData?.employee?.display_name || "").trim()
    ) {
      setEditErrorText("員工編號及姓名為必填。");
      return;
    }

    if (!String(editData?.account?.role_id || "").trim()) {
      setEditErrorText("帳號角色為必填。");
      return;
    }

    if (
      editData?.account?.new_password &&
      editData?.account?.new_password !== editData?.account?.confirm_password
    ) {
      setEditErrorText("新密碼與確認新密碼不一致。");
      return;
    }

    setSaving(true);
    setEditErrorText("");

    try {
      await apiAttendancePersonnelBasicUpdate(employeeId, {
        employee: editData.employee,
        contact: editData.contact,
        military: editData.military,
        account: {
          role_id: editData?.account?.role_id || "",
          new_password: editData?.account?.new_password || "",
        },
      });

      setEditData(null);
      await loadData(filters);

      setSuccessDialog({
        open: true,
        title: "儲存成功",
        message: "人員基本資料已儲存。",
      });
    } catch (error) {
      console.error(error);
      setEditErrorText(getErrorMessage(error, "儲存人員基本資料失敗。"));
    } finally {
      setSaving(false);
    }
  };

  const handleStartJobChange = () => {
    const job = editData?.job || {};

    setJobChangeErrorText("");
    setJobChangeData({
      supervisor_employee_id: job.supervisor_employee_id || "",
      unit_id: job.unit_id || "",
      position_id: job.position_id || "",
      effective_date: job.effective_date || "",
      employee_type: job.employee_type || "",
      status_after_change:
        job.status_after_change ||
        editData?.employee?.employee_status ||
        "啟用",
      remarks: "",
    });
  };

  const handleJobChangeValue = (field, value) => {
    setJobChangeData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveJobChange = async () => {
    const employeeId = Number(editData?.employee?.employee_id || 0);

    if (!employeeId) return;

    if (!jobChangeData?.effective_date) {
      setJobChangeErrorText("生效日為必填。");
      return;
    }

    setJobSaving(true);
    setJobChangeErrorText("");

    try {
      await apiAttendancePersonnelBasicJobChange(employeeId, jobChangeData);

      const response = await apiAttendancePersonnelBasicDetail(employeeId);

      const data = getData(response, {});

      setEditData((current) => ({
        ...current,
        employee: {
          ...(data?.employee || {}),
          employee_id: employeeId,
        },
        job: data?.job || {},
      }));

      setJobChangeData(null);
      await loadData(filters);

      setSuccessDialog({
        open: true,
        title: "儲存成功",
        message: "任職異動已儲存。",
      });
    } catch (error) {
      console.error(error);
      setJobChangeErrorText(getErrorMessage(error, "儲存任職異動失敗。"));
    } finally {
      setJobSaving(false);
    }
  };

  const renderValue = (row, column) => {
    if (column.key === "actions") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <Tooltip title="查看">
            <IconButton
              size="small"
              onClick={() => handleOpenDetail(row)}
              aria-label="查看"
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="編輯">
            <IconButton
              size="small"
              onClick={() => handleOpenEdit(row)}
              aria-label="編輯"
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    return displayValue(row?.[column.key]);
  };

  const employee = detailData?.employee || {};
  const contact = detailData?.contact || {};
  const military = detailData?.military || {};
  const job = detailData?.job || {};

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
        currentLabel="人員基本資料"
        mb="14px"
      />

      <Typography
        component="h1"
        sx={{
          mb: 2,
          fontSize: { xs: "22px", sm: "25px", md: "28px" },
          fontWeight: 700,
          color: "#111827",
        }}
      >
        人員基本資料
      </Typography>

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
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              單位
            </Typography>

            <SelectField
              value={filters.unit_id}
              onChange={(value) => handleFilterChange("unit_id", value)}
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
              options={[
                { value: "", label: "全部員工" },
                ...employeeOptions.map((employee) => ({
                  value: String(employee.employee_id || ""),
                  label: employeeLabel(employee),
                })),
              ]}
              displayEmpty
              fullWidth
              height="38px"
              disabled={loading}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ mb: "6px", fontSize: "15px", fontWeight: 500 }}>
              狀態
            </Typography>

            <SelectField
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              options={[
                { value: "", label: "全部狀態" },
                { value: "啟用", label: "啟用" },
                { value: "停用", label: "停用" },
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
              placeholder="員工編號、姓名或 Email"
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
          <Button
            variant="contained"
            onClick={handleOpenCreate}
            disabled={loading}
            sx={{
              height: "38px",
              whiteSpace: "nowrap",
            }}
          >
            新增員工
          </Button>

          <ActionButtons
            onClear={handleClear}
            onSearch={handleSearch}
            disabled={loading}
          />
        </Box>

        {errorText ? (
          <Alert severity="error" sx={{ mt: "16px" }}>
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
            rows={rows}
            getRowKey={(row) => row.employee_id}
            mobileCardTitleKey="display_name"
            emptyText="查無人員資料"
            renderValue={renderValue}
            pagination
            rowsPerPage={10}
          />
        )}
      </Paper>

      <FormDialog
        open={Boolean(createData)}
        title="新增員工"
        submitLabel="建立員工"
        cancelLabel="取消"
        maxWidth="md"
        submitting={creating}
        scrollToTopSignal={createErrorText}
        onClose={() => {
          if (creating) return;
          setCreateData(null);
          setCreateErrorText("");
        }}
        onSubmit={handleSaveCreate}
      >
        {createErrorText ? (
          <Alert severity="error">{createErrorText}</Alert>
        ) : null}

        <DetailSection title="基本資料">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              label="員工編號"
              size="small"
              required
              value={createData?.employee?.employee_no || ""}
              onChange={(event) =>
                handleCreateChange(
                  "employee",
                  "employee_no",
                  event.target.value,
                )
              }
            />

            <TextField
              label="姓名"
              size="small"
              required
              value={createData?.employee?.display_name || ""}
              onChange={(event) =>
                handleCreateChange(
                  "employee",
                  "display_name",
                  event.target.value,
                )
              }
            />

            <TextField
              label="姓"
              size="small"
              value={createData?.employee?.last_name || ""}
              onChange={(event) =>
                handleCreateChange("employee", "last_name", event.target.value)
              }
            />

            <TextField
              label="名"
              size="small"
              value={createData?.employee?.first_name || ""}
              onChange={(event) =>
                handleCreateChange("employee", "first_name", event.target.value)
              }
            />

            <TextField
              label="英文姓名"
              size="small"
              value={createData?.employee?.english_name || ""}
              onChange={(event) =>
                handleCreateChange(
                  "employee",
                  "english_name",
                  event.target.value,
                )
              }
            />

            <TextField
              label="Email"
              type="email"
              size="small"
              required
              value={createData?.employee?.email || ""}
              onChange={(event) =>
                handleCreateChange("employee", "email", event.target.value)
              }
            />

            <TextField
              select
              label="性別"
              size="small"
              value={createData?.employee?.gender || ""}
              onChange={(event) =>
                handleCreateChange("employee", "gender", event.target.value)
              }
            >
              <MenuItem value="">-- 請選擇 --</MenuItem>

              {GENDER_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <Autocomplete
              options={COUNTRY_OPTIONS}
              value={getCountryOption(createData?.employee?.nationality)}
              onChange={(_, option) =>
                handleCreateChange(
                  "employee",
                  "nationality",
                  option?.label || "",
                )
              }
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option?.label || ""
              }
              isOptionEqualToValue={(option, value) =>
                option.code === value?.code && option.label === value?.label
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="國籍"
                  size="small"
                  placeholder="搜尋國家"
                />
              )}
            />

            <TextField
              label="生日"
              type="date"
              size="small"
              value={createData?.employee?.birth_date || ""}
              onChange={(event) =>
                handleCreateChange("employee", "birth_date", event.target.value)
              }
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <TextField
              select
              label="婚姻狀態"
              size="small"
              value={createData?.employee?.marital_status || ""}
              onChange={(event) =>
                handleCreateChange(
                  "employee",
                  "marital_status",
                  event.target.value,
                )
              }
            >
              <MenuItem value="">-- 請選擇 --</MenuItem>

              {MARITAL_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="到職日"
              type="date"
              size="small"
              value={createData?.employee?.hire_date || ""}
              onChange={(event) =>
                handleCreateChange("employee", "hire_date", event.target.value)
              }
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <TextField
              select
              label="狀態"
              size="small"
              value={createData?.employee?.employee_status || "啟用"}
              onChange={(event) =>
                handleCreateChange(
                  "employee",
                  "employee_status",
                  event.target.value,
                )
              }
            >
              <MenuItem value="啟用">啟用</MenuItem>
              <MenuItem value="停用">停用</MenuItem>
            </TextField>
          </Box>
        </DetailSection>

        <DetailSection title="任職資料">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              select
              label="主管"
              size="small"
              value={createData?.job?.supervisor_employee_id || ""}
              onChange={(event) =>
                handleCreateChange(
                  "job",
                  "supervisor_employee_id",
                  event.target.value,
                )
              }
            >
              <MenuItem value="">-- 請選擇 --</MenuItem>

              {meta.employees.map((item) => (
                <MenuItem key={item.employee_id} value={item.employee_id}>
                  {employeeLabel(item)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="單位"
              size="small"
              value={createData?.job?.unit_id || ""}
              onChange={(event) =>
                handleCreateChange("job", "unit_id", event.target.value)
              }
            >
              <MenuItem value="">-- 請選擇 --</MenuItem>

              {meta.units.map((item) => (
                <MenuItem key={item.unit_id} value={item.unit_id}>
                  {item.unit_code && item.unit_name
                    ? `${item.unit_code} - ${item.unit_name}`
                    : item.unit_name || item.unit_code}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="職位"
              size="small"
              value={createData?.job?.position_id || ""}
              onChange={(event) =>
                handleCreateChange("job", "position_id", event.target.value)
              }
            >
              <MenuItem value="">-- 請選擇 --</MenuItem>

              {meta.positions.map((item) => (
                <MenuItem key={item.position_id} value={item.position_id}>
                  {item.position_code && item.position_name
                    ? `${item.position_code} - ${item.position_name}`
                    : item.position_name || item.position_code}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="生效日"
              type="date"
              size="small"
              required
              value={createData?.job?.effective_date || ""}
              onChange={(event) =>
                handleCreateChange("job", "effective_date", event.target.value)
              }
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <TextField
              select
              label="員工類型"
              size="small"
              value={createData?.job?.employee_type || ""}
              onChange={(event) =>
                handleCreateChange("job", "employee_type", event.target.value)
              }
            >
              <MenuItem value="">-- 請選擇 --</MenuItem>
              <MenuItem value="正職">正職</MenuItem>
              <MenuItem value="兼職">兼職</MenuItem>
              <MenuItem value="約聘">約聘</MenuItem>
              <MenuItem value="派遣">派遣</MenuItem>
              <MenuItem value="實習">實習</MenuItem>
              <MenuItem value="工讀">工讀</MenuItem>
            </TextField>

            <TextField
              label="備註"
              size="small"
              multiline
              minRows={2}
              value={createData?.job?.remarks || ""}
              onChange={(event) =>
                handleCreateChange("job", "remarks", event.target.value)
              }
              sx={{
                gridColumn: { sm: "1 / -1" },
              }}
            />
          </Box>
        </DetailSection>

        <DetailSection title="聯絡資料">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              label="手機"
              size="small"
              value={createData?.contact?.mobile_phone || ""}
              onChange={(event) =>
                handleCreateChange(
                  "contact",
                  "mobile_phone",
                  event.target.value,
                )
              }
            />

            <TextField
              label="住家電話"
              size="small"
              value={createData?.contact?.home_phone || ""}
              onChange={(event) =>
                handleCreateChange("contact", "home_phone", event.target.value)
              }
            />

            <TextField
              label="分機"
              size="small"
              value={createData?.contact?.extension_no || ""}
              onChange={(event) =>
                handleCreateChange(
                  "contact",
                  "extension_no",
                  event.target.value,
                )
              }
            />

            <TextField
              label="公務手機"
              size="small"
              value={createData?.contact?.work_mobile || ""}
              onChange={(event) =>
                handleCreateChange("contact", "work_mobile", event.target.value)
              }
            />

            <TextField
              label="個人 Email"
              type="email"
              size="small"
              value={createData?.contact?.personal_email || ""}
              onChange={(event) =>
                handleCreateChange(
                  "contact",
                  "personal_email",
                  event.target.value,
                )
              }
            />

            <TextField
              label="緊急聯絡人"
              size="small"
              value={createData?.contact?.emergency_contact_name || ""}
              onChange={(event) =>
                handleCreateChange(
                  "contact",
                  "emergency_contact_name",
                  event.target.value,
                )
              }
            />

            <TextField
              label="緊急聯絡人關係"
              size="small"
              value={createData?.contact?.emergency_relationship || ""}
              onChange={(event) =>
                handleCreateChange(
                  "contact",
                  "emergency_relationship",
                  event.target.value,
                )
              }
            />

            <TextField
              label="緊急聯絡人住家電話"
              size="small"
              value={createData?.contact?.emergency_home_phone || ""}
              onChange={(event) =>
                handleCreateChange(
                  "contact",
                  "emergency_home_phone",
                  event.target.value,
                )
              }
            />

            <TextField
              label="緊急聯絡人手機"
              size="small"
              value={createData?.contact?.emergency_mobile_phone || ""}
              onChange={(event) =>
                handleCreateChange(
                  "contact",
                  "emergency_mobile_phone",
                  event.target.value,
                )
              }
            />

            <Box
              sx={{
                gridColumn: { sm: "1 / -1" },
              }}
            >
              <Box
                sx={{
                  mb: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  size="small"
                  variant="text"
                  disabled={
                    !String(createData?.contact?.contact_address || "").trim()
                  }
                  onClick={() =>
                    handleCreateChange(
                      "contact",
                      "postal_address",
                      createData?.contact?.contact_address || "",
                    )
                  }
                >
                  同聯絡地址
                </Button>
              </Box>

              <TextField
                fullWidth
                label="郵寄地址"
                size="small"
                multiline
                minRows={2}
                value={createData?.contact?.postal_address || ""}
                onChange={(event) =>
                  handleCreateChange(
                    "contact",
                    "postal_address",
                    event.target.value,
                  )
                }
              />
            </Box>

            <Box
              sx={{
                gridColumn: { sm: "1 / -1" },
              }}
            >
              <Box
                sx={{
                  mb: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  size="small"
                  variant="text"
                  disabled={
                    !String(createData?.contact?.postal_address || "").trim()
                  }
                  onClick={() =>
                    handleCreateChange(
                      "contact",
                      "contact_address",
                      createData?.contact?.postal_address || "",
                    )
                  }
                >
                  同郵寄地址
                </Button>
              </Box>

              <TextField
                fullWidth
                label="聯絡地址"
                size="small"
                multiline
                minRows={2}
                value={createData?.contact?.contact_address || ""}
                onChange={(event) =>
                  handleCreateChange(
                    "contact",
                    "contact_address",
                    event.target.value,
                  )
                }
              />
            </Box>
          </Box>
        </DetailSection>

        <DetailSection title="兵役資料">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              label="兵役狀態"
              size="small"
              value={createData?.military?.military_status || ""}
              onChange={(event) =>
                handleCreateChange(
                  "military",
                  "military_status",
                  event.target.value,
                )
              }
            />

            <TextField
              label="役別"
              size="small"
              value={createData?.military?.service_type || ""}
              onChange={(event) =>
                handleCreateChange(
                  "military",
                  "service_type",
                  event.target.value,
                )
              }
            />

            <TextField
              label="兵役期間"
              size="small"
              value={createData?.military?.service_period || ""}
              onChange={(event) =>
                handleCreateChange(
                  "military",
                  "service_period",
                  event.target.value,
                )
              }
            />

            <TextField
              label="入境時間"
              type="date"
              size="small"
              value={createData?.military?.entry_date || ""}
              onChange={(event) =>
                handleCreateChange("military", "entry_date", event.target.value)
              }
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <TextField
              label="備註"
              size="small"
              multiline
              minRows={2}
              value={createData?.military?.remarks || ""}
              onChange={(event) =>
                handleCreateChange("military", "remarks", event.target.value)
              }
              sx={{
                gridColumn: { sm: "1 / -1" },
              }}
            />
          </Box>
        </DetailSection>

        <DetailSection title="HRMS 帳號">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              label="使用者名稱"
              size="small"
              required
              value={createData?.account?.username || ""}
              onChange={(event) =>
                handleCreateChange("account", "username", event.target.value)
              }
            />

            <Box />

            <TextField
              label="密碼"
              type="password"
              size="small"
              required
              value={createData?.account?.password || ""}
              onChange={(event) =>
                handleCreateChange("account", "password", event.target.value)
              }
            />

            <TextField
              label="確認密碼"
              type="password"
              size="small"
              required
              value={createData?.account?.confirm_password || ""}
              onChange={(event) =>
                handleCreateChange(
                  "account",
                  "confirm_password",
                  event.target.value,
                )
              }
            />
          </Box>
        </DetailSection>

        <DetailSection title="帳號角色">
          <TextField
            select
            fullWidth
            required
            label="帳號角色"
            size="small"
            value={createData?.account?.role_id || ""}
            onChange={(event) =>
              handleCreateChange("account", "role_id", event.target.value)
            }
            helperText="帳號角色決定此帳號可使用的系統功能與管理權限，請依實際職責選擇。"
          >
            <MenuItem value="">-- 請選擇 --</MenuItem>

            {meta.roles.map((role) => (
              <MenuItem key={role.role_id} value={String(role.role_id)}>
                {role.role_name}
              </MenuItem>
            ))}
          </TextField>
        </DetailSection>
      </FormDialog>

      <FormDialog
        open={Boolean(detailData)}
        title="人員基本資料"
        submitLabel="關閉"
        cancelLabel=""
        maxWidth="md"
        submitting={detailLoading}
        onClose={() => {
          if (detailLoading) return;
          setDetailData(null);
          setDetailErrorText("");
        }}
        onSubmit={() => {
          setDetailData(null);
          setDetailErrorText("");
        }}
      >
        {detailErrorText ? (
          <Alert severity="error">{detailErrorText}</Alert>
        ) : null}

        {detailLoading ? (
          <Box
            sx={{
              py: "32px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <DetailSection title="基本資料">
              <DetailField label="員工編號" value={employee.employee_no} />
              <DetailField label="姓名" value={employee.display_name} />
              <DetailField label="英文姓名" value={employee.english_name} />
              <DetailField label="Email" value={employee.email} />
              <DetailField label="性別" value={employee.gender} />
              <DetailField label="國籍" value={employee.nationality} />
              <DetailField label="生日" value={employee.birth_date} />
              <DetailField label="婚姻狀態" value={employee.marital_status} />
              <DetailField label="到職日" value={employee.hire_date} />
              <DetailField label="狀態" value={employee.employee_status} />
            </DetailSection>

            <DetailSection title="任職資料">
              <DetailField label="單位" value={job.unit_name} />
              <DetailField label="職稱" value={job.position_name} />
              <DetailField label="生效日" value={job.effective_date} />
            </DetailSection>

            <DetailSection title="聯絡資料">
              <DetailField label="手機" value={contact.mobile_phone} />
              <DetailField label="住家電話" value={contact.home_phone} />
              <DetailField label="郵寄地址" value={contact.postal_address} />
              <DetailField label="聯絡地址" value={contact.contact_address} />
              <DetailField label="分機" value={contact.extension_no} />
              <DetailField label="公務手機" value={contact.work_mobile} />
              <DetailField label="個人 Email" value={contact.personal_email} />
              <DetailField
                label="緊急聯絡人"
                value={contact.emergency_contact_name}
              />
              <DetailField
                label="緊急聯絡人關係"
                value={contact.emergency_relationship}
              />
              <DetailField
                label="緊急聯絡人住家電話"
                value={contact.emergency_home_phone}
              />
              <DetailField
                label="緊急聯絡人手機"
                value={contact.emergency_mobile_phone}
              />
            </DetailSection>

            <DetailSection title="兵役資料">
              <DetailField label="兵役狀態" value={military.military_status} />
              <DetailField label="役別" value={military.service_type} />
              <DetailField label="兵役期間" value={military.service_period} />
              <DetailField label="入境時間" value={military.entry_date} />
              <DetailField label="備註" value={military.remarks} />
            </DetailSection>
          </>
        )}
      </FormDialog>

      <FormDialog
        open={Boolean(editData)}
        title="編輯人員基本資料"
        submitLabel="儲存"
        cancelLabel="取消"
        maxWidth="md"
        submitting={saving}
        scrollToTopSignal={editErrorText}
        onClose={() => {
          if (saving) return;
          setEditData(null);
          setEditErrorText("");
        }}
        onSubmit={handleSaveEdit}
      >
        {editErrorText ? <Alert severity="error">{editErrorText}</Alert> : null}

        <DetailSection title="基本資料">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              label="員工編號"
              size="small"
              required
              value={editData?.employee?.employee_no || ""}
              onChange={(event) =>
                handleEditChange("employee", "employee_no", event.target.value)
              }
            />

            <TextField
              label="姓名"
              size="small"
              required
              value={editData?.employee?.display_name || ""}
              onChange={(event) =>
                handleEditChange("employee", "display_name", event.target.value)
              }
            />

            <TextField
              label="姓"
              size="small"
              value={editData?.employee?.last_name || ""}
              onChange={(event) =>
                handleEditChange("employee", "last_name", event.target.value)
              }
            />

            <TextField
              label="名"
              size="small"
              value={editData?.employee?.first_name || ""}
              onChange={(event) =>
                handleEditChange("employee", "first_name", event.target.value)
              }
            />

            <TextField
              label="英文姓名"
              size="small"
              value={editData?.employee?.english_name || ""}
              onChange={(event) =>
                handleEditChange("employee", "english_name", event.target.value)
              }
            />

            <TextField
              label="Email"
              type="email"
              size="small"
              value={editData?.employee?.email || ""}
              onChange={(event) =>
                handleEditChange("employee", "email", event.target.value)
              }
            />

            <TextField
              select
              label="性別"
              size="small"
              value={editData?.employee?.gender || ""}
              onChange={(event) =>
                handleEditChange("employee", "gender", event.target.value)
              }
            >
              <MenuItem value="">-- 請選擇 --</MenuItem>

              {GENDER_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <Autocomplete
              options={COUNTRY_OPTIONS}
              value={getCountryOption(editData?.employee?.nationality)}
              onChange={(_, option) =>
                handleEditChange("employee", "nationality", option?.label || "")
              }
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option?.label || ""
              }
              isOptionEqualToValue={(option, value) =>
                option.code === value?.code && option.label === value?.label
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="國籍"
                  size="small"
                  placeholder="搜尋國家"
                />
              )}
            />

            <TextField
              label="生日"
              type="date"
              size="small"
              value={editData?.employee?.birth_date || ""}
              onChange={(event) =>
                handleEditChange("employee", "birth_date", event.target.value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              select
              label="婚姻狀態"
              size="small"
              value={editData?.employee?.marital_status || ""}
              onChange={(event) =>
                handleEditChange(
                  "employee",
                  "marital_status",
                  event.target.value,
                )
              }
            >
              <MenuItem value="">-- 請選擇 --</MenuItem>

              {MARITAL_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="到職日"
              type="date"
              size="small"
              value={editData?.employee?.hire_date || ""}
              onChange={(event) =>
                handleEditChange("employee", "hire_date", event.target.value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              select
              label="狀態"
              size="small"
              value={editData?.employee?.employee_status || "啟用"}
              onChange={(event) =>
                handleEditChange(
                  "employee",
                  "employee_status",
                  event.target.value,
                )
              }
            >
              <MenuItem value="啟用">啟用</MenuItem>
              <MenuItem value="停用">停用</MenuItem>
            </TextField>
          </Box>
        </DetailSection>

        <DetailSection title="任職資料">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              label="單位"
              size="small"
              value={editData?.job?.unit_name || ""}
              slotProps={{ input: { readOnly: true } }}
            />

            <TextField
              label="職位"
              size="small"
              value={editData?.job?.position_name || ""}
              slotProps={{ input: { readOnly: true } }}
            />

            <TextField
              label="生效日"
              size="small"
              value={editData?.job?.effective_date || ""}
              slotProps={{ input: { readOnly: true } }}
            />

            <TextField
              label="員工類型"
              size="small"
              value={editData?.job?.employee_type || ""}
              slotProps={{ input: { readOnly: true } }}
            />
          </Box>

          {!jobChangeData ? (
            <Box
              sx={{
                mt: "14px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="outlined"
                onClick={handleStartJobChange}
                disabled={saving}
              >
                新增任職異動
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                mt: "16px",
                p: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
              }}
            >
              <Typography
                sx={{
                  mb: "14px",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                新增任職異動
              </Typography>

              {jobChangeErrorText ? (
                <Alert severity="error" sx={{ mb: "14px" }}>
                  {jobChangeErrorText}
                </Alert>
              ) : null}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: "14px",
                }}
              >
                <TextField
                  select
                  label="主管"
                  size="small"
                  value={jobChangeData.supervisor_employee_id}
                  onChange={(event) =>
                    handleJobChangeValue(
                      "supervisor_employee_id",
                      event.target.value,
                    )
                  }
                >
                  <MenuItem value="">-- 請選擇 --</MenuItem>

                  {meta.employees
                    .filter(
                      (item) =>
                        Number(item.employee_id) !==
                        Number(editData?.employee?.employee_id),
                    )
                    .map((item) => (
                      <MenuItem key={item.employee_id} value={item.employee_id}>
                        {employeeLabel(item)}
                      </MenuItem>
                    ))}
                </TextField>

                <TextField
                  select
                  label="單位"
                  size="small"
                  value={jobChangeData.unit_id}
                  onChange={(event) =>
                    handleJobChangeValue("unit_id", event.target.value)
                  }
                >
                  <MenuItem value="">-- 請選擇 --</MenuItem>

                  {meta.units.map((item) => (
                    <MenuItem key={item.unit_id} value={item.unit_id}>
                      {item.unit_code && item.unit_name
                        ? `${item.unit_code} - ${item.unit_name}`
                        : item.unit_name || item.unit_code}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="職位"
                  size="small"
                  value={jobChangeData.position_id}
                  onChange={(event) =>
                    handleJobChangeValue("position_id", event.target.value)
                  }
                >
                  <MenuItem value="">-- 請選擇 --</MenuItem>

                  {meta.positions.map((item) => (
                    <MenuItem key={item.position_id} value={item.position_id}>
                      {item.position_code && item.position_name
                        ? `${item.position_code} - ${item.position_name}`
                        : item.position_name || item.position_code}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="生效日"
                  type="date"
                  size="small"
                  required
                  value={jobChangeData.effective_date}
                  onChange={(event) =>
                    handleJobChangeValue("effective_date", event.target.value)
                  }
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: {
                      max: new Date().toLocaleDateString("sv-SE"),
                    },
                  }}
                />

                <TextField
                  select
                  label="員工類型"
                  size="small"
                  value={jobChangeData.employee_type}
                  onChange={(event) =>
                    handleJobChangeValue("employee_type", event.target.value)
                  }
                >
                  <MenuItem value="">-- 請選擇 --</MenuItem>
                  <MenuItem value="正職">正職</MenuItem>
                  <MenuItem value="兼職">兼職</MenuItem>
                  <MenuItem value="約聘">約聘</MenuItem>
                  <MenuItem value="派遣">派遣</MenuItem>
                  <MenuItem value="實習">實習</MenuItem>
                  <MenuItem value="工讀">工讀</MenuItem>
                </TextField>

                <TextField
                  select
                  label="異動後狀態"
                  size="small"
                  value={jobChangeData.status_after_change}
                  onChange={(event) =>
                    handleJobChangeValue(
                      "status_after_change",
                      event.target.value,
                    )
                  }
                >
                  <MenuItem value="啟用">啟用</MenuItem>
                  <MenuItem value="停用">停用</MenuItem>
                </TextField>

                <TextField
                  label="備註"
                  size="small"
                  multiline
                  minRows={2}
                  value={jobChangeData.remarks}
                  onChange={(event) =>
                    handleJobChangeValue("remarks", event.target.value)
                  }
                  sx={{ gridColumn: { sm: "1 / -1" } }}
                />
              </Box>

              <Box
                sx={{
                  mt: "14px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    setJobChangeData(null);
                    setJobChangeErrorText("");
                  }}
                  disabled={jobSaving}
                >
                  取消
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSaveJobChange}
                  disabled={jobSaving}
                >
                  {jobSaving ? "儲存中..." : "儲存任職異動"}
                </Button>
              </Box>
            </Box>
          )}
        </DetailSection>

        <DetailSection title="聯絡資料">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              label="手機"
              size="small"
              value={editData?.contact?.mobile_phone || ""}
              onChange={(event) =>
                handleEditChange("contact", "mobile_phone", event.target.value)
              }
            />
            <TextField
              label="住家電話"
              size="small"
              value={editData?.contact?.home_phone || ""}
              onChange={(event) =>
                handleEditChange("contact", "home_phone", event.target.value)
              }
            />
            <TextField
              label="分機"
              size="small"
              value={editData?.contact?.extension_no || ""}
              onChange={(event) =>
                handleEditChange("contact", "extension_no", event.target.value)
              }
            />
            <TextField
              label="公務手機"
              size="small"
              value={editData?.contact?.work_mobile || ""}
              onChange={(event) =>
                handleEditChange("contact", "work_mobile", event.target.value)
              }
            />
            <TextField
              label="個人 Email"
              type="email"
              size="small"
              value={editData?.contact?.personal_email || ""}
              onChange={(event) =>
                handleEditChange(
                  "contact",
                  "personal_email",
                  event.target.value,
                )
              }
            />
            <TextField
              label="緊急聯絡人"
              size="small"
              value={editData?.contact?.emergency_contact_name || ""}
              onChange={(event) =>
                handleEditChange(
                  "contact",
                  "emergency_contact_name",
                  event.target.value,
                )
              }
            />
            <TextField
              label="緊急聯絡人關係"
              size="small"
              value={editData?.contact?.emergency_relationship || ""}
              onChange={(event) =>
                handleEditChange(
                  "contact",
                  "emergency_relationship",
                  event.target.value,
                )
              }
            />
            <TextField
              label="緊急聯絡人住家電話"
              size="small"
              value={editData?.contact?.emergency_home_phone || ""}
              onChange={(event) =>
                handleEditChange(
                  "contact",
                  "emergency_home_phone",
                  event.target.value,
                )
              }
            />
            <TextField
              label="緊急聯絡人手機"
              size="small"
              value={editData?.contact?.emergency_mobile_phone || ""}
              onChange={(event) =>
                handleEditChange(
                  "contact",
                  "emergency_mobile_phone",
                  event.target.value,
                )
              }
            />

            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Box
                sx={{
                  mb: "6px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  size="small"
                  variant="text"
                  disabled={
                    !String(editData?.contact?.contact_address || "").trim()
                  }
                  onClick={() =>
                    handleEditChange(
                      "contact",
                      "postal_address",
                      editData?.contact?.contact_address || "",
                    )
                  }
                >
                  同聯絡地址
                </Button>
              </Box>

              <TextField
                fullWidth
                label="郵寄地址"
                size="small"
                multiline
                minRows={2}
                value={editData?.contact?.postal_address || ""}
                onChange={(event) =>
                  handleEditChange(
                    "contact",
                    "postal_address",
                    event.target.value,
                  )
                }
              />
            </Box>

            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <Box
                sx={{
                  mb: "6px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  size="small"
                  variant="text"
                  disabled={
                    !String(editData?.contact?.postal_address || "").trim()
                  }
                  onClick={() =>
                    handleEditChange(
                      "contact",
                      "contact_address",
                      editData?.contact?.postal_address || "",
                    )
                  }
                >
                  同郵寄地址
                </Button>
              </Box>

              <TextField
                fullWidth
                label="聯絡地址"
                size="small"
                multiline
                minRows={2}
                value={editData?.contact?.contact_address || ""}
                onChange={(event) =>
                  handleEditChange(
                    "contact",
                    "contact_address",
                    event.target.value,
                  )
                }
              />
            </Box>
          </Box>
        </DetailSection>

        <DetailSection title="兵役資料">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              label="兵役狀態"
              size="small"
              value={editData?.military?.military_status || ""}
              onChange={(event) =>
                handleEditChange(
                  "military",
                  "military_status",
                  event.target.value,
                )
              }
            />
            <TextField
              label="役別"
              size="small"
              value={editData?.military?.service_type || ""}
              onChange={(event) =>
                handleEditChange("military", "service_type", event.target.value)
              }
            />
            <TextField
              label="兵役期間"
              size="small"
              value={editData?.military?.service_period || ""}
              onChange={(event) =>
                handleEditChange(
                  "military",
                  "service_period",
                  event.target.value,
                )
              }
            />

            <TextField
              label="入境時間"
              type="date"
              size="small"
              value={editData?.military?.entry_date || ""}
              onChange={(event) =>
                handleEditChange("military", "entry_date", event.target.value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="備註"
              size="small"
              multiline
              minRows={2}
              value={editData?.military?.remarks || ""}
              onChange={(event) =>
                handleEditChange("military", "remarks", event.target.value)
              }
              sx={{ gridColumn: { sm: "1 / -1" } }}
            />
          </Box>
        </DetailSection>
        <DetailSection title="HRMS 帳號">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: "14px",
            }}
          >
            <TextField
              label="使用者名稱"
              size="small"
              value={editData?.account?.username || ""}
              slotProps={{
                input: { readOnly: true },
              }}
            />

            <Box />

            <TextField
              label="新密碼"
              type="password"
              size="small"
              value={editData?.account?.new_password || ""}
              onChange={(event) =>
                handleEditChange("account", "new_password", event.target.value)
              }
              helperText="如不需變更密碼，請留空。"
            />

            <TextField
              label="確認新密碼"
              type="password"
              size="small"
              value={editData?.account?.confirm_password || ""}
              onChange={(event) =>
                handleEditChange(
                  "account",
                  "confirm_password",
                  event.target.value,
                )
              }
            />
          </Box>
        </DetailSection>

        <DetailSection title="帳號角色">
          <TextField
            select
            fullWidth
            required
            label="帳號角色"
            size="small"
            value={editData?.account?.role_id || ""}
            onChange={(event) =>
              handleEditChange("account", "role_id", event.target.value)
            }
            helperText="帳號角色決定此帳號可使用的系統功能與管理權限，請依實際職責選擇。"
          >
            <MenuItem value="">-- 請選擇 --</MenuItem>

            {meta.roles.map((role) => (
              <MenuItem key={role.role_id} value={String(role.role_id)}>
                {role.role_name}
              </MenuItem>
            ))}
          </TextField>
        </DetailSection>
      </FormDialog>

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
