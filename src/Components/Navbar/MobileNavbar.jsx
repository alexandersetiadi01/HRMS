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
import { NavLink, useLocation } from "react-router-dom";
import MenuTile from "../MenuTile";
import {
  getDrawerBottomItems,
  getMenuItemsByIds,
} from "../../Utils/Menu/MenuRegistry";
import { loadMobileDrawerShortcutIds } from "../../Utils/Menu/MobileShortcutSettings";

export default function MobileNavbar() {
  const [open, setOpen] = useState(false);
  const [shortcutIds, setShortcutIds] = useState(loadMobileDrawerShortcutIds());
  const location = useLocation();

  useEffect(() => {
    const handleUpdate = () => {
      setShortcutIds(loadMobileDrawerShortcutIds());
    };

    window.addEventListener("hrms-mobile-drawer-shortcuts-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(
        "hrms-mobile-drawer-shortcuts-updated",
        handleUpdate
      );
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const title = useMemo(() => {
    if (location.pathname.startsWith("/attendance")) return "考勤";
    if (location.pathname.startsWith("/payroll")) return "薪資單";
    if (location.pathname.startsWith("/settings")) return "設定";
    if (location.pathname.startsWith("/dashboard")) return "儀表板";
    return "首頁";
  }, [location.pathname]);

  const primaryItems = getMenuItemsByIds(shortcutIds);
  const bottomItems = getDrawerBottomItems();

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

          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#8c8c8c",
              }}
            >
              <PersonIcon sx={{ fontSize: "28px" }} />
              <Typography sx={{ fontSize: "15px", color: "#8c8c8c" }}>
                帳戶
              </Typography>
            </Box>

            <IconButton onClick={() => setOpen(true)} sx={{ color: "#b6bcc8" }}>
              <MenuIcon sx={{ fontSize: "30px" }} />
            </IconButton>
          </Box>
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

            <Box>
              <Typography
                sx={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#2d3945",
                  lineHeight: 1.2,
                  mb: "4px",
                }}
              >
                帳戶
              </Typography>

              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#b0b5bf",
                  lineHeight: 1.2,
                }}
              >
                帳戶@mizunogi.com
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
            {bottomItems.map((item) => (
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
        </Box>
      </Drawer>
    </>
  );
}