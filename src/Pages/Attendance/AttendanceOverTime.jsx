import { useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  HOURS,
  MINUTES_30,
  selectMenuProps,
  SectionLabel,
  MobileTimeSelect,
  toMinutes,
  formatDuration,
  buildAttendanceSectionWrapperSx,
} from "../../Utils/Attendance/SharedForm";

export default function AttendanceOvertime() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [startDate, setStartDate] = useState("2026-03-31");
  const [endDate, setEndDate] = useState("2026-03-31");
  const [startHour, setStartHour] = useState("18");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("18");
  const [endMin, setEndMin] = useState("00");
  const [payType, setPayType] = useState("補休");
  const [reason, setReason] = useState("");

  const totalMinutes = useMemo(() => {
    if (startDate !== endDate) return 0;
    const diff = toMinutes(endHour, endMin) - toMinutes(startHour, startMin);
    return diff > 0 ? diff : 0;
  }, [startDate, endDate, startHour, startMin, endHour, endMin]);

  const sectionWrapperSx = buildAttendanceSectionWrapperSx(isMobile);

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        sx={{
          fontSize: isMobile ? "24px" : "22px",
          fontWeight: 700,
          mb: "16px",
          color: "#111827",
        }}
      >
        加班
      </Typography>

      <Box
        sx={{
          width: "100%",
          border: "1px solid #d1d5db",
          bgcolor: "#ffffff",
        }}
      >
        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>*時間</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                mb: "12px",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              {isMobile ? (
                <>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                      gap: "8px",
                      width: "100%",
                      alignItems: "start",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#6b7280",
                          mb: "6px",
                          fontWeight: 700,
                        }}
                      >
                        起
                      </Typography>

                      <TextField
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        sx={{
                          width: "100%",
                          mb: "8px",
                          "& .MuiInputBase-root": {
                            height: "38px",
                          },
                        }}
                      />

                      <MobileTimeSelect
                        hour={startHour}
                        minute={startMin}
                        onChangeHour={setStartHour}
                        onChangeMinute={setStartMin}
                        hours={HOURS}
                        minutes={MINUTES_30}
                      />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          color: "#6b7280",
                          mb: "6px",
                          fontWeight: 700,
                        }}
                      >
                        迄
                      </Typography>

                      <TextField
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        sx={{
                          width: "100%",
                          mb: "8px",
                          "& .MuiInputBase-root": {
                            height: "38px",
                          },
                        }}
                      />

                      <MobileTimeSelect
                        hour={endHour}
                        minute={endMin}
                        onChangeHour={setEndHour}
                        onChangeMinute={setEndMin}
                        hours={HOURS}
                        minutes={MINUTES_30}
                      />
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#1f3b67",
                      width: "100%",
                      mt: "8px",
                      fontWeight: 700,
                    }}
                  >
                    總計：{formatDuration(totalMinutes)}
                  </Typography>
                </>
              ) : (
                <>
                  <TextField
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    sx={{
                      width: "150px",
                      "& .MuiInputBase-root": { height: "38px" },
                    }}
                  />

                  <FormControl sx={{ width: "70px" }}>
                    <Select
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      MenuProps={selectMenuProps}
                      sx={{ height: "38px", fontSize: "15px" }}
                    >
                      {HOURS.map((h) => (
                        <MenuItem key={h} value={h}>
                          {h}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography sx={{ fontSize: "18px", color: "#374151" }}>
                    :
                  </Typography>

                  <FormControl sx={{ width: "70px" }}>
                    <Select
                      value={startMin}
                      onChange={(e) => setStartMin(e.target.value)}
                      MenuProps={selectMenuProps}
                      sx={{ height: "38px", fontSize: "15px" }}
                    >
                      {MINUTES_30.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography sx={{ fontSize: "18px", color: "#374151" }}>
                    ~
                  </Typography>

                  <TextField
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    sx={{
                      width: "150px",
                      "& .MuiInputBase-root": { height: "38px" },
                    }}
                  />

                  <FormControl sx={{ width: "70px" }}>
                    <Select
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      MenuProps={selectMenuProps}
                      sx={{ height: "38px", fontSize: "15px" }}
                    >
                      {HOURS.map((h) => (
                        <MenuItem key={h} value={h}>
                          {h}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography sx={{ fontSize: "18px", color: "#374151" }}>
                    :
                  </Typography>

                  <FormControl sx={{ width: "70px" }}>
                    <Select
                      value={endMin}
                      onChange={(e) => setEndMin(e.target.value)}
                      MenuProps={selectMenuProps}
                      sx={{ height: "38px", fontSize: "15px" }}
                    >
                      {MINUTES_30.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography
                    sx={{
                      ml: "12px",
                      fontSize: "14px",
                      color: "#1f3b67",
                      fontWeight: 700,
                    }}
                  >
                    總計：{formatDuration(totalMinutes)}
                  </Typography>
                </>
              )}
            </Box>

            <Typography
              sx={{
                fontSize: "14px",
                color: "#111827",
                lineHeight: 1.7,
                mb: "2px",
              }}
            >
              打卡紀錄：2026/03/31 上班 08:53 ~ 下班 -
            </Typography>

            <Typography
              sx={{
                fontSize: "14px",
                color: "#111827",
                lineHeight: 1.7,
                mb: "20px",
              }}
            >
              (至少須申請 0 時 30 分且申請時數須為 0 時 30 分的倍數)
            </Typography>

            <Typography
              sx={{
                fontSize: "14px",
                color: "#111827",
                fontWeight: 700,
                lineHeight: 1.7,
              }}
            >
              扣除休息時間 0 時 0 分，共申請 {formatDuration(totalMinutes)}
            </Typography>
          </Box>
        </Box>

        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>*給付方式</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <RadioGroup
              row
              value={payType}
              onChange={(e) => setPayType(e.target.value)}
              sx={{
                gap: "16px",
                flexWrap: "nowrap",
              }}
            >
              <FormControlLabel
                value="加班費"
                control={<Radio size="small" />}
                label="加班費"
                sx={{
                  mr: 0,
                  "& .MuiFormControlLabel-label": {
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  },
                }}
              />
              <FormControlLabel
                value="補休"
                control={<Radio size="small" />}
                label="補休"
                sx={{
                  mr: 0,
                  "& .MuiFormControlLabel-label": {
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  },
                }}
              />
            </RadioGroup>
          </Box>
        </Box>

        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>*事由</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <TextField
              fullWidth
              multiline
              minRows={isMobile ? 4 : 6}
              value={reason}
              onChange={(e) => {
                if (e.target.value.length <= 250) {
                  setReason(e.target.value);
                }
              }}
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: "15px",
                },
              }}
            />

            <Typography
              sx={{
                mt: "8px",
                mb: "14px",
                fontSize: "13px",
                color: "#9ca3af",
              }}
            >
              字數限制 250 字，已輸入 {reason.length} 字
            </Typography>

            <Box
              sx={{
                width: "100%",
                bgcolor: "#e5e9f0",
                px: "14px",
                py: "14px",
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#374151",
                  lineHeight: 1.8,
                }}
              >
                1.加班需事前申請，並經主管核准。 2.平日加班上限為4小時，每月加班上限為46小時。
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: "16px",
          gap: "10px",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <Button
          variant="contained"
          fullWidth={isMobile}
          sx={{
            bgcolor: "#101b4d",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#0c1438",
              boxShadow: "none",
            },
          }}
        >
          確定
        </Button>
        <Button variant="outlined" fullWidth={isMobile}>
          取消
        </Button>
      </Box>
    </Box>
  );
}