import {
  Box,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

export default function AttendanceAbnormalTable({ rows, loading = false, onView }) {
  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <Table
        size="small"
        sx={{
          width: "100%",
          tableLayout: "fixed",
          "& .MuiTableCell-root": {
            fontSize: { xs: "12px", sm: "14px" },
            px: { xs: "8px", sm: "16px" },
            py: { xs: "10px", sm: "12px" },
            verticalAlign: "middle",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            borderBottom: "1px solid #e5e7eb",
          },
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
            <TableCell
              sx={{
                fontWeight: 700,
                width: { xs: "28%", md: "140px" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              日期
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                width: { xs: "32%", md: "220px" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              原因
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                width: { xs: "32%", md: "auto" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              表單申請記錄
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 700,
                width: { xs: "56px", md: "80px" },
                whiteSpace: "nowrap",
              }}
            >
              操作
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={4}
                align="center"
                sx={{ color: "#6b7280" }}
              >
                載入中...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                align="center"
                sx={{ color: "#6b7280" }}
              >
                查無資料
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell
                  sx={{
                    whiteSpace: "normal",
                    lineHeight: 1.4,
                  }}
                >
                  {String(row.date || "-").slice(2)}
                </TableCell>
                <TableCell
                  sx={{
                    whiteSpace: "normal",
                    lineHeight: 1.4,
                  }}
                >
                  {row.reason}
                </TableCell>
                <TableCell
                  sx={{
                    whiteSpace: "normal",
                    lineHeight: 1.4,
                    color: row.formRecord ? "#111827" : "#6b7280",
                  }}
                >
                  {row.formRecord || "-"}
                </TableCell>

                <TableCell align="center">
                  <Tooltip title={row.relatedForms?.length ? "查看" : "無表單紀錄"}>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!row.relatedForms?.length}
                        onClick={() => onView?.(row)}
                        sx={{ color: "#374151" }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}