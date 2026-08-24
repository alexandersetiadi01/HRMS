import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  apiAttendancePersonnelBasicDetail,
  apiAttendancePersonnelBasicList,
} from "../../../../API/attendance";
import FormDialog from "../../../../Components/FormDialog";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  FilterActions,
  FilterRow,
  SelectField,
} from "../../AttendanceForm/ApplicationRecord/SharedFields";

const INITIAL_FILTERS = {
  unit_id: "",
  employee_id: "",
  status: "",
  search: "",
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
    employees: [],
  });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [detailErrorText, setDetailErrorText] = useState("");
  const [detailData, setDetailData] = useState(null);

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

  const selectedEmployee = useMemo(
    () =>
      employeeOptions.find(
        (employee) =>
          String(employee.employee_id || "") ===
          String(filters.employee_id || ""),
      ) || null,
    [employeeOptions, filters.employee_id],
  );

  const loadData = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setErrorText("");

    try {
      const response = await apiAttendancePersonnelBasicList(nextFilters);
      const data = getData(response, {});

      setRows(Array.isArray(data?.items) ? data.items : []);

      setMeta({
        units: Array.isArray(data?.meta?.units) ? data.meta.units : [],
        employees: Array.isArray(data?.meta?.employees)
          ? data.meta.employees
          : [],
      });
    } catch (error) {
      console.error(error);
      setRows([]);
      setErrorText(
        getErrorMessage(error, "載入人員基本資料失敗。"),
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
      const response =
        await apiAttendancePersonnelBasicDetail(employeeId);

      setDetailData(getData(response, {}));
    } catch (error) {
      console.error(error);
      setDetailErrorText(
        getErrorMessage(error, "載入人員詳細資料失敗。"),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const renderValue = (row, column) => {
    if (column.key === "actions") {
      return (
        <Tooltip title="查看">
          <IconButton
            size="small"
            onClick={() => handleOpenDetail(row)}
            aria-label="查看"
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
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
        <FilterRow>
          <SelectField
            label="單位"
            value={filters.unit_id}
            onChange={(value) => handleFilterChange("unit_id", value)}
            options={unitOptions}
            minWidth="180px"
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: { xs: "100%", sm: "240px" },
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                color: "#111827",
                fontWeight: 500,
              }}
            >
              員工
            </Typography>

            <Autocomplete
              size="small"
              options={employeeOptions}
              value={selectedEmployee}
              getOptionLabel={(option) => employeeLabel(option)}
              isOptionEqualToValue={(option, value) =>
                Number(option?.employee_id || 0) ===
                Number(value?.employee_id || 0)
              }
              onChange={(_event, value) =>
                handleFilterChange(
                  "employee_id",
                  value ? String(value.employee_id) : "",
                )
              }
              renderInput={(params) => (
                <TextField {...params} placeholder="全部員工" />
              )}
            />
          </Box>

          <SelectField
            label="狀態"
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
            options={[
              { value: "", label: "全部狀態" },
              { value: "啟用", label: "啟用" },
              { value: "停用", label: "停用" },
            ]}
            minWidth="150px"
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: { xs: "100%", sm: "240px" },
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                color: "#111827",
                fontWeight: 500,
              }}
            >
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
            />
          </Box>
        </FilterRow>

        <FilterActions
          onSearch={handleSearch}
          onClear={handleClear}
          searchDisabled={loading}
          clearDisabled={loading}
        />

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
          <Alert severity="error">
            {detailErrorText}
          </Alert>
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
              <DetailField label="電話" value={contact.phone} />
              <DetailField label="地址" value={contact.address} />
              <DetailField
                label="緊急聯絡人"
                value={contact.emergency_contact_name}
              />
              <DetailField
                label="緊急聯絡電話"
                value={contact.emergency_contact_phone}
              />
            </DetailSection>

            <DetailSection title="兵役資料">
              <DetailField
                label="兵役狀態"
                value={military.military_status}
              />
              <DetailField label="役別" value={military.service_type} />
              <DetailField
                label="兵役開始日"
                value={military.service_start_date}
              />
              <DetailField
                label="兵役結束日"
                value={military.service_end_date}
              />
              <DetailField label="入境時間" value={military.entry_date} />
            </DetailSection>
          </>
        )}
      </FormDialog>
    </Box>
  );
}