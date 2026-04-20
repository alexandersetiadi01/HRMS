import dayjs from "dayjs";

export function safeText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text !== "" ? text : fallback;
}

export function getTaiwanTodayDayjs() {
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

  return dayjs(`${year}-${month}-${day}`);
}

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function buildDateTimeString(dateValue, hour, minute) {
  if (!dateValue) {
    return "";
  }

  const date =
    typeof dateValue === "string"
      ? dateValue
      : dayjs(dateValue).isValid()
        ? dayjs(dateValue).format("YYYY-MM-DD")
        : "";

  if (!date) {
    return "";
  }

  return `${date} ${pad2(hour)}:${pad2(minute)}:00`;
}

export function formatDuration(minutes) {
  const totalMinutes = Number(minutes || 0);

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "0 時 0 分";
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return `${hours} 時 ${mins} 分`;
}

export function formatHoursText(hoursValue) {
  const hours = Number(hoursValue || 0);

  if (!Number.isFinite(hours) || hours <= 0) {
    return "0 小時";
  }

  const minutes = Math.round(hours * 60);
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;

  if (mm === 0) {
    return `${hh} 小時`;
  }

  return `${hh} 小時 ${mm} 分`;
}

export function normalizeScheduleMonthDays(payload) {
  const data = payload?.data?.data || payload?.data || payload || {};
  const days = Array.isArray(data?.days) ? data.days : [];

  return days.map((item) => ({
    ...item,
    work_date: safeText(item?.work_date, ""),
    day_type: safeText(item?.day_type, ""),
    schedule_id: Number(item?.schedule_id || 0),
    shift_id: Number(item?.shift_id || 0),
    break_minutes: Number(item?.break_minutes || 0),
  }));
}

export function getSelectableOvertimeDateSet(days = []) {
  const allowed = new Set();

  days.forEach((day) => {
    const dateKey = safeText(day?.work_date, "");
    const dayType = safeText(day?.day_type, "").toLowerCase();
    const scheduleId = Number(day?.schedule_id || 0);
    const shiftId = Number(day?.shift_id || 0);

    const isWorkingDay = ["normal", "support", "trip"].includes(dayType);
    const hasShift = scheduleId > 0 || shiftId > 0;

    if (dateKey && hasShift && isWorkingDay) {
      allowed.add(dateKey);
    }
  });

  return allowed;
}

export function findScheduleDay(days = [], workDate) {
  return (
    days.find((item) => String(item?.work_date || "") === String(workDate || "")) ||
    null
  );
}

export function getTimeTextFromDateTime(value) {
  const text = safeText(value, "");
  if (!text) {
    return "";
  }

  const date = dayjs(text);
  if (date.isValid()) {
    return date.format("HH:mm");
  }

  if (text.length >= 16) {
    return text.slice(11, 16);
  }

  return "";
}

export function getDateKey(dateValue) {
  if (!dateValue || !dayjs(dateValue).isValid()) {
    return "";
  }

  return dayjs(dateValue).format("YYYY-MM-DD");
}

export function getScheduleStartDateTime(selectedDay) {
  const workDate = safeText(selectedDay?.work_date, "");
  const expectedStart = safeText(selectedDay?.expected_start, "");

  if (!workDate || !expectedStart) {
    return null;
  }

  const date = dayjs(expectedStart);
  if (date.isValid()) {
    return date;
  }

  return dayjs(`${workDate} ${expectedStart}`);
}

export function getScheduleEndDateTime(selectedDay, selectedMeta) {
  const workDate = safeText(selectedDay?.work_date, "");
  const expectedEnd = safeText(selectedDay?.expected_end, "");
  const shiftEndDateTime = safeText(selectedMeta?.shift_end_datetime, "");

  if (shiftEndDateTime) {
    const dt = dayjs(shiftEndDateTime);
    if (dt.isValid()) {
      return dt;
    }
  }

  if (!workDate || !expectedEnd) {
    return null;
  }

  const date = dayjs(expectedEnd);
  if (date.isValid()) {
    return date;
  }

  return dayjs(`${workDate} ${expectedEnd}`);
}

export function getShiftEndDefaultTime(selectedDay, selectedMeta) {
  const shiftEnd = getScheduleEndDateTime(selectedDay, selectedMeta);

  if (!shiftEnd || !shiftEnd.isValid()) {
    return {
      hour: "18",
      minute: "00",
    };
  }

  return {
    hour: shiftEnd.format("HH"),
    minute: shiftEnd.format("mm"),
  };
}

export function addMinutesToTime(hour, minute, plusMinutes = 30) {
  const base = dayjs(`2000-01-01 ${pad2(hour)}:${pad2(minute)}:00`);
  const next = base.add(Number(plusMinutes || 0), "minute");

  return {
    hour: next.format("HH"),
    minute: next.format("mm"),
  };
}

export function getOvertimeEndDefaultTime(selectedDay, selectedMeta) {
  const shiftEndDefault = getShiftEndDefaultTime(selectedDay, selectedMeta);
  return addMinutesToTime(shiftEndDefault.hour, shiftEndDefault.minute, 30);
}

export function formatClockRecordText(selectedDay, selectedMeta, workDate, endHour, endMin) {
  if (!selectedDay || !workDate) {
    return "打卡紀錄：-";
  }

  const shiftStart = getScheduleStartDateTime(selectedDay);
  const overtimeEnd = dayjs(buildDateTimeString(workDate, endHour, endMin));

  const shiftStartText =
    shiftStart && shiftStart.isValid() ? shiftStart.format("HH:mm") : "-";

  const endText =
    overtimeEnd && overtimeEnd.isValid() ? overtimeEnd.format("HH:mm") : "-";

  return `打卡紀錄：${dayjs(workDate).format("YYYY/MM/DD")} 上班 ${shiftStartText} ~ 下班 ${endText}`;
}

export function calculateOvertimeSummary({
  workDate,
  startHour,
  startMin,
  endHour,
  endMin,
  selectedDay,
  selectedMeta,
}) {
  if (!workDate) {
    return {
      totalMinutes: 0,
      breakMinutes: 0,
      appliedMinutes: 0,
      overtimeMinutes: 0,
    };
  }

  const startDateTime = dayjs(buildDateTimeString(workDate, startHour, startMin));
  const endDateTime = dayjs(buildDateTimeString(workDate, endHour, endMin));
  const shiftStart = getScheduleStartDateTime(selectedDay);

  if (!startDateTime.isValid() || !endDateTime.isValid()) {
    return {
      totalMinutes: 0,
      breakMinutes: Number(selectedDay?.break_minutes || 0),
      appliedMinutes: 0,
      overtimeMinutes: 0,
    };
  }

  const overtimeMinutes =
    endDateTime.valueOf() > startDateTime.valueOf()
      ? endDateTime.diff(startDateTime, "minute")
      : 0;

  const breakMinutes = Number(selectedDay?.break_minutes || 0);

  let totalMinutes = overtimeMinutes;
  if (shiftStart && shiftStart.isValid() && endDateTime.valueOf() > shiftStart.valueOf()) {
    totalMinutes = endDateTime.diff(shiftStart, "minute");
  }

  if (totalMinutes < 0) {
    totalMinutes = 0;
  }

  let appliedMinutes = totalMinutes - breakMinutes;
  if (appliedMinutes < 0) {
    appliedMinutes = 0;
  }

  return {
    totalMinutes: overtimeMinutes,
    breakMinutes,
    appliedMinutes,
    overtimeMinutes,
  };
}