import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { NavLink, useNavigate } from "react-router-dom";
import MenuTile from "../MenuTile";
import {
  getDrawerBottomItems,
  getMenuItemsByIds,
} from "../../Utils/Menu/MenuRegistry";
import { loadMobileDrawerShortcutIds } from "../../Utils/Menu/MobileShortcutSettings";
import { getStoredAuthUser, logoutFromServer } from "../../API/auth";

export default function MobileNavbar() {
  const [open, setOpen] = useState(false);
  const [shortcutIds, setShortcutIds] = useState(loadMobileDrawerShortcutIds());
  const [authUser, setAuthUser] = useState(getStoredAuthUser());
  const navigate = useNavigate();

  useEffect(() => {
    const handleUpdate = () => {
      setShortcutIds(loadMobileDrawerShortcutIds());
    };

    window.addEventListener(
      "hrms-mobile-drawer-shortcuts-updated",
      handleUpdate,
    );
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(
        "hrms-mobile-drawer-shortcuts-updated",
        handleUpdate,
      );
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setAuthUser(getStoredAuthUser());
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const primaryItems = getMenuItemsByIds(shortcutIds);
  const bottomItems = getDrawerBottomItems();

  const employeeName = useMemo(() => {
    const employeeDisplayName = authUser?.employee?.display_name;
    const userDisplayName = authUser?.display_name;
    const userLogin = authUser?.user_login;

    return employeeDisplayName || userDisplayName || userLogin || "帳戶";
  }, [authUser]);

  const employeeEmail = useMemo(() => {
    const employeeRowEmail = authUser?.employee?.email;
    const userEmail = authUser?.user_email;

    return employeeRowEmail || userEmail || "";
  }, [authUser]);

  async function handleLogout() {
    try {
      await logoutFromServer();
    } finally {
      setOpen(false);
      navigate("/login", { replace: true });
    }
  }

  return (
    <>
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          bgcolor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Box
          sx={{
            height: "58px",
            px: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            component={NavLink}
            to="/"
            sx={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Typography
              sx={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#2196d3",
                lineHeight: 1,
              }}
            >
              SEHO
            </Typography>

            <Box
              sx={{
                px: "4px",
                py: "1px",
                border: "1px solid #8ec9ef",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#55aee5",
                lineHeight: 1.1,
              }}
            >
              HR
            </Box>
          </Box>

          <IconButton onClick={() => setOpen(true)} sx={{ color: "#b6bcc8" }}>
            <MenuIcon sx={{ fontSize: "30px" }} />
          </IconButton>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: "calc(100vw - 56px)",
            maxWidth: "760px",
            bgcolor: "#ffffff",
          },
        }}
      >
        <Box
          sx={{
            height: "100%",
            overflowY: "auto",
            px: "18px",
            pt: "18px",
            pb: "28px",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: "18px" }}>
            <IconButton
              onClick={() => setOpen(false)}
              sx={{ color: "#b6bcc8" }}
            >
              <CloseIcon sx={{ fontSize: "34px" }} />
            </IconButton>
          </Box>

          <Box
            component={NavLink}
            to="/account"
            onClick={() => setOpen(false)}
            sx={{
              textDecoration: "none",
              display: "grid",
              gridTemplateColumns: "80px 1fr 24px",
              alignItems: "center",
              gap: "12px",
              mb: "18px",
              cursor: "pointer",
            }}
          >
            <Avatar
              sx={{
                width: "80px",
                height: "80px",
                bgcolor: "#f0f0f0",
                color: "#9e9e9e",
              }}
            >
              <PersonIcon sx={{ fontSize: "46px" }} />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "25px",
                  fontWeight: 800,
                  color: "#2d3945",
                  lineHeight: 1.2,
                  mb: "4px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {employeeName}
              </Typography>

              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 400,
                  color: "#b0b5bf",
                  lineHeight: 1.2,
                  wordBreak: "break-all",
                }}
              >
                {employeeEmail}
              </Typography>
            </Box>

            <ChevronRightIcon sx={{ color: "#e0e3e8", fontSize: "30px" }} />
          </Box>

          <Divider sx={{ mb: "22px" }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "22px 14px",
            }}
          >
            {primaryItems.map((item) => (
              <MenuTile
                key={item.id}
                item={item}
                iconSize={42}
                iconColor="#1098dc"
                onClick={() => setOpen(false)}
                wrapperSx={{
                  gap: "10px",
                  minHeight: "112px",
                }}
                iconBoxSx={{
                  width: "56px",
                  height: "56px",
                }}
                labelSx={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#2d3945",
                }}
              />
            ))}
          </Box>

          <Divider sx={{ my: "22px" }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "22px 14px",
            }}
          >
            {bottomItems.map((item) => {
              const isLogout = item.label === "登出";
              const isDisabled = !!item.disable && !isLogout;

              return (
                <Box
                  key={item.id}
                  sx={{
                    opacity: isDisabled ? 0.45 : 1,
                  }}
                >
                  <MenuTile
                    item={item}
                    iconSize={42}
                    iconColor={
                      isLogout ? "#1098dc" : isDisabled ? "#cbd5e1" : "#1098dc"
                    }
                    onClick={() => {
                      if (isLogout) {
                        handleLogout();
                        return;
                      }

                      if (!isDisabled) {
                        setOpen(false);
                      }
                    }}
                    wrapperSx={{
                      gap: "10px",
                      minHeight: "112px",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      pointerEvents: isDisabled ? "none" : "auto",
                    }}
                    iconBoxSx={{
                      width: "56px",
                      height: "56px",
                    }}
                    labelSx={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: isLogout
                        ? "#2d3945"
                        : isDisabled
                          ? "#9ca3af"
                          : "#2d3945",
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
