export const PAYROLL_NAVIGATION = [
  {
    id: "settings",
    label: "設定",
    items: [
      {
        id: "ranges",
        label: "薪資範圍",
        path: "/attendance/admin/payroll/settings/ranges",
        implemented: true,
      },
      {
        id: "periods",
        label: "計薪週期維護",
        path: "/attendance/admin/payroll/settings/periods",
        implemented: true,
      },
      {
        id: "items",
        label: "薪資科目",
        path: "/attendance/admin/payroll/settings/items",
        implemented: true,
      },
      {
        id: "overtime-tax",
        label: "加班費所得稅類型",
        path: "/attendance/admin/payroll/settings/overtime-tax",
        implemented: true,
      },
      {
        id: "hourly-formula",
        label: "時薪計算公式",
        path: "/attendance/admin/payroll/settings/hourly-formula",
        implemented: true,
      },
      {
        id: "banks",
        label: "薪資帳戶銀行",
        path: "/attendance/admin/payroll/settings/banks",
        implemented: true,
      },
      {
        id: "insurance-units",
        label: "投保單位",
        path: "/attendance/admin/payroll/settings/insurance-units",
        implemented: true,
      },
      {
        id: "insurance-grades",
        label: "投保金額分級表",
        path: "/attendance/admin/payroll/settings/insurance-grades",
        implemented: true,  
      },
      {
        id: "insurance-rates",
        label: "保險費率",
        path: "/attendance/admin/payroll/settings/insurance-rates",
        implemented: true,
      },
      {
        id: "insurance-identities",
        label: "投保身分",
        path: "/attendance/admin/payroll/settings/insurance-identities",
        implemented: true,
      },
      {   
        id: "tax-units",
        label: "所得稅申報單位",
        path: "/attendance/admin/payroll/settings/tax-units",
        implemented: true,
      },
      {
        id: "tax-parameters",
        label: "所得稅參數",
        path: "/attendance/admin/payroll/settings/tax-parameters",
        implemented: true,
      },
      {
        id: "permissions",
        label: "權限設定",
        path: "/attendance/admin/payroll/settings/permissions",
        implemented: true,
      },
    ],
  },
  {
    id: "employee-data",
    label: "薪資保險資料",
    items: [
      {
        id: "employee-settings",
        label: "員工薪資保險資料",
        path: "/attendance/admin/payroll/employee-data/settings",
        implemented: true,
      },
      {
        id: "bulk-adjustment",
        label: "批次薪資調整",
        path: "/attendance/admin/payroll/employee-data/bulk-adjustment",
        implemented: true,
      },
      {
        id: "adjustment-history",
        label: "薪資異動紀錄",
        path: "/attendance/admin/payroll/employee-data/adjustment-history",
        implemented: true,
      },
    ],
  },
  {
    id: "operations",
    label: "薪資／獎金作業",
    items: [
      {
        id: "salary",
        label: "薪資作業",
        path: "/attendance/admin/payroll/operations/salary",
        implemented: true,
      },
      {
        id: "bonus",
        label: "獎金作業",
        path: "/attendance/admin/payroll/operations/bonus",
      },
      {
        id: "supplementary",
        label: "補發作業",
        path: "/attendance/admin/payroll/operations/supplementary",
      },
      {
        id: "history",
        label: "查詢／列印薪資",
        path: "/attendance/admin/payroll/operations/history",
      },
    ],
  },
  {
    id: "tasks",
    label: "待辦作業",
    items: [
      {
        id: "insurance-reconciliation",
        label: "核對保費差額",
        path: "/attendance/admin/payroll/tasks/insurance-reconciliation",
      },
      {
        id: "insured-salary-adjustment",
        label: "投保薪資調整",
        path: "/attendance/admin/payroll/tasks/insured-salary-adjustment",
      },
      {
        id: "termination-payroll",
        label: "離職薪資結算",
        path: "/attendance/admin/payroll/tasks/termination-payroll",
      },
    ],
  },
  {
    id: "tax",
    label: "所得稅／補充保費",
    items: [
      {
        id: "non-employee-income",
        label: "非員工所得",
        path: "/attendance/admin/payroll/tax/non-employee-income",
      },
      {
        id: "withholding",
        label: "扣繳作業",
        path: "/attendance/admin/payroll/tax/withholding",
      },
      {
        id: "declarations",
        label: "所得稅申報",
        path: "/attendance/admin/payroll/tax/declarations",
      },
      {
        id: "supplementary-premium",
        label: "補充保費作業",
        path: "/attendance/admin/payroll/tax/supplementary-premium",
      },
    ],
  },
  {
    id: "reports",
    label: "報表中心",
    items: [
      {
        id: "report-center",
        label: "薪資報表中心",
        path: "/attendance/admin/payroll/reports",
      },
    ],
  },
  {
    id: "payslips",
    label: "薪資單查詢",
    items: [
      {
        id: "payslip-search",
        label: "員工薪資單查詢",
        path: "/attendance/admin/payroll/payslips",
      },
    ],
  },
];

export function findPayrollNavigationItem(pathname) {
  for (const section of PAYROLL_NAVIGATION) {
    const item = section.items.find((candidate) => candidate.path === pathname);

    if (item) {
      return { section, item };
    }
  }

  return null;
}
