import {
  Box,
  Button,
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

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import {
  getStoreCategoryText,
  getStoreFullAddress,
} from "./OrderSystemHelpers";

export default function StoreTable({
  rows = [],
  loading = false,
  onEdit,
  onDelete,
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
              <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                店家名稱
              </TableCell>
              <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                分店
              </TableCell>
              <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                電話
              </TableCell>
              <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                分類
              </TableCell>
              <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                地址
              </TableCell>
              <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                操作
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
                    <Typography sx={{ fontSize: "14px" }}>載入中...</Typography>
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
                    查無店家資料
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const categories = getStoreCategoryText(row.categories);

                return (
                  <TableRow
                    key={row.store_id}
                    hover
                    sx={{
                      "&:last-child td": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontSize: "14px", fontWeight: 700 }}>
                        {row.store_name || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontSize: "14px" }}>
                        {row.branch_name || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{ fontSize: "14px", whiteSpace: "nowrap" }}
                      >
                        {row.phone || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {categories ? (
                        <Stack
                          direction="row"
                          spacing={0.8}
                          useFlexGap
                          flexWrap="wrap"
                          sx={{
                            rowGap: "8px",
                            alignItems: "center",
                          }}
                        >
                          {row.categories.map((category, index) => {
                            const categoryName =
                              typeof category === "string"
                                ? category
                                : category?.category_name || "";

                            if (!categoryName) {
                              return null;
                            }

                            return (
                              <Chip
                                key={`${row.store_id}-${categoryName}-${index}`}
                                label={categoryName}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: "28px",
                                  "& .MuiChip-label": {
                                    px: "10px",
                                    fontSize: "13px",
                                  },
                                }}
                              />
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography sx={{ fontSize: "14px" }}>-</Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: "14px",
                          maxWidth: "360px",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        {getStoreFullAddress(row) || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditOutlinedIcon />}
                          onClick={() => onEdit(row)}
                          sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          編輯
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={() => onDelete(row)}
                          sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          刪除
                        </Button>
                      </Stack>
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
