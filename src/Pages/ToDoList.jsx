import InternalModule from "../Components/InternalModule";

const pendingColumns = [
  {
    key: "status",
    label: "案件狀態",
    width: "120px",
    align: "center",
    withDivider: true,
    type: "statusPill",
  },
  {
    key: "title",
    label: "標題",
    width: "1fr",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "assigner",
    label: "指派者",
    width: "120px",
    align: "center",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "deadline",
    label: "期限",
    width: "200px",
    align: "center",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "selected",
    label: "選取",
    width: "80px",
    align: "center",
    type: "checkbox",
  },
];

const assignedColumns = [
  {
    key: "status",
    label: "案件狀態",
    width: "120px",
    align: "center",
    withDivider: true,
    type: "statusPill",
  },
  {
    key: "title",
    label: "標題",
    width: "1fr",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "handoverTarget",
    label: "交辦對象",
    width: "140px",
    align: "center",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "deadline",
    label: "期限",
    width: "180px",
    align: "center",
    withDivider: true,
    cellSx: { color: "#5a3c12" },
  },
  {
    key: "selected",
    label: "選取",
    width: "80px",
    align: "center",
    type: "checkbox",
  },
];

const pendingRows = [
  {
    id: 1,
    status: "結案",
    title: "工作契約、試用期間意書內容確認",
    assigner: "周欣慈",
    deadline: "2026/03/06 18:00",
    selected: false,
  },
  {
    id: 2,
    status: "結案",
    title: "114年扣繳憑單發放通知",
    assigner: "郭姿敏",
    deadline: "2026/03/10 23:59",
    selected: false,
  },
];

const assignedRows = [];

export default function TodoList() {
  return (
    <InternalModule
      title="待辦事項"
      accentColor="#677986"
      sidebarTitle="Assignment"
      defaultSidebarKey="pending"
      sidebarItems={[
        {
          key: "pending",
          label: "待辦事項",
          columns: pendingColumns,
          rows: pendingRows,
          emptyText: "查無資料",
        },
        {
          key: "assigned",
          label: "指派事項",
          columns: assignedColumns,
          rows: assignedRows,
          emptyText: "查無資料",
        },
      ]}
      actionButtons={[
        {
          label: "新增指派事項",
          minWidth: "112px",
          onClick: () => {},
        },
        {
          label: "下載勾選項目",
          minWidth: "112px",
          onClick: () => {},
        },
      ]}
    />
  );
}