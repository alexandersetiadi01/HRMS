export const payrollList = [
  {
    id: "2026-02-payroll",
    title: "2026/02 薪資單",
    depositDate: "2026/03/05",
    year: "2026",
    periodName: "2026/02 薪資單",
    department: "品牌部",
    employeeCodeName: "25002/許明城",
    payrollAccount: "252200273511",
    earnings: [
      { label: "本薪", amount: 35000 },
      { label: "全勤獎金", amount: 1000 },
    ],
    deductions: [
      { label: "請假扣款", amount: 3600 },
      { label: "健保費-個人", amount: 516 },
      { label: "勞保費-個人", amount: 766 },
      { label: "所得稅", amount: 1944 },
    ],
    summary: {
      actualPaid: 29174,
      taxableTotal: 32400,
      yearlyTaxableTotal: 77696,
    },
    noteLines: [
      "親愛的同仁您好：",
      "115年02月薪資預定於【115年3月5日】匯入您指定之薪資帳戶，請查收。",
      "如對薪資明細或金額有任何疑問，請於【3月10日前】與分機19聯繫，將協助您確認。",
      "感謝您一直以來的辛勞與付出。",
      "敬祝 工作順利",
    ],
    leaveBalanceRows: [
      {
        leaveType: "特休",
        available: "24 時 0 分",
        used: "24 時 0 分",
        remaining: "0 時 0 分",
      },
    ],
    leaveBalanceNote: "以上資料為截至03/02為止的統計結果，請至剩餘假別查看即時資訊",
  },
  {
    id: "2026-bonus-notice",
    title: "2026 114年度年終獎金發放通知",
    depositDate: "2026/02/12",
    year: "2026",
    periodName: "2026 114年度年終獎金發放通知",
    department: "品牌部",
    employeeCodeName: "25002/許明城",
    payrollAccount: "252200273511",
    earnings: [{ label: "年終獎金", amount: 42000 }],
    deductions: [{ label: "所得稅", amount: 2100 }],
    summary: {
      actualPaid: 39900,
      taxableTotal: 42000,
      yearlyTaxableTotal: 45596,
    },
    noteLines: [
      "親愛的同仁您好：",
      "114年度年終獎金已於【115年2月12日】匯入您指定之薪資帳戶，請查收。",
      "如有任何疑問，請與分機19聯繫。",
      "感謝您一年來的努力與付出。",
      "敬祝 新年快樂",
    ],
    leaveBalanceRows: [
      {
        leaveType: "特休",
        available: "16 時 0 分",
        used: "8 時 0 分",
        remaining: "8 時 0 分",
      },
    ],
    leaveBalanceNote: "以上資料為截至02/12為止的統計結果，請至剩餘假別查看即時資訊",
  },
  {
    id: "2026-01-payroll",
    title: "2026/01 薪資單",
    depositDate: "2026/02/05",
    year: "2026",
    periodName: "2026/01 薪資單",
    department: "品牌部",
    employeeCodeName: "25002/許明城",
    payrollAccount: "252200273511",
    earnings: [
      { label: "本薪", amount: 35000 },
      { label: "全勤獎金", amount: 1000 },
    ],
    deductions: [
      { label: "健保費-個人", amount: 516 },
      { label: "勞保費-個人", amount: 766 },
      { label: "所得稅", amount: 1318 },
    ],
    summary: {
      actualPaid: 32400,
      taxableTotal: 32400,
      yearlyTaxableTotal: 32400,
    },
    noteLines: [
      "親愛的同仁您好：",
      "115年01月薪資已於【115年2月5日】匯入您指定之薪資帳戶，請查收。",
      "如對薪資內容有疑問，請與分機19聯繫。",
      "感謝您的辛勞與付出。",
      "敬祝 工作順利",
    ],
    leaveBalanceRows: [
      {
        leaveType: "特休",
        available: "24 時 0 分",
        used: "16 時 0 分",
        remaining: "8 時 0 分",
      },
    ],
    leaveBalanceNote: "以上資料為截至02/03為止的統計結果，請至剩餘假別查看即時資訊",
  },
];

export function getPayrollById(id) {
  return payrollList.find((item) => item.id === id);
}

export function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US");
}