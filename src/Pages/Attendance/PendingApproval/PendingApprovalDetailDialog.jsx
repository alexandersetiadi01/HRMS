import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function Field({ label, value }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "92px minmax(0, 1fr)",
        columnGap: "10px",
        alignItems: "start",
      }}
    >
      <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "15px",
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {value || "-"}
      </Typography>
    </Box>
  );
}

function buildLeaveEntitlementFields(row) {
  const raw = row?.raw || {};

  const leaveName = String(
    raw?.leave_name || raw?.leave_type_name || "特殊假",
  ).trim();

  const relationType = String(
    raw?.relation_type || raw?.condition_value || raw?.condition_label || "",
  ).trim();

  const displayName = relationType
    ? `${leaveName} - ${relationType}`
    : leaveName;

  const eventDate = raw?.event_date
    ? String(raw.event_date).replaceAll("-", "/")
    : "-";

  const requestYear = raw?.request_year || "-";

  return [
    { label: "假別", value: displayName },
    { label: "事件日期", value: eventDate },
    { label: "年度", value: requestYear },
    { label: "事由", value: row?.reason || "-" },
  ];
}

export default function PendingApprovalDetailDialog({
  open,
  row,
  submitting = false,
  onClose,
  onAction,
  onRequestDelete,
  canDeleteRow,
  canApproveRow,
  canRejectRow,
}) {
  const showDelete = canDeleteRow?.(row);
  const showReject = canRejectRow?.(row);
  const showApprove = canApproveRow?.(row);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: "8px",
        }}
      >
        <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
          表單詳情
        </Typography>

        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Field label="表單類型" value={row?.formType} />
          <Field label="狀態" value={row?.statusLabel} />
          <Field label="申請人" value={row?.applicant} />
          <Field label="日期" value={row?.date} />

          {row?.type === "leave_entitlement" ? (
            buildLeaveEntitlementFields(row).map((item, index) => (
              <Field key={index} label={item.label} value={item.value} />
            ))
          ) : (
            <>
              <Field label="內容" value={row?.content} />
              <Field label="事由" value={row?.reason} />
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: "16px", py: "12px", gap: "8px" }}>
        {showDelete ? (
          <Button
            variant="outlined"
            color="error"
            onClick={() => onRequestDelete?.(row)}
            disabled={submitting}
          >
            刪除
          </Button>
        ) : null}

        {showReject ? (
          <Button
            variant="outlined"
            onClick={() => onAction?.(row, "reject")}
            disabled={submitting}
          >
            駁回
          </Button>
        ) : null}

        {showApprove ? (
          <Button
            variant="contained"
            onClick={() => onAction?.(row, "approve")}
            disabled={submitting}
          >
            核准
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
