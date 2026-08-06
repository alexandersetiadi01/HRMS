import { exportPayrollReportExcel } from "./payrollReportExcel";

function formatAmount(value) {
  const normalized = Number(value);

  return Number.isFinite(normalized) ? normalized : 0;
}

function formatPayrollMonth(year, month) {
  const normalizedYear = Number(year);

  const normalizedMonth = Number(month);

  if (!normalizedYear || !normalizedMonth) {
    return "";
  }

  return `${normalizedYear}/` + String(normalizedMonth).padStart(2, "0");
}

function buildBankAccount({ bank_code, bank_branch_code, bank_account_no }) {
  return [bank_code, bank_branch_code, bank_account_no]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("-");
}

export function exportSalaryBonusPaymentRegister({
  startMonth,
  endMonth,
  report,
}) {
  const rows = Array.isArray(report?.rows) ? report.rows : [];

  const summary = report?.summary || {};

  exportPayrollReportExcel({
    reportName: "薪資／獎金發放清冊",

    fileName: `薪資／獎金發放清冊_${startMonth}_${endMonth}`,

    sheetName: "薪資獎金發放清冊",

    metadata: [
      {
        label: "起始薪資年月",

        value: startMonth,
      },
      {
        label: "結束薪資年月",

        value: endMonth,
      },
      {
        label: "資料筆數",

        value: Number(summary.record_count || 0),
      },
    ],

    columns: [
      {
        label: "薪資年月",

        field: "payroll_month",

        width: 12,

        value: (row) => formatPayrollMonth(row.payroll_year, row.payroll_month),
      },
      {
        label: "批次名稱",

        field: "run_name",

        width: 22,
      },
      {
        label: "發放類型",

        field: "run_type",

        width: 14,
      },
      {
        label: "員工編號",

        field: "employee_no",

        width: 14,
      },
      {
        label: "員工姓名",

        field: "employee_name",

        width: 16,
      },
      {
        label: "薪資銀行",

        field: "bank_name",

        width: 18,
      },
      {
        label: "銀行帳號",

        field: "bank_account_no",

        width: 26,

        value: buildBankAccount,
      },
      {
        label: "應發金額",

        field: "gross_pay",

        width: 14,

        value: (row) => formatAmount(row.gross_pay),
      },
      {
        label: "應扣金額",

        field: "total_deduction",

        width: 14,

        value: (row) => formatAmount(row.total_deduction),
      },
      {
        label: "實發金額",

        field: "net_pay",

        width: 14,

        value: (row) => formatAmount(row.net_pay),
      },
      {
        label: "銀行轉帳金額",

        field: "bank_transfer_amount",

        width: 16,

        value: (row) => formatAmount(row.bank_transfer_amount),
      },
      {
        label: "發薪日",

        field: "pay_date",

        width: 14,
      },
    ],

    rows,

    summary: [
      {
        label: "應發金額合計",

        value: formatAmount(summary.gross_pay_total),
      },
      {
        label: "應扣金額合計",

        value: formatAmount(summary.total_deduction_total),
      },
      {
        label: "實發金額合計",

        value: formatAmount(summary.net_pay_total),
      },
      {
        label: "銀行轉帳金額合計",

        value: formatAmount(summary.bank_transfer_total),
      },
    ],
  });
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10).replaceAll("-", "/");
}

function formatPercentage(value) {
  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    return "";
  }

  return normalized;
}

function getInsuranceValue(record, field) {
  if (!record) {
    return "";
  }

  return record?.[field] ?? "";
}

function getInsuranceAmount(record) {
  if (!record) {
    return "";
  }

  return formatAmount(record.insured_salary);
}

export function exportMonthlyInsuranceStatusReport({ report }) {
  const rows = Array.isArray(report?.rows) ? report.rows : [];

  const summary = report?.summary || {};

  const reportMonth = String(report?.report_month || "").trim();

  exportPayrollReportExcel({
    reportName: "每月各式保險投保狀況",

    fileName: `每月各式保險投保狀況_${reportMonth || "未指定月份"}`,

    sheetName: "每月各式保險投保狀況",

    metadata: [
      {
        label: "報表月份",

        value: reportMonth,
      },
      {
        label: "報表基準日",

        value: formatDate(report?.report_date),
      },
      {
        label: "員工人數",

        value: Number(summary.employee_count || 0),
      },
      {
        label: "勞保投保中",

        value: Number(summary.labor_insured_count || 0),
      },
      {
        label: "職保投保中",

        value: Number(summary.occupational_insured_count || 0),
      },
      {
        label: "健保投保中",

        value: Number(summary.health_insured_count || 0),
      },
      {
        label: "勞退提繳中",

        value: Number(summary.pension_contributing_count || 0),
      },
    ],

    columns: [
      {
        label: "員工編號",

        field: "employee_no",

        width: 14,
      },
      {
        label: "員工姓名",

        field: "employee_name",

        width: 16,
      },

      {
        label: "勞保狀態",

        field: "labor_status",

        width: 12,

        value: (row) => getInsuranceValue(row.labor, "status"),
      },
      {
        label: "勞保異動類型",

        field: "labor_action_type",

        width: 14,

        value: (row) => getInsuranceValue(row.labor, "action_type"),
      },
      {
        label: "勞保生效日期",

        field: "labor_effective_date",

        width: 14,

        value: (row) =>
          formatDate(getInsuranceValue(row.labor, "effective_date")),
      },
      {
        label: "勞保投保單位",

        field: "labor_insurance_unit_name",

        width: 20,

        value: (row) => getInsuranceValue(row.labor, "insurance_unit_name"),
      },
      {
        label: "勞保投保身分",

        field: "labor_insurance_identity_name",

        width: 18,

        value: (row) => getInsuranceValue(row.labor, "insurance_identity_name"),
      },
      {
        label: "勞保投保薪資",

        field: "labor_insured_salary",

        width: 14,

        value: (row) => getInsuranceAmount(row.labor),
      },

      {
        label: "職保狀態",

        field: "occupational_status",

        width: 12,

        value: (row) => getInsuranceValue(row.occupational, "status"),
      },
      {
        label: "職保異動類型",

        field: "occupational_action_type",

        width: 14,

        value: (row) => getInsuranceValue(row.occupational, "action_type"),
      },
      {
        label: "職保生效日期",

        field: "occupational_effective_date",

        width: 14,

        value: (row) =>
          formatDate(getInsuranceValue(row.occupational, "effective_date")),
      },
      {
        label: "職保投保單位",

        field: "occupational_insurance_unit_name",

        width: 20,

        value: (row) =>
          getInsuranceValue(row.occupational, "insurance_unit_name"),
      },
      {
        label: "職保投保身分",

        field: "occupational_insurance_identity_name",

        width: 18,

        value: (row) =>
          getInsuranceValue(row.occupational, "insurance_identity_name"),
      },
      {
        label: "職保投保薪資",

        field: "occupational_insured_salary",

        width: 14,

        value: (row) => getInsuranceAmount(row.occupational),
      },

      {
        label: "健保狀態",

        field: "health_status",

        width: 12,

        value: (row) => getInsuranceValue(row.health, "status"),
      },
      {
        label: "健保異動類型",

        field: "health_action_type",

        width: 14,

        value: (row) => getInsuranceValue(row.health, "action_type"),
      },
      {
        label: "健保生效日期",

        field: "health_effective_date",

        width: 14,

        value: (row) =>
          formatDate(getInsuranceValue(row.health, "effective_date")),
      },
      {
        label: "健保投保單位",

        field: "health_insurance_unit_name",

        width: 20,

        value: (row) => getInsuranceValue(row.health, "insurance_unit_name"),
      },
      {
        label: "健保投保身分",

        field: "health_insurance_identity_name",

        width: 18,

        value: (row) =>
          getInsuranceValue(row.health, "insurance_identity_name"),
      },
      {
        label: "健保投保薪資",

        field: "health_insured_salary",

        width: 14,

        value: (row) => getInsuranceAmount(row.health),
      },

      {
        label: "勞退狀態",

        field: "pension_status",

        width: 12,

        value: (row) => getInsuranceValue(row.pension, "status"),
      },
      {
        label: "勞退異動類型",

        field: "pension_action_type",

        width: 14,

        value: (row) => getInsuranceValue(row.pension, "action_type"),
      },
      {
        label: "勞退生效日期",

        field: "pension_effective_date",

        width: 14,

        value: (row) =>
          formatDate(getInsuranceValue(row.pension, "effective_date")),
      },
      {
        label: "勞退提繳單位",

        field: "pension_insurance_unit_name",

        width: 20,

        value: (row) => getInsuranceValue(row.pension, "insurance_unit_name"),
      },
      {
        label: "勞退類型",

        field: "pension_type",

        width: 14,

        value: (row) => getInsuranceValue(row.pension, "pension_type"),
      },
      {
        label: "勞退提繳工資",

        field: "pension_insured_salary",

        width: 14,

        value: (row) => getInsuranceAmount(row.pension),
      },
      {
        label: "雇主提繳率",

        field: "employer_contribution_rate",

        width: 14,

        value: (row) =>
          formatPercentage(
            getInsuranceValue(row.pension, "employer_contribution_rate"),
          ),
      },
      {
        label: "員工自提率",

        field: "employee_contribution_rate",

        width: 14,

        value: (row) =>
          formatPercentage(
            getInsuranceValue(row.pension, "employee_contribution_rate"),
          ),
      },
    ],

    rows,

    summary: [
      {
        label: "員工人數",

        value: Number(summary.employee_count || 0),
      },
      {
        label: "勞保投保中人數",

        value: Number(summary.labor_insured_count || 0),
      },
      {
        label: "職保投保中人數",

        value: Number(summary.occupational_insured_count || 0),
      },
      {
        label: "健保投保中人數",

        value: Number(summary.health_insured_count || 0),
      },
      {
        label: "勞退提繳中人數",

        value: Number(summary.pension_contributing_count || 0),
      },
    ],
  });
}

export function exportMonthlyWithholdingTaxReport({ report }) {
  const rows = Array.isArray(report?.rows) ? report.rows : [];

  const summary = report?.summary || {};

  const reportMonth = String(report?.report_month || "").trim();

  const declarationUnit = report?.tax_declaration_unit || {};

  exportPayrollReportExcel({
    reportName: "每月薪資所得扣繳稅額",

    fileName:
      `每月薪資所得扣繳稅額_${reportMonth || "未指定月份"}_` +
      `${declarationUnit.declaration_unit_name || "未指定申報單位"}`,

    sheetName: "每月薪資所得扣繳稅額",

    metadata: [
      {
        label: "所得年月",
        value: reportMonth,
      },
      {
        label: "申報單位",
        value: declarationUnit.declaration_unit_name || "",
      },
      {
        label: "統一編號",
        value: declarationUnit.business_registration_no || "",
      },
      {
        label: "扣繳單位編號",
        value: declarationUnit.withholding_tax_unit_no || "",
      },
      {
        label: "資料筆數",
        value: Number(summary.record_count || 0),
      },
      {
        label: "員工人數",
        value: Number(summary.employee_count || 0),
      },
    ],

    columns: [
      {
        label: "所得年月",
        field: "income_month",
        width: 12,
        value: (row) => formatPayrollMonth(row.income_year, row.income_month),
      },
      {
        label: "員工編號",
        field: "employee_no",
        width: 14,
      },
      {
        label: "員工姓名",
        field: "employee_name",
        width: 16,
      },
      {
        label: "薪資批次",
        field: "run_name",
        width: 22,
      },
      {
        label: "發放類型",
        field: "run_type",
        width: 14,
      },
      {
        label: "所得格式",
        field: "income_format",
        width: 18,
      },
      {
        label: "納稅義務人類型",
        field: "taxpayer_type",
        width: 18,
      },
      {
        label: "居住狀態",
        field: "residency_status",
        width: 14,
      },
      {
        label: "扣繳方式",
        field: "withholding_method",
        width: 18,
      },
      {
        label: "所得金額",
        field: "taxable_amount",
        width: 14,
        value: (row) => formatAmount(row.taxable_amount),
      },
      {
        label: "扣繳稅額",
        field: "withholding_tax",
        width: 14,
        value: (row) => formatAmount(row.withholding_tax),
      },
      {
        label: "給付日期",
        field: "pay_date",
        width: 14,
        value: (row) => formatDate(row.pay_date),
      },
      {
        label: "扣繳結果狀態",
        field: "status",
        width: 16,
      },
    ],

    rows,

    summary: [
      {
        label: "所得金額合計",
        value: formatAmount(summary.taxable_amount_total),
      },
      {
        label: "扣繳稅額合計",
        value: formatAmount(summary.withholding_tax_total),
      },
    ],
  });
}
