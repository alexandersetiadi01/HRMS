import InternalModule from "../Components/InternalModule";

const columns = [
  { key: "title", label: "標題", width: "1fr" },
  { key: "publisher", label: "發佈者", width: "160px" },
  { key: "publishTime", label: "發佈時間", width: "160px" },
];

export default function LatestNews() {
  return (
    <InternalModule
      title="最新消息"
      accentColor="#35b8ec"
      sidebarTitle="消息分類"
      sidebarItems={[
        {
          key: "activity",
          label: "活動訊息",
          columns,
          rows: [],
          emptyText: "查無資料",
          emptyFooterText: "顯示 - 筆，共 筆",
        },
        {
          key: "policy",
          label: "政策宣導",
          columns,
          rows: [],
          emptyText: "查無資料",
          emptyFooterText: "顯示 - 筆，共 筆",
        },
        {
          key: "admin",
          label: "行政公告",
          columns,
          rows: [],
          emptyText: "查無資料",
          emptyFooterText: "顯示 - 筆，共 筆",
        },
      ]}
      columns={columns}
      rows={[]}
      emptyText="查無資料"
      emptyFooterText="顯示 - 筆，共 筆"
    />
  );
}
