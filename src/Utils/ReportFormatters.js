export function getReportErrorMessage(
  error,
  fallback,
) {
  return (
    error?.response?.data
      ?.message
    || error?.response?.data
      ?.data?.message
    || error?.message
    || fallback
  );
}

export function formatReportAmount(
  value,
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0";
  }

  return new Intl.NumberFormat(
    "zh-TW",
    {
      maximumFractionDigits:
        2,
    },
  ).format(number);
}

export function formatReportDate(
  value,
) {
  if (!value) {
    return "--";
  }

  return String(value)
    .slice(0, 10)
    .replaceAll("-", "/");
}

export function formatPayrollMonth(
  year,
  month,
) {
  if (
    !year
    || !month
  ) {
    return "--";
  }

  return (
    `${year}/`
    + String(month).padStart(
      2,
      "0",
    )
  );
}

export function buildSalaryBankAccount(
  row,
) {
  const parts = [
    row?.bank_code,
    row?.bank_branch_code,
    row?.bank_account_no,
  ]
    .map(
      (value) =>
        String(
          value || "",
        ).trim(),
    )
    .filter(Boolean);

  return (
    parts.join("-")
    || "--"
  );
}

export function getInsuranceStatusColor(
  status,
) {
  if (
    status === "投保中"
    || status === "提繳中"
  ) {
    return "success";
  }

  return "default";
}

export function formatReportPercentage(
  value,
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "--";
  }

  return (
    `${formatReportAmount(
      number,
    )}%`
  );
}

export function validateSalaryMonthRange({
  startMonth,
  endMonth,
}) {
  if (
    !startMonth
    || !endMonth
  ) {
    return "請選擇起始與結束薪資年月。";
  }

  if (
    startMonth
    > endMonth
  ) {
    return "起始薪資年月不可晚於結束薪資年月。";
  }

  return "";
}

export function validateInsuranceReportMonth({
  year,
  month,
}) {
  const normalizedYear =
    Number(year);

  const normalizedMonth =
    Number(month);

  if (
    !Number.isInteger(
      normalizedYear,
    )
    || normalizedYear < 1900
    || normalizedYear > 9999
  ) {
    return "請輸入正確的年度。";
  }

  if (
    !Number.isInteger(
      normalizedMonth,
    )
    || normalizedMonth < 1
    || normalizedMonth > 12
  ) {
    return "請選擇正確的月份。";
  }

  return "";
}