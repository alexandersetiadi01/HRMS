import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import FormDialog from "../../../../Components/FormDialog";
import SuccessDialog from "../../../../Components/SuccessDialog";
import ResponsiveAttendanceTable from "../../AttendanceForm/ResponsiveAttendanceTable";
import {
  apiAttendancePunchLocations,
  apiCreateAttendancePunchLocation,
  apiDeleteAttendancePunchLocation,
  apiUpdateAttendancePunchLocation,
} from "../../../../API/attendance";

const INITIAL_FORM = {
  location_name: "",
  latitude: "",
  longitude: "",
  radius_meters: "50",
  allow_app_location: true,
  status: "啟用",
};

const TABLE_COLUMNS = [
  { key: "location_name", label: "地點名稱", width: "1.4fr" },
  { key: "latitude", label: "緯度", width: "1.2fr" },
  { key: "longitude", label: "經度", width: "1.2fr" },
  { key: "radius_meters", label: "允許範圍", width: "1fr" },
  { key: "allow_app_location", label: "允許APP定位打卡", width: "1.3fr" },
  { key: "status", label: "狀態", width: "0.8fr" },
  { key: "actions", label: "操作", width: "100px" },
];

function normalizeRows(response) {
  const payload = response?.data?.data || response?.data || response || [];
  return Array.isArray(payload) ? payload : [];
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export default function ClockLocationSettingsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErrorText, setLoadErrorText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrorText, setFormErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(0);
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const loadRows = async () => {
    setLoading(true);
    setLoadErrorText("");

    try {
      const response = await apiAttendancePunchLocations();
      setRows(normalizeRows(response));
    } catch (error) {
      console.error("Failed to load punch locations:", error);
      setRows([]);
      setLoadErrorText(
        getErrorMessage(error, "地點設定載入失敗。"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const displayRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        latitude:
          row.location_type === "other" || row.latitude === null
            ? "-"
            : String(row.latitude),
        longitude:
          row.location_type === "other" || row.longitude === null
            ? "-"
            : String(row.longitude),
        radius_meters:
          row.location_type === "other" || row.radius_meters === null
            ? "-"
            : `${row.radius_meters} 公尺`,
        allow_app_location:
          Number(row.allow_app_location || 0) === 1 ? "是" : "否",
      })),
    [rows],
  );

  const handleOpenCreate = () => {
    setEditingRow(null);
    setForm(INITIAL_FORM);
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleOpenEdit = (row) => {
    const source = rows.find(
      (item) =>
        Number(item.location_id || 0) ===
        Number(row.location_id || 0),
    );

    if (!source) return;

    setEditingRow(source);
    setForm({
      location_name: String(source.location_name || ""),
      latitude:
        source.latitude === null
          ? ""
          : String(source.latitude),
      longitude:
        source.longitude === null
          ? ""
          : String(source.longitude),
      radius_meters:
        source.radius_meters === null
          ? ""
          : String(source.radius_meters),
      allow_app_location:
        Number(source.allow_app_location || 0) === 1,
      status: String(source.status || "啟用"),
    });
    setFormErrorText("");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    if (submitting) return;

    setFormOpen(false);
    setEditingRow(null);
    setForm(INITIAL_FORM);
    setFormErrorText("");
  };

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const isOther =
      String(editingRow?.location_type || "") === "other";

    if (!isOther && !form.location_name.trim()) {
      return "請輸入地點名稱。";
    }

    if (isOther) {
      return "";
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const radiusMeters = Number(form.radius_meters);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return "緯度必須介於 -90 至 90。";
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return "經度必須介於 -180 至 180。";
    }

    if (
      !Number.isFinite(radiusMeters) ||
      radiusMeters <= 0
    ) {
      return "允許範圍必須大於 0 公尺。";
    }

    return "";
  };

  const buildPayload = () => {
    const isOther =
      String(editingRow?.location_type || "") === "other";

    if (isOther) {
      return {
        allow_app_location: form.allow_app_location ? 1 : 0,
        status: form.status,
      };
    }

    return {
      location_name: form.location_name.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius_meters: Number(form.radius_meters),
      allow_app_location: form.allow_app_location ? 1 : 0,
      status: form.status,
    };
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const validationError = validateForm();

    if (validationError) {
      setFormErrorText(validationError);
      return;
    }

    setSubmitting(true);
    setFormErrorText("");

    try {
      const payload = buildPayload();

      if (editingRow) {
        await apiUpdateAttendancePunchLocation(
          editingRow.location_id,
          payload,
        );
      } else {
        await apiCreateAttendancePunchLocation(payload);
      }

      await loadRows();

      const message = editingRow
        ? "地點設定已成功更新。"
        : "地點設定已成功新增。";

      setFormOpen(false);
      setEditingRow(null);
      setForm(INITIAL_FORM);
      setSuccessDialog({
        open: true,
        title: "操作成功",
        message,
      });
    } catch (error) {
      console.error("Failed to save punch location:", error);
      setFormErrorText(
        getErrorMessage(error, "地點設定儲存失敗。"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const locationId = Number(row.location_id || 0);

    if (
      locationId <= 0 ||
      row.location_type === "other" ||
      deletingId > 0
    ) {
      return;
    }

    const confirmed = window.confirm(
      `確定要刪除「${row.location_name}」嗎？`,
    );

    if (!confirmed) return;

    setDeletingId(locationId);

    try {
      await apiDeleteAttendancePunchLocation(locationId);
      await loadRows();

      setSuccessDialog({
        open: true,
        title: "刪除成功",
        message: "地點設定已成功刪除。",
      });
    } catch (error) {
      console.error("Failed to delete punch location:", error);
      setLoadErrorText(
        getErrorMessage(error, "地點設定刪除失敗。"),
      );
    } finally {
      setDeletingId(0);
    }
  };

  const renderValue = (row, column) => {
    if (column.key === "actions") {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <Tooltip title="編輯">
            <IconButton
              size="small"
              onClick={() => handleOpenEdit(row)}
              aria-label="編輯"
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {row.location_type !== "other" ? (
            <Tooltip title="刪除">
              <span>
                <IconButton
                  size="small"
                  disabled={
                    deletingId ===
                    Number(row.location_id || 0)
                  }
                  onClick={() => handleDelete(row)}
                  aria-label="刪除"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Box>
      );
    }

    return row[column.key] ?? "-";
  };

  const isOther =
    String(editingRow?.location_type || "") === "other";

  return (
    <Box>
      <Box
        sx={{
          mb: "18px",
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: "12px",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            地點設定
          </Typography>

          <Typography
            sx={{
              mt: "4px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            設定APP定位打卡可辨識的地點及座標範圍。
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={handleOpenCreate}
        >
          新增
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: "16px" }}>
        座標請使用地圖網址中的經緯度。定位不屬於已設定地點時，系統將視為「其他」。
      </Alert>

      {loadErrorText ? (
        <Alert severity="error" sx={{ mb: "16px" }}>
          {loadErrorText}
        </Alert>
      ) : null}

      {loading ? (
        <Box
          sx={{
            minHeight: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={30} />
        </Box>
      ) : (
        <ResponsiveAttendanceTable
          columns={TABLE_COLUMNS}
          rows={displayRows}
          getRowKey={(row) => row.location_id}
          mobileCardTitleKey="location_name"
          desktopMinWidth="900px"
          emptyText="查無地點設定"
          renderValue={renderValue}
          fitToContainer
        />
      )}

      <FormDialog
        open={formOpen}
        title={
          isOther
            ? "編輯其他"
            : editingRow
              ? "編輯地點設定"
              : "新增地點設定"
        }
        submitting={submitting}
        submitLabel="儲存"
        maxWidth="sm"
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
      >
        {formErrorText ? (
          <Alert severity="error">
            {formErrorText}
          </Alert>
        ) : null}

        {isOther ? (
          <Alert severity="info">
            「其他」代表目前定位不屬於任何已設定地點時的打卡方式。
          </Alert>
        ) : (
          <>
            <TextField
              label="地點名稱"
              value={form.location_name}
              onChange={(event) =>
                handleChange(
                  "location_name",
                  event.target.value,
                )
              }
              size="small"
              fullWidth
              required
            />

            <TextField
              label="緯度"
              type="number"
              value={form.latitude}
              onChange={(event) =>
                handleChange(
                  "latitude",
                  event.target.value,
                )
              }
              size="small"
              fullWidth
              required
              slotProps={{
                htmlInput: {
                  step: "0.0000001",
                  min: -90,
                  max: 90,
                },
              }}
            />

            <TextField
              label="經度"
              type="number"
              value={form.longitude}
              onChange={(event) =>
                handleChange(
                  "longitude",
                  event.target.value,
                )
              }
              size="small"
              fullWidth
              required
              slotProps={{
                htmlInput: {
                  step: "0.0000001",
                  min: -180,
                  max: 180,
                },
              }}
            />

            <TextField
              label="允許範圍"
              type="number"
              value={form.radius_meters}
              onChange={(event) =>
                handleChange(
                  "radius_meters",
                  event.target.value,
                )
              }
              size="small"
              fullWidth
              required
              slotProps={{
                htmlInput: {
                  min: 1,
                  step: 1,
                },
              }}
              helperText="單位：公尺"
            />
          </>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={form.allow_app_location}
              onChange={(event) =>
                handleChange(
                  "allow_app_location",
                  event.target.checked,
                )
              }
            />
          }
          label="允許APP定位打卡"
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.status === "啟用"}
              onChange={(event) =>
                handleChange(
                  "status",
                  event.target.checked
                    ? "啟用"
                    : "停用",
                )
              }
            />
          }
          label="啟用"
        />
      </FormDialog>

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