import http from "./http";

export async function apiClockIn(payload) {
  const res = await http.post("/clock-in", payload);
  return res.data;
}

export async function apiClockOut(payload) {
  const res = await http.post("/clock-out", payload);
  return res.data;
}

export async function apiTodayStatus() {
  const res = await http.get("/today-status");
  return res.data;
}

/**
 * =========================
 * NEW: Attendance Record (Frontend)
 * =========================
 */

export async function apiAttendanceRecords(params = {}) {
  const {
    date_from,
    date_to,
    record_type,
    location,
    method,
  } = params;

  const res = await http.get("/attendance/frontend-records", {
    params: {
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
 * NEW: Attendance Schedule (Calendar)
 * =========================
 */

export async function apiAttendanceScheduleMonth(params = {}) {
  const { year, month } = params;

  const res = await http.get("/attendance/frontend-schedule-month", {
    params: {
      year,
      month,
    },
  });

  return res.data;
}