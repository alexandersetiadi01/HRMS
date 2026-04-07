import InternalModule from "../Components/InternalModule";

const inboxColumns = [
  {
    key: "status",
    label: "狀態",
    width: "90px",
    align: "center",
    withDivider: true,
    type: "statusPill",
  },
  {
    key: "content",
    label: "內容",
    width: "1fr",
    withDivider: true,
    cellSx: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  },
  {
    key: "sender",
    label: "寄件人",
    width: "120px",
    align: "center",
    withDivider: true,
  },
  {
    key: "delete",
    label: "刪除",
    width: "80px",
    align: "center",
    withDivider: true,
    type: "delete",
  },
  {
    key: "time",
    label: "時間",
    width: "160px",
    align: "center",
  },
];

const sentColumns = [
  {
    key: "content",
    label: "內容",
    width: "1fr",
    withDivider: true,
    cellSx: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
  },
  {
    key: "receiver",
    label: "收件人",
    width: "160px",
    align: "center",
    withDivider: true,
  },
  {
    key: "delete",
    label: "刪除",
    width: "80px",
    align: "center",
    withDivider: true,
    type: "delete",
  },
  {
    key: "time",
    label: "時間",
    width: "160px",
    align: "center",
  },
];

const inboxRows = [
  {
    id: 1,
    status: "已讀",
    content: "薪資調整通知 許明城 同仁您好：有鑒於您在工作上的付...",
    sender: "郭姿敏",
    delete: true,
    time: "2026/02/05 12:39",
  },
];

const sentRows = [];

export default function StickyNotes() {
  return (
    <InternalModule
      title="便利貼"
      accentColor="#f45a4d"
      sidebarTitle="NOTE"
      defaultSidebarKey="inbox"
      sidebarItems={[
        {
          key: "inbox",
          label: "收件紀錄",
          columns: inboxColumns,
          rows: inboxRows,
          emptyText: "查無資料",
        },
        {
          key: "sent",
          label: "發送紀錄",
          columns: sentColumns,
          rows: sentRows,
          emptyText: "查無資料",
        },
      ]}
      actionButtons={[
        {
          label: "新增便利貼",
          minWidth: "110px",
          onClick: () => {},
        },
      ]}
    />
  );
}