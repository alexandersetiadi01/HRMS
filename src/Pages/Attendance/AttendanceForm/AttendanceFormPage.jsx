import { useMemo, useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FormRecordLayout from "../../../Layouts/FormRecordLayout";
import CheckInRecord from "./CheckInRecord";
import LeaveOfAbsence from "./LeaveOfAbsence";
import OvertimeRecord from "./OvertimeRecord";
import OvertimeStatistic from "./OvertimeStatistic";
import ApplicationRecord from "./ApplicationRecord/ApplicationRecord";

const menuConfig = [
  { key: "checkin", label: "打卡紀錄管理" },
  { key: "leave", label: "請假紀錄" },
  { key: "special", label: "特殊假別申請", disabled: true },
  {
    key: "overtime",
    label: "加班紀錄",
    children: [
      { key: "overtime-record", label: "申請紀錄" },
      { key: "overtime-statistic", label: "加班統計" },
    ],
    icon: <KeyboardArrowDownIcon sx={{ fontSize: "18px", color: "#b8923f" }} />,
  },
  { key: "business-trip", label: "公出/出差", disabled: true },
  { key: "agent", label: "代申請紀錄" },
];

function EmptyContent() {
  return null;
}

export default function AttendanceFormPage() {
  const [activeMenu, setActiveMenu] = useState("checkin");
  const [activeOvertimeMenu, setActiveOvertimeMenu] =
    useState("overtime-record");

  const content = useMemo(() => {
    if (activeMenu === "checkin") return <CheckInRecord />;
    if (activeMenu === "leave") return <LeaveOfAbsence />;

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

    setActiveMenu(key);
  };

  const handleOvertimeMenuClick = (key) => {
    const overtimeMenu = menuConfig.find((item) => item.key === "overtime");
    const targetChild = overtimeMenu?.children?.find((item) => item.key === key);

    if (targetChild?.disabled) {
      return;
    }

    setActiveMenu("overtime");
    setActiveOvertimeMenu(key);
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