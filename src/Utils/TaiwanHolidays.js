import Holidays from "date-holidays";

const hd = new Holidays("TW");
const yearCache = new Map();

const RUYUT_BASE =
  "https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data";

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

function normalizeDate(dateStr) {
  const str = String(dateStr || "").trim();

  // YYYYMMDD → YYYY-MM-DD
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }

  // already correct
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  return "";
}

function buildRuyutMap(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((acc, item) => {
    const key = normalizeDate(item?.date);
    if (!key) return acc;

    acc[key] = {
      isHoliday: Boolean(item?.isHoliday),
      description: item?.description || "",
    };

    return acc;
  }, {});
}

function buildDateHolidaysMap(year) {
  const holidays = hd.getHolidays(year) || [];

  return holidays.reduce((acc, item) => {
    if (!item?.date) return acc;

    // only public holidays
    if (item.type !== "public") return acc;

    const key = item.date.slice(0, 10);

    acc[key] = {
      isHoliday: true,
      description: item.name || "",
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

  const request = fetch(`${RUYUT_BASE}/${safeYear}.json`)
    .then(async (res) => {
      // ✅ primary source (ruyut)
      if (res.ok) {
        const json = await res.json();
        return buildRuyutMap(json);
      }

      // 🔁 fallback
      console.warn(`Ruyut data missing for ${safeYear}, using fallback`);
      return buildDateHolidaysMap(safeYear);
    })
    .catch((err) => {
      console.warn(`Fetch failed for ${safeYear}, fallback used`, err);
      return buildDateHolidaysMap(safeYear);
    });

  yearCache.set(safeYear, request);
  return request;
}