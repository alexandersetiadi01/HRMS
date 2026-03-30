import { Box, Typography } from "@mui/material";
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
import { NavLink } from "react-router-dom";

const attendanceMenuItems = [
  {
    label: "個人班表",
    to: "/attendance/schedule",
    icon: <CalendarMonthOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "忘打卡申請",
    to: "/attendance/missed-punch",
    icon: <PlaceOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "打卡紀錄",
    to: "/attendance/record",
    icon: <DescriptionOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "特殊假別申請",
    to: "/attendance/special-leave",
    icon: <StarBorderOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "請假",
    to: "/attendance/leave",
    icon: <EventBusyOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "加班",
    to: "/attendance/overtime",
    icon: <MoreTimeOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "表單申請紀錄",
    to: "/attendance/form-record",
    icon: <FeedOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "剩餘假別",
    to: "/attendance/leave-balance",
    icon: <ManageSearchOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "待審核表單",
    to: "/attendance/pending-approval",
    icon: <FactCheckOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
  {
    label: "公出/出差",
    to: "/attendance/business-trip",
    icon: <WorkOutlineOutlinedIcon sx={{ fontSize: "56px", color: "#2196d3" }} />,
  },
];

function AttendanceMenuCard({ item }) {
  return (
    <Box
      component={NavLink}
      to={item.to}
      sx={{
        textDecoration: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        color: "#111827",
        "&.active .attendance-icon-wrap": {
          transform: "translateY(-2px)",
        },
        "&.active .attendance-label": {
          color: "#0c93d4",
          fontWeight: 700,
        },
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
        }}
      >
        {item.icon}
      </Box>

      <Typography
        className="attendance-label"
        sx={{
          fontSize: "16px",
          color: "#111827",
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