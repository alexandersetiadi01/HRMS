import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

function safeText(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  const text = String(value).trim();
  return text !== "" ? text : "-";
}

function renderMultilineText(value) {
  const text = safeText(value);

  if (text === "-") {
    return (
      <Typography sx={{ fontSize: { xs: "11px", sm: "14px" } }}>-</Typography>
    );
  }

  return text.split("\n").map((line, index) => (
    <Typography
      key={`${line}-${index}`}
      sx={{
        fontSize: { xs: "11px", sm: "14px" },
        lineHeight: 1.4,
      }}
    >
      {line}
    </Typography>
  ));
}

export default function AttendanceRecordTable({
  rows = [],
  loading = false,
  onRowClick,
}) {
  const safeRows = Array.isArray(rows) ? rows : [];

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
            fontSize: { xs: "11px", sm: "14px" },
            px: { xs: "4px", sm: "16px" },
            py: { xs: "8px", sm: "12px" },
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
                width: { xs: "16%", md: "110px" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              日期
            </TableCell>

            <TableCell
              sx={{
                fontWeight: 700,
                width: { xs: "22%", md: "180px" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              上班時間/
              <br />
              地點
            </TableCell>

            <TableCell
              sx={{
                fontWeight: 700,
                width: { xs: "22%", md: "180px" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              下班時間/
              <br />
              地點
            </TableCell>

            <TableCell
              sx={{
                fontWeight: 700,
                width: { xs: "14%", md: "120px" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              計薪時數
            </TableCell>

            <TableCell
              sx={{
                fontWeight: 700,
                width: { xs: "12%", md: "110px" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              遲到分鐘
            </TableCell>

            <TableCell
              sx={{
                fontWeight: 700,
                width: { xs: "14%", md: "130px" },
                whiteSpace: "normal",
                lineHeight: 1.3,
              }}
            >
              狀態
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                讀取中
              </TableCell>
            </TableRow>
          ) : safeRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                查無資料
              </TableCell>
            </TableRow>
          ) : (
            safeRows.map((row, i) => {
              const dateText = safeText(row?.date);
              const startText = safeText(row?.start);
              const endText = safeText(row?.end);
              const paidHoursText = safeText(row?.paidHours, "0");
              const lateMinutesText = safeText(row?.lateMinutes, "0");
              const statusText = safeText(row?.status);

              return (
                <TableRow
                  key={row?.id || i}
                  hover
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: "pointer",
                  }}
                >
                  <TableCell
                    sx={{
                      whiteSpace: "normal",
                      lineHeight: 1.4,
                    }}
                  >
                    {dateText}
                  </TableCell>

                  <TableCell
                    sx={{
                      whiteSpace: "normal",
                      lineHeight: 1.4,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        minHeight: "100%",
                        lineHeight: 1.4,
                      }}
                    >
                      {renderMultilineText(startText)}
                    </Box>
                  </TableCell>

                  <TableCell
                    sx={{
                      whiteSpace: "normal",
                      lineHeight: 1.4,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        minHeight: "100%",
                        lineHeight: 1.4,
                      }}
                    >
                      {renderMultilineText(endText)}
                    </Box>
                  </TableCell>

                  <TableCell>{paidHoursText}</TableCell>
                  <TableCell>{lateMinutesText}</TableCell>
                  <TableCell>{statusText}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Box>
  );
}