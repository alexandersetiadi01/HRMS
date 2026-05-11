import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  getOrderStores,
  updateOrder,
  updateOrderItem,
} from "../../API/order";

import {
  formatCurrency,
  formatDateTimeInputValue,
  getStoreMenusForOrder,
} from "./OrderSystemHelpers";

const paymentStatusOptions = ["未付款", "已付款", "已取消"];

export default function EditOrderDialog({
  open,
  order,
  onClose,
  onSaved,
  onNotify,
}) {
  const [form, setForm] = useState({
    title: "",
    store_id: "",
    description: "",
    start_at: "",
    deadline_at: "",
  });
  const [itemStatuses, setItemStatuses] = useState({});
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const notify = (message, severity = "success") => {
    if (typeof onNotify === "function") {
      onNotify(message, severity);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      title: order?.title || "",
      store_id: order?.store_id || "",
      description: order?.description || "",
      start_at: formatDateTimeInputValue(order?.start_at),
      deadline_at: formatDateTimeInputValue(order?.deadline_at),
    });

    const nextItemStatuses = {};

    if (Array.isArray(order?.items)) {
      order.items.forEach((item) => {
        if (item?.order_item_id) {
          nextItemStatuses[item.order_item_id] =
            item.payment_status || "未付款";
        }
      });
    }

    setItemStatuses(nextItemStatuses);

    const loadStores = async () => {
      try {
        setLoading(true);

        const rows = await getOrderStores();

        setStores(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error(error);
        setStores([]);
        notify("讀取店家資料失敗，請稍後再試。", "error");
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, [open, order]);

  const selectedStore = useMemo(() => {
    return stores.find((store) => {
      return Number(store.store_id) === Number(form.store_id);
    });
  }, [stores, form.store_id]);

  const selectedStoreMenus = useMemo(() => {
    return getStoreMenusForOrder(selectedStore);
  }, [selectedStore]);

  const orderItems = useMemo(() => {
    return Array.isArray(order?.items) ? order.items : [];
  }, [order]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateItemStatus = (orderItemId, value) => {
    setItemStatuses((previous) => ({
      ...previous,
      [orderItemId]: value,
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      notify("請輸入訂單名稱。", "warning");
      return false;
    }

    if (!form.store_id) {
      notify("請選擇店家。", "warning");
      return false;
    }

    if (!form.start_at) {
      notify("請選擇開始時間。", "warning");
      return false;
    }

    if (!form.deadline_at) {
      notify("請選擇截止時間。", "warning");
      return false;
    }

    if (
      new Date(form.deadline_at).getTime() <=
      new Date(form.start_at).getTime()
    ) {
      notify("截止時間必須晚於開始時間。", "warning");
      return false;
    }

    if (selectedStore && selectedStoreMenus.length === 0) {
      notify("此店家尚未設定品項，請先至店家管理新增品項。", "warning");
      return false;
    }

    return true;
  };

  const getItemDetailText = (item) => {
    const details = Array.isArray(item?.details) ? item.details : [];

    if (!details.length) {
      return "-";
    }

    return details
      .map((detail) => {
        const menuName = detail.menu_name || "-";
        const quantity = Number(detail.quantity || 0);
        const price = Number(detail.price || 0);

        return `${menuName} × ${quantity}（${formatCurrency(price * quantity)}）`;
      })
      .join("、");
  };

  const saveChangedItemStatuses = async () => {
    const changedItems = orderItems.filter((item) => {
      const orderItemId = item?.order_item_id;

      if (!orderItemId) {
        return false;
      }

      return (
        itemStatuses[orderItemId] &&
        itemStatuses[orderItemId] !== item.payment_status
      );
    });

    await Promise.all(
      changedItems.map((item) =>
        updateOrderItem(item.order_item_id, {
          payment_status: itemStatuses[item.order_item_id],
        }),
      ),
    );
  };

  const handleSubmit = async () => {
    if (!order?.order_id || !validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      await updateOrder(order.order_id, {
        title: form.title,
        store_id: Number(form.store_id),
        description: form.description,
        start_at: form.start_at,
        deadline_at: form.deadline_at,
      });

      await saveChangedItemStatuses();

      if (typeof onSaved === "function") {
        await onSaved();
      }

      onClose();
    } catch (error) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        "更新訂單失敗，請稍後再試。";

      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const storeLabel = (store) => {
    return [store.store_name, store.branch_name].filter(Boolean).join(" / ");
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle sx={{ fontSize: "20px", fontWeight: 700 }}>
        編輯訂單
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="訂單名稱"
              required
              value={form.title}
              disabled={loading || submitting}
              onChange={(event) => updateField("title", event.target.value)}
            />

            <TextField
              select
              fullWidth
              size="small"
              label="店家/分店"
              required
              value={form.store_id}
              disabled={loading || submitting}
              onChange={(event) => updateField("store_id", event.target.value)}
            >
              <MenuItem value="">請選擇店家</MenuItem>
              {stores.map((store) => (
                <MenuItem key={store.store_id} value={store.store_id}>
                  {storeLabel(store)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              multiline
              minRows={3}
              size="small"
              label="說明"
              value={form.description}
              disabled={loading || submitting}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
            />

            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              label="開始時間"
              required
              InputLabelProps={{ shrink: true }}
              value={form.start_at}
              disabled={loading || submitting}
              onChange={(event) => updateField("start_at", event.target.value)}
            />

            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              label="截止時間"
              required
              InputLabelProps={{ shrink: true }}
              value={form.deadline_at}
              disabled={loading || submitting}
              onChange={(event) =>
                updateField("deadline_at", event.target.value)
              }
            />
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>
              員工訂購明細
            </Typography>

            {orderItems.length > 0 ? (
              <Stack spacing={1.25}>
                {orderItems.map((item) => {
                  const orderItemId = item.order_item_id;
                  const employeeLabel = [
                    item.employee_no,
                    item.display_name,
                  ]
                    .filter(Boolean)
                    .join(" / ");

                  return (
                    <Box
                      key={orderItemId}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "180px minmax(0, 1fr) 110px 150px",
                        },
                        gap: "12px",
                        alignItems: "center",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        p: "12px",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: "#6b7280",
                            mb: "4px",
                          }}
                        >
                          員工
                        </Typography>
                        <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                          {employeeLabel || "-"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: "#6b7280",
                            mb: "4px",
                          }}
                        >
                          訂購品項
                        </Typography>
                        <Typography sx={{ fontSize: "14px" }}>
                          {getItemDetailText(item)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: "#6b7280",
                            mb: "4px",
                          }}
                        >
                          小計
                        </Typography>
                        <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                          {formatCurrency(item.item_amount || 0)}
                        </Typography>
                      </Box>

                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="付款狀態"
                        value={itemStatuses[orderItemId] || "未付款"}
                        disabled={loading || submitting}
                        onChange={(event) =>
                          updateItemStatus(orderItemId, event.target.value)
                        }
                      >
                        {paymentStatusOptions.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Box
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  p: "16px",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                  尚無訂購明細
                </Typography>
              </Box>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: "16px 24px" }}>
        <Button disabled={submitting} onClick={onClose}>
          取消
        </Button>

        <Button
          variant="contained"
          disabled={loading || submitting}
          onClick={handleSubmit}
        >
          儲存更新
        </Button>
      </DialogActions>
    </Dialog>
  );
}