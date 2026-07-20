import { useId, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import useNotifications from "../../Contexts/UseNotification";

const NOTIFICATION_PREVIEW_LENGTH = 60;

function normalizeNotificationText(value) {
  return String(value || "").trim();
}

function getNotificationTextPreview(value) {
  const text = normalizeNotificationText(value);
  const characters = Array.from(text);

  if (characters.length <= NOTIFICATION_PREVIEW_LENGTH) {
    return text;
  }

  return `${characters
    .slice(0, NOTIFICATION_PREVIEW_LENGTH)
    .join("")
    .trimEnd()}...`;
}

function notificationNeedsExpansion(notification) {
  const subjectLength = Array.from(
    normalizeNotificationText(notification?.subject),
  ).length;

  const messageLength = Array.from(
    normalizeNotificationText(notification?.message),
  ).length;

  return (
    subjectLength > NOTIFICATION_PREVIEW_LENGTH ||
    messageLength > NOTIFICATION_PREVIEW_LENGTH
  );
}

function formatNotificationTime(value) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "";
  }

  const date = new Date(normalizedValue.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return normalizedValue;
  }

  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function normalizeTargetPath(value) {
  const targetPath = String(value || "").trim();

  return targetPath.startsWith("/") ? targetPath : "";
}

function getNotificationTargetPath(notification) {
  const sourceType = String(notification?.source_type || "");

  const sourceId = Number(notification?.source_id || 0);

  if (sourceId > 0) {
    const sourceRoutes = {
      payroll_result: "/payroll",
      department_announcement: "/announcement",
      news: "/latest-news",
      task_assignee: "/to-do-list",
      sticky_note_recipient: "/sticky-note",
    };

    if (sourceRoutes[sourceType]) {
      return `${sourceRoutes[sourceType]}` + `?highlight=${sourceId}`;
    }
  }

  return normalizeTargetPath(notification?.target_path);
}

export default function NotificationBell({
  iconColor = "#8b8b8b",
  iconSize = 27,
}) {
  const navigate = useNavigate();
  const menuId = useId();

  const [anchorElement, setAnchorElement] = useState(null);

  const [opening, setOpening] = useState(false);
  const [selectedId, setSelectedId] = useState(0);
  const [actionError, setActionError] = useState("");
  const [expandedIds, setExpandedIds] = useState([]);

  const {
    notifications,
    totalUnread,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    dismissNotification,
  } = useNotifications();

  const open = Boolean(anchorElement);

  async function handleOpen(event) {
    setAnchorElement(event.currentTarget);
    setActionError("");
    setOpening(true);

    try {
      await refreshNotifications({
        silent: true,
      });
    } finally {
      setOpening(false);
    }
  }

  function handleClose() {
    setAnchorElement(null);
    setActionError("");
    setExpandedIds([]);
  }

  async function handleNotificationClick(notification) {
    const notificationId = Number(notification?.notification_id || 0);

    const targetPath = getNotificationTargetPath(notification);

    setActionError("");
    setSelectedId(notificationId);

    try {
      if (
        notificationId &&
        !notification?.is_read &&
        notification?.notification_type === "clock_out_reminder"
      ) {
        await markAsRead(notificationId);
      }

      handleClose();

      if (targetPath) {
        navigate(targetPath);
      }
    } catch (clickError) {
      setActionError(
        clickError?.response?.data?.message ||
          clickError?.response?.data?.data?.message ||
          clickError?.message ||
          "無法更新通知狀態，請稍後再試。",
      );
    } finally {
      setSelectedId(0);
    }
  }

  async function handleDismiss(event, notification) {
    event.stopPropagation();

    const notificationId = Number(notification?.notification_id || 0);

    if (!notificationId) {
      return;
    }

    setActionError("");
    setSelectedId(notificationId);

    try {
      await dismissNotification(notificationId);

      setExpandedIds((currentIds) =>
        currentIds.filter((id) => id !== notificationId),
      );
    } catch (dismissError) {
      setActionError(
        dismissError?.response?.data?.message ||
          dismissError?.response?.data?.data?.message ||
          dismissError?.message ||
          "無法移除通知，請稍後再試。",
      );
    } finally {
      setSelectedId(0);
    }
  }

  function handleToggleExpanded(event, notificationId) {
    event.stopPropagation();

    if (!notificationId) {
      return;
    }

    setExpandedIds((currentIds) => {
      if (currentIds.includes(notificationId)) {
        return currentIds.filter((id) => id !== notificationId);
      }

      return [...currentIds, notificationId];
    });
  }

  return (
    <>
      <IconButton
        type="button"
        aria-label={`通知，${totalUnread} 則未讀`}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleOpen}
        sx={{
          color: iconColor,
          flexShrink: 0,
          width: "40px",
          height: "40px",
          "&:hover": {
            bgcolor: "#f3f4f6",
          },
        }}
      >
        <Badge
          color="error"
          badgeContent={totalUnread}
          max={99}
          overlap="circular"
          invisible={totalUnread <= 0}
          sx={{
            "& .MuiBadge-badge": {
              minWidth: "18px",
              height: "18px",
              px: "4px",
              fontSize: "10px",
              fontWeight: 700,
            },
          }}
        >
          <NotificationsIcon
            sx={{
              fontSize: iconSize,
            }}
          />
        </Badge>
      </IconButton>

      <Popover
        id={menuId}
        open={open}
        anchorEl={anchorElement}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: {
                xs: "calc(100vw - 24px)",
                sm: "380px",
              },
              maxWidth: "380px",
              mt: "6px",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 14px 34px " + "rgba(15, 23, 42, 0.18)",
            },
          },
        }}
      >
        <Box
          sx={{
            px: "16px",
            py: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "#ffffff",
          }}
        >
          <Typography
            sx={{
              fontSize: "17px",
              fontWeight: 700,
              color: "#1f2937",
            }}
          >
            通知
          </Typography>

          <Typography
            sx={{
              fontSize: "12px",
              color: totalUnread > 0 ? "#dc2626" : "#9ca3af",
              fontWeight: totalUnread > 0 ? 700 : 400,
            }}
          >
            {totalUnread} 則未讀
          </Typography>
        </Box>

        <Divider />

        {actionError || error ? (
          <Alert
            severity="error"
            sx={{
              m: "12px",
              fontSize: "13px",
            }}
          >
            {actionError || error}
          </Alert>
        ) : null}

        <Box
          sx={{
            maxHeight: {
              xs: "min(60vh, 460px)",
              sm: "460px",
            },
            overflowY: "auto",
            bgcolor: "#ffffff",
          }}
        >
          {(loading || opening) && notifications.length === 0 ? (
            <Box
              sx={{
                minHeight: "130px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : null}

          {!loading && !opening && notifications.length === 0 ? (
            <Box
              sx={{
                minHeight: "130px",
                px: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#9ca3af",
                }}
              >
                目前沒有通知
              </Typography>
            </Box>
          ) : null}

          {notifications.map((notification, index) => {
            const notificationId = Number(notification?.notification_id || 0);

            const isUnread = !notification?.is_read;
            const isSelected = selectedId === notificationId;

            const isExpanded = expandedIds.includes(notificationId);

            const canExpand = notificationNeedsExpansion(notification);

            const subject =
              normalizeNotificationText(notification?.subject) || "未命名通知";

            const message = normalizeNotificationText(notification?.message);

            return (
              <Box key={notificationId || `${index}`}>
                <Box
                  role="button"
                  tabIndex={isSelected ? -1 : 0}
                  aria-disabled={isSelected}
                  onClick={() => {
                    handleNotificationClick(notification);
                  }}
                  onKeyDown={(event) => {
                    if (
                      !isSelected &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();

                      handleNotificationClick(notification);
                    }
                  }}
                  sx={{
                    width: "100%",
                    border: 0,
                    px: "16px",
                    py: "13px",
                    bgcolor: isUnread ? "#f0f9ff" : "#ffffff",
                    display: "grid",
                    gridTemplateColumns: "10px minmax(0, 1fr) " + "auto 24px",
                    gap: "10px",
                    alignItems: "start",
                    textAlign: "left",
                    cursor: isSelected ? "wait" : "pointer",
                    opacity: isSelected ? 0.65 : 1,
                    "&:hover": {
                      bgcolor: isUnread ? "#e0f2fe" : "#f9fafb",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: "8px",
                      height: "8px",
                      mt: "6px",
                      borderRadius: "50%",
                      bgcolor: isUnread ? "#ef4444" : "transparent",
                    }}
                  />

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        minWidth: 0,
                        fontSize: "14px",
                        lineHeight: 1.45,
                        fontWeight: isUnread ? 700 : 400,
                        color: "#1f2937",
                        overflowWrap: "anywhere",
                        whiteSpace: isExpanded ? "pre-wrap" : "normal",
                      }}
                    >
                      {isExpanded
                        ? subject
                        : getNotificationTextPreview(subject)}
                    </Typography>

                    {message ? (
                      <Typography
                        sx={{
                          mt: "4px",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          fontWeight: 400,
                          color: "#64748b",
                          overflowWrap: "anywhere",
                          whiteSpace: isExpanded ? "pre-wrap" : "normal",
                        }}
                      >
                        {isExpanded
                          ? message
                          : getNotificationTextPreview(message)}
                      </Typography>
                    ) : null}

                    {canExpand ? (
                      <Button
                        type="button"
                        size="small"
                        aria-expanded={isExpanded}
                        onClick={(event) =>
                          handleToggleExpanded(event, notificationId)
                        }
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                        endIcon={
                          isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                        }
                        sx={{
                          minWidth: 0,
                          mt: "3px",
                          p: 0,
                          color: "#0284c7",
                          fontSize: "12px",
                          lineHeight: 1.4,
                          textTransform: "none",
                          "& .MuiButton-endIcon": {
                            ml: "2px",
                          },
                          "& .MuiSvgIcon-root": {
                            fontSize: "17px",
                          },
                          "&:hover": {
                            bgcolor: "transparent",
                            color: "#0369a1",
                          },
                        }}
                      >
                        {isExpanded ? "收合" : "展開"}
                      </Button>
                    ) : null}
                  </Box>

                  <Typography
                    sx={{
                      pt: "2px",
                      fontSize: "11px",
                      color: "#9ca3af",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatNotificationTime(notification?.created_at)}
                  </Typography>

                  <IconButton
                    type="button"
                    size="small"
                    aria-label="移除此通知"
                    disabled={isSelected}
                    onClick={(event) => handleDismiss(event, notification)}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                    }}
                    sx={{
                      width: "24px",
                      height: "24px",
                      p: 0,
                      color: "#9ca3af",
                      "&:hover": {
                        color: "#dc2626",
                        bgcolor: "#fee2e2",
                      },
                    }}
                  >
                    <CloseIcon
                      sx={{
                        fontSize: "17px",
                      }}
                    />
                  </IconButton>
                </Box>

                {index < notifications.length - 1 ? <Divider /> : null}
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}
