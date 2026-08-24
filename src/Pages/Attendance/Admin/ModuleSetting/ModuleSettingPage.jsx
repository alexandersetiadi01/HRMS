import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Collapse, Paper, Tab, Tabs, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ApprovalSettingsTab from "./ApprovalSettingsTab";
import ClockIpSettingsTab from "./ClockIpSettingsTab";
import ClockLocationSettingsTab from "./ClockLocationSettingsTab";
import PermissionSettingsTab from "./PermissionSettingsTab";
import UnitParameterSettingsTab from "./UnitParameterSettingsTab";
import Breadcrumb from "../../../../Utils/Breadcrumb";
import AttendanceRulesTab from "./AttendanceRulesTab";
import CalendarTab from "./CalendarTab";
import LeaveTypesTab from "./LeaveTypesTab";
import ShiftGroupAssignments from "./ShiftGroupAssignments";
import ShiftGroupsTab from "./ShiftGroupsTab";
import ShiftsTab from "./ShiftsTab";
import {
  ATTENDANCE_RULE_ITEMS,
  CLOCK_SETTING_ITEMS,
  FORM_PARAMETER_ITEMS,
  MODULE_TABS,
  SHIFT_GROUP_ITEMS,
} from "./moduleSettingOptions";

const MODULE_SETTING_BASE = "/attendance/admin/module-setting";

function getModuleSettingState(pathname) {
  const relativePath = pathname
    .replace(MODULE_SETTING_BASE, "")
    .replace(/^\/+|\/+$/g, "");

  const parts = relativePath ? relativePath.split("/") : [];

  if (parts[0] === "approval") {
    return {
      activeTab: "approval",
      activeParameter: "",
      activeAttendanceRule: "leave",
      activeShiftGroupItem: "groups",
      activeClockSetting: "location",
    };
  }

  if (parts[0] === "form-parameters") {
    const activeParameter = parts[1] || "calendar";

    return {
      activeTab: "form-parameters",
      activeParameter,
      activeAttendanceRule:
        activeParameter === "attendance-rules" ? parts[2] || "leave" : "leave",
      activeShiftGroupItem:
        activeParameter === "shift-group" ? parts[2] || "groups" : "groups",
      activeClockSetting:
        activeParameter === "clock-settings" ? parts[2] || "location" : "location",
    };
  }

  return {
    activeTab: "permissions",
    activeParameter: "",
    activeAttendanceRule: "leave",
    activeShiftGroupItem: "groups",
    activeClockSetting: "location",
  };
}

export default function ModuleSettingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = getModuleSettingState(location.pathname);
  const {
    activeTab,
    activeParameter,
    activeAttendanceRule,
    activeShiftGroupItem,
    activeClockSetting,
  } = routeState;

  const [attendanceRulesOpen, setAttendanceRulesOpen] = useState(
    activeParameter === "attendance-rules",
  );
  const [shiftGroupOpen, setShiftGroupOpen] = useState(
    activeParameter === "shift-group",
  );
  const [clockSettingsOpen, setClockSettingsOpen] = useState(
    activeParameter === "clock-settings",
  );

  useEffect(() => {
    if (activeParameter === "attendance-rules") {
      setAttendanceRulesOpen(true);
    }

    if (activeParameter === "shift-group") {
      setShiftGroupOpen(true);
    }

    if (activeParameter === "clock-settings") {
      setClockSettingsOpen(true);
    }
  }, [activeParameter]);

  const handleTabChange = (_event, value) => {
    if (value === "permissions") {
      navigate(`${MODULE_SETTING_BASE}/permissions`);
      return;
    }

    if (value === "approval") {
      navigate(`${MODULE_SETTING_BASE}/approval`);
      return;
    }

    navigate(`${MODULE_SETTING_BASE}/form-parameters/calendar`);
  };

  const handleParameterClick = (item) => {
    if (item.value === "attendance-rules") {
      if (activeParameter === "attendance-rules") {
        setAttendanceRulesOpen((current) => !current);
        return;
      }

      setAttendanceRulesOpen(true);
      navigate(`${MODULE_SETTING_BASE}/form-parameters/attendance-rules/leave`);
      return;
    }

    if (item.value === "shift-group") {
      if (activeParameter === "shift-group") {
        setShiftGroupOpen((current) => !current);
        return;
      }

      setShiftGroupOpen(true);
      navigate(`${MODULE_SETTING_BASE}/form-parameters/shift-group/groups`);
      return;
    }

    if (item.value === "clock-settings") {
      if (activeParameter === "clock-settings") {
        setClockSettingsOpen((current) => !current);
        return;
      }

      setClockSettingsOpen(true);
      navigate(`${MODULE_SETTING_BASE}/form-parameters/clock-settings/location`);
      return;
    }

    navigate(`${MODULE_SETTING_BASE}/form-parameters/${item.value}`);
  };

  const handleAttendanceRuleClick = (value) => {
    navigate(`${MODULE_SETTING_BASE}/form-parameters/attendance-rules/${value}`);
  };

  const handleShiftGroupClick = (value) => {
    navigate(`${MODULE_SETTING_BASE}/form-parameters/shift-group/${value}`);
  };

  const handleClockSettingClick = (value) => {
    navigate(`${MODULE_SETTING_BASE}/form-parameters/clock-settings/${value}`);
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, sm: 2.5, md: 3 } }}>
      <Breadcrumb
        rootLabel="管理者專區"
        rootTo="/attendance"
        currentLabel="模組設定"
        mb="14px"
      />

      <Typography
        component="h1"
        sx={{
          mb: 2,
          fontSize: { xs: "22px", sm: "25px", md: "28px" },
          fontWeight: 700,
          color: "#111827",
        }}
      >
        模組設定
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          mb: "14px",
          overflow: "hidden",
          borderColor: "#d1d5db",
          borderRadius: "8px",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: "52px",
            "& .MuiTabs-flexContainer": {
              justifyContent: { sm: "center" },
            },
            "& .MuiTab-root": {
              minHeight: "52px",
              minWidth: { xs: "120px", sm: "160px" },
              px: { xs: 1.5, sm: 3 },
              fontSize: { xs: "14px", sm: "15px", md: "16px" },
              fontWeight: 700,
            },
          }}
        >
          {MODULE_TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          overflow: "hidden",
          borderColor: "#d1d5db",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            display: { xs: "block", md: "grid" },
            gridTemplateColumns:
              activeTab === "form-parameters"
                ? { md: "210px minmax(0, 1fr)" }
                : { md: "minmax(0, 1fr)" },
            minHeight: "520px",
          }}
        >
          {activeTab === "form-parameters" ? (
            <Box
              sx={{
                borderRight: { md: "1px solid #e5e7eb" },
                borderBottom: { xs: "1px solid #e5e7eb", md: "none" },
                bgcolor: "#f9fafb",
              }}
            >
            <Box sx={{ p: "10px" }}>
              {FORM_PARAMETER_ITEMS.map((item) => {
                const active = activeParameter === item.value;
                const expandable = Boolean(item.expandable);

                return (
                  <Box key={item.value}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => handleParameterClick(item)}
                      sx={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        border: 0,
                        borderRadius: "6px",
                        px: "14px",
                        py: "11px",
                        bgcolor: active ? "#e8f3ff" : "transparent",
                        color: active ? "#1976d2" : "#374151",
                        fontSize: "15px",
                        fontWeight: active ? 700 : 400,
                        textAlign: "left",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        "&:hover": {
                          bgcolor: active ? "#e8f3ff" : "#f3f4f6",
                        },
                      }}
                    >
                      <Box component="span">{item.label}</Box>

                      {expandable ? (
                        item.value === "attendance-rules" ? (
                          attendanceRulesOpen ? (
                            <KeyboardArrowDownIcon sx={{ fontSize: "20px" }} />
                          ) : (
                            <KeyboardArrowRightIcon sx={{ fontSize: "20px" }} />
                          )
                        ) : item.value === "shift-group" ? (
                          shiftGroupOpen ? (
                            <KeyboardArrowDownIcon sx={{ fontSize: "20px" }} />
                          ) : (
                            <KeyboardArrowRightIcon sx={{ fontSize: "20px" }} />
                          )
                        ) : item.value === "clock-settings" ? (
                          clockSettingsOpen ? (
                            <KeyboardArrowDownIcon sx={{ fontSize: "20px" }} />
                          ) : (
                            <KeyboardArrowRightIcon sx={{ fontSize: "20px" }} />
                          )
                        ) : null
                      ) : null}
                    </Box>

                    {item.value === "attendance-rules" ? (
                      <Collapse
                        in={attendanceRulesOpen}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ py: "4px" }}>
                          {ATTENDANCE_RULE_ITEMS.map((rule) => {
                            const ruleActive =
                              activeParameter === "attendance-rules" &&
                              activeAttendanceRule === rule.value;

                            return (
                              <Box
                                key={rule.value}
                                component="button"
                                type="button"
                                onClick={() =>
                                  handleAttendanceRuleClick(rule.value)
                                }
                                sx={{
                                  width: "100%",
                                  display: "block",
                                  border: 0,
                                  borderRadius: "6px",
                                  pl: "30px",
                                  pr: "14px",
                                  py: "9px",
                                  bgcolor: ruleActive
                                    ? "#f0f7ff"
                                    : "transparent",
                                  color: ruleActive ? "#1976d2" : "#4b5563",
                                  fontSize: "14px",
                                  fontWeight: ruleActive ? 700 : 400,
                                  textAlign: "left",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  "&:hover": {
                                    bgcolor: ruleActive ? "#f0f7ff" : "#f3f4f6",
                                  },
                                }}
                              >
                                {rule.label}
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                    ) : null}

                    {item.value === "shift-group" ? (
                      <Collapse
                        in={shiftGroupOpen}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ py: "4px" }}>
                          {SHIFT_GROUP_ITEMS.map((shiftGroupItem) => {
                            const shiftGroupActive =
                              activeParameter === "shift-group" &&
                              activeShiftGroupItem === shiftGroupItem.value;

                            return (
                              <Box
                                key={shiftGroupItem.value}
                                component="button"
                                type="button"
                                onClick={() =>
                                  handleShiftGroupClick(shiftGroupItem.value)
                                }
                                sx={{
                                  width: "100%",
                                  display: "block",
                                  border: 0,
                                  borderRadius: "6px",
                                  pl: "30px",
                                  pr: "14px",
                                  py: "9px",
                                  bgcolor: shiftGroupActive
                                    ? "#f0f7ff"
                                    : "transparent",
                                  color: shiftGroupActive
                                    ? "#1976d2"
                                    : "#4b5563",
                                  fontSize: "14px",
                                  fontWeight: shiftGroupActive ? 700 : 400,
                                  textAlign: "left",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  "&:hover": {
                                    bgcolor: shiftGroupActive
                                      ? "#f0f7ff"
                                      : "#f3f4f6",
                                  },
                                }}
                              >
                                {shiftGroupItem.label}
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                    ) : null}

                    {item.value === "clock-settings" ? (
                      <Collapse
                        in={clockSettingsOpen}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ py: "4px" }}>
                          {CLOCK_SETTING_ITEMS.map((clockSettingItem) => {
                            const clockSettingActive =
                              activeParameter === "clock-settings" &&
                              activeClockSetting === clockSettingItem.value;

                            return (
                              <Box
                                key={clockSettingItem.value}
                                component="button"
                                type="button"
                                onClick={() =>
                                  handleClockSettingClick(
                                    clockSettingItem.value,
                                  )
                                }
                                sx={{
                                  width: "100%",
                                  display: "block",
                                  border: 0,
                                  borderRadius: "6px",
                                  pl: "30px",
                                  pr: "14px",
                                  py: "9px",
                                  bgcolor: clockSettingActive
                                    ? "#f0f7ff"
                                    : "transparent",
                                  color: clockSettingActive
                                    ? "#1976d2"
                                    : "#4b5563",
                                  fontSize: "14px",
                                  fontWeight: clockSettingActive ? 700 : 400,
                                  textAlign: "left",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  "&:hover": {
                                    bgcolor: clockSettingActive
                                      ? "#f0f7ff"
                                      : "#f3f4f6",
                                  },
                                }}
                              >
                                {clockSettingItem.label}
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                    ) : null}
                  </Box>
                );
              })}
            </Box>
          </Box>
          ) : null}

          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ p: { xs: "16px", sm: "20px" }, minWidth: 0 }}>
              {activeTab === "permissions" ? (
                <PermissionSettingsTab />
              ) : null}

              {activeTab === "approval" ? (
                <ApprovalSettingsTab />
              ) : null}

              {activeTab === "form-parameters" ? (
                <>
                  {activeParameter === "calendar" ? <CalendarTab /> : null}

                  {activeParameter === "shift" ? <ShiftsTab /> : null}

                  {activeParameter === "shift-group" &&
                  activeShiftGroupItem === "groups" ? (
                    <ShiftGroupsTab />
                  ) : null}

                  {activeParameter === "shift-group" &&
                  activeShiftGroupItem === "assignments" ? (
                    <ShiftGroupAssignments />
                  ) : null}

                  {activeParameter === "leave-types" ? <LeaveTypesTab /> : null}

                  {activeParameter === "attendance-rules" ? (
                    <AttendanceRulesTab activeRule={activeAttendanceRule} />
                  ) : null}

                  {activeParameter === "clock-settings" &&
                  activeClockSetting === "location" ? (
                    <ClockLocationSettingsTab />
                  ) : null}

                  {activeParameter === "clock-settings" &&
                  activeClockSetting === "ip" ? (
                    <ClockIpSettingsTab />
                  ) : null}

                  {activeParameter === "unit-settings" ? (
                    <UnitParameterSettingsTab />
                  ) : null}
                </>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
