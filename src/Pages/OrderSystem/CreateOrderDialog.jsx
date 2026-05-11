import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";

import {
  createOrder,
  getOrderEmployees,
  getOrderStores,
} from "../../API/order";

import OrderMenuItemRows from "./OrderMenuItemRows";

import { getCurrentEmployeeId } from "../../API/account";

import {
  buildEmptyOrderForm,
  calculateOrderTotals,
  getStoreMenusForOrder,
  normalizeOrderPayload,
} from "./OrderSystemHelpers";

export default function CreateOrderDialog({
  open,
  onClose,
  onSaved,
  onNotify,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(buildEmptyOrderForm());
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
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

    setActiveStep(0);
    setForm(buildEmptyOrderForm());

    const loadOptions = async () => {
      try {
        setLoading(true);

        const [storeRows, employeeRows] = await Promise.all([
          getOrderStores(),
          getOrderEmployees(),
        ]);

        setStores(Array.isArray(storeRows) ? storeRows : []);
        setEmployees(Array.isArray(employeeRows) ? employeeRows : []);
      } catch (error) {
        console.error(error);
        notify("讀取訂單選項失敗，請稍後再試。", "error");
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [open]);

  const selectedStore = useMemo(() => {
    return stores.find((store) => {
      return Number(store.store_id) === Number(form.store_id);
    });
  }, [stores, form.store_id]);

  const menus = useMemo(() => {
    return getStoreMenusForOrder(selectedStore);
  }, [selectedStore]);

  const totals = useMemo(() => {
    return calculateOrderTotals(form.order_items, menus);
  }, [form.order_items, menus]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateStepOne = () => {
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

    return true;
  };

  const validateStepTwo = () => {
    const payload = normalizeOrderPayload(form);

    if (!payload.order_items.length) {
      notify("請至少新增一筆有效的員工訂購品項。", "warning");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateStepOne()) {
      return;
    }

    setActiveStep((previous) => previous + 1);
  };

  const handleBack = () => {
    setActiveStep((previous) => Math.max(0, previous - 1));
  };

  const handleSubmit = async () => {
    if (!validateStepOne() || !validateStepTwo()) {
      return;
    }

    const currentEmployeeId = getCurrentEmployeeId();

    if (!currentEmployeeId) {
      notify("找不到目前登入者對應的員工資料，無法建立訂單。", "error");
      return;
    }

    try {
      setSubmitting(true);

      const payload = normalizeOrderPayload(form);

      payload.created_by = currentEmployeeId;

      await createOrder(payload);

      if (typeof onSaved === "function") {
        await onSaved();
      }

      onClose();
    } catch (error) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.data?.message ||
        "建立訂單失敗，請稍後再試。";

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
        新增訂單
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Stepper activeStep={activeStep}>
            <Step>
              <StepLabel>建立訂單資料</StepLabel>
            </Step>
            <Step>
              <StepLabel>新增訂購品項</StepLabel>
            </Step>
          </Stepper>

          {activeStep === 0 ? (
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
                onChange={(event) => {
                  updateField("store_id", event.target.value);
                  updateField("order_items", buildEmptyOrderForm().order_items);
                }}
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
                onChange={(event) =>
                  updateField("start_at", event.target.value)
                }
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

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Box
                  sx={{
                    border: "1px solid #d8d8d8",
                    p: "12px",
                    minWidth: "160px",
                  }}
                >
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    參與人數
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
                    {totals.participantCount}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    border: "1px solid #d8d8d8",
                    p: "12px",
                    minWidth: "160px",
                  }}
                >
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    總數量
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
                    {totals.totalQty}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    border: "1px solid #d8d8d8",
                    p: "12px",
                    minWidth: "160px",
                  }}
                >
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    總金額
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
                    ${totals.totalAmount.toLocaleString("zh-TW")}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
                訂購品項
              </Typography>

              <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                先選擇員工，再選擇該員工訂購的品項與數量。總數量、總金額、參與人數會自動計算。
              </Typography>

              <OrderMenuItemRows
                value={form.order_items}
                employees={employees}
                menus={menus}
                disabled={loading || submitting}
                onChange={(value) => updateField("order_items", value)}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Box
                  sx={{
                    border: "1px solid #d8d8d8",
                    p: "12px",
                    minWidth: "160px",
                  }}
                >
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    參與人數
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
                    {totals.participantCount}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    border: "1px solid #d8d8d8",
                    p: "12px",
                    minWidth: "160px",
                  }}
                >
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    總數量
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
                    {totals.totalQty}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    border: "1px solid #d8d8d8",
                    p: "12px",
                    minWidth: "160px",
                  }}
                >
                  <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                    總金額
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
                    ${totals.totalAmount.toLocaleString("zh-TW")}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: "16px 24px" }}>
        <Button disabled={submitting} onClick={onClose}>
          取消
        </Button>

        {activeStep > 0 ? (
          <Button disabled={submitting} onClick={handleBack}>
            上一步
          </Button>
        ) : null}

        {activeStep === 0 ? (
          <Button
            variant="contained"
            disabled={loading || submitting}
            onClick={handleNext}
          >
            下一步
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={loading || submitting}
            onClick={handleSubmit}
          >
            儲存訂單
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}