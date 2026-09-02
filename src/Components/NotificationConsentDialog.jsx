import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import {
  fetchNotificationPreferences,
  savePushSubscription,
  updateNotificationPreferences,
} from "../API/notification";
import {
  getBrowserNotificationPermission,
  getBrowserPushSupport,
  requestBrowserNotificationPermission,
  serializeBrowserPushSubscription,
  subscribeBrowserToPush,
} from "../Utils/Notifications/PushSubscription";
import {
  getStoredNotificationConsent,
  saveNotificationConsent,
} from "../Utils/Notifications/NotificationConsent";

function getErrorMessage(error) {
  return (
    error?.response?.data?.message
    || error?.response?.data?.data?.message
    || error?.message
    || "無法完成裝置通知設定，請稍後再試。"
  );
}

export default function NotificationConsentDialog({
  enabled,
  employeeId,
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [vapidPublicKey, setVapidPublicKey] = useState("");

  useEffect(() => {
    let active = true;

    async function initializeNotificationConsent() {
      await Promise.resolve();

      if (!enabled || !employeeId) {
        return;
      }

      const support = getBrowserPushSupport();

      if (!support.supported) {
        return;
      }

      const browserPermission = (
        getBrowserNotificationPermission()
      );

      if (browserPermission === "denied") {
        saveNotificationConsent(employeeId, "denied");
        return;
      }

      const storedConsent = getStoredNotificationConsent(
        employeeId,
      );

      if (storedConsent?.status === "denied") {
        return;
      }

      try {
        const preferences = await fetchNotificationPreferences();

        if (!active) {
          return;
        }

        const pushAvailable = Boolean(
          preferences?.push_config?.available,
        );

        const publicKey = String(
          preferences?.push_config?.vapid_public_key || "",
        ).trim();

        if (!pushAvailable || !publicKey) {
          return;
        }

        setVapidPublicKey(publicKey);

        if (
          storedConsent?.status === "granted"
          && browserPermission === "granted"
        ) {
          const subscription = await subscribeBrowserToPush(
            publicKey,
          );

          await savePushSubscription(
            serializeBrowserPushSubscription(subscription),
          );

          return;
        }

        if (active) {
          setOpen(true);
        }
      } catch (error) {
        if (active) {
          setErrorText(getErrorMessage(error));
          setOpen(true);
        }
      }
    }

    initializeNotificationConsent();

    return () => {
      active = false;
    };
  }, [enabled, employeeId]);

  async function handleAllow() {
    setSubmitting(true);
    setErrorText("");

    try {
      const permission = await (
        requestBrowserNotificationPermission()
      );

      if (permission === "denied") {
        await updateNotificationPreferences({
          push_enabled: false,
          push_permission_state: "denied",
        });

        saveNotificationConsent(employeeId, "denied");
        setOpen(false);
        return;
      }

      if (permission !== "granted") {
        setErrorText(
          "尚未取得裝置通知權限。請選擇允許後再試一次。",
        );
        return;
      }

      if (!vapidPublicKey) {
        throw new Error("找不到裝置通知公開金鑰。");
      }

      const subscription = await subscribeBrowserToPush(
        vapidPublicKey,
      );

      await savePushSubscription(
        serializeBrowserPushSubscription(subscription),
      );

      saveNotificationConsent(employeeId, "granted");
      setOpen(false);
    } catch (error) {
      setErrorText(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeny() {
    setSubmitting(true);
    setErrorText("");

    try {
      const permission = getBrowserNotificationPermission();

      await updateNotificationPreferences({
        push_enabled: false,
        push_permission_state: permission === "unsupported"
          ? "unsupported"
          : permission,
      });

      saveNotificationConsent(employeeId, "denied");
      setOpen(false);
    } catch (error) {
      setErrorText(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ pb: "8px" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <NotificationsOutlinedIcon
            sx={{ color: "#1698dc", fontSize: "28px" }}
          />

          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            裝置通知同意
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: "4px !important" }}>
        <Typography
          sx={{
            fontSize: "15px",
            lineHeight: 1.8,
            color: "#374151",
          }}
        >
          同意後，SEHO HR 可以將下班打卡提醒、薪資單、最新消息、部門公告及指派任務通知傳送到此裝置。
          <br />
          <br />
          即使您選擇不同意，網站內的通知、未讀數量及提醒標記仍會正常顯示。
          直接指派給您的項目仍可能寄送到註冊帳號的電子郵件。
        </Typography>

        {errorText ? (
          <Alert severity="error" sx={{ mt: "16px" }}>
            {errorText}
          </Alert>
        ) : null}
      </DialogContent>

      <DialogActions
        sx={{
          px: "24px",
          pb: "20px",
          gap: "8px",
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="outlined"
          onClick={handleDeny}
          disabled={submitting}
          sx={{
            minWidth: "96px",
            borderRadius: "10px",
            fontWeight: 700,
          }}
        >
          不同意
        </Button>

        <Button
          variant="contained"
          onClick={handleAllow}
          disabled={submitting}
          startIcon={
            submitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
          sx={{
            minWidth: "96px",
            borderRadius: "10px",
            fontWeight: 700,
          }}
        >
          {submitting ? "設定中" : "同意"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}