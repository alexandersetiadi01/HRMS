import { useMemo, useState } from "react";
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
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import MoreTimeOutlinedIcon from "@mui/icons-material/MoreTimeOutlined";
import FeedOutlinedIcon from "@mui/icons-material/FeedOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import WalletOutlinedIcon from "@mui/icons-material/WalletOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { NavLink, useLocation } from "react-router-dom";

const DRAWER_PRIMARY_ITEMS = [
  { label: "個人出勤", to: "/attendance/clock", icon: <PlaceOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} /> },
  { label: "剩餘假別", to: "/attendance/leave-balance", icon: <CalendarMonthOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "表單申請紀錄", to: "/attendance/form-record", icon: <ManageSearchOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "請假", to: "/attendance/leave", icon: <EventBusyOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: false },
  { label: "個人班表", to: "/attendance/schedule", icon: <CalendarMonthOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} /> },
  { label: "訊息中心", to: "/dashboard", icon: <DescriptionOutlined sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "定位打卡", to: "/attendance/clock", icon: <PlaceOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} /> },
  { label: "審核中心", to: "/attendance/pending-approval", icon: <FactCheckOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "待辦事項", to: "/dashboard", icon: <DescriptionOutlined sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "忘打卡申請", to: "/attendance/missed-punch", icon: <DescriptionOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: false },
  { label: "加班", to: "/attendance/overtime", icon: <MoreTimeOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "便利貼", to: "/dashboard", icon: <FeedOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "我的薪資單", to: "/payroll", icon: <WalletOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "特殊假別申請", to: "/attendance/special-leave", icon: <StarBorderOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "公出/出差", to: "/attendance/business-trip", icon: <WorkOutlineOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "公司規章", to: "/dashboard", icon: <MenuBookOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "搜尋人員", to: "/dashboard", icon: <SearchOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "內部連結", to: "/dashboard", icon: <LinkOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
];

const DRAWER_BOTTOM_ITEMS = [
  { label: "登出", to: "/login", icon: <LogoutOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "設定", to: "/dashboard", icon: <SettingsOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
  { label: "意見回饋", to: "/dashboard", icon: <FeedbackOutlinedIcon sx={{ fontSize: "42px", color: "#1098dc" }} />, disable: true },
];

function DrawerGridItem({ item, onClick }) {
  const isDisabled = !!item.disable;

  return (
    <Box
      component={isDisabled ? "div" : NavLink}
      to={isDisabled ? undefined : item.to}
      onClick={
        isDisabled
          ? (e) => e.preventDefault()
          : () => {
              onClick?.();
            }
      }
      sx={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "10px",
        minHeight: "112px",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      <Box
        sx={{
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: isDisabled ? "grayscale(100%)" : "none",
        }}
      >
        {item.icon}
      </Box>

      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#2d3945",
          textAlign: "center",
          lineHeight: 1.3,
          wordBreak: "break-word",
        }}
      >
        {item.label}
      </Typography>
    </Box>
  );
}

export default function MobileNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const title = useMemo(() => {
    if (location.pathname.startsWith("/attendance")) return "考勤";
    if (location.pathname.startsWith("/foundation")) return "基礎";
    if (location.pathname.startsWith("/payroll")) return "薪資單";
    if (location.pathname.startsWith("/dashboard")) return "儀表板";
    return "首頁";
  }, [location.pathname]);

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
            <Box sx={{ display: "flex", alignItems: "center", gap: "6px", color: "#8c8c8c" }}>
              <PersonIcon sx={{ fontSize: "28px" }} />
              <Typography sx={{ fontSize: "15px", color: "#8c8c8c" }}>帳戶</Typography>
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
            <IconButton onClick={() => setOpen(false)} sx={{ color: "#b6bcc8" }}>
              <CloseIcon sx={{ fontSize: "34px" }} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 24px",
              alignItems: "center",
              gap: "12px",
              mb: "18px",
            }}
          >
            <Avatar sx={{ width: "80px", height: "80px", bgcolor: "#f0f0f0", color: "#9e9e9e" }}>
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
                許明城
              </Typography>
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#b0b5bf",
                  lineHeight: 1.2,
                }}
              >
                alex@mizunogi.com
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
            {DRAWER_PRIMARY_ITEMS.map((item) => (
              <DrawerGridItem key={item.label} item={item} onClick={() => setOpen(false)} />
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
            {DRAWER_BOTTOM_ITEMS.map((item) => (
              <DrawerGridItem key={item.label} item={item} onClick={() => setOpen(false)} />
            ))}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}