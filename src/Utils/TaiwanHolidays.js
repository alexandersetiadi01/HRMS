const TAIWAN_CALENDAR_BASE =
  "https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data";

const yearCache = new Map();

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function normalizeApiDate(dateStr) {
  const str = String(dateStr || "").trim();

  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  return "";
}

function buildHolidayMap(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((acc, item) => {
    const key = normalizeApiDate(item?.date);
    if (!key) return acc;

    acc[key] = {
      isHoliday: Boolean(item?.isHoliday),
      description: item?.description || "",
      week: item?.week || "",
    };

    return acc;
  }, {});
}

export async function fetchTaiwanCalendarYear(year) {
  const safeYear = Number(year);

  if (!Number.isInteger(safeYear)) {
    throw new Error(`Invalid year: ${year}`);
  }

  if (yearCache.has(safeYear)) {
    return yearCache.get(safeYear);
  }

  const request = fetch(`${TAIWAN_CALENDAR_BASE}/${safeYear}.json`, {
    method: "GET",
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch Taiwan calendar for ${safeYear}`);
      }

      const json = await res.json();
      return buildHolidayMap(json);
    })
    .catch((error) => {
      yearCache.delete(safeYear);
      throw error;
    });

  yearCache.set(safeYear, request);
  return request;
}

export function getTaiwanHolidayNameFromMap(date, holidayMap) {
  if (!date || !holidayMap) return "";

  const key = formatDateKey(date);
  const info = holidayMap[key];

  if (!info?.isHoliday) return "";
  return info.description || "國定假日";
}

export function isTaiwanHolidayFromMap(date, holidayMap) {
  if (!date || !holidayMap) return false;

  const key = formatDateKey(date);
  return Boolean(holidayMap[key]?.isHoliday);
}