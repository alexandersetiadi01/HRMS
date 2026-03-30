export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

export function formatRange(year, month) {
  const start = `${year}/${pad2(month)}/01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}/${pad2(month)}/${pad2(endDate)}`;
  return `${start}-${end}`;
}

export function formatCellKey(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getTodayYearMonth() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  };
}

export function getPrevMonthYear(year, month) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

export function getNextMonthYear(year, month) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }

  return { year, month: month + 1 };
}