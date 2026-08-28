import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import ResponsiveAttendanceTable from "../ResponsiveAttendanceTable";
import { getApplicationRecordYearOptions } from "./Options";
import {
  ActionButtons,
  SelectField,
} from "./SharedFields";
import {
  apiLeaveApplicationMeta,
  apiLeaveApplicationRecordList,
} from "../../../../API/attendance";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "待簽核", label: "待簽核" },
  { value: "已核准", label: "已核准" },
  { value: "已駁回", label: "已駁回" },
  { value: "已取消", label: "已取消" },
];

const TABLE_COLUMNS = [
  { key: "applyDate", label: "申請日期", width: "11%" },
  { key: "unit", label: "單位", width: "15%" },
  { key: "applicant", label: "申請人", width: "15%" },
  {
    key: "dateTime",
    label: "日期/時間",
    width: "20%",
    desktopWhiteSpace: "pre-line",
    mobileWhiteSpace: "pre-line",
  },
  { key: "total", label: "總計", width: "14%" },
  { key: "type", label: "類型", width: "11%" },
  { key: "status", label: "狀態", width: "14%" },
];

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    "讀取公出/出差申請紀錄失敗。"
  );
}

function formatHoursText(value) {
  const hours = Number(value);

  if (!Number.isFinite(hours) || hours <= 0) {
    return "-";
  }

  const rounded = Math.round(hours * 100) / 100;

  return `${rounded} 小時`;
}

function getBusinessTripType(item = {}) {
  const value = String(
    item.leave_name ||
      item.leave_type_name ||
      item.leave_label ||
      "",
  ).trim();

  if (value === "公出" || value.startsWith("公出 -")) {
    return "公出";
  }

  if (value === "出差" || value.startsWith("出差 -")) {
    return "出差";
  }

  return "";
}

export default function BusinessTrip() {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();

  const yearOptions = useMemo(
    () => getApplicationRecordYearOptions(currentYear),
    [currentYear],
  );

  const yearSelectOptions = useMemo(
    () =>
      yearOptions.map((item) => ({
        value: item,
        label: item,
      })),
    [yearOptions],
  );

  const [year, setYear] = useState(String(currentYear));
  const [unit, setUnit] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    year: String(currentYear),
    unit: "",
    employee: "",
    status: "all",
  });

  const [isEmployeeOnly, setIsEmployeeOnly] = useState(true);
  const [unitOptions, setUnitOptions] = useState([
    { value: "", label: "請選擇" },
  ]);
  const [employeeOptions, setEmployeeOptions] = useState([
    { value: "", label: "請選擇" },
  ]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setMetaLoading(true);

      try {
        const meta = await apiLeaveApplicationMeta();

        if (!active) return;

        const actor = meta?.actor || {};
        const positionName = String(actor?.position_name || "")
          .trim()
          .toLowerCase();
        const unitName = String(actor?.unit_name || "")
          .trim()
          .toLowerCase();

        const isManagerLike =
          positionName.includes("manager") ||
          positionName.includes("主管") ||
          positionName.includes("經理") ||
          positionName.includes("副理") ||
          positionName.includes("協理") ||
          positionName.includes("總監") ||
          positionName.includes("director") ||
          positionName.includes("supervisor") ||
          positionName.includes("admin") ||
          unitName.includes("管理");

        const employeeOnly =
          actor?.is_employee_position === true
            ? true
            : !isManagerLike;

        setIsEmployeeOnly(employeeOnly);

        setUnitOptions(
          employeeOnly
            ? [{ value: "", label: "請選擇" }]
            : [
                { value: "", label: "請選擇" },
                ...(Array.isArray(meta?.unitOptions)
                  ? meta.unitOptions
                  : []),
              ],
        );

        setEmployeeOptions(
          employeeOnly
            ? [{ value: "", label: "請選擇" }]
            : [
                { value: "", label: "請選擇" },
                ...(Array.isArray(meta?.employeeOptions)
                  ? meta.employeeOptions
                  : []),
              ],
        );
      } catch (error) {
        if (!active) return;

        console.error(error);
        setIsEmployeeOnly(true);
        setUnitOptions([{ value: "", label: "請選擇" }]);
        setEmployeeOptions([{ value: "", label: "請選擇" }]);
      } finally {
        if (active) {
          setMetaLoading(false);
        }
      }
    }

    loadMeta();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (metaLoading) return;

    let active = true;

    async function loadRows() {
      setLoading(true);
      setErrorText("");

      try {
        const result = await apiLeaveApplicationRecordList({
          year: appliedFilters.year,
          request_status: appliedFilters.status,
          employee_id:
            !isEmployeeOnly && appliedFilters.employee
              ? Number(appliedFilters.employee)
              : undefined,
          use_current_employee: isEmployeeOnly,
        });

        if (!active) return;

        const payload = result?.data?.data || result?.data || {};
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : [];

        const filtered = items.filter((item) => {
          const type = getBusinessTripType(item);

          if (!type) {
            return false;
          }

          const unitMatch =
            isEmployeeOnly || !appliedFilters.unit
              ? true
              : String(item?.unit_label || "") ===
                String(appliedFilters.unit);

          const employeeMatch =
            isEmployeeOnly || !appliedFilters.employee
              ? true
              : String(item?.employee_id || "") ===
                String(appliedFilters.employee);

          return unitMatch && employeeMatch;
        });

        setRows(
          filtered.map((item) => ({
            id: item.id || item.request_id || 0,
            applyDate: item.request_date || "-",
            unit: item.unit_label || "-",
            applicant: item.applicant_name || "-",
            dateTime: item.datetime_text
              ? item.datetime_text.replace(" - ", "\n")
              : "-",
            total: formatHoursText(item.requested_hours),
            type: getBusinessTripType(item),
            status: item.status_label || "-",
          })),
        );
      } catch (error) {
        if (!active) return;

        console.error(error);
        setRows([]);
        setErrorText(getErrorMessage(error));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRows();

    return () => {
      active = false;
    };
  }, [appliedFilters, isEmployeeOnly, metaLoading]);

  const employeeOptionsByUnit = useMemo(() => {
    if (!unit) {
      return employeeOptions;
    }

    return [
      employeeOptions[0],
      ...employeeOptions.filter(
        (option, index) =>
          index !== 0 &&
          String(option?.unit_label || "") === String(unit),
      ),
    ];
  }, [employeeOptions, unit]);

  const handleSearch = () => {
    setAppliedFilters({
      year,
      unit,
      employee,
      status,
    });
  };

  const handleClear = () => {
    const nextYear = String(currentYear);

    setYear(nextYear);
    setUnit("");
    setEmployee("");
    setStatus("all");

    setAppliedFilters({
      year: nextYear,
      unit: "",
      employee: "",
      status: "all",
    });
  };

  return (
    <Box>
      <Box
        sx={{
          mb: "14px",
          pb: "10px",
          borderBottom: "1px solid #d1d5db",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: isEmployeeOnly
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(4, minmax(0, 1fr))",
            },
            gap: "14px",
            alignItems: "end",
          }}
        >
          <SelectField
            label="年度"
            required
            value={year}
            onChange={setYear}
            options={yearSelectOptions}
            fullWidth
            height="38px"
            disabled={loading || metaLoading}
          />

          {!isEmployeeOnly ? (
            <SelectField
              label="單位"
              value={unit}
              onChange={(value) => {
                setUnit(value);
                setEmployee("");
              }}
              options={unitOptions}
              displayEmpty
              fullWidth
              height="38px"
              disabled={metaLoading}
            />
          ) : null}

          {!isEmployeeOnly ? (
            <SelectField
              label="工號/姓名"
              value={employee}
              onChange={setEmployee}
              options={employeeOptionsByUnit}
              displayEmpty
              fullWidth
              height="38px"
              disabled={metaLoading}
            />
          ) : null}

          <SelectField
            label="狀態"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            fullWidth
            height="38px"
            disabled={loading}
          />
        </Box>

        <Box
          sx={{
            mt: "14px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <ActionButtons
            onClear={handleClear}
            onSearch={handleSearch}
            disabled={loading || metaLoading}
          />
        </Box>
      </Box>

      {errorText ? (
        <Typography
          sx={{
            mb: "12px",
            fontSize: "14px",
            color: "#dc2626",
          }}
        >
          {errorText}
        </Typography>
      ) : null}

      <ResponsiveAttendanceTable
        columns={TABLE_COLUMNS}
        rows={rows}
        mobileCardTitleKey="applyDate"
        getRowKey={(row) => row.id}
        emptyText={loading ? "讀取中..." : "查無公出/出差申請紀錄"}
        pagination
        rowsPerPage={10}
      />
    </Box>
  );
}