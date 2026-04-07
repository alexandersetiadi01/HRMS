import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import MoreTimeOutlinedIcon from "@mui/icons-material/MoreTimeOutlined";
import FeedOutlinedIcon from "@mui/icons-material/FeedOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import EventIcon from "@mui/icons-material/Event";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";

export function renderMenuIcon(iconKey, { size = 52, color = "#2196d3" } = {}) {
  const sx = { fontSize: `${size}px`, color };

  switch (iconKey) {
    case "attendance-clock":
      return <PlaceOutlinedIcon sx={sx} />;
    case "attendance-record":
      return <DescriptionOutlinedIcon sx={sx} />;
    case "attendance-leave-balance":
      return <EventIcon sx={sx} />;
    case "attendance-form-record":
      return <FeedOutlinedIcon sx={sx} />;
    case "attendance-leave":
      return <EventBusyOutlinedIcon sx={sx} />;
    case "attendance-schedule":
      return <CalendarMonthOutlinedIcon sx={sx} />;
    case "attendance-pending":
      return <FactCheckOutlinedIcon sx={sx} />;
    case "attendance-missed-punch":
      return <HelpOutlineOutlinedIcon sx={sx} />;
    case "attendance-overtime":
      return <MoreTimeOutlinedIcon sx={sx} />;
    case "attendance-special-leave":
      return <LocalActivityIcon sx={sx} />;
    case "attendance-business-trip":
      return <WorkOutlineOutlinedIcon sx={sx} />;
    case "home-announcement":
      return <CampaignOutlinedIcon sx={sx} />;
    case "home-latest-news":
      return <FeedOutlinedIcon sx={sx} />;
    case "home-order":
      return <ShoppingCartOutlinedIcon sx={sx} />;
    case "home-account":
      return <PersonOutlineOutlinedIcon sx={sx} />;
    case "home-sticky-note":
      return <EditNoteOutlinedIcon sx={sx} />;
    case "home-payroll":
      return <AccountBalanceWalletIcon sx={sx} />;
    case "home-schedule":
      return <ScheduleOutlinedIcon sx={sx} />;
    case "home-leave":
      return <EventNoteOutlinedIcon sx={sx} />;
    case "settings":
      return <SettingsOutlinedIcon sx={sx} />;
    case "logout":
      return <LogoutOutlinedIcon sx={sx} />;
    case "feedback":
      return <FeedbackOutlinedIcon sx={sx} />;
    default:
      return <DescriptionOutlinedIcon sx={sx} />;
  }
}

export const MENU_ITEMS = [
  {
    id: "clock",
    label: "個人出勤",
    to: "/attendance/clock",
    iconKey: "attendance-clock",
    disable: false,
    groups: ["mobileDrawer"],
    defaultInMobileDrawer: true,
  },
  {
    id: "record",
    label: "打卡紀錄",
    to: "/attendance/record",
    iconKey: "attendance-record",
    disable: false,
    groups: ["mobileDrawer", "attendance"],
    defaultInMobileDrawer: true,
  },
  {
    id: "leave-balance",
    label: "剩餘假別",
    to: "/attendance/leave-balance",
    iconKey: "attendance-leave-balance",
    disable: false,
    groups: ["mobileDrawer", "attendance"],
    defaultInMobileDrawer: true,
  },
  {
    id: "form-record",
    label: "表單申請紀錄",
    to: "/attendance/form-record",
    iconKey: "attendance-form-record",
    disable: false,
    groups: ["mobileDrawer", "attendance"],
    defaultInMobileDrawer: true,
  },
  {
    id: "leave",
    label: "請假",
    to: "/attendance/leave",
    iconKey: "attendance-leave",
    disable: false,
    groups: ["mobileDrawer", "attendance", "homeShortcut"],
    defaultInMobileDrawer: true,
  },
  {
    id: "schedule",
    label: "個人班表",
    to: "/attendance/schedule",
    iconKey: "attendance-schedule",
    disable: false,
    groups: ["mobileDrawer", "attendance", "homeShortcut"],
    defaultInMobileDrawer: true,
  },
  {
    id: "location-clock",
    label: "定位打卡",
    to: "/attendance/clock",
    iconKey: "attendance-clock",
    disable: false,
    groups: ["mobileDrawer"],
    defaultInMobileDrawer: true,
  },
  {
    id: "pending-approval",
    label: "待審核表單",
    to: "/attendance/pending-approval",
    iconKey: "attendance-pending",
    disable: false,
    groups: ["mobileDrawer", "attendance"],
    defaultInMobileDrawer: true,
  },
  {
    id: "missed-punch",
    label: "忘打卡申請",
    to: "/attendance/missed-punch",
    iconKey: "attendance-missed-punch",
    disable: false,
    groups: ["mobileDrawer", "attendance", "homeShortcut"],
    defaultInMobileDrawer: true,
  },
  {
    id: "overtime",
    label: "加班",
    to: "/attendance/overtime",
    iconKey: "attendance-overtime",
    disable: false,
    groups: ["mobileDrawer", "attendance", "homeShortcut"],
    defaultInMobileDrawer: true,
  },
  {
    id: "payroll",
    label: "我的薪資單",
    to: "/payroll",
    iconKey: "home-payroll",
    disable: false,
    groups: ["mobileDrawer", "homeShortcut"],
    defaultInMobileDrawer: true,
  },
  {
    id: "special-leave",
    label: "特殊假別申請",
    to: "/attendance/special-leave",
    iconKey: "attendance-special-leave",
    disable: false,
    groups: ["mobileDrawer", "attendance"],
    defaultInMobileDrawer: true,
  },
  {
    id: "regulation",
    label: "公司規章",
    to: "/regulation",
    iconKey: "attendance-form-record",
    disable: false,
    groups: ["mobileDrawer", "homeShortcut"],
    defaultInMobileDrawer: true,
  },
  {
    id: "business-trip",
    label: "公出/出差",
    to: "/attendance/business-trip",
    iconKey: "attendance-business-trip",
    disable: false,
    groups: ["mobileDrawer", "attendance"],
    defaultInMobileDrawer: true,
  },

  {
    id: "announcement",
    label: "部門公告",
    to: "/announcement",
    iconKey: "home-announcement",
    disable: false,
    groups: ["homeShortcut"],
  },
  {
    id: "latest-news",
    label: "最新消息",
    to: "/latest-news",
    iconKey: "home-latest-news",
    disable: false,
    groups: ["homeShortcut"],
  },
  {
    id: "ordering-system",
    label: "最新訂單",
    to: "/ordering-system",
    iconKey: "home-order",
    disable: false,
    groups: ["homeShortcut"],
  },
  {
    id: "account",
    label: "個人資訊",
    to: "/account",
    iconKey: "home-account",
    disable: false,
    groups: ["homeShortcut"],
  },
  {
    id: "sticky-note",
    label: "便利貼",
    to: "/sticky-note",
    iconKey: "home-sticky-note",
    disable: false,
    groups: ["homeShortcut"],
  },

  {
    id: "drawer-settings",
    label: "設定",
    to: "/settings",
    iconKey: "settings",
    disable: false,
    groups: ["drawerBottom"],
  },
  {
    id: "drawer-logout",
    label: "登出",
    to: "/login",
    iconKey: "logout",
    disable: true,
    groups: ["drawerBottom"],
  },
  {
    id: "drawer-feedback",
    label: "意見回饋",
    to: "/dashboard",
    iconKey: "feedback",
    disable: true,
    groups: ["drawerBottom"],
  },
];

export const DEFAULT_MOBILE_DRAWER_SHORTCUT_IDS = MENU_ITEMS
  .filter((item) => item.groups.includes("mobileDrawer") && item.defaultInMobileDrawer)
  .map((item) => item.id);

export function getMenuItemsByGroup(group) {
  return MENU_ITEMS.filter((item) => item.groups.includes(group));
}

export function getMenuItemsByIds(ids = []) {
  return ids
    .map((id) => MENU_ITEMS.find((item) => item.id === id))
    .filter(Boolean);
}

export function getAttendanceMenuItems() {
  return getMenuItemsByGroup("attendance");
}

export function getHomeShortcutItems() {
  return getMenuItemsByGroup("homeShortcut");
}

export function getDrawerBottomItems() {
  return getMenuItemsByGroup("drawerBottom");
}

export function getMobileDrawerCandidates() {
  return getMenuItemsByGroup("mobileDrawer");
}