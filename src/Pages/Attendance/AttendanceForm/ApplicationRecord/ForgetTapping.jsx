import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ResponsiveAttendanceTable from "../ResponsiveAttendanceTable";
import {
  EMPLOYEE_OPTIONS,
  UNIT_OPTIONS,
  getApplicationRecordMonthOptions,
  getApplicationRecordYearOptions,
} from "./Options";
import {
  ActionButtons,
  FilterRow,
  SelectField,
  YearMonthField,
} from "./SharedFields";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "forget-apply", label: "忘打卡申請" },
  { value: "delete-mistake", label: "誤打卡刪除" },
  { value: "manual-fill", label: "打卡補登" },
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

const MOCK_ROWS = [
  {
    id: 1,
    applyDate: "2026/04/02",
    unit: "D002/業務部",
    applicant: "25002/許明城",
    dateTime: "2026/04/01 09:00",
    type: "忘打卡申請",
    location: "台北辦公室",
    status: "忘打卡申請",
  },
];

export default function ForgetTapping() {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

  const yearOptions = useMemo(
    () => getApplicationRecordYearOptions(currentYear),
    [currentYear]
  );
  const monthOptions = useMemo(() => getApplicationRecordMonthOptions(), []);

  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(currentMonth);
  const [unit, setUnit] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("all");

  const filteredRows = useMemo(() => {
    return MOCK_ROWS.filter((row) => {
      const unitMatch = !unit || row.unit === unit;
      const employeeMatch = !employee || row.applicant === employee;

      const statusMap = {
        "forget-apply": "忘打卡申請",
        "delete-mistake": "誤打卡刪除",
        "manual-fill": "打卡補登",
      };

      const statusMatch = status === "all" || row.status === statusMap[status];

      return unitMatch && employeeMatch && statusMatch;
    });
  }, [unit, employee, status]);

  const handleClear = () => {
    setYear(String(currentYear));
    setMonth(currentMonth);
    setUnit("");
    setEmployee("");
    setStatus("all");
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

          <SelectField
            label="單位"
            value={unit}
            onChange={setUnit}
            options={UNIT_OPTIONS}
            displayEmpty
          />

          <SelectField
            label="工號/姓名"
            value={employee}
            onChange={setEmployee}
            options={EMPLOYEE_OPTIONS}
            displayEmpty
          />
        </FilterRow>

        <FilterRow withDivider>
          <SelectField
            label="狀態"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            minWidth="240px"
          />

          <ActionButtons onClear={handleClear} />
        </FilterRow>
      </Box>

      <ResponsiveAttendanceTable
        columns={TABLE_COLUMNS}
        rows={filteredRows}
        mobileCardTitleKey="applyDate"
        getRowKey={(row) => row.id}
      />
    </Box>
  );
}