import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

export default function AttendanceAbnormalTable({ rows }) {
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
                width: { xs: "40%", md: "auto" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              表單申請記錄
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell
                sx={{
                  whiteSpace: "normal",
                  lineHeight: 1.4,
                }}
              >
                {row.date.slice(2)}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}