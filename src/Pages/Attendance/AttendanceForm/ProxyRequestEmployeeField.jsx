import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import { apiAttendanceProxyRequestMeta } from "../../../API/attendance";
import { getCurrentEmployeeId } from "../../../API/account";
import { SelectField } from "./ApplicationRecord/SharedFields";

function unwrapData(response, fallback = {}) {
  const payload = response?.data?.data ?? response?.data ?? response;

  if (payload === undefined || payload === null) {
    return fallback;
  }

  return payload;
}

function employeeLabel(employee = {}) {
  const employeeNo = String(employee?.employee_no || "").trim();
  const displayName = String(employee?.display_name || "").trim();

  if (employeeNo && displayName) {
    return `${employeeNo}/${displayName}`;
  }

  return employeeNo || displayName || "";
}

export default function ProxyRequestEmployeeField({
  formType,
  value,
  onChange,
  disabled = false,
}) {
  const currentEmployeeId = Number(getCurrentEmployeeId() || 0);

  const [meta, setMeta] = useState({
    permissions: {},
    employees: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let active = true;

    const loadMeta = async () => {
      setLoading(true);
      setErrorText("");

      try {
        const response = await apiAttendanceProxyRequestMeta();
        const data = unwrapData(response, {});

        if (!active) return;

        setMeta({
          permissions:
            data?.permissions && typeof data.permissions === "object"
              ? data.permissions
              : {},
          employees: Array.isArray(data?.employees) ? data.employees : [],
        });
      } catch (error) {
        if (!active) return;

        console.error("Failed to load proxy request meta:", error);
        setMeta({
          permissions: {},
          employees: [],
        });
        setErrorText("無法載入代申請資料。");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMeta();

    return () => {
      active = false;
    };
  }, []);

  const allowedUnitIds = useMemo(() => {
    const unitIds = Array.isArray(meta.permissions?.[formType])
      ? meta.permissions[formType]
      : [];

    return unitIds
      .map((unitId) => Number(unitId || 0))
      .filter((unitId) => unitId > 0);
  }, [formType, meta.permissions]);

  const employeeOptions = useMemo(() => {
    return meta.employees
      .filter((employee) =>
        allowedUnitIds.includes(Number(employee?.employee_unit_id || 0)),
      )
      .filter(
        (employee) =>
          Number(employee?.employee_id || 0) !== currentEmployeeId,
      )
      .map((employee) => ({
        value: String(employee.employee_id),
        label: employeeLabel(employee),
      }));
  }, [allowedUnitIds, currentEmployeeId, meta.employees]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "38px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (errorText) {
    return (
      <Alert severity="error">
        {errorText}
      </Alert>
    );
  }

  if (employeeOptions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        sx={{
          mb: "6px",
          fontSize: "15px",
          fontWeight: 500,
        }}
      >
        選擇人員
      </Typography>

      <SelectField
        value={value}
        onChange={onChange}
        options={[
          {
            value: "",
            label: "請選擇人員",
          },
          ...employeeOptions,
        ]}
        displayEmpty
        fullWidth
        height="38px"
        disabled={disabled}
      />
    </Box>
  );
}