import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";

import {
  createHrmsAccount,
  deleteHrmsAccount,
  fetchHrmsAccounts,
  fetchHrmsAccountSystemRoles,
  updateHrmsAccount,
} from "../../../../API/account";
import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";

const TABLE_COLUMNS = [
  { key: "employee_no", label: "員工編號", width: "0.9fr" },
  { key: "display_name", label: "姓名", width: "0.9fr" },
  { key: "account_status", label: "帳號狀態", width: "0.7fr" },
  { key: "user_login", label: "登入帳號", width: "1fr" },
  { key: "user_email", label: "登入 Email", width: "1.8fr" },
  { key: "role_name", label: "系統角色", width: "0.75fr" },
  { key: "actions", label: "操作", width: "90px" },
];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.data?.message ||
    error?.message ||
    fallback
  );
}

function displayValue(value) {
  const text = String(value ?? "").trim();

  return text || "-";
}

function normalizeAccount(row = {}) {
  const employeeId = Number(row?.employee_id || 0);
  const wpUserId = Number(row?.wp_user_id || 0);
  const roleCode = String(row?.role_code || "")
    .trim()
    .toLowerCase();

  const roleNameMap = {
    user: "使用者",
    admin: "管理員",
  };

  return {
    ...row,
    employee_id:
      Number.isInteger(employeeId) && employeeId > 0
        ? employeeId
        : 0,
    wp_user_id:
      Number.isInteger(wpUserId) && wpUserId > 0
        ? wpUserId
        : 0,
    employee_no: String(row?.employee_no || "").trim(),
    display_name: String(row?.display_name || "").trim(),
    employee_email: String(row?.employee_email || "").trim(),
    user_login: String(row?.user_login || "").trim(),
    user_email: String(row?.user_email || "").trim(),
    role_id: Number(row?.role_id || 0),
    role_code: roleCode,
    role_name:
      roleNameMap[roleCode] ||
      String(row?.role_name || "").trim(),
    account_status: wpUserId > 0 ? "已建立" : "未建立",
  };
}

function normalizeRole(role = {}) {
  const roleCode = String(
    role?.role_code || "",
  )
    .trim()
    .toLowerCase();

  const roleNameMap = {
    user: "使用者",
    admin: "管理員",
  };

  return {
    ...role,
    role_id: Number(role?.role_id || 0),
    role_code: roleCode,
    role_name:
      roleNameMap[roleCode] ||
      String(
        role?.role_name ||
          role?.role_code ||
          "",
      ).trim(),
  };
}

export default function AccountManagementPage() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [dialogErrorText, setDialogErrorText] = useState("");
  const [createRow, setCreateRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const [createForm, setCreateForm] = useState({
    user_login: "",
    user_email: "",
    password: "",
    confirm_password: "",
    role_id: "",
  });

  const [editForm, setEditForm] = useState({
    user_email: "",
    new_password: "",
    confirm_password: "",
    role_id: "",
  });

  const loadPage = useCallback(async () => {
    setLoading(true);
    setErrorText("");

    try {
      const [accountRows, systemRoles] = await Promise.all([
        fetchHrmsAccounts(),
        fetchHrmsAccountSystemRoles(),
      ]);

      setRows(
        (Array.isArray(accountRows) ? accountRows : [])
          .map(normalizeAccount)
          .filter((row) => row.employee_id > 0),
      );

      setRoles(
        (Array.isArray(systemRoles) ? systemRoles : [])
          .map(normalizeRole)
          .filter(
            (role) =>
              role.role_id > 0 &&
              ["user", "admin"].includes(
                role.role_code.toLowerCase(),
              ),
          ),
      );
    } catch (error) {
      setErrorText(
        getErrorMessage(
          error,
          "載入 HRMS 帳號資料失敗。",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const filteredRows = useMemo(() => {
    const keyword = String(search || "")
      .trim()
      .toLowerCase();

    if (!keyword) {
      return rows;
    }

    return rows.filter((row) => {
      return [
        row.employee_no,
        row.display_name,
        row.employee_email,
        row.user_login,
        row.user_email,
        row.role_name,
        row.role_code,
        row.account_status,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword),
      );
    });
  }, [rows, search]);

  const defaultUserRoleId = useMemo(() => {
    const role = roles.find(
      (item) =>
        item.role_code.toLowerCase() === "user",
    );

    return role?.role_id
      ? String(role.role_id)
      : "";
  }, [roles]);

  const handleOpenCreate = (row) => {
    setDialogErrorText("");
    setCreateRow(row);
    setCreateForm({
      user_login: "",
      user_email: row?.employee_email || "",
      password: "",
      confirm_password: "",
      role_id: defaultUserRoleId,
    });
  };

  const handleOpenEdit = (row) => {
    setDialogErrorText("");
    setEditRow(row);
    setEditForm({
      user_email: row?.user_email || "",
      new_password: "",
      confirm_password: "",
      role_id: row?.role_id
        ? String(row.role_id)
        : defaultUserRoleId,
    });
  };

  const handleCreate = async () => {
    if (!createRow?.employee_id) {
      return;
    }

    const userLogin = String(
      createForm.user_login || "",
    ).trim();

    const userEmail = String(
      createForm.user_email || "",
    ).trim();

    const password = String(
      createForm.password || "",
    );

    const roleId = Number(
      createForm.role_id || 0,
    );

    if (!userLogin) {
      setDialogErrorText("請輸入登入帳號。");
      return;
    }

    if (!userEmail) {
      setDialogErrorText("請輸入登入 Email。");
      return;
    }

    if (!password) {
      setDialogErrorText("請輸入密碼。");
      return;
    }

    if (
      password !==
      createForm.confirm_password
    ) {
      setDialogErrorText(
        "密碼與確認密碼不一致。",
      );
      return;
    }

    if (roleId <= 0) {
      setDialogErrorText("請選擇系統角色。");
      return;
    }

    setSaving(true);
    setDialogErrorText("");

    try {
      await createHrmsAccount({
        employee_id: createRow.employee_id,
        user_login: userLogin,
        user_email: userEmail,
        password,
        role_id: roleId,
      });

      setCreateRow(null);

      await loadPage();

      setSuccessDialog({
        open: true,
        title: "建立成功",
        message: "HRMS 帳號已建立並綁定至員工。",
      });
    } catch (error) {
      setDialogErrorText(
        getErrorMessage(
          error,
          "建立 HRMS 帳號失敗。",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editRow?.employee_id) {
      return;
    }

    const userEmail = String(
      editForm.user_email || "",
    ).trim();

    const newPassword = String(
      editForm.new_password || "",
    );

    const roleId = Number(
      editForm.role_id || 0,
    );

    if (!userEmail) {
      setDialogErrorText("請輸入登入 Email。");
      return;
    }

    if (roleId <= 0) {
      setDialogErrorText("請選擇系統角色。");
      return;
    }

    if (
      newPassword &&
      newPassword !==
        editForm.confirm_password
    ) {
      setDialogErrorText(
        "新密碼與確認新密碼不一致。",
      );
      return;
    }

    setSaving(true);
    setDialogErrorText("");

    try {
      await updateHrmsAccount(
        editRow.employee_id,
        {
          user_email: userEmail,
          role_id: roleId,
          new_password: newPassword,
        },
      );

      setEditRow(null);

      await loadPage();

      setSuccessDialog({
        open: true,
        title: "更新成功",
        message: "HRMS 帳號資料已更新。",
      });
    } catch (error) {
      setDialogErrorText(
        getErrorMessage(
          error,
          "更新 HRMS 帳號失敗。",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow?.employee_id) {
      return;
    }

    setSaving(true);
    setErrorText("");

    try {
      await deleteHrmsAccount(
        deleteRow.employee_id,
      );

      setDeleteRow(null);

      await loadPage();

      setSuccessDialog({
        open: true,
        title: "刪除成功",
        message:
          "HRMS 帳號已刪除，員工資料仍保留。",
      });
    } catch (error) {
      setErrorText(
        getErrorMessage(
          error,
          "刪除 HRMS 帳號失敗。",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const renderValue = (row, column) => {
    if (column.key === "actions") {
      if (!row.wp_user_id) {
        return (
          <Tooltip title="建立帳號">
            <IconButton
              size="small"
              onClick={() =>
                handleOpenCreate(row)
              }
              aria-label="建立帳號"
            >
              <AddOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      }

      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
          }}
        >
          <Tooltip title="編輯帳號">
            <IconButton
              size="small"
              onClick={() =>
                handleOpenEdit(row)
              }
              aria-label="編輯帳號"
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="刪除帳號">
            <IconButton
              size="small"
              color="error"
              onClick={() =>
                setDeleteRow(row)
              }
              aria-label="刪除帳號"
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }

    return displayValue(row?.[column.key]);
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      <Breadcrumb
        rootLabel="管理者專區"
        rootTo="/attendance"
        currentLabel="帳號管理"
        mb="14px"
      />

      <Typography
        component="h1"
        sx={{
          mb: 2,
          fontSize: {
            xs: "22px",
            sm: "25px",
            md: "28px",
          },
          fontWeight: 700,
          color: "#111827",
        }}
      >
        帳號管理
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: "14px", sm: "18px" },
          borderColor: "#d1d5db",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            mb: "24px",
            display: "flex",
            alignItems: {
              xs: "stretch",
              sm: "center",
            },
            justifyContent: "space-between",
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: "10px",
          }}
        >
          <TextField
            size="small"
            value={search}
            placeholder="員工編號、姓名、帳號或 Email"
            onChange={(event) =>
              setSearch(event.target.value)
            }
            sx={{
              width: {
                xs: "100%",
                sm: "360px",
              },
              "& .MuiInputBase-root": {
                height: "38px",
                fontSize: "15px",
              },
            }}
          />

          <Button
            variant="outlined"
            startIcon={
              loading ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <RefreshOutlinedIcon />
              )
            }
            disabled={loading}
            onClick={loadPage}
            sx={{
              height: "38px",
              whiteSpace: "nowrap",
            }}
          >
            重新整理
          </Button>
        </Box>

        {errorText ? (
          <Alert
            severity="error"
            sx={{ mb: "16px" }}
          >
            {errorText}
          </Alert>
        ) : null}

        {loading ? (
          <Box
            sx={{
              py: "48px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : (
          <ResponsiveAttendanceTable
            columns={TABLE_COLUMNS}
            rows={filteredRows}
            getRowKey={(row) =>
              row.employee_id
            }
            mobileCardTitleKey="display_name"
            mobileCardEndKey="account_status"
            emptyText="查無員工資料"
            renderValue={renderValue}
            pagination
            rowsPerPage={10}
            fitToContainer
          />
        )}
      </Paper>

      <FormDialog
        open={Boolean(createRow)}
        title="建立 HRMS 帳號"
        submitLabel="建立帳號"
        cancelLabel="取消"
        submitting={saving}
        scrollToTopSignal={dialogErrorText}
        onClose={() => {
          if (saving) return;

          setCreateRow(null);
          setDialogErrorText("");
        }}
        onSubmit={handleCreate}
      >
        {dialogErrorText ? (
          <Alert severity="error">
            {dialogErrorText}
          </Alert>
        ) : null}

        <TextField
          label="員工"
          size="small"
          value={
            createRow
              ? `${createRow.employee_no || ""}${
                  createRow.employee_no &&
                  createRow.display_name
                    ? " / "
                    : ""
                }${createRow.display_name || ""}`
              : ""
          }
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />

        <TextField
          label="登入帳號"
          size="small"
          required
          value={createForm.user_login}
          onChange={(event) =>
            setCreateForm((previous) => ({
              ...previous,
              user_login: event.target.value,
            }))
          }
        />

        <TextField
          label="登入 Email"
          type="email"
          size="small"
          required
          value={createForm.user_email}
          onChange={(event) =>
            setCreateForm((previous) => ({
              ...previous,
              user_email: event.target.value,
            }))
          }
        />

        <TextField
          select
          label="系統角色"
          size="small"
          required
          value={createForm.role_id}
          onChange={(event) =>
            setCreateForm((previous) => ({
              ...previous,
              role_id: event.target.value,
            }))
          }
          helperText="一般使用者只能使用一般模式；系統管理員可切換一般模式與管理員模式。"
        >
          <MenuItem value="">
            -- 請選擇 --
          </MenuItem>

          {roles.map((role) => (
            <MenuItem
              key={role.role_id}
              value={String(role.role_id)}
            >
              {role.role_name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="密碼"
          type="password"
          size="small"
          required
          value={createForm.password}
          onChange={(event) =>
            setCreateForm((previous) => ({
              ...previous,
              password: event.target.value,
            }))
          }
        />

        <TextField
          label="確認密碼"
          type="password"
          size="small"
          required
          value={createForm.confirm_password}
          onChange={(event) =>
            setCreateForm((previous) => ({
              ...previous,
              confirm_password: event.target.value,
            }))
          }
        />
      </FormDialog>

      <FormDialog
        open={Boolean(editRow)}
        title="編輯 HRMS 帳號"
        submitLabel="儲存"
        cancelLabel="取消"
        submitting={saving}
        scrollToTopSignal={dialogErrorText}
        onClose={() => {
          if (saving) return;

          setEditRow(null);
          setDialogErrorText("");
        }}
        onSubmit={handleUpdate}
      >
        {dialogErrorText ? (
          <Alert severity="error">
            {dialogErrorText}
          </Alert>
        ) : null}

        <TextField
          label="員工"
          size="small"
          value={
            editRow
              ? `${editRow.employee_no || ""}${
                  editRow.employee_no &&
                  editRow.display_name
                    ? " / "
                    : ""
                }${editRow.display_name || ""}`
              : ""
          }
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />

        <TextField
          label="登入帳號"
          size="small"
          value={editRow?.user_login || ""}
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
          helperText="登入帳號建立後不可變更。"
        />

        <TextField
          label="登入 Email"
          type="email"
          size="small"
          required
          value={editForm.user_email}
          onChange={(event) =>
            setEditForm((previous) => ({
              ...previous,
              user_email: event.target.value,
            }))
          }
        />

        <TextField
          select
          label="系統角色"
          size="small"
          required
          value={editForm.role_id}
          onChange={(event) =>
            setEditForm((previous) => ({
              ...previous,
              role_id: event.target.value,
            }))
          }
          helperText="一般使用者只能使用一般模式；系統管理員可切換一般模式與管理員模式。"
        >
          <MenuItem value="">
            -- 請選擇 --
          </MenuItem>

          {roles.map((role) => (
            <MenuItem
              key={role.role_id}
              value={String(role.role_id)}
            >
              {role.role_name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="新密碼"
          type="password"
          size="small"
          value={editForm.new_password}
          onChange={(event) =>
            setEditForm((previous) => ({
              ...previous,
              new_password: event.target.value,
            }))
          }
          helperText="如不需變更密碼，請留空。"
        />

        <TextField
          label="確認新密碼"
          type="password"
          size="small"
          value={editForm.confirm_password}
          onChange={(event) =>
            setEditForm((previous) => ({
              ...previous,
              confirm_password: event.target.value,
            }))
          }
        />
      </FormDialog>

      <Dialog
        open={Boolean(deleteRow)}
        onClose={
          saving
            ? undefined
            : () => setDeleteRow(null)
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          刪除 HRMS 帳號
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning">
            將刪除
            {deleteRow?.display_name
              ? `「${deleteRow.display_name}」`
              : "此員工"}
            的 HRMS 登入帳號，但不會刪除員工資料。確定要繼續嗎？
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            disabled={saving}
            onClick={() =>
              setDeleteRow(null)
            }
          >
            取消
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={saving}
            onClick={handleDelete}
          >
            {saving
              ? "刪除中..."
              : "確認刪除"}
          </Button>
        </DialogActions>
      </Dialog>

      <SuccessDialog
        open={successDialog.open}
        title={successDialog.title}
        message={successDialog.message}
        onClose={() =>
          setSuccessDialog({
            open: false,
            title: "",
            message: "",
          })
        }
      />
    </Box>
  );
}