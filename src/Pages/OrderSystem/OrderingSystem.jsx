import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from "@mui/material";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import InternalModule from "../../Components/InternalModule";
import {
  completeOrder,
  deleteOrder,
  getOrderDetail,
  getOrderList,
} from "../../API/order";

import CreateOrderDialog from "./CreateOrderDialog";
import EditOrderDialog from "./EditOrderDialog";
import OrderDetailDialog from "./OrderDetailDialog";
import StoreManagementDialog from "./StoreManagementDialog";

import {
  formatCurrency,
  formatDateTime,
  isOrderClosed,
  isOrderInProgress,
} from "./OrderSystemHelpers";

const ongoingColumns = [
  { key: "title", label: "標題", width: "1fr", withDivider: true },
  {
    key: "initiator",
    label: "發起人",
    width: "130px",
    align: "center",
    withDivider: true,
  },
  {
    key: "deadline",
    label: "截止時間",
    width: "160px",
    align: "center",
    withDivider: true,
  },
  {
    key: "orderCount",
    label: "訂單數",
    width: "110px",
    align: "center",
    withDivider: true,
  },
  {
    key: "amount",
    label: "總金額",
    width: "80px",
    align: "center",
    withDivider: true,
  },
  {
    key: "order",
    label: "訂購",
    width: "80px",
    align: "center",
    withDivider: true,
  },
  {
    key: "manage",
    label: "管理功能",
    width: "170px",
    align: "center",
    type: "actions",
  },
];

const deadlineOrderColumns = [
  { key: "title", label: "標題", width: "1fr", withDivider: true },
  {
    key: "scheduledEndTime",
    label: "預計結案時間",
    width: "155px",
    align: "center",
    withDivider: true,
  },
  {
    key: "orderCount",
    label: "訂單數",
    width: "80px",
    align: "center",
    withDivider: true,
  },
  {
    key: "amount",
    label: "總金額",
    width: "85px",
    align: "center",
    withDivider: true,
  },
  {
    key: "unpaidOrderCount",
    label: "未付款單數",
    width: "120px",
    align: "center",
    withDivider: true,
    headerWrap: false,
  },
  {
    key: "unpaidAmount",
    label: "未付款金額",
    width: "120px",
    align: "center",
    withDivider: true,
    headerWrap: false,
  },
  {
    key: "manage",
    label: "管理功能",
    width: "100px",
    align: "center",
    type: "actions",
    headerWrap: false,
  },
];

function getStoreLabel(order) {
  return [order.store_name, order.branch_name].filter(Boolean).join(" / ");
}

export default function OrderingSystem() {
  const [orders, setOrders] = useState([]);
  const [storeManagementOpen, setStoreManagementOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rowsVersion, setRowsVersion] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    content: "",
    confirmText: "確定",
    confirmColor: "primary",
    onConfirm: null,
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const closeSnackbar = () => {
    setSnackbar((previous) => ({
      ...previous,
      open: false,
    }));
  };

  const openConfirmDialog = ({
    title,
    content,
    confirmText = "確定",
    confirmColor = "primary",
    onConfirm,
  }) => {
    setConfirmDialog({
      open: true,
      title,
      content,
      confirmText,
      confirmColor,
      onConfirm,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      title: "",
      content: "",
      confirmText: "確定",
      confirmColor: "primary",
      onConfirm: null,
    });
  };

  const loadOrders = async () => {
    try {
      const response = await getOrderList();

      setOrders(Array.isArray(response) ? response : []);
      setRowsVersion((previous) => previous + 1);
    } catch (error) {
      console.error(error);
      setOrders([]);
      setRowsVersion((previous) => previous + 1);
      showSnackbar("讀取訂單資料失敗，請稍後再試。", "error");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrderDetail = async (row) => {
    try {
      const detail = await getOrderDetail(row.id);

      setSelectedOrder(detail);
      setDetailOpen(true);
    } catch (error) {
      console.error(error);
      showSnackbar("讀取訂單明細失敗，請稍後再試。", "error");
    }
  };

  const openEditOrder = async (row) => {
    try {
      const detail = await getOrderDetail(row.id);

      setSelectedOrder(detail);
      setEditOpen(true);
    } catch (error) {
      console.error(error);
      showSnackbar("讀取訂單資料失敗，請稍後再試。", "error");
    }
  };

  const handleDeleteOrder = async (row) => {
    openConfirmDialog({
      title: "刪除訂單",
      content: `確定要刪除訂單「${row.title}」嗎？`,
      confirmText: "刪除",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          await deleteOrder(row.id);
          await loadOrders();
          showSnackbar("訂單已刪除。", "success");
        } catch (error) {
          console.error(error);
          showSnackbar("刪除訂單失敗，請稍後再試。", "error");
        } finally {
          closeConfirmDialog();
        }
      },
    });
  };

  const handleCompleteOrder = async (row) => {
    openConfirmDialog({
      title: "完成訂單",
      content: `確定要將訂單「${row.title}」標記為完成嗎？`,
      confirmText: "完成",
      confirmColor: "success",
      onConfirm: async () => {
        try {
          await completeOrder(row.id);
          await loadOrders();
          showSnackbar("訂單已標記為完成。", "success");
        } catch (error) {
          console.error(error);
          showSnackbar("完成訂單失敗，請稍後再試。", "error");
        } finally {
          closeConfirmDialog();
        }
      },
    });
  };

  const buildOngoingActions = () => [
    {
      label: "查看",
      icon: <VisibilityOutlinedIcon sx={{ fontSize: "20px" }} />,
      onClick: openOrderDetail,
    },
    {
      label: "編輯",
      icon: <EditOutlinedIcon sx={{ fontSize: "20px" }} />,
      onClick: openEditOrder,
    },
    {
      label: "刪除",
      icon: <DeleteOutlineIcon sx={{ fontSize: "20px" }} />,
      color: "#dc2626",
      hoverColor: "#b91c1c",
      onClick: handleDeleteOrder,
    },
    {
      label: "完成",
      icon: <CheckCircleOutlineIcon sx={{ fontSize: "20px" }} />,
      color: "#16a34a",
      hoverColor: "#15803d",
      onClick: handleCompleteOrder,
    },
  ];

  const buildDeadlineActions = () => [
    {
      label: "查看",
      icon: <VisibilityOutlinedIcon sx={{ fontSize: "20px" }} />,
      onClick: openOrderDetail,
    },
  ];

  const mapOngoingRow = (order) => ({
    id: order.order_id,
    title: order.title || "-",
    initiator: order.created_by_name || order.created_by || "-",
    deadline: formatDateTime(order.deadline_at),
    orderCount: String(order.participant_count || 0),
    amount: formatCurrency(order.total_amount || 0),
    order: "訂購",
    manage: buildOngoingActions(),
  });

  const mapDeadlineRow = (order) => ({
    id: order.order_id,
    title: order.title || "-",
    scheduledEndTime:
      formatDateTime(order.completed_at) !== "-"
        ? formatDateTime(order.completed_at)
        : formatDateTime(order.deadline_at),
    orderCount: String(order.participant_count || 0),
    amount: formatCurrency(order.total_amount || 0),
    unpaidOrderCount: String(order.unpaid_count || 0),
    unpaidAmount: formatCurrency(order.unpaid_amount || 0),
    manage: buildDeadlineActions(),
  });

  const ongoingRows = useMemo(() => {
    return orders.filter(isOrderInProgress).map(mapOngoingRow);
  }, [orders]);

  const deadlineRows = useMemo(() => {
    return orders.filter(isOrderClosed).map(mapDeadlineRow);
  }, [orders]);

  return (
    <>
      <InternalModule
        title="訂餐系統"
        accentColor="#29b34a"
        sidebarTitle="訂單"
        defaultSidebarKey="ongoing"
        rowsVersion={rowsVersion}
        sidebarItems={[
          {
            key: "ongoing",
            label: "進行中之訂單",
            columns: ongoingColumns,
            rows: ongoingRows,
            emptyText: "查無資料",
          },
          {
            key: "deadline",
            label: "截止訂購訂單",
            columns: deadlineOrderColumns,
            rows: deadlineRows,
            emptyText: "查無資料",
          },
        ]}
        actionButtons={[
          {
            label: "新增訂單",
            minWidth: "110px",
            onClick: () => {
              setCreateOrderOpen(true);
            },
          },
          {
            label: "店家管理",
            minWidth: "110px",
            onClick: () => {
              setStoreManagementOpen(true);
            },
          },
        ]}
        columns={ongoingColumns}
        rows={ongoingRows}
        emptyText="查無資料"
      />

      <StoreManagementDialog
        open={storeManagementOpen}
        onNotify={showSnackbar}
        onClose={() => {
          setStoreManagementOpen(false);
          loadOrders();
        }}
      />

      <CreateOrderDialog
        open={createOrderOpen}
        onNotify={showSnackbar}
        onClose={() => {
          setCreateOrderOpen(false);
        }}
        onSaved={async () => {
          await loadOrders();
          showSnackbar("訂單建立成功。", "success");
        }}
      />

      <OrderDetailDialog
        open={detailOpen}
        order={selectedOrder}
        onClose={() => {
          setDetailOpen(false);
          setSelectedOrder(null);
        }}
      />

      <EditOrderDialog
        open={editOpen}
        order={selectedOrder}
        onNotify={showSnackbar}
        onClose={() => {
          setEditOpen(false);
          setSelectedOrder(null);
        }}
        onSaved={async () => {
          await loadOrders();
          showSnackbar("訂單更新成功。", "success");
        }}
      />

      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>

        <DialogContent>
          <DialogContentText>{confirmDialog.content}</DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeConfirmDialog}>取消</Button>

          <Button
            variant="contained"
            color={confirmDialog.confirmColor}
            onClick={() => {
              if (typeof confirmDialog.onConfirm === "function") {
                confirmDialog.onConfirm();
              }
            }}
          >
            {confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={closeSnackbar}
          sx={{
            width: "100%",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
