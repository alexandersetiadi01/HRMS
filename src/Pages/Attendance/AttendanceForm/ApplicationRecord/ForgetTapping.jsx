import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import ResponsiveAttendanceTable from "../ResponsiveAttendanceTable";
import {
  getApplicationRecordMonthOptions,
  getApplicationRecordYearOptions,
} from "./Options";
import {
  ActionButtons,
  FilterRow,
  SelectField,
  YearMonthField,
} from "./SharedFields";
import {
  apiMissedPunchApplicationMeta,
  apiMissedPunchApplicationRecordList,
} from "../../../../API/attendance";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "待審核", label: "待審核" },
  { value: "已核准", label: "已核准" },
  { value: "已駁回", label: "已駁回" },
];

const TABLE_COLUMNS = [
  { key: "applyDate", label: "申請日期", width: "12%" },
  { key: "unit", label: "單位", width: "17%" },
  { key: "applicant", label: "申請人", width: "17%" },
  {
    key: "dateTime",
    label: "日期/時間",
    width: "18%",
    desktopWhiteSpace: "pre-line",
    mobileWhiteSpace: "pre-line",
  },
  { key: "type", label: "類型", width: "14%" },
  { key: "location", label: "地點", width: "11%" },
  { key: "status", label: "狀態", width: "11%" },
];

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    "讀取忘打卡申請紀錄失敗。"
  );
}

export default function ForgetTapping() {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

  const yearOptions = useMemo(
    () => getApplicationRecordYearOptions(currentYear),
    [currentYear],
  );
  const monthOptions = useMemo(() => getApplicationRecordMonthOptions(), []);

  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(currentMonth);
  const [unit, setUnit] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState({
    year: String(currentYear),
    month: currentMonth,
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
        const meta = await apiMissedPunchApplicationMeta();

        if (!active) {
          return;
        }

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
          actor?.is_employee_position === true ? true : !isManagerLike;

        setIsEmployeeOnly(employeeOnly);

        setUnitOptions([
          { value: "", label: "請選擇" },
          ...(Array.isArray(meta?.unitOptions) ? meta.unitOptions : []),
        ]);

        setEmployeeOptions([
          { value: "", label: "請選擇" },
          ...(Array.isArray(meta?.employeeOptions) ? meta.employeeOptions : []),
        ]);
      } catch (error) {
        if (!active) {
          return;
        }

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
    if (metaLoading) {
      return;
    }

    let active = true;

    async function loadRows() {
      setLoading(true);
      setErrorText("");

      try {
        const result = await apiMissedPunchApplicationRecordList({
          year: appliedFilters.year,
          month: appliedFilters.month,
          request_status: appliedFilters.status,
          employee_id:
            !isEmployeeOnly && appliedFilters.employee
              ? Number(appliedFilters.employee)
              : undefined,
          use_current_employee: isEmployeeOnly,
        });

        if (!active) {
          return;
        }

        const payload = result?.data?.data || result?.data || {};
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : [];

        const filtered = items.filter((item) => {
          const unitMatch =
            isEmployeeOnly || !appliedFilters.unit
              ? true
              : String(item?.unit_label || "") === appliedFilters.unit;

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
            dateTime: item.datetime_text || "-",
            type: "忘打卡申請",
            location: item.location_label || "-",
            status: item.status_label || "-",
          })),
        );
      } catch (error) {
        if (!active) {
          return;
        }

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
          index !== 0 && String(option?.unit_label || "") === String(unit),
      ),
    ];
  }, [employeeOptions, unit]);

  const handleSearch = () => {
    setAppliedFilters({
      year,
      month,
      unit,
      employee,
      status,
    });
  };

  const handleClear = () => {
    const nextYear = String(currentYear);
    const nextMonth = currentMonth;

    setYear(nextYear);
    setMonth(nextMonth);
    setUnit("");
    setEmployee("");
    setStatus("all");

    setAppliedFilters({
      year: nextYear,
      month: nextMonth,
      unit: "",
      employee: "",
      status: "all",
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          mb: "14px",
        }}
      >
        <FilterRow>
          <YearMonthField
            required
            year={year}
            onYearChange={setYear}
            yearOptions={yearOptions}
            month={month}
            onMonthChange={setMonth}
            monthOptions={monthOptions}
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
              disabled={metaLoading}
            />
          ) : null}
        </FilterRow>

        <FilterRow withDivider>
          <SelectField
            label="狀態"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            minWidth="240px"
          />

          <ActionButtons onClear={handleClear} onSearch={handleSearch} />
        </FilterRow>
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
        emptyText={loading ? "讀取中..." : "查無資料"}
      />
    </Box>
  );
}
