import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { formatCurrency, formatDateTime } from "./orderSystemHelpers";

function getStatusColor(status) {
  switch (status) {
    case "進行中":
      return "primary";

    case "已完成":
      return "success";

    case "已截止":
    case "已結案":
      return "warning";

    case "已取消":
      return "error";

    default:
      return "default";
  }
}

export default function OrderTable({
  rows = [],
  loading = false,
  emptyText = "查無資料",
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      <TableContainer
        sx={{
          overflowX: "auto",
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#f9fafb",
              }}
            >
              <TableCell
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                訂單名稱
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                店家
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                截止時間
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                訂購人數
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                訂單金額
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                狀態
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      py: "32px",
                    }}
                  >
                    <CircularProgress size={24} />

                    <Typography
                      sx={{
                        fontSize: "14px",
                      }}
                    >
                      載入中...
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography
                    sx={{
                      textAlign: "center",
                      py: "32px",
                      fontSize: "14px",
                      color: "#6b7280",
                    }}
                  >
                    {emptyText}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const storeLabel = [
                  row.store_name,
                  row.branch_name,
                ]
                  .filter(Boolean)
                  .join(" / ");

                return (
                  <TableRow
                    key={row.order_id}
                    hover
                    sx={{
                      "&:last-child td": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {row.title || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "14px",
                        }}
                      >
                        {storeLabel || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDateTime(row.deadline_at)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "14px",
                        }}
                      >
                        {row.total_people || 0}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        $
                        {formatCurrency(
                          row.total_amount || 0
                        )}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={row.status || "-"}
                        color={getStatusColor(row.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}