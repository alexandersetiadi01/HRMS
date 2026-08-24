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

function buildLeaveLabel(item = {}) {
  const leaveName = String(
    item.leave_name || item.leave_type_name || item.leave_label || "",
  ).trim();

  const relationType = String(
    item.relation_type ||
      item.leave_relation_type ||
      item.entitlement_relation_type ||
      item.condition_value ||
      item.condition_label ||
      item.kinship ||
      item.kinship_label ||
      item.relationship ||
      "",
  ).trim();

  if (leaveName && relationType) {
    return `${leaveName} - ${relationType}`;
  }

  return leaveName;
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
    leave_label: buildLeaveLabel(item),
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
 * Attendance Administration
 * =========================
 */

export async function apiAttendancePunches(params = {}) {
  const {
    employee_id,
    date_from,
    date_to,
    punch_type,
    location,
    method,
  } = params;

  const res = await http.get("/attendance/punches", {
    params: {
      employee_id: employee_id || undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
      punch_type: punch_type || undefined,
      location: location || undefined,
      method: method || undefined,
    },
  });

  return res.data;
}

export async function apiCreateAttendancePunch(payload = {}) {
  const res = await http.post("/attendance/punches", {
    employee_id: payload.employee_id,
    punch_time: payload.punch_time,
    punch_type: payload.punch_type,
    method: payload.method || "手動",
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    ip_address: payload.ip_address || "",
    location_label: payload.location_label || "",
    maintenance_reason: payload.maintenance_reason || "",
  });

  return res.data;
}

export async function apiUpdateAttendancePunch(punchId, payload = {}) {
  const res = await http.patch(`/attendance/punches/${punchId}`, {
    ...payload,
    maintenance_reason: payload.maintenance_reason || "",
  });

  return res.data;
}

export async function apiDeleteAttendancePunch(
  punchId,
  maintenanceReason,
) {
  const res = await http.delete(
    `/attendance/punches/${punchId}`,
    {
      params: {
        maintenance_reason: maintenanceReason || "",
      },
    },
  );

  return res.data;
}

export async function apiAttendancePunchMaintenanceLogs(
  params = {},
) {
  const {
    employee_id,
    punch_id,
    action_type,
    operator_user_id,
    date_from,
    date_to,
  } = params;

  const res = await http.get(
    "/attendance/punches/maintenance-logs",
    {
      params: {
        employee_id: employee_id || undefined,
        punch_id: punch_id || undefined,
        action_type: action_type || undefined,
        operator_user_id:
          operator_user_id || undefined,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
      },
    },
  );

  return res.data;
}

export async function apiAttendancePunchBulkPreview(
  payload = {},
) {
  const res = await http.post(
    "/attendance/punches/bulk-preview",
    payload,
  );

  return res.data;
}

export async function apiAttendancePunchBulkCreate(
  payload = {},
) {
  const res = await http.post(
    "/attendance/punches/bulk-create",
    payload,
  );

  return res.data;
}

export async function apiAttendanceAnomalies(params = {}) {
  const {
    employee_id,
    anomaly_type,
    status,
    date_from,
    date_to,
  } = params;

  const res = await http.get("/attendance/anomalies", {
    params: {
      employee_id: employee_id || undefined,
      anomaly_type: anomaly_type || undefined,
      status: status || undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
    },
  });

  return res.data;
}

export async function apiAttendanceAbsences(params = {}) {
  const { employee_id, status, date_from, date_to } = params;

  const res = await http.get("/attendance/absences", {
    params: {
      employee_id: employee_id || undefined,
      status: status || undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
    },
  });

  return res.data;
}

export async function apiCreateAttendanceAbsence(payload = {}) {
  const res = await http.post("/attendance/absences", payload);
  return res.data;
}

export async function apiUpdateAttendanceAbsence(absenceId, payload = {}) {
  const res = await http.patch(`/attendance/absences/${absenceId}`, payload);
  return res.data;
}

export async function apiRevokeAttendanceAbsence(absenceId, revokedReason) {
  const res = await http.post(`/attendance/absences/${absenceId}/revoke`, {
    revoked_reason: revokedReason || "",
  });

  return res.data;
}

export async function apiConvertAttendanceAnomalyToAbsence(anomalyId, payload = {}) {
  const res = await http.post(
    `/attendance/anomalies/${anomalyId}/convert-to-absence`,
    payload,
  );

  return res.data;
}

export async function apiAttendanceCalendarMasters() {
  const res = await http.get("/attendance/calendar-masters");
  return res.data;
}

export async function apiAttendanceCalendarMaster(calendarId) {
  const res = await http.get(`/attendance/calendar-masters/${calendarId}`);
  return res.data;
}

export async function apiCreateAttendanceCalendarMaster(payload) {
  const res = await http.post("/attendance/calendar-masters", payload);
  return res.data;
}

export async function apiUpdateAttendanceCalendarMaster(calendarId, payload) {
  const res = await http.put(`/attendance/calendar-masters/${calendarId}`, payload);
  return res.data;
}

export async function apiAttendanceCalendarYears(calendarId) {
  const res = await http.get(`/attendance/calendar-masters/${calendarId}/years`);
  return res.data;
}

export async function apiCreateAttendanceCalendarYear(calendarId, payload) {
  const res = await http.post(`/attendance/calendar-masters/${calendarId}/years`, payload);
  return res.data;
}

export async function apiAttendanceCalendarYearDates(calendarYearId) {
  const res = await http.get(`/attendance/calendar-years/${calendarYearId}/dates`);
  return res.data;
}

export async function apiSaveAttendanceCalendarYearDate(calendarYearId, date, payload) {
  const res = await http.put(`/attendance/calendar-years/${calendarYearId}/dates/${date}`, payload);
  return res.data;
}

export async function apiDeleteAttendanceCalendarYearDate(calendarYearId, date) {
  const res = await http.delete(`/attendance/calendar-years/${calendarYearId}/dates/${date}`);
  return res.data;
}

export async function apiPublishAttendanceCalendarYear(calendarYearId) {
  const res = await http.post(`/attendance/calendar-years/${calendarYearId}/publish`);
  return res.data;
}


export async function apiAttendanceCalendars(params = {}) {
  const res = await http.get("/attendance/calendars", {
    params: {
      year: params.year || undefined,
      status: params.status || undefined,
    },
  });

  return res.data;
}

export async function apiAttendanceCalendar(calendarId) {
  const res = await http.get(`/attendance/calendars/${calendarId}`);
  return res.data;
}

export async function apiAttendanceCalendarDates(calendarId) {
  const res = await http.get(`/attendance/calendars/${calendarId}/dates`);
  return res.data;
}

export async function apiPublishAttendanceCalendar(calendarId) {
  const res = await http.post(`/attendance/calendars/${calendarId}/publish`);
  return res.data;
}

export async function apiDeactivateAttendanceCalendar(calendarId) {
  const res = await http.post(`/attendance/calendars/${calendarId}/deactivate`);
  return res.data;
}

export async function apiDeleteAttendanceCalendar(calendarId) {
  const res = await http.delete(`/attendance/calendars/${calendarId}`);
  return res.data;
}

export async function apiSaveAttendanceCalendarDate(calendarId, date, payload) {
  const res = await http.put(`/attendance/calendars/${calendarId}/dates/${date}`, payload);
  return res.data;
}

export async function apiDeleteAttendanceCalendarDate(calendarId, date) {
  const res = await http.delete(`/attendance/calendars/${calendarId}/dates/${date}`);
  return res.data;
}

export async function apiCreateAttendanceCalendar(payload) {
  const res = await http.post("/attendance/calendars", payload);
  return res.data;
}

export async function apiUpdateAttendanceCalendar(calendarId, payload) {
  const res = await http.put(`/attendance/calendars/${calendarId}`, payload);
  return res.data;
}

export async function apiAttendanceShiftGroups(params = {}) {
  const res = await http.get("/attendance/shift-groups", {
    params: {
      status: params.status || undefined,
    },
  });

  return res.data;
}

export async function apiAttendanceShiftGroupAssignments(params = {}) {
  const res = await http.get("/attendance/shift-group-assignments", {
    params: {
      employee_id: params.employee_id || undefined,
      shift_group_id: params.shift_group_id || undefined,
    },
  });

  return res.data;
}

export async function apiAttendanceShiftGroupAssignment(assignmentId) {
  const res = await http.get(
    `/attendance/shift-group-assignments/${assignmentId}`,
  );

  return res.data;
}

export async function apiCreateAttendanceShiftGroupAssignment(payload) {
  const res = await http.post(
    "/attendance/shift-group-assignments",
    payload,
  );

  return res.data;
}

export async function apiUpdateAttendanceShiftGroupAssignment(
  assignmentId,
  payload,
) {
  const res = await http.put(
    `/attendance/shift-group-assignments/${assignmentId}`,
    payload,
  );

  return res.data;
}

export async function apiDeleteAttendanceShiftGroupAssignment(assignmentId) {
  const res = await http.delete(
    `/attendance/shift-group-assignments/${assignmentId}`,
  );

  return res.data;
}

export async function apiAttendanceShiftGroup(shiftGroupId) {
  const res = await http.get(`/attendance/shift-groups/${shiftGroupId}`);
  return res.data;
}

export async function apiCreateAttendanceShiftGroup(payload) {
  const res = await http.post("/attendance/shift-groups", payload);
  return res.data;
}

export async function apiUpdateAttendanceShiftGroup(shiftGroupId, payload) {
  const res = await http.put(`/attendance/shift-groups/${shiftGroupId}`, payload);
  return res.data;
}

export async function apiUpdateAttendanceShiftGroupStatus(shiftGroupId, status) {
  const res = await http.put(`/attendance/shift-groups/${shiftGroupId}/status`, {
    status,
  });

  return res.data;
}

export async function apiDeleteAttendanceShiftGroup(shiftGroupId) {
  const res = await http.delete(`/attendance/shift-groups/${shiftGroupId}`);
  return res.data;
}

export async function apiAttendanceShiftGroupConfiguration(shiftGroupId) {
  const res = await http.get(`/attendance/shift-groups/${shiftGroupId}/configuration`);
  return res.data;
}

export async function apiSaveAttendanceShiftGroupConfiguration(shiftGroupId, payload) {
  const res = await http.put(`/attendance/shift-groups/${shiftGroupId}/configuration`, payload);
  return res.data;
}

export async function apiAttendanceShiftGroupFutureUpdatePreview(shiftGroupId, updateDate) {
  const res = await http.get(`/attendance/shift-groups/${shiftGroupId}/future-update-preview`, {
    params: {
      update_date: updateDate,
    },
  });

  return res.data;
}

export async function apiUpdateAttendanceShiftGroupFuture(shiftGroupId, payload) {
  const res = await http.put(`/attendance/shift-groups/${shiftGroupId}/future-update`, payload);
  return res.data;
}

export async function apiAttendanceShiftGroupShifts(shiftGroupId) {
  const res = await http.get(`/attendance/shift-groups/${shiftGroupId}/shifts`);
  return res.data;
}

export async function apiSaveAttendanceShiftGroupShifts(shiftGroupId, payload) {
  const res = await http.put(`/attendance/shift-groups/${shiftGroupId}/shifts`, payload);
  return res.data;
}

export async function apiAttendanceShifts(params = {}) {
  const res = await http.get("/attendance/shifts", {
    params: {
      status: params.status || undefined,
    },
  });

  return res.data;
}

export async function apiCreateAttendanceShift(payload) {
  const res = await http.post("/attendance/shifts", payload);
  return res.data;
}

export async function apiUpdateAttendanceShift(shiftId, payload) {
  const res = await http.put(`/attendance/shifts/${shiftId}`, payload);
  return res.data;
}

export async function apiUpdateAttendanceShiftStatus(shiftId, status) {
  const res = await http.patch(
    `/attendance/shifts/${shiftId}/status`,
    { status },
  );

  return res.data;
}

export async function apiDeleteAttendanceShift(shiftId) {
  const res = await http.delete(
    `/attendance/shifts/${shiftId}`,
  );

  return res.data;
}

export async function apiAttendanceShiftDays(shiftId) {
  const res = await http.get(`/attendance/shifts/${shiftId}/days`);
  return res.data;
}

export async function apiSaveAttendanceShiftDays(shiftId, days) {
  const res = await http.put(`/attendance/shifts/${shiftId}/days`, {
    days,
  });

  return res.data;
}

export async function apiAttendanceAdminMeta() {
  const [employeeRes, unitRes, jobRecordRes] = await Promise.all([
    http.get("/employees", {
      params: {
        page: 1,
        per_page: 100,
      },
    }),
    http.get("/org-units"),
    http.get("/employee-job-records"),
  ]);

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
    ]),
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
      const employeeId = Number(record?.employee_id || 0);

      if (!employeeId || latestJobRecordMap.has(employeeId)) {
        return;
      }

      latestJobRecordMap.set(employeeId, record);
    });

  const unitOptions = units
    .map((unit) => {
      const unitId = Number(unit?.unit_id || 0);
      const unitCode = String(unit?.unit_code || "").trim();
      const unitName = String(unit?.unit_name || "").trim();

      return {
        value: String(unitId),
        label:
          unitCode && unitName
            ? `${unitCode}/${unitName}`
            : unitName || unitCode,
      };
    })
    .filter((unit) => unit.value !== "0")
    .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"));

  const employeeOptions = employees
    .map((employee) => {
      const employeeId = Number(employee?.employee_id || 0);
      const employeeNo = String(employee?.employee_no || "").trim();
      const displayName = String(employee?.display_name || "").trim();
      const jobRecord = latestJobRecordMap.get(employeeId);
      const unitId = Number(jobRecord?.unit_id || 0);
      const unit = unitMap.get(unitId);

      return {
        value: String(employeeId),
        employee_id: employeeId,
        employee_no: employeeNo,
        display_name: displayName,
        label:
          employeeNo && displayName
            ? `${employeeNo}/${displayName}`
            : employeeNo || displayName,
        unit_id: unitId,
        unit_label:
          unit?.unit_code && unit?.unit_name
            ? `${unit.unit_code}/${unit.unit_name}`
            : unit?.unit_name || unit?.unit_code || "",
      };
    })
    .filter((employee) => employee.employee_id > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"));

  return {
    unitOptions,
    employeeOptions,
  };
}

/**
 * =========================
 * Attendance Record (Frontend)
 * =========================
 */

export async function apiAttendanceAdminRecords(params = {}) {
  const { employee_id, date_from, date_to } = params;

  const res = await http.get("/attendance-records", {
    params: {
      employee_id: employee_id || undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
    },
  });

  return res.data;
}

export async function apiSyncAttendanceAdminRecords(params = {}) {
  const { employee_id, date_from, date_to } = params;

  const res = await http.post("/attendance-records", {
    employee_id: Number(employee_id || 0),
    date_from,
    date_to,
  });

  return res.data;
}

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
 * Attendance Rules
 * =========================
 */

export async function apiAttendanceRules(params = {}) {
  const res = await http.get("/attendance/rules", {
    params: {
      rule_type: params.rule_type || undefined,
      status: params.status || undefined,
    },
  });

  return res.data;
}

export async function apiCreateAttendanceRule(payload) {
  const res = await http.post("/attendance/rules", payload);
  return res.data;
}

export async function apiUpdateAttendanceRule(attendanceRuleId, payload) {
  const res = await http.put(`/attendance/rules/${attendanceRuleId}`, payload);
  return res.data;
}

export async function apiDeleteAttendanceRule(attendanceRuleId) {
  const res = await http.delete(`/attendance/rules/${attendanceRuleId}`);
  return res.data;
}

export async function apiAttendanceRuleRanges(attendanceRuleId) {
  const res = await http.get(`/attendance/rules/${attendanceRuleId}/ranges`);
  return res.data;
}

export async function apiSaveAttendanceRuleRanges(attendanceRuleId, ranges) {
  const res = await http.put(`/attendance/rules/${attendanceRuleId}/ranges`, {
    ranges,
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

export async function apiCreateLeaveType(payload) {
  const res = await http.post("/leave/types", payload);
  return res.data;
}

export async function apiUpdateLeaveType(leaveTypeId, payload) {
  const res = await http.put(`/leave/types/${leaveTypeId}`, payload);
  return res.data;
}

export async function apiUpdateLeaveTypeStatus(leaveTypeId, status) {
  const res = await http.patch(`/leave/types/${leaveTypeId}/status`, { status });
  return res.data;
}

export async function apiDeleteLeaveType(leaveTypeId) {
  const res = await http.delete(`/leave/types/${leaveTypeId}`);
  return res.data;
}

export async function apiLeaveRules() {
  const res = await http.get("/leave/rules");
  return res.data;
}

export async function apiCreateLeaveRule(payload) {
  const res = await http.post("/leave/rules", payload);
  return res.data;
}

export async function apiUpdateLeaveRule(leaveRuleId, payload) {
  const res = await http.put(`/leave/rules/${leaveRuleId}`, payload);
  return res.data;
}

export async function apiDeleteLeaveRule(leaveRuleId) {
  const res = await http.delete(`/leave/rules/${leaveRuleId}`);
  return res.data;
}

export async function apiLeaveRuleSettings(leaveTypeId) {
  const res = await http.get("/leave/rule-settings", {
    params: {
      leave_type_id: leaveTypeId,
    },
  });

  return res.data;
}

export async function apiSaveLeaveRuleSettings(leaveTypeId, settings) {
  const res = await http.put(`/leave/rule-settings/${leaveTypeId}`, {
    settings,
  });

  return res.data;
}

export async function apiLeaveRuleConditions(params = {}) {
  const res = await http.get("/leave/rule-conditions", {
    params: {
      leave_type_id: params.leave_type_id || undefined,
    },
  });

  return res.data;
}

export async function apiCreateLeaveRuleCondition(payload) {
  const res = await http.post("/leave/rule-conditions", payload);
  return res.data;
}

export async function apiUpdateLeaveRuleCondition(conditionId, payload) {
  const res = await http.put(`/leave/rule-conditions/${conditionId}`, payload);
  return res.data;
}

export async function apiDeleteLeaveRuleCondition(conditionId) {
  const res = await http.delete(`/leave/rule-conditions/${conditionId}`);
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
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments
    : [];

  const hasAttachments = attachments.some((file) => file instanceof File);

  if (hasAttachments) {
    const formData = new FormData();

    formData.append("employee_id", employeeId);
    formData.append("leave_type_id", payload.leave_type_id || "");
    formData.append("start_datetime", payload.start_datetime || "");
    formData.append("end_datetime", payload.end_datetime || "");
    formData.append("reason", payload.reason || "");

    if (payload.entitlement_instance_id) {
      formData.append("entitlement_instance_id", payload.entitlement_instance_id);
    }

    attachments.forEach((file) => {
      if (file instanceof File) {
        formData.append("attachments[]", file);
      }
    });

    const res = await http.post("/leave-requests", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  }

  const requestPayload = {
    employee_id: employeeId,
    leave_type_id: payload.leave_type_id,
    start_datetime: payload.start_datetime,
    end_datetime: payload.end_datetime,
    reason: payload.reason,
  };

  if (payload.entitlement_instance_id) {
    requestPayload.entitlement_instance_id = payload.entitlement_instance_id;
  }

  const res = await http.post("/leave-requests", requestPayload);

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
  const { employee_id, leave_type_id, use_current_employee = true } = params;
  const employeeId = use_current_employee
    ? Number(employee_id || getCurrentEmployeeId() || 0)
    : Number(employee_id || 0);

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

export async function apiApproveLeaveEntitlementRequest(entitlementRequestId) {
  const res = await http.post(`/leave-entitlement-requests/${entitlementRequestId}/approve`);
  return res.data;
}

export async function apiRejectLeaveEntitlementRequest(entitlementRequestId) {
  const res = await http.post(`/leave-entitlement-requests/${entitlementRequestId}/reject`);
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
 * Schedule Rules
 * =========================
 */

export async function apiAttendanceScheduleRules() {
  const res = await http.get("/attendance/schedule-rules");
  return res.data;
}

export async function apiUpdateAttendanceScheduleRule(scheduleRuleId, payload = {}) {
  const res = await http.put(`/attendance/schedule-rules/${scheduleRuleId}`, payload);
  return res.data;
}

export async function apiAttendanceSelfSchedulingMeta() {
  const res = await http.get("/attendance/self-scheduling/meta");
  return res.data;
}

export async function apiSaveAttendanceSelfSchedule(payload = {}) {
  const res = await http.put("/attendance/self-scheduling", payload);
  return res.data;
}

export async function apiAttendanceOutingRules() {
  const res = await http.get("/attendance/outing-rules");
  return res.data;
}

export async function apiUpdateAttendanceOutingRule(ruleCode, ruleValue) {
  const res = await http.put("/attendance/outing-rules", {
    rule_code: ruleCode,
    rule_value: ruleValue,
  });

  return res.data;
}

export async function apiAttendanceUnitParameters(unitId) {
  const res = await http.get(`/attendance/unit-parameters/${unitId}`);
  return res.data;
}

export async function apiUpdateAttendanceUnitParameters(unitId, items = []) {
  const res = await http.put(`/attendance/unit-parameters/${unitId}`, {
    items,
  });

  return res.data;
}

export async function apiAttendanceUnitParameterCandidates() {
  const res = await http.get("/attendance/unit-parameters/candidates");
  return res.data;
}

export async function apiAttendanceProxyRequestMeta() {
  const res = await http.get("/attendance/proxy-request-meta");
  return res.data;
}

export async function apiAttendancePermissionSettings() {
  const res = await http.get("/attendance/permission-settings");
  return res.data;
}

export async function apiAttendancePermissionSetting(roleId) {
  const res = await http.get(`/attendance/permission-settings/${roleId}`);
  return res.data;
}

export async function apiUpdateAttendancePermissionSetting(roleId, permissionCodes = []) {
  const res = await http.put(`/attendance/permission-settings/${roleId}`, {
    permission_codes: permissionCodes,
  });

  return res.data;
}

export async function apiAttendanceApprovalSettings() {
  const res = await http.get("/attendance/approval-settings");
  return res.data;
}

export async function apiAttendanceApprovalSetting(requestType) {
  const res = await http.get(`/attendance/approval-settings/${requestType}`);
  return res.data;
}

export async function apiUpdateAttendanceApprovalSetting(requestType, steps = []) {
  const res = await http.put(`/attendance/approval-settings/${requestType}`, {
    steps,
  });

  return res.data;
}

export async function apiAttendanceBusinessTripRules() {
  const res = await http.get("/attendance/business-trip-rules");
  return res.data;
}

export async function apiUpdateAttendanceBusinessTripRule(ruleCode, ruleValue) {
  const res = await http.put("/attendance/business-trip-rules", {
    rule_code: ruleCode,
    rule_value: ruleValue,
  });

  return res.data;
}

export async function apiAttendancePunchLocations() {
  const res = await http.get("/attendance/punch-locations");
  return res.data;
}

export async function apiCreateAttendancePunchLocation(payload = {}) {
  const res = await http.post("/attendance/punch-locations", payload);
  return res.data;
}

export async function apiUpdateAttendancePunchLocation(locationId, payload = {}) {
  const res = await http.put(`/attendance/punch-locations/${locationId}`, payload);
  return res.data;
}

export async function apiDeleteAttendancePunchLocation(locationId) {
  const res = await http.delete(`/attendance/punch-locations/${locationId}`);
  return res.data;
}

export async function apiAttendancePunchIpSettings() {
  const res = await http.get("/attendance/punch-ip-settings");
  return res.data;
}

export async function apiUpdateAttendancePunchIpSettings(enabled) {
  const res = await http.put("/attendance/punch-ip-settings", {
    enabled: Boolean(enabled),
  });
  return res.data;
}

export async function apiCreateAttendancePunchIpRule(payload = {}) {
  const res = await http.post("/attendance/punch-ip-rules", payload);
  return res.data;
}

export async function apiUpdateAttendancePunchIpRule(ipRuleId, payload = {}) {
  const res = await http.put(`/attendance/punch-ip-rules/${ipRuleId}`, payload);
  return res.data;
}

export async function apiDeleteAttendancePunchIpRule(ipRuleId) {
  const res = await http.delete(`/attendance/punch-ip-rules/${ipRuleId}`);
  return res.data;
}

export async function apiAttendanceSelfSchedulingReview(params = {}) {
  const res = await http.get("/attendance/self-scheduling/review", {
    params: {
      employee_id: Number(params.employee_id || 0) || undefined,
      year: Number(params.year || 0) || undefined,
      month: Number(params.month || 0) || undefined,
    },
  });

  return res.data;
}

export async function apiPublishAttendanceSelfSchedule(payload = {}) {
  const res = await http.post("/attendance/self-scheduling/publish", {
    employee_id: Number(payload.employee_id || 0),
    year: Number(payload.year || 0),
    month: Number(payload.month || 0),
  });

  return res.data;
}

/**
 * =========================
 * Overtime
 * =========================
 */

export async function apiOvertimeRules() {
  const res = await http.get("/overtime/rules");
  return res.data;
}

export async function apiUpdateOvertimeRule(overtimeRuleId, payload = {}) {
  const res = await http.put(`/overtime/rules/${overtimeRuleId}`, payload);
  return res.data;
}

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
  const employeeId = Number(employee_id || 0);

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
