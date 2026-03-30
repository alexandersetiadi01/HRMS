import { Box, Typography } from "@mui/material";
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
import { NavLink } from "react-router-dom";

const shortcutItems = [
  {
    label: "請假",
    icon: <EventNoteOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/attendance/leave",
    disable: true,
  },
  {
    label: "加班",
    icon: (
      <WorkOutlineOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />
    ),
    to: "/attendance/overtime",
    disable: true,
  },
  {
    label: "我要打卡",
    icon: <PlaceOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/attendance/clock",
    disable: false, // ✅ enabled
  },
  {
    label: "忘打卡申請",
    icon: (
      <HelpOutlineOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />
    ),
    to: "/attendance/missed-punch",
    disable: true,
  },
  {
    label: "個人班表",
    icon: <ScheduleOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/attendance/schedule",
    disable: false, // ✅ enabled
  },
  {
    label: "公司規章",
    icon: (
      <DescriptionOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />
    ),
    to: "/dashboard",
    disable: true,
  },
  {
    label: "部門公告",
    icon: <CampaignOutlinedIcon sx={{ fontSize: "52px", color: "#2196d3" }} />,
    to: "/dashboard",
    disable: true,
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

        // ✅ disabled style
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

          // dim icon if disabled
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

function HomePage() {
  return (
    <Box>
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

export default HomePage;
