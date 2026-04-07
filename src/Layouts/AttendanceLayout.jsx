import { Box, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import MoreTimeOutlinedIcon from "@mui/icons-material/MoreTimeOutlined";
import FeedOutlinedIcon from "@mui/icons-material/FeedOutlined";
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import EventIcon from '@mui/icons-material/Event';
import { NavLink } from "react-router-dom";

const attendanceMenuItems = [
  {
    label: "個人班表",
    to: "/attendance/schedule",
    disable: false,
    icon: <CalendarMonthOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "忘打卡申請",
    to: "/attendance/missed-punch",
    disable: false,
    icon: <PlaceOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "打卡紀錄",
    to: "/attendance/record",
    disable: false,
    icon: <DescriptionOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "特殊假別申請",
    to: "/attendance/special-leave",
    disable: false,
    icon: <LocalActivityIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "請假",
    to: "/attendance/leave",
    disable: false,
    icon: <EventBusyOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "加班",
    to: "/attendance/overtime",
    disable: false,
    icon: <MoreTimeOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "表單申請紀錄",
    to: "/attendance/form-record",
    disable: false,
    icon: <FeedOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "剩餘假別",
    to: "/attendance/leave-balance",
    disable: false,
    icon: <EventIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "待審核表單",
    to: "/attendance/pending-approval",
    disable: false,
    icon: <FactCheckOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "公出/出差",
    to: "/attendance/business-trip",
    disable: false,
    icon: <WorkOutlineOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
];

function AttendanceMenuCard({ item }) {
  const isDisabled = item.disable;

  return (
    <Box
      component={isDisabled ? "div" : NavLink}
      to={isDisabled ? undefined : item.to}
      onClick={isDisabled ? (e) => e.preventDefault() : undefined}
      sx={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        color: "#111827",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,

        ...(isDisabled
          ? {}
          : {
              "&.active .attendance-icon-wrap": {
                transform: "translateY(-2px)",
              },
              "&.active .attendance-label": {
                color: "#0c93d4",
                fontWeight: 700,
              },
            }),
      }}
    >
      <Box
        className="attendance-icon-wrap"
        sx={{
          width: "84px",
          height: "84px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          filter: isDisabled ? "grayscale(100%) opacity(0.6)" : "none",
        }}
      >
        {item.icon}
      </Box>

      <Typography
        className="attendance-label"
        sx={{
          fontSize: "16px",
          color: isDisabled ? "#9ca3af" : "#111827",
          textAlign: "center",
          lineHeight: 1.3,
          transition: "all 0.2s ease",
        }}
      >
        {item.label}
      </Typography>
    </Box>
  );
}

export default function AttendanceLayout() {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
          mb: "28px",
        }}
      >
        個人專區
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            md: "repeat(5, minmax(0, 1fr))",
            lg: "repeat(6, minmax(0, 1fr))",
          },
          gap: "48px 28px",
        }}
      >
        {attendanceMenuItems.map((item) => (
          <AttendanceMenuCard key={item.to} item={item} />
        ))}
      </Box>
    </Box>
  );
}