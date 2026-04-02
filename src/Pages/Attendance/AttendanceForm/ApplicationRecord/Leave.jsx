import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ResponsiveAttendanceTable from "../ResponsiveAttendanceTable";
import {
  EMPLOYEE_OPTIONS,
  UNIT_OPTIONS,
  getApplicationRecordYearOptions,
} from "./Options";
import {
  ActionButtons,
  FilterRow,
  SelectField,
} from "./SharedFields";

const STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "signing", label: "簽核中" },
  { value: "returned", label: "已駁回" },
  { value: "approved", label: "已核准" },
  { value: "cancel-signing", label: "撤銷簽核中" },
  { value: "cancelled", label: "已撤銷" },
];

const YEAR_OPTIONS_LABEL = "年度";

const TABLE_COLUMNS = [
  { key: "applyDate", label: "申請日期", width: "11%" },
  { key: "unit", label: "單位", width: "17%" },
  { key: "applicant", label: "申請人", width: "17%" },
  { key: "leaveType", label: "假別", width: "16%" },
  {
    key: "dateTime",
    label: "日期/時間",
    width: "22%",
    desktopWhiteSpace: "pre-line",
    mobileWhiteSpace: "pre-line",
  },
  { key: "status", label: "狀態", width: "17%" },
];

const MOCK_ROWS = [
  {
    id: 1,
    applyDate: "2026/04/02",
    unit: "D002/業務部",
    applicant: "25002/許明城",
    leaveType: "特休",
    dateTime: "2026/04/10 09:00 -\n2026/04/10 18:00",
    status: "已核准",
  },
];

export default function Leave() {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();

  const yearOptions = useMemo(
    () => getApplicationRecordYearOptions(currentYear),
    [currentYear]
  );

  const [year, setYear] = useState(String(currentYear));
  const [unit, setUnit] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("all");

  const yearSelectOptions = yearOptions.map((item) => ({
    value: item,
    label: item,
  }));

  const filteredRows = useMemo(() => {
    return MOCK_ROWS.filter((row) => {
      const unitMatch = !unit || row.unit === unit;
      const employeeMatch = !employee || row.applicant === employee;

      const statusMap = {
        signing: "簽核中",
        returned: "已駁回",
        approved: "已核准",
        "cancel-signing": "撤銷簽核中",
        cancelled: "已撤銷",
      };

      const statusMatch = status === "all" || row.status === statusMap[status];

      return unitMatch && employeeMatch && statusMatch;
    });
  }, [unit, employee, status]);

  const handleClear = () => {
    setYear(String(currentYear));
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
          <SelectField
            label={YEAR_OPTIONS_LABEL}
            required
            value={year}
            onChange={setYear}
            options={yearSelectOptions}
            minWidth="82px"
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
            minWidth="200px"
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