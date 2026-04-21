// src/API/attendance
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
      employee_id: employeeId,
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

  const res = await http.get("/leave-types", {
    params: {
      employee_id: employeeId || undefined,
    },
  });

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
  const { employee_id, status, date_from, date_to } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/leave-requests", {
    params: {
      employee_id: employeeId || undefined,
      status,
      date_from,
      date_to,
    },
  });

  return res.data;
}

export async function apiCreateLeaveRequest(payload = {}) {
  const employeeId = Number(
    payload.employee_id || getCurrentEmployeeId() || 0,
  );

  const res = await http.post("/leave-requests", {
    employee_id: employeeId,
    leave_type_id: payload.leave_type_id,
    start_datetime: payload.start_datetime,
    end_datetime: payload.end_datetime,
    reason: payload.reason,
  });

  return res.data;
}

export async function apiLeaveBalances(params = {}) {
  const { employee_id, leave_type_id } = params;
  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

  const res = await http.get("/leave-balances", {
    params: {
      employee_id: employeeId || undefined,
      leave_type_id,
    },
  });

  return res.data;
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
  const employeeId = Number(
    payload.employee_id || getCurrentEmployeeId() || 0,
  );

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
  } = params;

  const employeeId = Number(employee_id || getCurrentEmployeeId() || 0);

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
  const employeeId = Number(
    payload.employee_id || getCurrentEmployeeId() || 0,
  );

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