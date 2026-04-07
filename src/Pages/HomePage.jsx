import { Box, Paper, Typography } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import FeedOutlinedIcon from "@mui/icons-material/FeedOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MoreTimeOutlinedIcon from "@mui/icons-material/MoreTimeOutlined";
import { NavLink } from "react-router-dom";

const shortcutItems = [
  {
    label: "請假",
    icon: <EventNoteOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/attendance/leave",
    disable: false,
  },
  {
    label: "加班",
    icon: (
      <MoreTimeOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />
    ),
    to: "/attendance/overtime",
    disable: false,
  },
  {
    label: "我要打卡",
    icon: <PlaceOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/attendance/clock",
    disable: false,
  },
  {
    label: "忘打卡申請",
    icon: (
      <HelpOutlineOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />
    ),
    to: "/attendance/missed-punch",
    disable: false,
  },
  {
    label: "個人班表",
    icon: <ScheduleOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/attendance/schedule",
    disable: false,
  },
  {
    label: "公司規章",
    icon: (
      <DescriptionOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />
    ),
    to: "/regulation",
    disable: false,
  },
  {
    label: "部門公告",
    icon: <CampaignOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/announcement",
    disable: false,
  },
  {
    label: "最新消息",
    icon: <FeedOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/dashboard",
    disable: true,
  },
  {
    label: "最新訂單",
    icon: (
      <ShoppingCartOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />
    ),
    to: "/dashboard",
    disable: true,
  },
  {
    label: "個人資訊",
    icon: (
      <PersonOutlineOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />
    ),
    to: "/dashboard",
    disable: true,
  },
  {
    label: "待辦事項",
    icon: <FactCheckOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/dashboard",
    disable: true,
  },
  {
    label: "便利貼",
    icon: <EditNoteOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/dashboard",
    disable: true,
  },
   {
    label: "我的薪資單",
    icon: <AccountBalanceWalletIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/payroll",
    disable: false,
  },
  
];

const mobileWidgets = [
  {
    label: "個人出勤",
    subLabel: "你有1異常",
    value: "08:53 /",
    icon: (
      <AccessTimeOutlinedIcon sx={{ fontSize: "46px", color: "#1698dc" }} />
    ),
    dotColor: "#d83a3a",
    to: "/attendance/clock",
  },
  {
    label: "請假",
    subLabel: "特休",
    value: "56時",
    icon: (
      <CalendarMonthOutlinedIcon sx={{ fontSize: "46px", color: "#1698dc" }} />
    ),
    dotColor: "#ffffff",
    to: "/attendance/leave",
  },
  {
    label: "個人班表",
    subLabel: "常日班",
    value: "09:00 ~ 18:00",
    icon: (
      <AssignmentOutlinedIcon sx={{ fontSize: "46px", color: "#1698dc" }} />
    ),
    dotColor: "#ffffff",
    to: "/attendance/schedule",
  },
  {
    label: "選單設置",
    subLabel: "",
    value: "",
    icon: <SettingsOutlinedIcon sx={{ fontSize: "46px", color: "#1698dc" }} />,
    dotColor: "#ffffff",
    to: "/dashboard",
    disable: true,
  },
];

function SectionTitle({ children }) {
  return (
    <Typography
      sx={{
        fontSize: "18px",
        fontWeight: 700,
        color: "#111827",
        mb: "24px",
      }}
    >
      {children}
    </Typography>
  );
}

function ShortcutItem({ icon, label, to, disable }) {
  return (
    <Box
      component={disable ? "div" : NavLink}
      to={disable ? undefined : to}
      onClick={disable ? (e) => e.preventDefault() : undefined}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "12px",
        textDecoration: "none",
        cursor: disable ? "not-allowed" : "pointer",
        opacity: disable ? 0.5 : 1,
      }}
    >
      <Box
        sx={{
          width: "72px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: disable ? "grayscale(100%) opacity(0.6)" : "none",
        }}
      >
        {icon}
      </Box>

      <Typography
        sx={{
          fontSize: "16px",
          color: disable ? "#9ca3af" : "#1f2937",
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function MobileWidgetCard({ item }) {
  const isDisabled = !!item.disable;

  return (
  <Box
    component={isDisabled ? "div" : NavLink}
    to={isDisabled ? undefined : item.to}
    onClick={isDisabled ? (e) => e.preventDefault() : undefined}
    sx={{
      textDecoration: "none",
      minWidth: 0,
      opacity: isDisabled ? 0.7 : 1,
      cursor: isDisabled ? "not-allowed" : "pointer",
    }}
  >
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#ffffff",
        borderRadius: "16px",
        p: "14px",
        height: "120px",
        display: "flex",
        alignItems: "center",   // ✅ vertical center (main fix)
        gap: "12px",
        position: "relative",
      }}
    >
      {/* ICON */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center", // ✅ icon vertical center
          justifyContent: "center",
        }}
      >
        {item.icon}
      </Box>

      {/* TEXT */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", // ✅ center text block
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#2d3945",
            lineHeight: 1.2,
            wordBreak: "break-word", // ✅ allow wrapping
          }}
        >
          {item.label}
        </Typography>

        {item.subLabel && (
          <Typography
            sx={{
              fontSize: "14px",
              color: "#9ca3af",
              mt: "2px",
              lineHeight: 1.2,
              wordBreak: "break-word", // ✅ wrap instead of cut
            }}
          >
            {item.subLabel}
          </Typography>
        )}

        {item.value && (
          <Typography
            sx={{
              fontSize: "16px",
              color: "#2d3945",
              mt: "2px",
              lineHeight: 1.2,
              wordBreak: "break-word", // ✅ wrap time properly
            }}
          >
            {item.value}
          </Typography>
        )}
      </Box>

      {/* DOT */}
      <Box
        sx={{
          position: "absolute",
          top: "10px",
          right: "10px",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          bgcolor: item.dotColor,
          border: item.dotColor === "#ffffff" ? "1px solid #e5e7eb" : "none",
        }}
      />
    </Paper>
  </Box>
);
}

function MobileClockButton() {
  return (
    <Box
      component={NavLink}
      to="/attendance/clock"
      sx={{
        textDecoration: "none",
        display: "block",
        position: "relative",
        mt: "18px",
      }}
    >
      <Box
        sx={{
          height: "430px",
          borderRadius: "24px",
          bgcolor: "#f6f7f9",
          overflow: "hidden",
          position: "relative",
          border: "1px solid #f0f2f5",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.32,
            backgroundImage:
              "radial-gradient(circle at 20px 20px, #d9dde3 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "46%",
            transform: "translate(-50%, -50%)",
            width: "210px",
            height: "210px",
            borderRadius: "50%",
            bgcolor: "#ffffff",
            boxShadow: "0 0 0 26px rgba(205, 236, 248, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "112px",
              height: "112px",
              borderRadius: "50%",
              bgcolor: "#ffffff",
              border: "8px solid #cfeefd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PlaceOutlinedIcon sx={{ fontSize: "56px", color: "#1698dc" }} />
          </Box>
        </Box>

        <Box
          sx={{
            position: "absolute",
            left: "50%",
            bottom: "54px",
            transform: "translateX(-50%)",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#2d3945",
              lineHeight: 1.2,
            }}
          >
            下班了！{" "}
            <Box component="span" sx={{ color: "#1698dc" }}>
              定位打卡
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function MobileHomePage() {
  return (
    <Box
      sx={{
        display: { xs: "block", md: "none" },
        pb: "20px",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "18px 14px",
          mb: "18px",
        }}
      >
        {mobileWidgets.map((item) => (
          <MobileWidgetCard key={item.label} item={item} />
        ))}
      </Box>

      <MobileClockButton />
    </Box>
  );
}

function DesktopHomePage() {
  return (
    <Box sx={{ display: { xs: "none", md: "block" } }}>
      <Box
        sx={{
          bgcolor: "#ececf1",
          minHeight: "180px",
          borderRadius: "2px",
          px: { xs: "24px", md: "28px" },
          py: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          overflow: "hidden",
          mb: "32px",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: "28px", md: "46px" },
            fontWeight: 700,
            color: "#2196d3",
            lineHeight: 1.2,
            flexShrink: 0,
          }}
        >
          歡迎來到SEHO HR.
        </Typography>

        <Box
          sx={{
            display: { xs: "none", md: "grid" },
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: "14px",
            minWidth: "520px",
            opacity: 0.95,
          }}
        >
          {Array.from({ length: 24 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                width: "28px",
                height: "28px",
                border: "1px solid #8f8f8f",
                borderRadius: index % 4 === 0 ? "50%" : "4px",
                bgcolor: index % 3 === 0 ? "#f7d64a" : "#ffffff",
              }}
            />
          ))}
        </Box>
      </Box>

      <Box>
        <SectionTitle>我的快捷</SectionTitle>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(6, minmax(0, 1fr))",
            },
            gap: "44px 24px",
          }}
        >
          {shortcutItems.map((item) => (
            <ShortcutItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              to={item.to}
              disable={item.disable}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function HomePage() {
  return (
    <Box>
      <MobileHomePage />
      <DesktopHomePage />
    </Box>
  );
}

export default HomePage;
