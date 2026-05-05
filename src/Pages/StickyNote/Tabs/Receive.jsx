import { Box, Button, Chip, Typography } from "@mui/material";

function getStatusColor(status) {
  if (status === "未讀") return "error";
  if (status === "已讀") return "default";
  return "default";
}

export default function Receive({
  rows = [],
  loading = false,
  onMarkRead,
  onDelete,
}) {
  if (loading) {
    return <Typography sx={{ fontSize: "14px" }}>讀取中...</Typography>;
  }

  if (!rows.length) {
    return <Typography sx={{ fontSize: "14px" }}>沒有資料</Typography>;
  }

  return (
    <Box>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>寄件人</th>
            <th>內容</th>
            <th>狀態</th>
            <th>發送時間</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const sender =
              `${row.sender_employee_no || ""} ${row.sender_display_name || ""}`.trim() ||
              "-";

            return (
              <tr key={index}>
                <td>{row.sticky_note_id}</td>

                <td>{sender}</td>

                <td style={{ maxWidth: "300px", wordBreak: "break-word" }}>
                  {row.content || "-"}
                </td>

                <td>
                  <Chip
                    label={row.status || "-"}
                    color={getStatusColor(row.status)}
                    size="small"
                  />
                </td>

                <td>{row.note_created_at || "-"}</td>

                <td>
                  <Box sx={{ display: "flex", gap: "6px" }}>
                    {row.status === "未讀" && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onMarkRead(row)}
                      >
                        標記已讀
                      </Button>
                    )}

                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => onDelete(row)}
                    >
                      刪除
                    </Button>
                  </Box>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
}