import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import {
  createOrderMenu,
  createOrderStore,
  deleteOrderMenu,
  deleteOrderStore,
  getOrderStores,
  updateOrderMenu,
  updateOrderStore,
} from "../../API/order";

import StoreDialog from "./StoreDialog";
import StoreTable from "./StoreTable";

function getValidMenuItems(menuItems) {
  if (!Array.isArray(menuItems)) {
    return [];
  }

  return menuItems.filter((item) => {
    return String(item.menu_name || "").trim() !== "";
  });
}

export default function StoreManagementDialog({ open, onClose, onNotify }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [storeDialogMode, setStoreDialogMode] = useState("create");
  const [editingRow, setEditingRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    row: null,
  });

  const notify = (message, severity = "success") => {
    if (typeof onNotify === "function") {
      onNotify(message, severity);
    }
  };

  const loadStores = async () => {
    try {
      setLoading(true);

      const response = await getOrderStores();

      setRows(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(error);
      notify("讀取店家資料失敗，請稍後再試。", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    loadStores();
  }, [open]);

  const saveStoreMenus = async (storeId, menuItems) => {
    const validItems = getValidMenuItems(menuItems);

    const existingMenus = Array.isArray(editingRow?.menus)
      ? editingRow.menus
      : [];

    const submittedMenuIds = validItems
      .map((item) => Number(item.menu_id || 0))
      .filter((menuId) => menuId > 0);

    if (storeDialogMode === "update") {
      const removedMenus = existingMenus.filter((menu) => {
        const menuId = Number(menu.menu_id || 0);

        return menuId > 0 && !submittedMenuIds.includes(menuId);
      });

      await Promise.all(
        removedMenus.map((menu) => deleteOrderMenu(menu.menu_id)),
      );
    }

    await Promise.all(
      validItems.map((item) => {
        const payload = {
          store_id: storeId,
          menu_name: String(item.menu_name || "").trim(),
          price: Number(item.price || 0),
          is_active: 1,
        };

        if (item.menu_id) {
          return updateOrderMenu(item.menu_id, payload);
        }

        return createOrderMenu(payload);
      }),
    );
  };

  const handleCreate = () => {
    setStoreDialogMode("create");
    setEditingRow(null);
    setStoreDialogOpen(true);
  };

  const handleEdit = (row) => {
    setStoreDialogMode("update");
    setEditingRow(row);
    setStoreDialogOpen(true);
  };

  const handleDelete = (row) => {
    setConfirmDelete({
      open: true,
      row,
    });
  };

  const closeDeleteConfirm = () => {
    setConfirmDelete({
      open: false,
      row: null,
    });
  };

  const confirmDeleteStore = async () => {
    const row = confirmDelete.row;

    if (!row?.store_id) {
      closeDeleteConfirm();
      return;
    }

    try {
      setLoading(true);

      await deleteOrderStore(row.store_id);

      await loadStores();

      notify("店家已刪除。", "success");
    } catch (error) {
      console.error(error);
      notify("刪除店家失敗，請稍後再試。", "error");
    } finally {
      setLoading(false);
      closeDeleteConfirm();
    }
  };

  const handleSubmitStore = async (payload) => {
    try {
      setSubmitting(true);

      const menuItems = Array.isArray(payload.menu_items)
        ? payload.menu_items
        : [];

      const storePayload = {
        ...payload,
      };

      delete storePayload.menu_items;

      let storeId = editingRow?.store_id;

      if (storeDialogMode === "update" && storeId) {
        await updateOrderStore(storeId, storePayload);
      } else {
        const createdStore = await createOrderStore(storePayload);
        storeId = createdStore?.store_id;
      }

      if (storeId) {
        await saveStoreMenus(storeId, menuItems);
      }

      setStoreDialogOpen(false);
      setEditingRow(null);

      await loadStores();

      notify(
        storeDialogMode === "update" ? "店家已更新。" : "店家已建立。",
        "success",
      );
    } catch (error) {
      console.error(error);
      notify("儲存店家失敗，請稍後再試。", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
              店家管理
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              sx={{
                textTransform: "none",
                boxShadow: "none",
              }}
            >
              新增店家
            </Button>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Box>
            <StoreTable
              rows={rows}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <StoreDialog
        open={storeDialogOpen}
        mode={storeDialogMode}
        initialValue={editingRow}
        loading={submitting}
        onClose={() => {
          if (submitting) {
            return;
          }

          setStoreDialogOpen(false);
        }}
        onSubmit={handleSubmitStore}
      />

      <Dialog
        open={confirmDelete.open}
        onClose={closeDeleteConfirm}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>刪除店家</DialogTitle>

        <DialogContent>
          <DialogContentText>
            {`確定要刪除店家「${confirmDelete.row?.store_name || ""}」嗎？`}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDeleteConfirm}>取消</Button>

          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteStore}
          >
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}