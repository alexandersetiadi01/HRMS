import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import { formatCurrency, formatDateTime } from "./OrderSystemHelpers";

function getStoreLabel(order) {
  return [order?.store_name, order?.branch_name].filter(Boolean).join(" / ");
}

function getOrderItems(order) {
  if (Array.isArray(order?.order_items)) {
    return order.order_items;
  }

  if (Array.isArray(order?.items)) {
    return order.items;
  }

  return [];
}

function getItemDetails(item) {
  if (Array.isArray(item?.details)) {
    return item.details;
  }

  if (Array.isArray(item?.menu_items)) {
    return item.menu_items;
  }

  return [];
}

function getPaymentStatusChipSx(status) {
  if (status === "已付款") {
    return {
      color: "#166534",
      bgcolor: "#dcfce7",
      borderColor: "#22c55e",
    };
  }

  if (status === "已取消") {
    return {
      color: "#854d0e",
      bgcolor: "#fef9c3",
      borderColor: "#eab308",
    };
  }

  return {
    color: "#991b1b",
    bgcolor: "#fee2e2",
    borderColor: "#ef4444",
  };
}

export default function OrderDetailDialog({ open, order, onClose }) {
  const orderItems = getOrderItems(order);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          width: {
            xs: "calc(100vw - 16px)",
            sm: "calc(100vw - 64px)",
          },
          m: { xs: "8px", sm: "32px" },
          maxHeight: {
            xs: "calc(100dvh - 16px)",
            sm: "calc(100dvh - 64px)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: "16px", sm: "24px" },
          py: { xs: "12px", sm: "16px" },
          fontSize: { xs: "18px", sm: "20px" },
          fontWeight: 700,
        }}
      >
        訂單明細
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: { xs: "12px", sm: "24px" },
          py: { xs: "16px", sm: "20px" },
        }}
      >
        {!order ? (
          <Typography sx={{ fontSize: "15px" }}>查無資料</Typography>
        ) : (
          <Stack spacing={2.5}>
            <Box>
              <Typography
                sx={{
                  fontSize: "18px",
                  fontWeight: 700,
                  overflowWrap: "anywhere",
                }}
              >
                {order.title || "-"}
              </Typography>

              <Stack spacing={0.8} sx={{ mt: "12px" }}>
                <Typography sx={{ fontSize: "14px" }}>
                  店家：{getStoreLabel(order) || "-"}
                </Typography>
                <Typography sx={{ fontSize: "14px" }}>
                  狀態：{order.status || "-"}
                </Typography>
                <Typography sx={{ fontSize: "14px" }}>
                  開始時間：{formatDateTime(order.start_at)}
                </Typography>
                <Typography sx={{ fontSize: "14px" }}>
                  截止時間：{formatDateTime(order.deadline_at)}
                </Typography>
                <Typography sx={{ fontSize: "14px" }}>
                  完成時間：{formatDateTime(order.completed_at)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "14px",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  說明：{order.description || "-"}
                </Typography>
              </Stack>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: "12px",
              }}
            >
              <Box sx={{ border: "1px solid #d8d8d8", p: "12px" }}>
                <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                  參與人數
                </Typography>
                <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
                  {order.participant_count || 0}
                </Typography>
              </Box>

              <Box sx={{ border: "1px solid #d8d8d8", p: "12px" }}>
                <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                  總數量
                </Typography>
                <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
                  {order.total_qty || 0}
                </Typography>
              </Box>

              <Box sx={{ border: "1px solid #d8d8d8", p: "12px" }}>
                <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                  總金額
                </Typography>
                <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
                  ${formatCurrency(order.total_amount || 0)}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={1.5}>
              <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>
                員工訂購明細
              </Typography>

              {orderItems.length === 0 ? (
                <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                  查無訂購明細
                </Typography>
              ) : (
                orderItems.map((item, index) => {
                  const details = getItemDetails(item);

                  return (
                    <Box
                      key={item.order_item_id || index}
                      sx={{
                        border: "1px solid #d8d8d8",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          px: "14px",
                          py: "10px",
                          bgcolor: "#f9fafb",
                          display: "flex",
                          flexDirection: { xs: "column", sm: "row" },
                          alignItems: { xs: "stretch", sm: "center" },
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "15px",
                            fontWeight: 700,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {[item.employee_no, item.display_name]
                            .filter(Boolean)
                            .join(" ") || "-"}
                        </Typography>

                        <Stack direction="row" spacing={2} flexWrap="wrap">
                          <Chip
                            label={`付款狀態：${item.payment_status || "-"}`}
                            variant="outlined"
                            size="small"
                            sx={{
                              maxWidth: "100%",
                              alignSelf: { xs: "flex-start", sm: "center" },
                              fontSize: "15px",
                              fontWeight: 700,
                              borderRadius: "4px",
                              ...getPaymentStatusChipSx(item.payment_status),
                            }}
                          />
                        </Stack>
                      </Box>

                      {item.note ? (
                        <Box sx={{ px: "14px", py: "8px" }}>
                          <Typography
                            sx={{
                              fontSize: "14px",
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
                            }}
                          >
                            備註：{item.note}
                          </Typography>
                        </Box>
                      ) : null}

                      <Box
                        sx={{
                          display: { xs: "none", sm: "grid" },
                          gridTemplateColumns:
                            "minmax(0, 1fr) 100px 120px 120px",
                          borderTop: "1px solid #d8d8d8",
                          bgcolor: "#f3f4f6",
                        }}
                      >
                        <Box sx={{ p: "10px", fontWeight: 700 }}>品項</Box>
                        <Box sx={{ p: "10px", fontWeight: 700 }}>數量</Box>
                        <Box sx={{ p: "10px", fontWeight: 700 }}>單價</Box>
                        <Box sx={{ p: "10px", fontWeight: 700 }}>小計</Box>
                      </Box>

                      {details.length === 0 ? (
                        <Box sx={{ p: "10px" }}>
                          <Typography sx={{ fontSize: "14px" }}>
                            查無品項
                          </Typography>
                        </Box>
                      ) : (
                        details.map((detail, detailIndex) => {
                          const quantity = Number(detail.quantity || 0);
                          const price = Number(
                            detail.price || detail.menu_price || 0,
                          );
                          const subtotal =
                            detail.subtotal !== undefined
                              ? Number(detail.subtotal || 0)
                              : price * quantity;

                          return (
                            <Box
                              key={detail.order_item_detail_id || detailIndex}
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "repeat(3, minmax(0, 1fr))",
                                  sm: "minmax(0, 1fr) 100px 120px 120px",
                                },
                                borderTop: "1px solid #eeeeee",
                              }}
                            >
                              <Box
                                sx={{
                                  gridColumn: { xs: "1 / -1", sm: "auto" },
                                  p: "10px",
                                  minWidth: 0,
                                }}
                              >
                                <Typography
                                  sx={{
                                    display: { xs: "block", sm: "none" },
                                    mb: "3px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                  }}
                                >
                                  品項
                                </Typography>

                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {detail.menu_name || "-"}
                                </Typography>
                              </Box>

                              <Box sx={{ p: "10px", minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    display: { xs: "block", sm: "none" },
                                    mb: "3px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                  }}
                                >
                                  數量
                                </Typography>

                                <Typography sx={{ fontSize: "14px" }}>
                                  {quantity}
                                </Typography>
                              </Box>

                              <Box sx={{ p: "10px", minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    display: { xs: "block", sm: "none" },
                                    mb: "3px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                  }}
                                >
                                  單價
                                </Typography>

                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  ${formatCurrency(price)}
                                </Typography>
                              </Box>

                              <Box sx={{ p: "10px", minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    display: { xs: "block", sm: "none" },
                                    mb: "3px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#6b7280",
                                  }}
                                >
                                  小計
                                </Typography>

                                <Typography
                                  sx={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  ${formatCurrency(subtotal)}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  );
                })
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: "12px", sm: "24px" },
          py: { xs: "12px", sm: "16px" },
        }}
      >
        <Button onClick={onClose} sx={{ width: { xs: "100%", sm: "auto" } }}>
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}
