import { useEffect, useMemo, useState } from "react";
import { Box, Link, Typography } from "@mui/material";
import ResponsiveAttendanceTable from "../ResponsiveAttendanceTable";
import { getApplicationRecordYearOptions } from "./Options";
import {
  ActionButtons,
  SelectField,
} from "./SharedFields";
import {
  apiLeaveApplicationMeta,
  apiLeaveEntitlementRequests,
} from "../../../../API/attendance";

const STATUS_OPTIONS = [
  { value: "", label: "全部" },
  { value: "待審核", label: "待審核" },
  { value: "已核准", label: "已核准" },
  { value: "已駁回", label: "已駁回" },
];

const TABLE_COLUMNS = [
  { key: "applyDate", label: "申請日期", width: "12%" },
  { key: "unit", label: "單位", width: "16%" },
  { key: "applicant", label: "申請人", width: "18%" },
  { key: "leaveType", label: "假別", width: "16%" },
  { key: "attachment", label: "附件", width: "22%" },
  { key: "status", label: "狀態", width: "16%" },
];

function getItems(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}

function formatDate(value) {
  const raw = String(value || "").trim();

  if (!raw) return "-";

  return raw.replace(/-/g, "/").slice(0, 10);
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    "讀取特殊假別申請紀錄失敗。"
  );
}

export default function SpecialLeave() {
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
  const [status, setStatus] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    year: String(currentYear),
    unit: "",
    employee: "",
    status: "",
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

  const filteredEmployeeOptions = useMemo(() => {
    if (!unit) return employeeOptions;

    return employeeOptions.filter(
      (item) =>
        !item.value ||
        String(item.unit_label || "") === String(unit),
    );
  }, [employeeOptions, unit]);

  const employeeMap = useMemo(
    () =>
      new Map(
        employeeOptions
          .filter((item) => item.value)
          .map((item) => [
            Number(item.employee_id || item.value || 0),
            item,
          ]),
      ),
    [employeeOptions],
  );

  const displayRows = useMemo(() => {
    return rows
      .map((row) => {
        const employeeOption = employeeMap.get(
          Number(row.employee_id || 0),
        );

        const applicant =
          row.employee_no && row.employee_name
            ? `${row.employee_no}/${row.employee_name}`
            : employeeOption?.label ||
              row.employee_name ||
              row.employee_no ||
              "-";

        return {
          ...row,
          id:
            row.entitlement_request_id ||
            row.request_id ||
            row.id,
          applyDate: formatDate(row.submitted_at),
          unit: employeeOption?.unit_label || "-",
          applicant,
          leaveType: row.leave_name || "-",
          attachment: Array.isArray(row.attachments)
            ? row.attachments
            : [],
          status: row.request_status || "-",
        };
      })
      .filter((row) => {
        if (
          appliedFilters.unit &&
          String(row.unit || "") !== String(appliedFilters.unit)
        ) {
          return false;
        }

        return true;
      });
  }, [rows, employeeMap, appliedFilters.unit]);

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setMetaLoading(true);

      try {
        const meta = await apiLeaveApplicationMeta();

        if (!active) return;

        const actor = meta?.actor || {};
        const positionName = String(
          actor?.position_name || "",
        )
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
        const response = await apiLeaveEntitlementRequests({
          employee_id:
            !isEmployeeOnly && appliedFilters.employee
              ? Number(appliedFilters.employee)
              : undefined,
          request_year: appliedFilters.year || undefined,
          request_status: appliedFilters.status || undefined,
        });

        if (!active) return;

        setRows(getItems(response));
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

  const handleSearch = () => {
    setAppliedFilters({
      year,
      unit: isEmployeeOnly ? "" : unit,
      employee: isEmployeeOnly ? "" : employee,
      status,
    });
  };

  const handleClear = () => {
    const nextFilters = {
      year: String(currentYear),
      unit: "",
      employee: "",
      status: "",
    };

    setYear(nextFilters.year);
    setUnit("");
    setEmployee("");
    setStatus("");
    setAppliedFilters(nextFilters);
  };

  const renderTableValue = (row, column) => {
    if (column.key === "attachment") {
      const attachments = Array.isArray(row.attachment)
        ? row.attachment
        : [];

      if (attachments.length === 0) {
        return "-";
      }

      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "2px",
          }}
        >
          {attachments.map((attachment, index) => {
            const fileName =
              attachment?.file_name ||
              attachment?.name ||
              `附件 ${index + 1}`;

            const fileUrl =
              attachment?.file_url ||
              attachment?.url ||
              "";

            if (!fileUrl) {
              return (
                <Typography
                  key={`${fileName}-${index}`}
                  sx={{ fontSize: "14px" }}
                >
                  {fileName}
                </Typography>
              );
            }

            return (
              <Link
                key={`${fileUrl}-${index}`}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{ fontSize: "14px" }}
              >
                {fileName}
              </Link>
            );
          })}
        </Box>
      );
    }

    return row[column.key] ?? "-";
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
              options={filteredEmployeeOptions}
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
        rows={displayRows}
        mobileCardTitleKey="applyDate"
        getRowKey={(row) => row.id}
        emptyText="查無特殊假別申請紀錄"
        renderValue={renderTableValue}
        pagination
        rowsPerPage={10}
      />
    </Box>
  );
}