import { Box } from "@mui/material";

export function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

export function formatDate(value) {
  if (!value) return "-";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd}`;
}

export function getStatusColor(value) {
  switch (value) {
    case "未開始":
    case "待處理":
      return "#b8b8b8";

    case "已開始":
    case "進行中":
      return "#2563eb";

    case "已完成":
    case "準時":
      return "#16a34a";

    case "已結束":
      return "#111827";

    case "已取消":
      return "#9ca3af";

    case "已逾期":
    case "逾期":
      return "#dc2626";

    default:
      return "#b8b8b8";
  }
}

export function StatusPill({ value }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "52px",
        height: "18px",
        px: "8px",
        borderRadius: "2px",
        bgcolor: getStatusColor(value),
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {value || "-"}
    </Box>
  );
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function downloadExcelFile(filename, rows) {
  const headers = [
    "指派者",
    "指派給",
    "交辦日期",
    "期限",
    "案件狀態",
    "說明",
    "回報紀錄",
  ];

  const htmlRows = rows.map((row) => {
    const values = [
      row.assigner || "-",
      row.handoverTarget || "-",
      formatDateTime(row.created_at),
      row.deadline || "-",
      row.status || "-",
      row.description || "-",
      row.replyText || "-",
    ];

    return `<tr>${values
      .map((value) => `<td>${escapeHtml(value)}</td>`)
      .join("")}</tr>`;
  });

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${headers
              .map((header) => `<th>${escapeHtml(header)}</th>`)
              .join("")}</tr>
          </thead>
          <tbody>${htmlRows.join("")}</tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}