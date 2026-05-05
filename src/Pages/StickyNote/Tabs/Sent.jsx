import { Box, Button, Chip, Typography } from "@mui/material";

function getStatusColor(status) {
  if (status === "已送出") return "primary";
  return "default";
}

export default function SentTab({
  rows = [],
  loading = false,
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
            <th>內容</th>
            <th>收件人</th>
            <th>狀態</th>
            <th>發送時間</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            return (
              <tr key={index}>
                <td>{row.sticky_note_id}</td>

                <td style={{ maxWidth: "300px", wordBreak: "break-word" }}>
                  {row.content || "-"}
                </td>

                <td>{row.receiver_names || "-"}</td>

                <td>
                  <Chip
                    label={row.status || "-"}
                    color={getStatusColor(row.status)}
                    size="small"
                  />
                </td>

                <td>{row.created_at || "-"}</td>

                <td>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => onDelete(row)}
                  >
                    刪除
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
}