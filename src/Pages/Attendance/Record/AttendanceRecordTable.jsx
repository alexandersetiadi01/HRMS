import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function AttendanceRecordTable({ rows = [], loading = false }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <>
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
                  width: { xs: "19%", md: "110px" },
                  whiteSpace: "normal",
                  lineHeight: 1.3,
                }}
              >
                日期
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  width: { xs: "23%", md: "150px" },
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
                  width: { xs: "18%", md: "120px" },
                  whiteSpace: "normal",
                  lineHeight: 1.3,
                }}
              >
                打卡
                <br />
                方式
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  width: { xs: "23%", md: "150px" },
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
                  width: { xs: "17%", md: "120px" },
                  whiteSpace: "normal",
                  lineHeight: 1.3,
                }}
              >
                打卡
                <br />
                方式
              </TableCell>

              <TableCell
                sx={{
                  width: { xs: "32px", md: "48px" },
                }}
              />
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
                const dateText =
                  typeof row?.date === "string" && row.date !== ""
                    ? row.date
                    : "-";

                const startText =
                  typeof row?.start === "string" && row.start !== ""
                    ? row.start
                    : "-";

                const startMethodText =
                  typeof row?.startMethod === "string" && row.startMethod !== ""
                    ? row.startMethod
                    : "-";

                const endText =
                  typeof row?.end === "string" && row.end !== ""
                    ? row.end
                    : "-";

                const endMethodText =
                  typeof row?.endMethod === "string" && row.endMethod !== ""
                    ? row.endMethod
                    : "-";

                return (
                  <TableRow key={i}>
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
                      {startText}
                    </TableCell>

                    <TableCell
                      sx={{
                        color: "#2563eb",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          height: "100%",
                          lineHeight: 1.4,
                        }}
                      >
                        <Typography sx={{ fontSize: { xs: "11px", sm: "14px" } }}>
                          {startMethodText}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: "11px", sm: "14px" } }}>
                          查看地點
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell
                      sx={{
                        whiteSpace: "normal",
                        lineHeight: 1.4,
                      }}
                    >
                      {endText}
                    </TableCell>

                    <TableCell
                      sx={{
                        color: "#2563eb",
                        whiteSpace: "normal",
                        lineHeight: 1.4,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          height: "100%",
                          lineHeight: 1.4,
                        }}
                      >
                        <Typography sx={{ fontSize: { xs: "11px", sm: "14px" } }}>
                          {endMethodText}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: "11px", sm: "14px" } }}>
                          查看地點
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        verticalAlign: "middle",
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{
                          p: { xs: "2px", sm: "4px" },
                        }}
                      >
                        <DeleteOutlineIcon
                          sx={{ fontSize: { xs: "18px", sm: "20px" } }}
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}