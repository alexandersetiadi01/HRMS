import {
  exportPayrollReportExcel,
} from "./payrollReportExcel";

function formatAmount(value) {
  const normalized =
    Number(value);

  return Number.isFinite(
    normalized,
  )
    ? normalized
    : 0;
}

function formatPayrollMonth(
  year,
  month,
) {
  const normalizedYear =
    Number(year);

  const normalizedMonth =
    Number(month);

  if (
    !normalizedYear
    || !normalizedMonth
  ) {
    return "";
  }

  return (
    `${normalizedYear}/`
    + String(
      normalizedMonth,
    ).padStart(2, "0")
  );
}

function buildBankAccount({
  bank_code,
  bank_branch_code,
  bank_account_no,
}) {
  return [
    bank_code,
    bank_branch_code,
    bank_account_no,
  ]
    .map(
      (value) =>
        String(
          value || "",
        ).trim(),
    )
    .filter(Boolean)
    .join("-");
}

export function exportSalaryBonusPaymentRegister({
  startMonth,
  endMonth,
  report,
}) {
  const rows =
    Array.isArray(
      report?.rows,
    )
      ? report.rows
      : [];

  const summary =
    report?.summary
    || {};

  exportPayrollReportExcel({
    reportName:
      "薪資／獎金發放清冊",

    fileName:
      `薪資／獎金發放清冊_${startMonth}_${endMonth}`,

    sheetName:
      "薪資獎金發放清冊",

    metadata: [
      {
        label:
          "起始薪資年月",

        value:
          startMonth,
      },
      {
        label:
          "結束薪資年月",

        value:
          endMonth,
      },
      {
        label:
          "資料筆數",

        value:
          Number(
            summary.record_count
            || 0,
          ),
      },
    ],

    columns: [
      {
        label:
          "薪資年月",

        field:
          "payroll_month",

        width:
          12,

        value:
          (row) =>
            formatPayrollMonth(
              row.payroll_year,
              row.payroll_month,
            ),
      },
      {
        label:
          "批次名稱",

        field:
          "run_name",

        width:
          22,
      },
      {
        label:
          "發放類型",

        field:
          "run_type",

        width:
          14,
      },
      {
        label:
          "員工編號",

        field:
          "employee_no",

        width:
          14,
      },
      {
        label:
          "員工姓名",

        field:
          "employee_name",

        width:
          16,
      },
      {
        label:
          "薪資銀行",

        field:
          "bank_name",

        width:
          18,
      },
      {
        label:
          "銀行帳號",

        field:
          "bank_account_no",

        width:
          26,

        value:
          buildBankAccount,
      },
      {
        label:
          "應發金額",

        field:
          "gross_pay",

        width:
          14,

        value:
          (row) =>
            formatAmount(
              row.gross_pay,
            ),
      },
      {
        label:
          "應扣金額",

        field:
          "total_deduction",

        width:
          14,

        value:
          (row) =>
            formatAmount(
              row.total_deduction,
            ),
      },
      {
        label:
          "實發金額",

        field:
          "net_pay",

        width:
          14,

        value:
          (row) =>
            formatAmount(
              row.net_pay,
            ),
      },
      {
        label:
          "銀行轉帳金額",

        field:
          "bank_transfer_amount",

        width:
          16,

        value:
          (row) =>
            formatAmount(
              row.bank_transfer_amount,
            ),
      },
      {
        label:
          "發薪日",

        field:
          "pay_date",

        width:
          14,
      },
    ],

    rows,

    summary: [
      {
        label:
          "應發金額合計",

        value:
          formatAmount(
            summary.gross_pay_total,
          ),
      },
      {
        label:
          "應扣金額合計",

        value:
          formatAmount(
            summary.total_deduction_total,
          ),
      },
      {
        label:
          "實發金額合計",

        value:
          formatAmount(
            summary.net_pay_total,
          ),
      },
      {
        label:
          "銀行轉帳金額合計",

        value:
          formatAmount(
            summary.bank_transfer_total,
          ),
      },
    ],
  });
}