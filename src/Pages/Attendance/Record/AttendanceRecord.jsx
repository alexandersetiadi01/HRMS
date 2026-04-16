import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Button,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Select,
  Checkbox,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AttendanceRecordTable from "./AttendanceRecordTable";
import AttendanceAbnormalTable from "./AttendanceAbnormalTable";
import Breadcrumb from "../../../Utils/Breadcrumb";
import { apiAttendanceRecords } from "../../../API/attendance";

const DEFAULT_LOCATION_OPTIONS = ["全部"];
const DEFAULT_METHOD_OPTIONS = ["全部"];
const ABNORMAL_REASON_OPTIONS = ["全部", "遲到", "早退", "忘打卡"];

const RECORD_TYPE_MAP = {
  上下班: "clock",
  休息: "break",
  外出: "outing",
};

const ABNORMAL_DATA = [
  {
    date: "2026/03/04",
    reason: "遲到6分鐘",
    formRecord: "",
  },
];

export default function AttendanceRecord() {
  const [tab, setTab] = useState(0);
  const [recordType, setRecordType] = useState("上下班");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("全部");
  const [method, setMethod] = useState("全部");
  const [locationOptions, setLocationOptions] = useState(
    DEFAULT_LOCATION_OPTIONS,
  );
  const [methodOptions, setMethodOptions] = useState(DEFAULT_METHOD_OPTIONS);
  const [recordRows, setRecordRows] = useState([]);
  const [recordLoading, setRecordLoading] = useState(false);
  const [abnormalReason, setAbnormalReason] = useState("全部");
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const fetchRecordData = async ({
    nextRecordType = recordType,
    nextStartDate = startDate,
    nextEndDate = endDate,
    nextLocation = location,
    nextMethod = method,
  } = {}) => {
    try {
      setRecordLoading(true);

      const res = await apiAttendanceRecords({
        record_type: RECORD_TYPE_MAP[nextRecordType] || "clock",
        date_from: nextStartDate,
        date_to: nextEndDate,
        location: nextLocation,
        method: nextMethod,
      });

      const payload = res?.data || {};
      const items = Array.isArray(payload?.items) ? payload.items : [];

      const formattedRows = items.map((item) => ({
        date: item?.date || "-",
        start: item?.start_display || "-",
        startMethod: item?.start_method || "-",
        end: item?.end_display || "-",
        endMethod: item?.end_method || "-",
      }));

      const nextLocationOptions =
        Array.isArray(payload?.filters?.locations) &&
        payload.filters.locations.length > 0
          ? payload.filters.locations
          : DEFAULT_LOCATION_OPTIONS;

      const nextMethodOptions =
        Array.isArray(payload?.filters?.methods) &&
        payload.filters.methods.length > 0
          ? payload.filters.methods
          : DEFAULT_METHOD_OPTIONS;

      setRecordRows(formattedRows);
      setLocationOptions(nextLocationOptions);
      setMethodOptions(nextMethodOptions);

      if (!nextLocationOptions.includes(nextLocation)) {
        setLocation("全部");
      }

      if (!nextMethodOptions.includes(nextMethod)) {
        setMethod("全部");
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      setRecordRows([]);
      setLocationOptions(DEFAULT_LOCATION_OPTIONS);
      setMethodOptions(DEFAULT_METHOD_OPTIONS);
    } finally {
      setRecordLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 0) {
      return;
    }

    fetchRecordData();
  }, [tab, recordType]);

  const handleSearchRecord = () => {
    fetchRecordData();
  };

  const handleResetRecord = () => {
    const resetLocation = "全部";
    const resetMethod = "全部";

    setLocation(resetLocation);
    setMethod(resetMethod);

    fetchRecordData({
      nextLocation: resetLocation,
      nextMethod: resetMethod,
    });
  };

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        p: { xs: "0px", md: "24px" },
      }}
    >
      <Breadcrumb rootLabel="個人專區" currentLabel="打卡紀錄" mb="14px" />
      <Typography sx={{ fontSize: "24px", fontWeight: 700, mb: 2 }}>
        打卡紀錄
      </Typography>

      <Paper
        sx={{
          borderRadius: "0px",
          overflow: "hidden",
          border: "1px solid #d1d5db",
        }}
      >
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: "52px",
            borderBottom: "1px solid #d1d5db",
            "& .MuiTabs-flexContainer": {
              width: "100%",
            },
            "& .MuiTab-root": {
              minHeight: "52px",
              fontSize: { xs: "14px", sm: "16px" },
              color: "#374151",
              fontWeight: 700,
            },
            "& .Mui-selected": {
              color: "#1976d2",
            },
            "& .MuiTabs-indicator": {
              height: "2px",
            },
          }}
        >
          <Tab label="上下班/休息/外出" />
          <Tab label="異常" />
        </Tabs>

        <Box sx={{ p: { xs: "16px", sm: "20px" } }}>
          {tab === 0 ? (
            <Stack spacing={2.5}>
              {/* Desktop layout */}
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Stack spacing={2.5}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                      *資料類型
                    </Typography>

                    <RadioGroup
                      row
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                    >
                      {["上下班", "休息", "外出"].map((item) => (
                        <FormControlLabel
                          key={item}
                          value={item}
                          control={<Radio size="small" />}
                          label={item}
                          sx={{
                            mr: 0,
                            ml: 0,
                            px: "0px",
                            py: "4px",
                            borderRadius: "4px",
                            "& .MuiFormControlLabel-label": {
                              fontSize: "14px",
                              fontWeight: 700,
                              color:
                                recordType === item ? "#1976d2" : "#374151",
                            },
                          }}
                        />
                      ))}
                    </RadioGroup>

                    <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                      *查詢日期
                    </Typography>

                    <TextField
                      size="small"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      sx={{
                        width: "190px",
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />

                    <Typography sx={{ fontSize: "16px" }}>~</Typography>

                    <TextField
                      size="small"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      sx={{
                        width: "190px",
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />

                    <Button
                      variant="contained"
                      onClick={handleSearchRecord}
                      sx={{
                        minWidth: "64px",
                        height: "40px",
                        bgcolor: "#1976d2",
                        boxShadow: "none",
                      }}
                    >
                      搜尋
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleResetRecord}
                      sx={{
                        minWidth: "64px",
                        height: "40px",
                      }}
                    >
                      清空
                    </Button>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                      地點
                    </Typography>

                    <FormControl size="small" sx={{ minWidth: "120px" }}>
                      <Select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        sx={{ height: "40px" }}
                      >
                        {locationOptions.map((item) => (
                          <MenuItem key={item} value={item}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                      打卡方式
                    </Typography>

                    <FormControl size="small" sx={{ minWidth: "160px" }}>
                      <Select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        sx={{ height: "40px" }}
                      >
                        {methodOptions.map((item) => (
                          <MenuItem key={item} value={item}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ flex: 1 }} />

                    <Button
                      variant="contained"
                      sx={{
                        minWidth: "100px",
                        height: "36px",
                        bgcolor: "#0f1f57",
                        boxShadow: "none",
                      }}
                    >
                      忘打卡申請
                    </Button>
                  </Stack>
                </Stack>
              </Box>

              {/* Mobile layout */}
              <Box sx={{ display: { xs: "block", md: "none" } }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography sx={{ fontSize: "14px", mb: 1 }}>
                      *資料類型
                    </Typography>

                    <RadioGroup
                      row
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                      sx={{
                        flexWrap: "wrap",
                        gap: 0.5,
                      }}
                    >
                      {["上下班", "休息", "外出"].map((item) => (
                        <FormControlLabel
                          key={item}
                          value={item}
                          control={<Radio size="small" />}
                          label={item}
                          sx={{
                            mr: 0.5,
                            ml: 0,
                            "& .MuiFormControlLabel-label": {
                              fontSize: "14px",
                              fontWeight: 700,
                              color:
                                recordType === item ? "#1976d2" : "#374151",
                            },
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: "14px", mb: 1 }}>
                      *查詢日期
                    </Typography>

                    <Stack
                      direction="row"
                      alignItems="center"
                      sx={{ width: "100%" }}
                    >
                      <TextField
                        size="small"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        sx={{
                          width: "calc((100% - 24px) / 2)",
                          "& .MuiInputBase-root": {
                            height: "40px",
                          },
                          "& .MuiInputBase-input": {
                            px: "10px",
                            fontSize: "13px",
                          },
                          "& input": {
                            minWidth: 0,
                          },
                          "& input::-webkit-date-and-time-value": {
                            textAlign: "left",
                          },
                          "& input::-webkit-calendar-picker-indicator": {
                            marginLeft: "4px",
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />

                      <Typography
                        sx={{
                          width: "24px",
                          textAlign: "center",
                          fontSize: "16px",
                          color: "#374151",
                          flexShrink: 0,
                        }}
                      >
                        ~
                      </Typography>

                      <TextField
                        size="small"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        sx={{
                          width: "calc((100% - 24px) / 2)",
                          "& .MuiInputBase-root": {
                            height: "40px",
                          },
                          "& .MuiInputBase-input": {
                            px: "10px",
                            fontSize: "13px",
                          },
                          "& input": {
                            minWidth: 0,
                          },
                          "& input::-webkit-date-and-time-value": {
                            textAlign: "left",
                          },
                          "& input::-webkit-calendar-picker-indicator": {
                            marginLeft: "4px",
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={2.5}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSearchRecord}
                      sx={{
                        height: "40px",
                        bgcolor: "#1976d2",
                        boxShadow: "none",
                      }}
                    >
                      搜尋
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleResetRecord}
                      sx={{
                        height: "40px",
                      }}
                    >
                      清空
                    </Button>
                  </Stack>

                  <Box>
                    <Typography sx={{ fontSize: "14px", mb: 1 }}>
                      地點
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        sx={{ height: "40px" }}
                      >
                        {locationOptions.map((item) => (
                          <MenuItem key={item} value={item}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: "14px", mb: 1 }}>
                      打卡方式
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        sx={{ height: "40px" }}
                      >
                        {methodOptions.map((item) => (
                          <MenuItem key={item} value={item}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      height: "36px",
                      bgcolor: "#0f1f57",
                      boxShadow: "none",
                    }}
                  >
                    忘打卡申請
                  </Button>
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              {/* Desktop abnormal layout */}
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                      *查詢日期
                    </Typography>

                    <TextField
                      size="small"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      sx={{
                        width: "190px",
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />

                    <Typography sx={{ fontSize: "16px" }}>~</Typography>

                    <TextField
                      size="small"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      sx={{
                        width: "190px",
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography sx={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                      *原因
                    </Typography>

                    <FormControl
                      size="small"
                      sx={{ minWidth: "320px", flex: 1 }}
                    >
                      <Select
                        value={abnormalReason}
                        onChange={(e) => setAbnormalReason(e.target.value)}
                        sx={{ height: "40px" }}
                      >
                        {ABNORMAL_REASON_OPTIONS.map((item) => (
                          <MenuItem key={item} value={item}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      sx={{
                        minWidth: "64px",
                        height: "40px",
                        bgcolor: "#1976d2",
                        boxShadow: "none",
                      }}
                    >
                      搜尋
                    </Button>

                    <Button
                      variant="outlined"
                      sx={{
                        minWidth: "64px",
                        height: "40px",
                      }}
                    >
                      清空
                    </Button>
                  </Stack>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showOnlyPending}
                        onChange={(e) => setShowOnlyPending(e.target.checked)}
                        size="small"
                      />
                    }
                    label="僅顯示無表單申請紀錄資料"
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": {
                        fontSize: "14px",
                      },
                    }}
                  />

                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button
                      variant="contained"
                      sx={{
                        minWidth: "64px",
                        height: "36px",
                        bgcolor: "#0f1f57",
                        boxShadow: "none",
                      }}
                    >
                      請假
                    </Button>
                    <Button
                      variant="contained"
                      sx={{
                        minWidth: "100px",
                        height: "36px",
                        bgcolor: "#0f1f57",
                        boxShadow: "none",
                      }}
                    >
                      忘打卡申請
                    </Button>
                  </Stack>
                </Stack>
              </Box>

              {/* Mobile abnormal layout */}
              <Box sx={{ display: { xs: "block", md: "none" } }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography sx={{ fontSize: "14px", mb: 1 }}>
                      *查詢日期
                    </Typography>

                    <Stack
                      direction="row"
                      alignItems="center"
                      sx={{ width: "100%" }}
                    >
                      <TextField
                        size="small"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        sx={{
                          width: "calc((100% - 24px) / 2)",
                          "& .MuiInputBase-root": {
                            height: "40px",
                          },
                          "& .MuiInputBase-input": {
                            px: "10px",
                            fontSize: "13px",
                          },
                          "& input": {
                            minWidth: 0,
                          },
                          "& input::-webkit-date-and-time-value": {
                            textAlign: "left",
                          },
                          "& input::-webkit-calendar-picker-indicator": {
                            marginLeft: "4px",
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />

                      <Typography
                        sx={{
                          width: "24px",
                          textAlign: "center",
                          fontSize: "16px",
                          color: "#374151",
                          flexShrink: 0,
                        }}
                      >
                        ~
                      </Typography>

                      <TextField
                        size="small"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        sx={{
                          width: "calc((100% - 24px) / 2)",
                          "& .MuiInputBase-root": {
                            height: "40px",
                          },
                          "& .MuiInputBase-input": {
                            px: "10px",
                            fontSize: "13px",
                          },
                          "& input": {
                            minWidth: 0,
                          },
                          "& input::-webkit-date-and-time-value": {
                            textAlign: "left",
                          },
                          "& input::-webkit-calendar-picker-indicator": {
                            marginLeft: "4px",
                          },
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: "14px", mb: 1 }}>
                      *原因
                    </Typography>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={abnormalReason}
                        onChange={(e) => setAbnormalReason(e.target.value)}
                        sx={{ height: "40px" }}
                      >
                        {ABNORMAL_REASON_OPTIONS.map((item) => (
                          <MenuItem key={item} value={item}>
                            {item}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showOnlyPending}
                        onChange={(e) => setShowOnlyPending(e.target.checked)}
                        size="small"
                      />
                    }
                    label="僅顯示無表單申請紀錄資料"
                    sx={{
                      m: 0,
                      alignItems: "flex-start",
                      "& .MuiFormControlLabel-label": {
                        fontSize: "14px",
                        mt: "2px",
                      },
                    }}
                  />

                  <Stack direction="row" spacing={2.5}>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        height: "40px",
                        bgcolor: "#1976d2",
                        boxShadow: "none",
                      }}
                    >
                      搜尋
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        height: "40px",
                      }}
                    >
                      清空
                    </Button>
                  </Stack>

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        height: "36px",
                        bgcolor: "#0f1f57",
                        boxShadow: "none",
                      }}
                    >
                      請假
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{
                        height: "36px",
                        bgcolor: "#0f1f57",
                        boxShadow: "none",
                      }}
                    >
                      忘打卡申請
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>

        <Box
          sx={{
            px: { xs: "12px", sm: "20px" },
            pb: "20px",
          }}
        >
          {tab === 0 ? (
            <>
              <AttendanceRecordTable
                rows={recordRows}
                loading={recordLoading}
              />

              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                  spacing={0.5}
                  flexWrap="nowrap"
                >
                  <Button
                    size="small"
                    sx={{
                      minWidth: { xs: "28px", sm: "40px" },
                      px: 0.25,
                      fontSize: { xs: "11px", sm: "14px" },
                    }}
                  >
                    {"<<"}
                  </Button>

                  <Button
                    size="small"
                    sx={{
                      minWidth: { xs: "28px", sm: "40px" },
                      px: 0.25,
                      fontSize: { xs: "11px", sm: "14px" },
                    }}
                  >
                    {"<"}
                  </Button>

                  <TextField
                    size="small"
                    value="1"
                    sx={{
                      width: { xs: "42px", sm: "60px" },
                      "& .MuiInputBase-root": {
                        height: { xs: "32px", sm: "40px" },
                      },
                      "& .MuiInputBase-input": {
                        px: 0.5,
                        py: 0.25,
                        textAlign: "center",
                        fontSize: { xs: "12px", sm: "14px" },
                      },
                    }}
                  />

                  <Typography sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                    / 3
                  </Typography>

                  <Button
                    size="small"
                    sx={{
                      minWidth: { xs: "28px", sm: "40px" },
                      px: 0.25,
                      fontSize: { xs: "11px", sm: "14px" },
                    }}
                  >
                    {">"}
                  </Button>

                  <Button
                    size="small"
                    sx={{
                      minWidth: { xs: "28px", sm: "40px" },
                      px: 0.25,
                      fontSize: { xs: "11px", sm: "14px" },
                    }}
                  >
                    {">>"}
                  </Button>
                </Stack>

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="flex-start"
                  spacing={1}
                  flexWrap="wrap"
                >
                  <FormControl size="small">
                    <Select
                      value={10}
                      sx={{
                        width: { xs: "64px", sm: "64px" },
                        height: { xs: "36px", sm: "40px" },
                        fontSize: { xs: "12px", sm: "14px" },
                      }}
                    >
                      <MenuItem value={10}>10</MenuItem>
                    </Select>
                  </FormControl>

                  <Typography sx={{ fontSize: { xs: "12px", sm: "14px" } }}>
                    1-10 / 22
                  </Typography>
                </Stack>
              </Stack>
            </>
          ) : (
            <AttendanceAbnormalTable rows={ABNORMAL_DATA} />
          )}
        </Box>
      </Paper>
    </Box>
  );
}
