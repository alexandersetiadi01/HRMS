import { useMemo, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import { Link as RouterLink } from "react-router-dom";
import {
  HOURS,
  MINUTES_60,
  selectMenuProps,
  SectionLabel,
  MobileTimeSelect,
  buildAttendanceSectionWrapperSx,
} from "../../../Utils/Attendance/SharedForm";

const LEAVE_TYPES = [
  { value: "paid-sick", label: "有薪病假" },
  { value: "personal", label: "事假" },
];

const LEAVE_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} 時 0 分`,
}));

const SPECIAL_LEAVE_TYPES = [
  { value: "marriage", label: "婚假" },
  { value: "funeral", label: "喪假" },
  { value: "family-care", label: "家庭照顧假" },
  { value: "maternity-checkup", label: "陪產檢及陪產假" },
  { value: "public", label: "公假" },
  { value: "injury", label: "公傷假" },
  { value: "unpaid-sick", label: "無薪病假" },
];

const AGENT_OPTIONS = [
  { value: "17001", label: "17001/王穎傑" },
  { value: "17002", label: "17002/張小明" },
  { value: "17003", label: "17003/陳美玲" },
];

const FORM_TYPES = [
  { key: "missed-punch", label: "忘打卡申請" },
  { key: "leave", label: "請假" },
  { key: "overtime", label: "加班" },
  { key: "business-trip", label: "公出/出差" },
];

function LeaveTypeRow({
  row,
  onChangeType,
  onChangeHours,
  onRemove,
  leaveTypes,
  leaveHourOptions,
  mobile,
}) {
  return (
    <Box sx={{ mb: mobile ? "12px" : "10px", width: "100%", minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          width: "100%",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: "18px",
            minWidth: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mt: "10px",
          }}
        >
          <CancelIcon
            onClick={onRemove}
            sx={{
              color: "#7b7b7b",
              fontSize: "18px",
              cursor: "pointer",
            }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: mobile
                ? "minmax(0, 1fr) 130px"
                : "minmax(0, 1fr) 150px",
              gap: "8px",
              width: "100%",
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <FormControl sx={{ width: "100%", minWidth: 0 }}>
              <Select
                displayEmpty
                value={row.leaveType}
                onChange={(e) => onChangeType(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{
                  height: "38px",
                  fontSize: "14px",
                }}
              >
                <MenuItem value="">請選擇假別</MenuItem>
                {leaveTypes.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ width: "100%", minWidth: 0 }}>
              <Select
                displayEmpty
                value={row.leaveHours}
                onChange={(e) => onChangeHours(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{
                  height: "38px",
                  fontSize: "14px",
                }}
              >
                <MenuItem value="">請選擇</MenuItem>
                {leaveHourOptions.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Typography
            sx={{
              fontSize: "14px",
              color: "#1f3b67",
              mt: "8px",
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {row.leaveType === "paid-sick"
              ? "有薪病假剩餘：240 時 0 分"
              : "剩餘：- 時 - 分"}
          </Typography>

          <Typography
            sx={{
              fontSize: "12px",
              color: "#6b7280",
              lineHeight: 1.5,
              mt: "4px",
              wordBreak: "break-word",
            }}
          >
            {row.leaveHours
              ? `(至少須申請 ${row.leaveHours} 時 0 分且申請時數須為 ${row.leaveHours} 時 0 分的倍數)`
              : "(至少須申請·時·分且申請時數須為·時·分的倍數)"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function AttendanceLeave() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [startDate, setStartDate] = useState("2026-03-31");
  const [endDate, setEndDate] = useState("2026-03-31");
  const [startHour, setStartHour] = useState("09");
  const [startMin, setStartMin] = useState("00");
  const [endHour, setEndHour] = useState("18");
  const [endMin, setEndMin] = useState("00");
  const [reason, setReason] = useState("");
  const [agent, setAgent] = useState("17001");
  const [isProxyApproval, setIsProxyApproval] = useState("no");
  const [selectedFormTypes, setSelectedFormTypes] = useState([
    "missed-punch",
    "leave",
    "overtime",
    "business-trip",
  ]);

  const [leaveRows, setLeaveRows] = useState([
    { id: 1, leaveType: "personal", leaveHours: "8" },
  ]);

  const [specialOpen, setSpecialOpen] = useState(false);
  const [specialReason, setSpecialReason] = useState("");
  const [specialLeaveType, setSpecialLeaveType] = useState("");
  const [specialFiles, setSpecialFiles] = useState([]);

  const totalLeaveHours = useMemo(() => {
    return leaveRows.reduce((sum, row) => sum + Number(row.leaveHours || 0), 0);
  }, [leaveRows]);

  const handleAddLeaveRow = () => {
    setLeaveRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        leaveType: "",
        leaveHours: "",
      },
    ]);
  };

  const handleRemoveLeaveRow = (id) => {
    setLeaveRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  };

  const updateLeaveRow = (id, key, value) => {
    setLeaveRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    );
  };

  const handleToggleFormType = (key) => {
    setSelectedFormTypes((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const sectionWrapperSx = buildAttendanceSectionWrapperSx(isMobile);

  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumbs
        separator={
          <NavigateNextIcon sx={{ fontSize: "18px", color: "#9ca3af" }} />
        }
        sx={{ mb: "10px" }}
      >
        <Link
          component={RouterLink}
          to="/attendance"
          underline="hover"
          sx={{
            fontSize: "14px",
            color: "#6b7280",
            textDecoration: "none",
            "&:hover": {
              color: "#0c93d4",
            },
          }}
        >
          個人專區
        </Link>

        <Typography
          sx={{
            fontSize: "14px",
            color: "#111827",
            fontWeight: 700,
          }}
        >
          請假
        </Typography>
      </Breadcrumbs>

      <Typography
        sx={{
          fontSize: isMobile ? "24px" : "22px",
          fontWeight: 700,
          mb: "16px",
          color: "#111827",
        }}
      >
        請假
      </Typography>

      <Box
        sx={{
          width: "100%",
          border: "1px solid #d1d5db",
          bgcolor: "#ffffff",
        }}
      >
        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>* 日期/時間</SectionLabel>

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
                    總計：8 時 0 分
                  </Typography>
                </>
              ) : (
                <>
                  <TextField
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    sx={{
                      width: "140px",
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
                      width: "140px",
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
                      {MINUTES_60.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Typography
                    sx={{ ml: "8px", fontSize: "14px", color: "#1f3b67" }}
                  >
                    總計：8 時 0 分
                  </Typography>
                </>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                mb: "8px",
              }}
            >
              {leaveRows.map((row) => (
                <LeaveTypeRow
                  key={row.id}
                  row={row}
                  leaveTypes={LEAVE_TYPES}
                  leaveHourOptions={LEAVE_HOUR_OPTIONS}
                  onRemove={() => handleRemoveLeaveRow(row.id)}
                  onChangeType={(value) =>
                    updateLeaveRow(row.id, "leaveType", value)
                  }
                  onChangeHours={(value) =>
                    updateLeaveRow(row.id, "leaveHours", value)
                  }
                  mobile={isMobile}
                />
              ))}
            </Box>

            <Box
              onClick={handleAddLeaveRow}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#1d73b2",
                fontSize: "14px",
                cursor: "pointer",
                mb: "12px",
              }}
            >
              <AddCircleIcon sx={{ fontSize: "18px" }} />
              新增
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: isMobile ? "stretch" : "center",
                justifyContent: "space-between",
                mb: "10px",
                gap: "12px",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Typography sx={{ fontSize: "14px", color: "#1f3b67" }}>
                總計：{totalLeaveHours} 時 0 分，不足 8 時 0 分
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: isMobile ? "stretch" : "center",
                  gap: "8px",
                  flexShrink: 0,
                  flexDirection: isMobile ? "column" : "row",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                <Typography sx={{ fontSize: "13px", color: "#9ca3af" }}>
                  找不到可用假別?
                </Typography>
                <Button
                  variant="contained"
                  fullWidth={isMobile}
                  onClick={() => setSpecialOpen(true)}
                  sx={{
                    minWidth: "88px",
                    height: "32px",
                    fontSize: "12px",
                    bgcolor: "#101b4d",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#0c1438",
                      boxShadow: "none",
                    },
                  }}
                >
                  特殊假別申請
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                height: "22px",
                bgcolor: "#e5e9f0",
                width: "100%",
              }}
            />
          </Box>
        </Box>

        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>事由</SectionLabel>

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
            <Typography sx={{ mt: "8px", fontSize: "13px", color: "#9ca3af" }}>
              字數限制 250 字，已輸入 {reason.length} 字
            </Typography>
          </Box>
        </Box>

        <Box sx={sectionWrapperSx}>
          <SectionLabel mobile={isMobile}>代理人</SectionLabel>

          <Box sx={{ p: isMobile ? "0 14px 14px" : "16px" }}>
            <FormControl
              sx={{ width: isMobile ? "100%" : "170px", mb: "10px" }}
            >
              <Select
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

            <Box
              sx={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                gap: "18px",
                mb: "10px",
                flexWrap: "wrap",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Typography sx={{ fontSize: "14px", color: "#374151" }}>
                *是否代理簽核
              </Typography>

              <RadioGroup
                row={!isMobile}
                value={isProxyApproval}
                onChange={(e) => setIsProxyApproval(e.target.value)}
                sx={{ gap: "8px" }}
              >
                <FormControlLabel
                  value="yes"
                  control={<Radio size="small" />}
                  label="是"
                />
                <FormControlLabel
                  value="no"
                  control={<Radio size="small" />}
                  label="否"
                />
              </RadioGroup>
            </Box>

            {isProxyApproval === "yes" ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: "18px",
                  flexWrap: "wrap",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#374151",
                    minWidth: isMobile ? "auto" : "80px",
                  }}
                >
                  *表單類型
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
                    gap: isMobile ? "10px 12px" : "20px",
                    width: isMobile ? "100%" : "auto",
                    alignItems: "center",
                  }}
                >
                  {FORM_TYPES.map((item) => (
                    <FormControlLabel
                      key={item.key}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedFormTypes.includes(item.key)}
                          onChange={() => handleToggleFormType(item.key)}
                        />
                      }
                      label={item.label}
                      sx={{
                        m: 0,
                        alignItems: "center",
                        "& .MuiFormControlLabel-label": {
                          fontSize: "14px",
                          whiteSpace: "nowrap",
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ) : null}
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
              檔案格式限制為 Microsoft Office 文件、TXT文字檔、PDF、JPG、JPEG、GIF、PNG
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              檔案大小限制為 3 MB
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              最多上傳 3 個檔案
            </Typography>
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
          申請
        </Button>
        <Button variant="outlined" fullWidth={isMobile}>
          取消
        </Button>
      </Box>

      <Dialog
        open={specialOpen}
        onClose={() => setSpecialOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: "6px",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#101b4d",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 700,
            px: "18px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
            特殊假別申請
          </Typography>

          <IconButton
            onClick={() => setSpecialOpen(false)}
            size="small"
            sx={{
              color: "#ffffff",
              p: 0,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: "20px", sm: "36px", md: "44px" },
            py: "28px",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "90px 1fr" },
              rowGap: "18px",
              columnGap: "28px",
              alignItems: "start",
              maxWidth: "760px",
            }}
          >
            <Box
              sx={{
                pt: "8px",
                fontSize: "15px",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
                *
              </Box>
              事由
            </Box>

            <Box>
              <TextField
                fullWidth
                multiline
                minRows={4}
                value={specialReason}
                onChange={(e) => {
                  if (e.target.value.length <= 250) {
                    setSpecialReason(e.target.value);
                  }
                }}
                sx={{
                  maxWidth: "550px",
                  "& .MuiInputBase-root": {
                    fontSize: "15px",
                  },
                }}
              />
              <Typography
                sx={{
                  mt: "8px",
                  fontSize: "14px",
                  color: "#9ca3af",
                }}
              >
                字數限制 250 字，已輸入 {specialReason.length} 字
              </Typography>
            </Box>

            <Box
              sx={{
                pt: "8px",
                fontSize: "15px",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
                *
              </Box>
              假別
            </Box>

            <FormControl sx={{ width: "270px" }}>
              <Select
                displayEmpty
                value={specialLeaveType}
                onChange={(e) => setSpecialLeaveType(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{
                  height: "38px",
                  fontSize: "15px",
                }}
              >
                <MenuItem value="" disabled>
                  請選擇
                </MenuItem>
                {SPECIAL_LEAVE_TYPES.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                pt: "8px",
                fontSize: "15px",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              附件
            </Box>

            <Box>
              <Button variant="outlined" component="label" sx={{ mb: "8px" }}>
                選擇檔案
                <input
                  hidden
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSpecialFiles(files.slice(0, 3));
                  }}
                />
              </Button>

              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                *檔案格式限制為 Microsoft Office 文件, TXT文字檔, PDF, 壓縮檔,
                JPG, JPEG, GIF, PNG
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                *檔案大小限制為 3 MB
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                *最多上傳 3 個檔案
              </Typography>

              {specialFiles.length > 0 ? (
                <Box sx={{ mt: "10px" }}>
                  {specialFiles.map((file) => (
                    <Typography
                      key={file.name}
                      sx={{ fontSize: "13px", color: "#374151" }}
                    >
                      {file.name}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: "18px",
            py: "12px",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button
            variant="contained"
            sx={{
              minWidth: "64px",
              height: "36px",
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

          <Button
            variant="outlined"
            onClick={() => setSpecialOpen(false)}
            sx={{
              minWidth: "64px",
              height: "36px",
              color: "#374151",
              borderColor: "#9ca3af",
            }}
          >
            取消
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}