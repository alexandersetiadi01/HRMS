export const REPORT_IDS = {
  SALARY_BONUS_PAYMENT_REGISTER: "salary-bonus-payment-register",

  MONTHLY_INSURANCE_STATUS: "monthly-insurance-status",

  MONTHLY_WITHHOLDING_TAX: "monthly-withholding-tax",

  TAX_DEPENDENT_DETAILS: "tax-dependent-details",
};

export const APOLLO_REPORTS = [
  {
    id: REPORT_IDS.SALARY_BONUS_PAYMENT_REGISTER,

    label: "薪資／獎金發放清冊",

    description: "依薪資年月期間查詢已關帳的薪資與獎金發放資料。",

    implemented: true,
  },
  {
    id: REPORT_IDS.MONTHLY_INSURANCE_STATUS,

    label: "每月各式保險投保狀況",

    description: "依年度與月份查詢員工各式保險投保狀況。",

    implemented: true,
  },
  {
    id: REPORT_IDS.MONTHLY_WITHHOLDING_TAX,

    label: "每月薪資所得扣繳稅額",

    description: "依所得年度、月份與申報單位查詢每月扣繳稅額。",

    implemented: true,
  },
  {
    id: REPORT_IDS.TAX_DEPENDENT_DETAILS,

    label: "所得稅扶養親屬明細",

    description: "依生效基準日、員工與狀態查詢所得稅扶養親屬資料。",

    implemented: true,
  },
];

export const CURRENT_DATE = new Date();

export const CURRENT_YEAR = String(CURRENT_DATE.getFullYear());

export const CURRENT_MONTH_NUMBER = String(CURRENT_DATE.getMonth() + 1);

export const CURRENT_MONTH =
  `${CURRENT_YEAR}-` + CURRENT_MONTH_NUMBER.padStart(2, "0");

export const MONTH_OPTIONS = Array.from(
  {
    length: 12,
  },
  (_value, index) => {
    const month = index + 1;

    return {
      value: String(month),

      label: `${month} 月`,
    };
  },
);
