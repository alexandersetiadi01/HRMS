import InternalModule from "../Components/InternalModule";

const ongoingColumns = [
  { key: "title", label: "標題", width: "1fr", withDivider: true },
  {
    key: "initiator",
    label: "發起人",
    width: "130px",
    align: "center",
    withDivider: true,
  },
  {
    key: "deadline",
    label: "截止時間",
    width: "160px",
    align: "center",
    withDivider: true,
  },
  {
    key: "orderCount",
    label: "訂單數",
    width: "110px",
    align: "center",
    withDivider: true,
  },
  {
    key: "amount",
    label: "總金額",
    width: "80px",
    align: "center",
    withDivider: true,
  },
  {
    key: "order",
    label: "訂購",
    width: "80px",
    align: "center",
    withDivider: true,
  },
  {
    key: "manage",
    label: "管理功能",
    width: "110px",
    align: "center",
  },
];

const deadlineOrderColumns = [
  { key: "title", label: "標題", width: "1fr", withDivider: true },
  {
    key: "scheduledEndTime",
    label: "預計結案時間",
    width: "155px",
    align: "center",
    withDivider: true,
  },
  {
    key: "orderCount",
    label: "訂單數",
    width: "80px",
    align: "center",
    withDivider: true,
  },
  {
    key: "amount",
    label: "總金額",
    width: "85px",
    align: "center",
    withDivider: true,
  },
  {
    key: "unpaidOrderCount",
    label: "未付款單數",
    width: "88px",
    align: "center",
    withDivider: true,
  },
  {
    key: "unpaidAmount",
    label: "未付款金額",
    width: "95px",
    align: "center",
    withDivider: true,
  },
  {
    key: "manage",
    label: "管理功能",
    width: "120px",
    align: "center",
    type: "search",
  },
];

const deadlineOrderRows = [
  {
    id: 1,
    title: "午餐-2026/01/05",
    scheduledEndTime: "2026/01/05 17:15",
    orderCount: "5",
    amount: "865",
    unpaidOrderCount: "5",
    unpaidAmount: "865",
    manage: true,
    detailDialog: {
      dialogTitle: "訂購明細",
      title: "午餐-2026/01/05",
      body: `今日美味午餐已享用完畢 😊
此表單為試行導入訂餐系統之測試使用，
再請大家協助實際操作填寫，以利評估後續是否正式採用系統化作業，
感謝大家的配合，謝謝！`,
      shopName: "邊緣人餐盒",
      ratingText: "評價總分：(0) ☆☆☆☆☆",
      deadlineText: "截止時間：2026/01/05 16:00",
    },
  },
];

export default function OrderingSystem() {
  return (
    <InternalModule
      title="訂餐系統"
      accentColor="#29b34a"
      sidebarTitle="訂單"
      defaultSidebarKey="ongoing"
      sidebarItems={[
        {
          key: "ongoing",
          label: "進行中之訂單",
          columns: ongoingColumns,
          rows: [],
          emptyText: "查無資料",
        },
        {
          key: "deadline",
          label: "截止訂購訂單",
          columns: deadlineOrderColumns,
          rows: deadlineOrderRows,
          emptyText: "查無資料",
        },
      ]}
      actionButtons={[
        { label: "新增訂單", minWidth: "110px", onClick: () => {} },
        { label: "店家管理", minWidth: "110px", onClick: () => {} },
      ]}
      columns={ongoingColumns}
      rows={[]}
      emptyText="查無資料"
    />
  );
}