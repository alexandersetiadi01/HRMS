import { useState } from "react";
import { Box, Collapse, Paper, Tab, Tabs, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ClockIpSettingsTab from "./ClockIpSettingsTab";
import ClockLocationSettingsTab from "./ClockLocationSettingsTab";
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

export default function ModuleSettingPage() {
  const [activeTab, setActiveTab] = useState("form-parameters");
  const [activeParameter, setActiveParameter] = useState("leave-types");
  const [activeAttendanceRule, setActiveAttendanceRule] = useState("leave");
  const [activeShiftGroupItem, setActiveShiftGroupItem] = useState("groups");
  const [attendanceRulesOpen, setAttendanceRulesOpen] = useState(false);
  const [shiftGroupOpen, setShiftGroupOpen] = useState(false);
  const [clockSettingsOpen, setClockSettingsOpen] = useState(false);
  const [activeClockSetting, setActiveClockSetting] = useState("location");

  const handleParameterClick = (item) => {
    if (item.value === "attendance-rules") {
      setActiveParameter("attendance-rules");
      setActiveTab("form-parameters");
      setAttendanceRulesOpen((current) => !current);
      return;
    }

    if (item.value === "shift-group") {
      setActiveParameter("shift-group");
      setActiveTab("form-parameters");
      setShiftGroupOpen((current) => !current);
      return;
    }

    if (item.value === "clock-settings") {
      setActiveParameter("clock-settings");
      setActiveTab("form-parameters");
      setClockSettingsOpen((current) => !current);
      return;
    }

    setActiveParameter(item.value);
    setActiveTab("form-parameters");
  };

  const handleAttendanceRuleClick = (value) => {
    setActiveTab("form-parameters");
    setActiveParameter("attendance-rules");
    setActiveAttendanceRule(value);
  };

  const handleShiftGroupClick = (value) => {
    setActiveTab("form-parameters");
    setActiveParameter("shift-group");
    setActiveShiftGroupItem(value);
  };

  const handleClockSettingClick = (value) => {
    setActiveTab("form-parameters");
    setActiveParameter("clock-settings");
    setActiveClockSetting(value);
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
          overflow: "hidden",
          borderColor: "#d1d5db",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{
            display: { xs: "block", md: "grid" },
            gridTemplateColumns: { md: "210px minmax(0, 1fr)" },
            minHeight: "520px",
          }}
        >
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

          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                overflowX: "auto",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_event, value) => setActiveTab(value)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  minHeight: "48px",
                  "& .MuiTab-root": {
                    minHeight: "48px",
                    minWidth: { xs: "120px", sm: "150px" },
                    px: { xs: 1.5, sm: 2.5 },
                    fontSize: { xs: "14px", sm: "15px", md: "16px" },
                    fontWeight: 700,
                  },
                }}
              >
                {MODULE_TABS.map((tab) => (
                  <Tab key={tab.value} value={tab.value} label={tab.label} />
                ))}
              </Tabs>
            </Box>

            <Box sx={{ p: { xs: "16px", sm: "20px" }, minWidth: 0 }}>
              {activeTab === "permissions" ? (
                <>
                  <Typography
                    sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
                  >
                    權限設定
                  </Typography>

                  <Typography
                    sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}
                  >
                    Attendance 模組權限設定
                  </Typography>
                </>
              ) : null}

              {activeTab === "approval" ? (
                <>
                  <Typography
                    sx={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}
                  >
                    簽核設定
                  </Typography>

                  <Typography
                    sx={{ mt: "4px", fontSize: "14px", color: "#6b7280" }}
                  >
                    請假、加班、忘打卡、公出及出差簽核流程設定
                  </Typography>
                </>
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
