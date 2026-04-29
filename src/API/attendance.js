import http from "./http";
import { getCurrentEmployeeId } from "./account";

function getTaiwanDateParts() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";

  return {
    year: Number(year || 0),
    month: Number(month || 0),
    day: Number(day || 0),
    date: `${year}-${month}-${day}`,
  };
}

function unwrapData(response, fallback = null) {
  return response?.data?.data ?? fallback;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatDateSlash(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }

  return raw.replace(/-/g, "/");
}

function formatDateTimeMinute(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/,
  );

  if (match) {
    return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
  }

  return raw;
}

function formatDateTimeRangeShort(startValue, endValue) {
  const startRaw = String(startValue || "").trim();
  const endRaw = String(endValue || "").trim();

  if (!startRaw && !endRaw) {
    return "";
  }

  if (!startRaw || !endRaw) {
    return formatDateTimeMinute(startRaw || endRaw);
  }

  const startDate = formatDateSlash(startRaw);
  const endDate = formatDateSlash(endRaw);

  const startTimeMatch = startRaw.match(/(\d{2}):(\d{2})/);
  const endTimeMatch = endRaw.match(/(\d{2}):(\d{2})/);

  const startTime = startTimeMatch
    ? `${startTimeMatch[1]}:${startTimeMatch[2]}`
    : "";
  const endTime = endTimeMatch ? `${endTimeMatch[1]}:${endTimeMatch[2]}` : "";

  if (startDate && endDate && startDate === endDate) {
    if (startTime && endTime) {
      return `${startDate} ${startTime} - ${endTime}`;
    }

    return `${startDate} ${startTime || endTime}`.trim();
  }

  return `${formatDateTimeMinute(startRaw)} - ${formatDateTimeMinute(endRaw)}`;
}

function formatMissedPunchType(value) {
  const type = String(value || "").trim();

  if (type === "in" || type === "上班") {
    return "上班";
  }

  if (type === "out" || type === "下班") {
    return "下班";
  }

  return value || "";
}

function formatRequestStatus(value) {
  const status = String(value || "").trim();

  const map = {
    draft: "草稿",
    草稿: "草稿",

    pending: "待審核",
    待審核: "待審核",
    待簽核: "待簽核",

    approved: "已核准",
    已核准: "已核准",

    rejected: "已駁回",
    已駁回: "已駁回",

    cancelled: "已取消",
    已取消: "已取消",
  };

  return map[status] || value || "";
}

function normalizeMissedPunchItem(item = {}) {
  return {
    ...item,
    id: item.missed_punch_request_id || item.id || 0,
    request_id: item.missed_punch_request_id || item.id || 0,
    request_date: formatDateSlash(
      item.request_date || item.created_at || item.request_datetime || "",
    ),
    applicant_name: item.display_name || item.employee_name || "",
    maintenance_type: "忘打卡",
    datetime_text: formatDateTimeMinute(item.request_datetime),
    request_type_label: formatMissedPunchType(item.request_punch_type),
    location_label: item.location_label || "",
    status_label: formatRequestStatus(item.request_status),
    reason: item.reason || "",
  };
}

function normalizeLeaveItem(item = {}) {
  return {
    ...item,
    id: item.leave_request_id || item.id || 0,
    request_id: item.leave_request_id || item.id || 0,
    request_date: formatDateSlash(
      item.request_date || item.created_at || item.start_datetime || "",
    ),
    applicant_name: item.display_name || item.employee_name || "",
    leave_label:
      item.leave_name || item.leave_type_name || item.leave_label || "",
    datetime_text: formatDateTimeRangeShort(
      item.start_datetime,
      item.end_datetime,
    ),
    status_label: formatRequestStatus(item.request_status),
    reason: item.reason || "",
  };
}

function normalizeOvertimeItem(item = {}) {
  return {
    ...item,
    id: item.overtime_request_id || item.id || 0,
    request_id: item.overtime_request_id || item.id || 0,
    request_date: formatDateSlash(
      item.request_date || item.created_at || item.start_datetime || "",
    ),
    applicant_name: item.display_name || item.employee_name || "",
    overtime_type_label: item.overtime_type_label || item.overtime_type || "",
    pay_method_label: item.pay_method_label || item.pay_method || "",
    datetime_text: formatDateTimeRangeShort(
      item.start_datetime,
      item.end_datetime,
    ),
    requested_hours:
      toNumber(item.requested_hours, NaN) ||
      toNumber(item.overtime_hours, NaN) ||
      toNumber(item.hours, 0),
    requested_minutes:
      toNumber(item.requested_minutes, NaN) ||
      toNumber(item.overtime_minutes, NaN) ||
      Math.round(
        (toNumber(item.requested_hours, NaN) ||
          toNumber(item.overtime_hours, NaN) ||
          toNumber(item.hours, 0)) * 60,
      ),
    status_label: formatRequestStatus(item.request_status),
    reason: item.reason || "",
  };
}

function sumHours(items = [], predicate = null) {
  return items.reduce((sum, item) => {
    if (predicate && !predicate(item)) {
      return sum;
    }

    return sum + toNumber(item.requested_hours, 0);
  }, 0);
}

function roundHours(value) {
  return Math.round(toNumber(value, 0) * 100) / 100;
}

export async function apiAttendanceClock(payload) {
  const res = await http.post("/attendance/clock", payload);
  return res.data;
}

export async function apiClockIn(payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  return apiAttendanceClock({
    ...payload,
    employee_id: employeeId,
    action_type: "in",
  });
}

export async function apiClockOut(payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  return apiAttendanceClock({
    ...payload,
    employee_id: employeeId,
    action_type: "out",
  });
}

export async function apiTodayStatus(params = {}) {
  const employeeId = Number(params.employee_id || getCurrentEmployeeId() || 0);
  const today = getTaiwanDateParts();

  const res = await http.get("/attendance/frontend-schedule-month", {
    params: {
      employee_id: employeeId || undefined,
      year: today.year,
      month: today.month,
    },
  });

  const payload = unwrapData(res, {});
  const days = Array.isArray(payload?.days) ? payload.days : [];
  const day =
    days.find((item) => String(item?.work_date || "") === today.date) || null;

  const hasClockIn = !!day?.actual_in;
  const hasClockOut = !!day?.actual_out;
  const isCompleted = hasClockIn && hasClockOut;

  return {
    employee_id: employeeId,
    today: today.date,
    day,
    hasClockIn,
    hasClockOut,
    isCompleted,
    nextAction: isCompleted ? "done" : hasClockIn ? "out" : "in",
  };
}

/**
 * =========================
 * Attendance Record (Frontend)
 * =========================
 */

export async function apiAttendanceRecords(params = {}) {
  const { date_from, date_to, record_type, location, method, employee_id } =
    params;

  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/attendance/frontend-records", {
    params: {
      employee_id: employeeId || undefined,
      date_from,
      date_to,
      record_type,
      location,
      method,
    },
  });

  return res.data;
}

/**
 * =========================
 * Attendance Schedule (Calendar)
 * =========================
 */

export async function apiAttendanceScheduleMonth(params = {}) {
  const { year, month, employee_id } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/attendance/frontend-schedule-month", {
    params: {
      employee_id: employeeId || undefined,
      year,
      month,
    },
  });

  return res.data;
}

/**
 * =========================
 * Leave
 * =========================
 */

export async function apiLeaveTypes(params = {}) {
  const { employee_id } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/leave/types", {
    params: {
      employee_id: employeeId || undefined,
    },
  });

  return res.data;
}

export async function apiSpecialLeaveOptions() {
  const res = await http.get("/leave/special-options");

  return res.data;
}

export async function apiLeaveMeta() {
  const res = await http.get("/leave/meta");

  return res.data;
}

export async function apiLeaveRequestFormMeta(params = {}) {
  const { employee_id } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/leave-request-form-meta", {
    params: {
      employee_id: employeeId || undefined,
    },
  });

  return res.data;
}

export async function apiLeaveRequests(params = {}) {
  const { employee_id, status, request_status, date_from, date_to } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/leave-requests", {
    params: {
      employee_id: employeeId || undefined,
      status,
      request_status,
      date_from,
      date_to,
    },
  });

  return res.data;
}

export async function apiCreateLeaveRequest(payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.post("/leave-requests", {
    employee_id: employeeId,
    leave_type_id: payload.leave_type_id,
    start_datetime: payload.start_datetime,
    end_datetime: payload.end_datetime,
    reason: payload.reason,
  });

  return res.data;
}

export async function apiUpdateLeaveRequest(requestId, payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.put(`/leave-requests/${requestId}`, {
    employee_id: employeeId,
    leave_type_id: payload.leave_type_id,
    start_datetime: payload.start_datetime,
    end_datetime: payload.end_datetime,
    reason: payload.reason,
    request_status: payload.request_status,
  });

  return res.data;
}

export async function apiDeleteLeaveRequest(requestId, params = {}) {
  const employeeId = Number(params.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.delete(`/leave-requests/${requestId}`, {
    data: {
      employee_id: employeeId,
    },
  });

  return res.data;
}

export async function apiApproveLeaveRequest(requestId, payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.post(`/leave-requests/${requestId}/approve`, {
    employee_id: employeeId,
  });

  return res.data;
}

export async function apiRejectLeaveRequest(requestId, payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.post(`/leave-requests/${requestId}/reject`, {
    employee_id: employeeId,
  });

  return res.data;
}

export async function apiLeaveBalances(params = {}) {
  const { employee_id, leave_type_id } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/leave/balances", {
    params: {
      employee_id: employeeId || undefined,
      leave_type_id,
    },
  });

  return res.data;
}

export async function apiLeaveEntitlementInstances(params = {}) {
  const {
    employee_id,
    leave_type_id,
    request_year,
    relation_type,
    status,
  } = params;

  const res = await http.get("/leave/entitlements", {
    params: {
      employee_id: employee_id || undefined,
      leave_type_id,
      request_year,
      relation_type,
      status,
    },
  });

  return res.data;
}

export async function apiLeaveEntitlementRequests(params = {}) {
  const {
    employee_id,
    leave_type_id,
    request_status,
    request_year,
    relation_type,
    date_from,
    date_to,
  } = params;

  const res = await http.get("/leave-entitlement-requests", {
    params: {
      employee_id: employee_id || undefined,
      leave_type_id,
      request_status,
      request_year,
      relation_type,
      date_from,
      date_to,
    },
  });

  return res.data;
}

export async function apiCreateLeaveEntitlementRequest(payload = {}) {
  const hasAttachments =
    Array.isArray(payload.attachments) && payload.attachments.length > 0;

  if (hasAttachments) {
    const formData = new FormData();

    if (payload.employee_id) {
      formData.append("employee_id", String(payload.employee_id));
    }

    formData.append("leave_type_id", String(payload.leave_type_id || ""));
    formData.append("reason", String(payload.reason || ""));
    formData.append("event_date", String(payload.event_date || ""));
    formData.append("request_year", String(payload.request_year || ""));
    formData.append("relation_type", String(payload.relation_type || ""));

    payload.attachments.forEach((file) => {
      formData.append("attachments[]", file);
    });

    const res = await http.post("/leave-entitlement-requests", formData);

    return res.data;
  }

  const requestPayload = {
    leave_type_id: payload.leave_type_id,
    reason: payload.reason,
    event_date: payload.event_date,
    request_year: payload.request_year,
    relation_type: payload.relation_type,
  };

  if (payload.employee_id) {
    requestPayload.employee_id = payload.employee_id;
  }

  const res = await http.post("/leave-entitlement-requests", requestPayload);

  return res.data;
}

export async function apiLeaveApplicationMeta() {
  const [actorRes, employeeRes, unitRes, jobRecordRes] = await Promise.all([
    apiGetPendingApprovalActor().catch(() => ({ data: null })),
    http
      .get("/employees", {
        params: {
          page: 1,
          per_page: 100,
        },
      })
      .catch(() => ({ data: { data: [] } })),
    http.get("/org-units").catch(() => ({ data: { data: [] } })),
    http
      .get("/employee-job-records")
      .catch(() => ({ data: { data: [] } })),
  ]);

  const actor = unwrapData(actorRes, {}) || {};
  const employees = unwrapData(employeeRes, []) || [];
  const units = unwrapData(unitRes, []) || [];
  const jobRecords = unwrapData(jobRecordRes, []) || [];

  const unitMap = new Map(
    units.map((unit) => [
      Number(unit?.unit_id || 0),
      {
        unit_id: Number(unit?.unit_id || 0),
        unit_code: String(unit?.unit_code || "").trim(),
        unit_name: String(unit?.unit_name || "").trim(),
      },
    ])
  );

  const latestJobRecordMap = new Map();

  [...jobRecords]
    .sort((a, b) => {
      const aDate = String(a?.effective_date || "");
      const bDate = String(b?.effective_date || "");

      if (aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }

      return Number(b?.job_record_id || 0) - Number(a?.job_record_id || 0);
    })
    .forEach((record) => {
      const key = Number(record?.employee_id || 0);

      if (!key || latestJobRecordMap.has(key)) {
        return;
      }

      latestJobRecordMap.set(key, record);
    });

  const employeeOptions = [];
  const unitOptionMap = new Map();

  employees.forEach((employee) => {
    const employeeIdValue = Number(employee?.employee_id || 0);

    if (!employeeIdValue) {
      return;
    }

    const employeeNo = String(employee?.employee_no || "").trim();
    const displayName = String(employee?.display_name || "").trim();
    const label =
      employeeNo && displayName
        ? `${employeeNo}/${displayName}`
        : employeeNo || displayName || "";

    const latestJob = latestJobRecordMap.get(employeeIdValue);
    const unit = unitMap.get(Number(latestJob?.unit_id || 0));
    const unitLabel =
      unit?.unit_code && unit?.unit_name
        ? `${unit.unit_code}/${unit.unit_name}`
        : unit?.unit_name || unit?.unit_code || "";

    if (unitLabel) {
      unitOptionMap.set(unitLabel, {
        value: unitLabel,
        label: unitLabel,
      });
    }

    employeeOptions.push({
      value: String(employeeIdValue),
      label,
      employee_id: employeeIdValue,
      unit_label: unitLabel,
    });
  });

  employeeOptions.sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"));
  const unitOptions = Array.from(unitOptionMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "zh-Hant")
  );

  return {
    actor: {
      employee_id: Number(actor?.employee_id || 0),
      unit_id: Number(actor?.unit_id || 0),
      unit_name: String(actor?.unit_name || "").trim(),
      position_name: String(actor?.position_name || "").trim(),
      is_employee_position: !!actor?.is_employee_position,
    },
    unitOptions,
    employeeOptions,
  };
}

export async function apiLeaveApplicationRecordList(params = {}) {
  const {
    employee_id,
    year,
    request_status,
    use_current_employee = true,
  } = params;

  const hasExplicitEmployee =
    employee_id !== undefined && employee_id !== null && employee_id !== "";

  const employeeId = hasExplicitEmployee
    ? Number(employee_id || 0)
    : use_current_employee
      ? Number(getCurrentEmployeeId() || 0)
      : 0;

  const dateFrom = year ? `${Number(year)}-01-01` : "";
  const dateTo = year ? `${Number(year)}-12-31` : "";

  const [res, actorRes, employeeRes, unitRes, jobRecordRes] = await Promise.all([
    apiLeaveRequests({
      employee_id: employeeId || undefined,
      request_status:
        request_status && request_status !== "all" ? request_status : undefined,
    }),
    apiGetPendingApprovalActor().catch(() => ({ data: null })),
    http
      .get("/employees", {
        params: {
          page: 1,
          per_page: 100,
        },
      })
      .catch(() => ({ data: { data: [] } })),
    http.get("/org-units").catch(() => ({ data: { data: [] } })),
    http
      .get("/employee-job-records")
      .catch(() => ({ data: { data: [] } })),
  ]);

  const payload = unwrapData({ data: res }, {});
  let items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  if (dateFrom || dateTo) {
    items = items.filter((item) => {
      const start = String(item?.start_datetime || "").slice(0, 10);

      if (!start) {
        return true;
      }

      if (dateFrom && start < dateFrom) {
        return false;
      }

      if (dateTo && start > dateTo) {
        return false;
      }

      return true;
    });
  }

  const actor = unwrapData(actorRes, {}) || {};
  const employees = unwrapData(employeeRes, []) || [];
  const units = unwrapData(unitRes, []) || [];
  const jobRecords = unwrapData(jobRecordRes, []) || [];

  const unitMap = new Map(
    units.map((unit) => [
      Number(unit?.unit_id || 0),
      {
        unit_id: Number(unit?.unit_id || 0),
        unit_code: String(unit?.unit_code || "").trim(),
        unit_name: String(unit?.unit_name || "").trim(),
      },
    ])
  );

  const latestJobRecordMap = new Map();

  [...jobRecords]
    .sort((a, b) => {
      const aDate = String(a?.effective_date || "");
      const bDate = String(b?.effective_date || "");

      if (aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }

      return Number(b?.job_record_id || 0) - Number(a?.job_record_id || 0);
    })
    .forEach((record) => {
      const key = Number(record?.employee_id || 0);

      if (!key || latestJobRecordMap.has(key)) {
        return;
      }

      latestJobRecordMap.set(key, record);
    });

  const employeeMap = new Map(
    employees.map((employee) => {
      const employeeIdValue = Number(employee?.employee_id || 0);
      const jobRecord = latestJobRecordMap.get(employeeIdValue);
      const unit = unitMap.get(Number(jobRecord?.unit_id || 0));

      const employeeNo = String(employee?.employee_no || "").trim();
      const displayName = String(employee?.display_name || "").trim();

      const applicantLabel =
        employeeNo && displayName
          ? `${employeeNo}/${displayName}`
          : employeeNo || displayName || "";

      const unitLabel =
        unit?.unit_code && unit?.unit_name
          ? `${unit.unit_code}/${unit.unit_name}`
          : unit?.unit_name || unit?.unit_code || "";

      return [
        employeeIdValue,
        {
          employee_id: employeeIdValue,
          employee_no: employeeNo,
          display_name: displayName,
          applicant_label: applicantLabel,
          unit_id: Number(jobRecord?.unit_id || 0),
          unit_label: unitLabel,
        },
      ];
    })
  );

  const normalizedItems = items.map((item) => {
    const normalized = normalizeLeaveItem(item);
    const employeeInfo = employeeMap.get(Number(item?.employee_id || 0));

    return {
      ...normalized,
      employee_id: Number(item?.employee_id || 0),
      unit_label:
        employeeInfo?.unit_label ||
        String(item?.unit_label || item?.unit_name || "").trim(),
      applicant_name:
        employeeInfo?.applicant_label ||
        normalized.applicant_name ||
        String(item?.employee_name || "").trim(),
      actor_is_employee_position: !!actor?.is_employee_position,
    };
  });

  return {
    ...res,
    data: {
      ...(res?.data || {}),
      items: normalizedItems,
    },
  };
}

/**
 * =========================
 * Overtime
 * =========================
 */

export async function apiOvertimeRequestMeta(params = {}) {
  const { employee_id, work_date, year, request_id } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/overtime/request-meta", {
    params: {
      employee_id: employeeId || undefined,
      work_date,
      year,
      request_id,
    },
  });

  return res.data;
}

export async function apiOvertimeRequests(params = {}) {
  const { employee_id, schedule_id, request_status } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/overtime-requests", {
    params: {
      employee_id: employeeId || undefined,
      schedule_id,
      request_status,
    },
  });

  return res.data;
}

export async function apiCreateOvertimeRequest(payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.post("/overtime-requests", {
    employee_id: employeeId,
    overtime_type: payload.overtime_type,
    pay_method: payload.pay_method,
    start_datetime: payload.start_datetime,
    end_datetime: payload.end_datetime,
    reason: payload.reason,
  });

  return res.data;
}

export async function apiUpdateOvertimeRequest(requestId, payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.put(`/overtime-requests/${requestId}`, {
    employee_id: employeeId,
    overtime_type: payload.overtime_type,
    pay_method: payload.pay_method,
    start_datetime: payload.start_datetime,
    end_datetime: payload.end_datetime,
    reason: payload.reason,
    request_status: payload.request_status,
  });

  return res.data;
}

export async function apiDeleteOvertimeRequest(requestId, params = {}) {
  const employeeId = Number(params.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.delete(`/overtime-requests/${requestId}`, {
    data: {
      employee_id: employeeId,
    },
  });

  return res.data;
}

export async function apiApproveOvertimeRequest(requestId, payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.post(`/overtime-requests/${requestId}/approve`, {
    employee_id: employeeId,
  });

  return res.data;
}

export async function apiRejectOvertimeRequest(requestId, payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.post(`/overtime-requests/${requestId}/reject`, {
    employee_id: employeeId,
  });

  return res.data;
}

export async function apiOvertimeApplicationMeta() {
  const [actorRes, employeeRes, unitRes, jobRecordRes] = await Promise.all([
    apiGetPendingApprovalActor().catch(() => ({ data: null })),
    http
      .get("/employees", {
        params: {
          page: 1,
          per_page: 100,
        },
      })
      .catch(() => ({ data: { data: [] } })),
    http.get("/org-units").catch(() => ({ data: { data: [] } })),
    http
      .get("/employee-job-records")
      .catch(() => ({ data: { data: [] } })),
  ]);

  const actor = unwrapData(actorRes, {}) || {};
  const employees = unwrapData(employeeRes, []) || [];
  const units = unwrapData(unitRes, []) || [];
  const jobRecords = unwrapData(jobRecordRes, []) || [];

  const unitMap = new Map(
    units.map((unit) => [
      Number(unit?.unit_id || 0),
      {
        unit_id: Number(unit?.unit_id || 0),
        unit_code: String(unit?.unit_code || "").trim(),
        unit_name: String(unit?.unit_name || "").trim(),
      },
    ])
  );

  const latestJobRecordMap = new Map();

  [...jobRecords]
    .sort((a, b) => {
      const aDate = String(a?.effective_date || "");
      const bDate = String(b?.effective_date || "");

      if (aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }

      return Number(b?.job_record_id || 0) - Number(a?.job_record_id || 0);
    })
    .forEach((record) => {
      const key = Number(record?.employee_id || 0);

      if (!key || latestJobRecordMap.has(key)) {
        return;
      }

      latestJobRecordMap.set(key, record);
    });

  const employeeOptions = [];
  const unitOptionMap = new Map();

  employees.forEach((employee) => {
    const employeeIdValue = Number(employee?.employee_id || 0);

    if (!employeeIdValue) {
      return;
    }

    const employeeNo = String(employee?.employee_no || "").trim();
    const displayName = String(employee?.display_name || "").trim();
    const label =
      employeeNo && displayName
        ? `${employeeNo}/${displayName}`
        : employeeNo || displayName || "";

    const latestJob = latestJobRecordMap.get(employeeIdValue);
    const unit = unitMap.get(Number(latestJob?.unit_id || 0));
    const unitLabel =
      unit?.unit_code && unit?.unit_name
        ? `${unit.unit_code}/${unit.unit_name}`
        : unit?.unit_name || unit?.unit_code || "";

    if (unitLabel) {
      unitOptionMap.set(unitLabel, {
        value: unitLabel,
        label: unitLabel,
      });
    }

    employeeOptions.push({
      value: String(employeeIdValue),
      label,
      employee_id: employeeIdValue,
      unit_label: unitLabel,
    });
  });

  employeeOptions.sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"));
  const unitOptions = Array.from(unitOptionMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "zh-Hant")
  );

  return {
    actor: {
      employee_id: Number(actor?.employee_id || 0),
      unit_id: Number(actor?.unit_id || 0),
      unit_name: String(actor?.unit_name || "").trim(),
      position_name: String(actor?.position_name || "").trim(),
      is_employee_position: !!actor?.is_employee_position,
    },
    unitOptions,
    employeeOptions,
  };
}

export async function apiOvertimeApplicationRecordList(params = {}) {
  const {
    employee_id,
    year,
    month,
    request_status,
    use_current_employee = true,
  } = params;

  const hasExplicitEmployee =
    employee_id !== undefined && employee_id !== null && employee_id !== "";

  const employeeId = hasExplicitEmployee
    ? Number(employee_id || 0)
    : use_current_employee
      ? Number(getCurrentEmployeeId() || 0)
      : 0;

  let date_from;
  let date_to;

  if (year && month) {
    const y = Number(year);
    const m = Number(month);
    const lastDay = new Date(y, m, 0).getDate();

    date_from = `${y}-${String(m).padStart(2, "0")}-01`;
    date_to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(
      2,
      "0"
    )}`;
  } else if (year) {
    const y = Number(year);
    date_from = `${y}-01-01`;
    date_to = `${y}-12-31`;
  }

  const [res, actorRes, employeeRes, unitRes, jobRecordRes] = await Promise.all([
    apiOvertimeRequests({
      employee_id: employeeId || undefined,
      request_status:
        request_status && request_status !== "all" ? request_status : undefined,
    }),
    apiGetPendingApprovalActor().catch(() => ({ data: null })),
    http
      .get("/employees", {
        params: {
          page: 1,
          per_page: 100,
        },
      })
      .catch(() => ({ data: { data: [] } })),
    http.get("/org-units").catch(() => ({ data: { data: [] } })),
    http
      .get("/employee-job-records")
      .catch(() => ({ data: { data: [] } })),
  ]);

  const payload = unwrapData({ data: res }, {});
  let items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  if (date_from || date_to) {
    items = items.filter((item) => {
      const start = String(item?.start_datetime || "").slice(0, 10);

      if (!start) {
        return true;
      }

      if (date_from && start < date_from) {
        return false;
      }

      if (date_to && start > date_to) {
        return false;
      }

      return true;
    });
  }

  const actor = unwrapData(actorRes, {}) || {};
  const employees = unwrapData(employeeRes, []) || [];
  const units = unwrapData(unitRes, []) || [];
  const jobRecords = unwrapData(jobRecordRes, []) || [];

  const unitMap = new Map(
    units.map((unit) => [
      Number(unit?.unit_id || 0),
      {
        unit_id: Number(unit?.unit_id || 0),
        unit_code: String(unit?.unit_code || "").trim(),
        unit_name: String(unit?.unit_name || "").trim(),
      },
    ])
  );

  const latestJobRecordMap = new Map();

  [...jobRecords]
    .sort((a, b) => {
      const aDate = String(a?.effective_date || "");
      const bDate = String(b?.effective_date || "");

      if (aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }

      return Number(b?.job_record_id || 0) - Number(a?.job_record_id || 0);
    })
    .forEach((record) => {
      const key = Number(record?.employee_id || 0);

      if (!key || latestJobRecordMap.has(key)) {
        return;
      }

      latestJobRecordMap.set(key, record);
    });

  const employeeMap = new Map(
    employees.map((employee) => {
      const employeeIdValue = Number(employee?.employee_id || 0);
      const jobRecord = latestJobRecordMap.get(employeeIdValue);
      const unit = unitMap.get(Number(jobRecord?.unit_id || 0));

      const employeeNo = String(employee?.employee_no || "").trim();
      const displayName = String(employee?.display_name || "").trim();

      const applicantLabel =
        employeeNo && displayName
          ? `${employeeNo}/${displayName}`
          : employeeNo || displayName || "";

      const unitLabel =
        unit?.unit_code && unit?.unit_name
          ? `${unit.unit_code}/${unit.unit_name}`
          : unit?.unit_name || unit?.unit_code || "";

      return [
        employeeIdValue,
        {
          employee_id: employeeIdValue,
          employee_no: employeeNo,
          display_name: displayName,
          applicant_label: applicantLabel,
          unit_id: Number(jobRecord?.unit_id || 0),
          unit_label: unitLabel,
        },
      ];
    })
  );

  const normalizedItems = items.map((item) => {
    const normalized = normalizeOvertimeItem(item);
    const employeeInfo = employeeMap.get(Number(item?.employee_id || 0));

    return {
      ...normalized,
      employee_id: Number(item?.employee_id || 0),
      unit_label:
        employeeInfo?.unit_label ||
        String(item?.unit_label || item?.unit_name || "").trim(),
      applicant_name:
        employeeInfo?.applicant_label ||
        normalized.applicant_name ||
        String(item?.employee_name || "").trim(),
      actor_is_employee_position: !!actor?.is_employee_position,
    };
  });

  return {
    ...res,
    data: {
      ...(res?.data || {}),
      items: normalizedItems,
    },
  };
}

/**
 * =========================
 * Missed Punch
 * =========================
 */

export async function apiMissedPunchRequests(params = {}) {
  const {
    employee_id,
    request_status,
    request_punch_type,
    date_from,
    date_to,
    limit,
    offset,
    use_current_employee = true,
  } = params;

  const hasExplicitEmployee =
    employee_id !== undefined && employee_id !== null && employee_id !== "";

  const employeeId = hasExplicitEmployee
    ? Number(employee_id || 0)
    : use_current_employee
      ? Number(getCurrentEmployeeId() || 0)
      : 0;

  const res = await http.get("/missed-punch-requests", {
    params: {
      employee_id: employeeId || undefined,
      request_status,
      request_punch_type,
      date_from,
      date_to,
      limit,
      offset,
    },
  });

  return res.data;
}

export async function apiCreateMissedPunchRequest(payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.post("/missed-punch-requests", {
    employee_id: employeeId,
    request_punch_type: payload.request_punch_type,
    request_datetime: payload.request_datetime,
    location_label: payload.location_label,
    location_note: payload.location_note,
    latitude: payload.latitude,
    longitude: payload.longitude,
    reason: payload.reason,
  });

  return res.data;
}

export async function apiUpdateMissedPunchRequest(requestId, payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.put(`/missed-punch-requests/${requestId}`, {
    employee_id: employeeId,
    request_punch_type: payload.request_punch_type,
    request_datetime: payload.request_datetime,
    location_label: payload.location_label,
    location_note: payload.location_note,
    latitude: payload.latitude,
    longitude: payload.longitude,
    reason: payload.reason,
    request_status: payload.request_status,
  });

  return res.data;
}

export async function apiDeleteMissedPunchRequest(requestId, params = {}) {
  const employeeId = Number(params.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.delete(`/missed-punch-requests/${requestId}`, {
    data: {
      employee_id: employeeId,
    },
  });

  return res.data;
}

export async function apiApproveMissedPunchRequest(requestId, payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.post(`/missed-punch-requests/${requestId}/approve`, {
    employee_id: employeeId,
  });

  return res.data;
}

export async function apiRejectMissedPunchRequest(requestId, payload = {}) {
  const employeeId = Number(payload.employee_id || getCurrentEmployeeId() || 0);

  const res = await http.post(`/missed-punch-requests/${requestId}/reject`, {
    employee_id: employeeId,
  });

  return res.data;
}

export async function apiMissedPunchApplicationMeta() {
  const [actorRes, employeeRes, unitRes, jobRecordRes] = await Promise.all([
    apiGetPendingApprovalActor().catch(() => ({ data: null })),
    http
      .get("/employees", {
        params: {
          page: 1,
          per_page: 100,
        },
      })
      .catch(() => ({ data: { data: [] } })),
    http.get("/org-units").catch(() => ({ data: { data: [] } })),
    http
      .get("/employee-job-records")
      .catch(() => ({ data: { data: [] } })),
  ]);

  const actor = unwrapData(actorRes, {}) || {};
  const employees = unwrapData(employeeRes, []) || [];
  const units = unwrapData(unitRes, []) || [];
  const jobRecords = unwrapData(jobRecordRes, []) || [];

  const unitMap = new Map(
    units.map((unit) => [
      Number(unit?.unit_id || 0),
      {
        unit_id: Number(unit?.unit_id || 0),
        unit_code: String(unit?.unit_code || "").trim(),
        unit_name: String(unit?.unit_name || "").trim(),
      },
    ])
  );

  const latestJobRecordMap = new Map();

  [...jobRecords]
    .sort((a, b) => {
      const aDate = String(a?.effective_date || "");
      const bDate = String(b?.effective_date || "");

      if (aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }

      return Number(b?.job_record_id || 0) - Number(a?.job_record_id || 0);
    })
    .forEach((record) => {
      const key = Number(record?.employee_id || 0);

      if (!key || latestJobRecordMap.has(key)) {
        return;
      }

      latestJobRecordMap.set(key, record);
    });

  const employeeOptions = [];
  const unitOptionMap = new Map();

  employees.forEach((employee) => {
    const employeeIdValue = Number(employee?.employee_id || 0);

    if (!employeeIdValue) {
      return;
    }

    const employeeNo = String(employee?.employee_no || "").trim();
    const displayName = String(employee?.display_name || "").trim();
    const label =
      employeeNo && displayName
        ? `${employeeNo}/${displayName}`
        : employeeNo || displayName || "";

    const latestJob = latestJobRecordMap.get(employeeIdValue);
    const unit = unitMap.get(Number(latestJob?.unit_id || 0));
    const unitLabel =
      unit?.unit_code && unit?.unit_name
        ? `${unit.unit_code}/${unit.unit_name}`
        : unit?.unit_name || unit?.unit_code || "";

    if (unitLabel) {
      unitOptionMap.set(unitLabel, {
        value: unitLabel,
        label: unitLabel,
      });
    }

    employeeOptions.push({
      value: String(employeeIdValue),
      label,
      employee_id: employeeIdValue,
      unit_label: unitLabel,
    });
  });

  employeeOptions.sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"));
  const unitOptions = Array.from(unitOptionMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "zh-Hant")
  );

  return {
    actor: {
      employee_id: Number(actor?.employee_id || 0),
      unit_id: Number(actor?.unit_id || 0),
      unit_name: String(actor?.unit_name || "").trim(),
      position_name: String(actor?.position_name || "").trim(),
      is_employee_position: !!actor?.is_employee_position,
    },
    unitOptions,
    employeeOptions,
  };
}

export async function apiMissedPunchApplicationRecordList(params = {}) {
  const {
    employee_id,
    year,
    month,
    request_status,
    use_current_employee = true,
  } = params;

  const hasExplicitEmployee =
    employee_id !== undefined && employee_id !== null && employee_id !== "";

  const employeeId = hasExplicitEmployee
    ? Number(employee_id || 0)
    : use_current_employee
      ? Number(getCurrentEmployeeId() || 0)
      : 0;

  let date_from;
  let date_to;

  if (year && month) {
    const y = Number(year);
    const m = Number(month);
    const lastDay = new Date(y, m, 0).getDate();

    date_from = `${y}-${String(m).padStart(2, "0")}-01`;
    date_to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(
      2,
      "0"
    )}`;
  }

  const [res, actorRes, employeeRes, unitRes, jobRecordRes] = await Promise.all([
    apiMissedPunchRequests({
      employee_id: employeeId || undefined,
      request_status:
        request_status && request_status !== "all" ? request_status : undefined,
      date_from,
      date_to,
      use_current_employee,
    }),
    apiGetPendingApprovalActor().catch(() => ({ data: null })),
    http
      .get("/employees", {
        params: {
          page: 1,
          per_page: 100,
        },
      })
      .catch(() => ({ data: { data: [] } })),
    http.get("/org-units").catch(() => ({ data: { data: [] } })),
    http
      .get("/employee-job-records")
      .catch(() => ({ data: { data: [] } })),
  ]);

  const payload = unwrapData({ data: res }, {});
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  const actor = unwrapData(actorRes, {}) || {};
  const employees = unwrapData(employeeRes, []) || [];
  const units = unwrapData(unitRes, []) || [];
  const jobRecords = unwrapData(jobRecordRes, []) || [];

  const unitMap = new Map(
    units.map((unit) => [
      Number(unit?.unit_id || 0),
      {
        unit_id: Number(unit?.unit_id || 0),
        unit_code: String(unit?.unit_code || "").trim(),
        unit_name: String(unit?.unit_name || "").trim(),
      },
    ])
  );

  const latestJobRecordMap = new Map();

  [...jobRecords]
    .sort((a, b) => {
      const aDate = String(a?.effective_date || "");
      const bDate = String(b?.effective_date || "");

      if (aDate !== bDate) {
        return bDate.localeCompare(aDate);
      }

      return Number(b?.job_record_id || 0) - Number(a?.job_record_id || 0);
    })
    .forEach((record) => {
      const key = Number(record?.employee_id || 0);

      if (!key || latestJobRecordMap.has(key)) {
        return;
      }

      latestJobRecordMap.set(key, record);
    });

  const employeeMap = new Map(
    employees.map((employee) => {
      const employeeIdValue = Number(employee?.employee_id || 0);
      const jobRecord = latestJobRecordMap.get(employeeIdValue);
      const unit = unitMap.get(Number(jobRecord?.unit_id || 0));

      const employeeNo = String(employee?.employee_no || "").trim();
      const displayName = String(employee?.display_name || "").trim();

      const applicantLabel =
        employeeNo && displayName
          ? `${employeeNo}/${displayName}`
          : employeeNo || displayName || "";

      const unitLabel =
        unit?.unit_code && unit?.unit_name
          ? `${unit.unit_code}/${unit.unit_name}`
          : unit?.unit_name || unit?.unit_code || "";

      return [
        employeeIdValue,
        {
          employee_id: employeeIdValue,
          employee_no: employeeNo,
          display_name: displayName,
          applicant_label: applicantLabel,
          unit_id: Number(jobRecord?.unit_id || 0),
          unit_label: unitLabel,
        },
      ];
    })
  );

  const normalizedItems = items.map((item) => {
    const normalized = normalizeMissedPunchItem(item);
    const employeeInfo = employeeMap.get(Number(item?.employee_id || 0));

    return {
      ...normalized,
      employee_id: Number(item?.employee_id || 0),
      unit_label:
        employeeInfo?.unit_label ||
        String(item?.unit_label || item?.unit_name || "").trim(),
      applicant_name:
        employeeInfo?.applicant_label ||
        normalized.applicant_name ||
        String(item?.employee_name || "").trim(),
      actor_is_employee_position: !!actor?.is_employee_position,
    };
  });

  return {
    ...res,
    data: {
      ...(res?.data || {}),
      items: normalizedItems,
    },
  };
}

/**
 * =========================
 * Unified Pending Approval
 * =========================
 */

export async function apiGetPendingApprovalActor() {
  const res = await http.get("/approval/actor");
  return res.data;
}

export async function apiGetPendingApprovals(params = {}) {
  const { type, employee_id } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/approval/pending", {
    params: {
      type,
      employee_id: employeeId || undefined,
    },
  });

  return res.data;
}

export async function apiApprovalAction(payload = {}) {
  const res = await http.post("/approval/action", {
    type: payload.type,
    id: payload.id,
    action: payload.action,
  });

  return res.data;
}

/**
 * =========================
 * Attendance Form Page
 * =========================
 */

export async function apiMissedPunchRecordList(params = {}) {
  const { employee_id, year, month, request_status } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  let date_from;
  let date_to;

  if (year && month) {
    const y = Number(year);
    const m = Number(month);
    const lastDay = new Date(y, m, 0).getDate();

    date_from = `${y}-${String(m).padStart(2, "0")}-01`;
    date_to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }

  const res = await apiMissedPunchRequests({
    employee_id: employeeId,
    request_status:
      request_status && request_status !== "all" ? request_status : "已核准",
    date_from,
    date_to,
  });

  const payload = unwrapData({ data: res }, {});
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    ...res,
    data: {
      ...(res?.data || {}),
      items: items.map(normalizeMissedPunchItem),
    },
  };
}

export async function apiLeaveRecordList(params = {}) {
  const { employee_id, year, month, status } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  let date_from;
  let date_to;

  if (year && month) {
    const y = Number(year);
    const m = Number(month);
    const lastDay = new Date(y, m, 0).getDate();

    date_from = `${y}-${String(m).padStart(2, "0")}-01`;
    date_to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  } else if (year) {
    const y = Number(year);
    date_from = `${y}-01-01`;
    date_to = `${y}-12-31`;
  }

  const res = await apiLeaveRequests({
    employee_id: employeeId,
    request_status: status && status !== "all" ? status : undefined,
    date_from,
    date_to,
  });

  const payload = unwrapData({ data: res }, {});
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    ...res,
    data: {
      ...(res?.data || {}),
      items: items.map(normalizeLeaveItem),
    },
  };
}

export async function apiOvertimeApplicationRecords(params = {}) {
  const { employee_id, year, month, request_status } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  let date_from;
  let date_to;

  if (year && month) {
    const y = Number(year);
    const m = Number(month);
    const lastDay = new Date(y, m, 0).getDate();

    date_from = `${y}-${String(m).padStart(2, "0")}-01`;
    date_to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  } else if (year) {
    const y = Number(year);
    date_from = `${y}-01-01`;
    date_to = `${y}-12-31`;
  }

  const res = await apiOvertimeRequests({
    employee_id: employeeId,
    request_status:
      request_status && request_status !== "all" ? request_status : undefined,
  });

  const payload = unwrapData({ data: res }, {});
  let items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  if (date_from || date_to) {
    items = items.filter((item) => {
      const start = String(item?.start_datetime || "").slice(0, 10);

      if (!start) {
        return true;
      }

      if (date_from && start < date_from) {
        return false;
      }

      if (date_to && start > date_to) {
        return false;
      }

      return true;
    });
  }

  return {
    ...res,
    data: {
      ...(res?.data || {}),
      items: items.map(normalizeOvertimeItem),
    },
  };
}

export async function apiOvertimeStatistics(params = {}) {
  const { employee_id, date_from, date_to } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await apiOvertimeRequests({
    employee_id: employeeId,
  });

  const payload = unwrapData({ data: res }, {});
  let items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  if (date_from || date_to) {
    items = items.filter((item) => {
      const start = String(item?.start_datetime || "").slice(0, 10);

      if (!start) {
        return true;
      }

      if (date_from && start < date_from) {
        return false;
      }

      if (date_to && start > date_to) {
        return false;
      }

      return true;
    });
  }

  const normalizedItems = items.map(normalizeOvertimeItem);

  const requested_pending = roundHours(
    sumHours(
      normalizedItems,
      (item) =>
        item.request_status === "pending" || item.request_status === "待簽核",
    ),
  );

  const requested_approved = roundHours(
    sumHours(
      normalizedItems,
      (item) =>
        item.request_status === "approved" || item.request_status === "已核准",
    ),
  );

  const requested_rejected = roundHours(
    sumHours(
      normalizedItems,
      (item) =>
        item.request_status === "rejected" || item.request_status === "已駁回",
    ),
  );

  const requested_draft = roundHours(
    sumHours(
      normalizedItems,
      (item) =>
        item.request_status === "draft" || item.request_status === "草稿",
    ),
  );

  const payable_hours = roundHours(
    sumHours(
      normalizedItems,
      (item) =>
        item.request_status === "approved" || item.request_status === "已核准",
    ),
  );

  const actual_paid_hours = payable_hours;

  return {
    success: true,
    data: {
      items: normalizedItems,
      summary: {
        requested_pending,
        requested_approved,
        requested_rejected,
        requested_draft,
        waiting_confirmation: 0,
        payable_hours,
        actual_paid_hours,
      },
    },
  };
}
