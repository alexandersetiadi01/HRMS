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
  MINUTES_60,
  selectMenuProps,
  SectionLabel,
  MobileTimeSelect,
  toMinutes,
  formatDuration,
  buildAttendanceSectionWrapperSx,
} from "../../Utils/Attendance/SharedForm";

const AGENT_OPTIONS = [
  { value: "", label: "工號或姓名" },
  { value: "17001", label: "17001/王穎傑" },
  { value: "17002", label: "17002/張小明" },
  { value: "17003", label: "17003/陳美玲" },
];

export default function AttendanceBusinessTrip() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [tripType, setTripType] = useState("公出");
  const [startDate, setStartDate] = useState("2026-03-31");
  const [endDate, setEndDate] = useState("2026-03-31");
  const [startHour, setStartHour] = useState("16");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("16");
  const [endMin, setEndMin] = useState("00");

  const [location, setLocation] = useState("");
  const [reason, setReason] = useState("");
  const [agent, setAgent] = useState("");
  const [note, setNote] = useState("");

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
        公出/出差
      </Typography>

      <Box
        sx={{
          width: "100%",
          border: "1px solid #d1d5db",
          bgcolor: "#ffffff",
        }}
      >
        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>*類型</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <RadioGroup
              row
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              sx={{
                gap: "24px",
                flexWrap: "nowrap",
              }}
            >
              <FormControlLabel
                value="公出"
                control={<Radio size="small" />}
                label="公出"
                sx={{
                  mr: 0,
                  "& .MuiFormControlLabel-label": {
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  },
                }}
              />
              <FormControlLabel
                value="出差"
                control={<Radio size="small" />}
                label="出差"
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
          <SectionLabel mobile={isMobile}>*日期/時間</SectionLabel>

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
                        minutes={MINUTES_60}
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
                        minutes={MINUTES_60}
                      />
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#1f3b67",
                      width: "100%",
                      mt: "8px",
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

                  <FormControl sx={{ width: "76px" }}>
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

                  <FormControl sx={{ width: "76px" }}>
                    <Select
                      value={startMin}
                      onChange={(e) => setStartMin(e.target.value)}
                      MenuProps={selectMenuProps}
                      sx={{ height: "38px", fontSize: "15px" }}
                    >
                      {MINUTES_60.map((m) => (
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

                  <FormControl sx={{ width: "76px" }}>
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

                  <FormControl sx={{ width: "76px" }}>
                    <Select
                      value={endMin}
                      onChange={(e) => setEndMin(e.target.value)}
                      MenuProps={selectMenuProps}
                      sx={{ height: "38px", fontSize: "15px" }}
                    >
                      {MINUTES_60.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography
                    sx={{
                      ml: "18px",
                      fontSize: "14px",
                      color: "#1f3b67",
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
              }}
            >
              (填寫時間須包含路程時間)
            </Typography>
          </Box>
        </Box>

        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>*地點</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <TextField
              fullWidth
              multiline
              minRows={isMobile ? 4 : 5}
              value={location}
              onChange={(e) => {
                if (e.target.value.length <= 250) {
                  setLocation(e.target.value);
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
                fontSize: "13px",
                color: "#9ca3af",
              }}
            >
              字數限制 250 字，已輸入 {location.length} 字
            </Typography>
          </Box>
        </Box>

        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>*事由</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <TextField
              fullWidth
              multiline
              minRows={isMobile ? 4 : 5}
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
                fontSize: "13px",
                color: "#9ca3af",
              }}
            >
              字數限制 250 字，已輸入 {reason.length} 字
            </Typography>
          </Box>
        </Box>

        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>代理人</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <FormControl sx={{ width: isMobile ? "100%" : "220px" }}>
              <Select
                displayEmpty
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{ height: "38px", fontSize: "14px" }}
              >
                {AGENT_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>備註</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <TextField
              fullWidth
              multiline
              minRows={isMobile ? 4 : 5}
              value={note}
              onChange={(e) => {
                if (e.target.value.length <= 250) {
                  setNote(e.target.value);
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
                fontSize: "13px",
                color: "#9ca3af",
              }}
            >
              字數限制 250 字，已輸入 {note.length} 字
            </Typography>
          </Box>
        </Box>

        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>附件</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <Button variant="outlined" component="label" sx={{ mb: "8px" }}>
              選擇檔案
              <input hidden type="file" multiple />
            </Button>

            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              *檔案格式限制為 Microsoft Office 文件, TXT文字檔, PDF, 壓縮檔, JPG, JPEG, GIF, PNG
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              *檔案大小限制為 3 MB
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              *最多上傳 3 個檔案
            </Typography>

            <Box
              sx={{
                mt: "14px",
                height: "30px",
                bgcolor: "#e5e9f0",
                width: "100%",
              }}
            />
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