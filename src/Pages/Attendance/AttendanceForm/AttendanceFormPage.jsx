import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FormRecordLayout from "../../../Layouts/FormRecordLayout";
import CheckInRecord from "./CheckInRecord";
import LeaveOfAbsence from "./LeaveOfAbsence";
import SpecialLeaveForm from "./SpecialLeaveForm";
import BusinessTripRecord from "./BusinessTripRecord";
import OvertimeRecord from "./OvertimeRecord";
import OvertimeStatistic from "./OvertimeStatistic";
import ApplicationRecord from "./ApplicationRecord/ApplicationRecord";

const menuConfig = [
  { key: "checkin", label: "打卡紀錄管理" },
  { key: "leave", label: "請假紀錄" },
  { key: "special", label: "特殊假別申請" },
  {
    key: "overtime",
    label: "加班紀錄",
    children: [
      { key: "overtime-record", label: "申請紀錄" },
      { key: "overtime-statistic", label: "加班統計" },
    ],
    icon: <KeyboardArrowDownIcon sx={{ fontSize: "18px", color: "#b8923f" }} />,
  },
  { key: "business-trip", label: "公出/出差" },
  { key: "agent", label: "代申請紀錄" },
];

const FORM_RECORD_BASE = "/attendance/form-record";

const OVERTIME_MENU_KEYS = [
  "overtime-record",
  "overtime-statistic",
];

function getRouteState(pathname) {
  const relativePath = pathname
    .replace(FORM_RECORD_BASE, "")
    .replace(/^\/+|\/+$/g, "");

  const segments = relativePath ? relativePath.split("/") : [];
  const section = segments[0] || "";

  if (section === "leave") {
    return {
      activeMenu: "leave",
      activeOvertimeMenu: "overtime-record",
    };
  }

  if (section === "special") {
    return {
      activeMenu: "special",
      activeOvertimeMenu: "overtime-record",
    };
  }

  if (section === "business-trip") {
    return {
      activeMenu: "business-trip",
      activeOvertimeMenu: "overtime-record",
    };
  }

  if (section === "overtime") {
    return {
      activeMenu: "overtime",
      activeOvertimeMenu: OVERTIME_MENU_KEYS.includes(segments[1])
        ? segments[1]
        : "overtime-record",
    };
  }

  if (section === "agent") {
    return {
      activeMenu: "agent",
      activeOvertimeMenu: "overtime-record",
    };
  }

  return {
    activeMenu: "checkin",
    activeOvertimeMenu: "overtime-record",
  };
}

function EmptyContent() {
  return null;
}

export default function AttendanceFormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMenu, activeOvertimeMenu } = getRouteState(location.pathname);

  useEffect(() => {
    let expectedPath = `${FORM_RECORD_BASE}/checkin`;

    if (activeMenu === "leave") {
      expectedPath = `${FORM_RECORD_BASE}/leave`;
    } else if (activeMenu === "special") {
      expectedPath = `${FORM_RECORD_BASE}/special`;
    } else if (activeMenu === "business-trip") {
      expectedPath = `${FORM_RECORD_BASE}/business-trip`;
    } else if (activeMenu === "overtime") {
      expectedPath = `${FORM_RECORD_BASE}/overtime/${activeOvertimeMenu}`;
    } else if (activeMenu === "agent") {
      if (location.pathname.startsWith(`${FORM_RECORD_BASE}/agent/`)) {
        return;
      }

      expectedPath = `${FORM_RECORD_BASE}/agent/forget-tapping`;
    }

    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [
    activeMenu,
    activeOvertimeMenu,
    location.pathname,
    navigate,
  ]);

  const content = useMemo(() => {
    if (activeMenu === "checkin") return <CheckInRecord />;
    if (activeMenu === "leave") return <LeaveOfAbsence />;
    if (activeMenu === "special") return <SpecialLeaveForm />;
    if (activeMenu === "business-trip") return <BusinessTripRecord />;

    if (activeMenu === "overtime") {
      if (activeOvertimeMenu === "overtime-record") return <OvertimeRecord />;
      if (activeOvertimeMenu === "overtime-statistic") {
        return <OvertimeStatistic />;
      }
      return <EmptyContent />;
    }

    if (activeMenu === "agent") return <ApplicationRecord />;

    return <EmptyContent />;
  }, [activeMenu, activeOvertimeMenu]);

  const handleMenuClick = (key) => {
    const target = menuConfig.find((item) => item.key === key);

    if (target?.disabled) {
      return;
    }

    if (key === "overtime") {
      return;
    }

    if (key === "agent") {
      navigate(`${FORM_RECORD_BASE}/agent/forget-tapping`);
      return;
    }

    navigate(`${FORM_RECORD_BASE}/${key}`);
  };

  const handleOvertimeMenuClick = (key) => {
    const overtimeMenu = menuConfig.find((item) => item.key === "overtime");
    const targetChild = overtimeMenu?.children?.find((item) => item.key === key);

    if (targetChild?.disabled) {
      return;
    }

    navigate(`${FORM_RECORD_BASE}/overtime/${key}`);
  };

  return (
    <FormRecordLayout
      title="表單申請紀錄"
      rootLabel="個人專區"
      menuConfig={menuConfig}
      activeMenu={activeMenu}
      activeOvertimeMenu={activeOvertimeMenu}
      onMenuClick={handleMenuClick}
      onOvertimeMenuClick={handleOvertimeMenuClick}
    >
      {content}
    </FormRecordLayout>
  );
}