import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import LabelCell from "../../Components/GlobalComponent";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const MINUTE_OPTIONS = ["00", "30"];

const SPECIAL_LEAVE_OPTIONS = [
  {
    value: "marriage",
    label: "婚假",
    available: "64 時 0 分",
    expiry: "2026/03/22 ~ 2026/06/21",
    rules: ["1.結婚者給予婚假八日，工資照給", "2.請檢附結婚登記證"],
  },
  {
    value: "funeral",
    label: "喪假",
    available: "64 時 0 分",
    expiry: "",
    rules: [
      "勞工喪假規定：",
      "一、父母、養父母、繼父母、配偶喪亡者，給予喪假8日，工資照給。",
      "二、祖父母、子女、配偶之父母、配偶之養父母或繼父母喪亡者，給予喪假6日，工資照給。",
      "三、曾祖父母、兄弟姊妹、配偶之祖父母喪亡者，給予喪假3日，工資照給。",
    ],
  },
  {
    value: "family-care",
    label: "家庭照顧假",
    available: "56 時 0 分",
    expiry: "",
    rules: [
      "1.於其家庭成員預防接種、發生嚴重之疾病或其他重大事故須親自照顧時，得請家庭照顧假；其請假日數併入事假計算，全年以7日為限",
      "2.請檢附證明文件",
    ],
  },
  {
    value: "maternity-checkup",
    label: "陪產檢及陪產假",
    available: "56 時 0 分",
    expiry: "",
    rules: [
      "1.陪產檢及陪產假共計七日。員工於其配偶妊娠產檢或其配偶分娩時，給予陪產檢及陪產假；如員工係為陪伴配偶產檢，應於配偶妊娠期間請休，如員工係為陪伴配偶生產，應在配偶分娩的當日及其前後合計15日期間內請休。",
      "2.請檢附出生證明文件。",
    ],
  },
  {
    value: "public",
    label: "公假",
    available: "",
    expiry: "",
    rules: ["1.員工依法令規定應給予公假者，工資照給", "2.請檢附證明文件"],
  },
  {
    value: "injury-leave",
    label: "公傷假",
    available: "",
    expiry: "",
    rules: [
      "1.員工因職業災害而致殘廢、傷害或疾病者，其治療、休養期間，給予公傷病假",
      "2.需檢附公傷證明文件",
    ],
  },

  {
    value: "unpaid-sick",
    label: "無薪病假",
    available: "",
    expiry: "",
    rules: [
      "1.員工因普通傷害、疾病或生理原因必須治療或休養者。",
      "2.病假期間不給工資",
    ],
  },
];

const FUNERAL_RELATION_OPTIONS = [
  { value: "Parents", label: "父母", text: "64 時 0 分" },
  { value: "Adoptive-parents", label: "養父母", text: "64 時 0 分" },
  { value: "Stepparents", label: "繼父母", text: "64 時 0 分" },
  { value: "Spouse", label: "配偶", text: "64 時 0 分" },
  { value: "Grandparents", label: "祖父母", text: "48 時 0 分" },
  { value: "Children", label: "子女", text: "48 時 0 分" },
  { value: "Parents-of-spouse", label: "配偶父母", text: "48 時 0 分" },
  { value: "Adoptive-parents-spouse", label: "配偶養父母", text: "48 時 0 分" },
  { value: "Stepparents-of-spouse", label: "配偶繼父母", text: "48 時 0 分" },
  { value: "Great-grandparents", label: "曾祖父母", text: "24 時 0 分" },
  { value: "Siblings", label: "兄弟姊妹", text: "24 時 0 分" },
  { value: "Grandparents-of-spouse", label: "配偶祖父母", text: "24 時 0 分" },
];

const selectMenuProps = {
  PaperProps: {
    sx: {
      maxHeight: 220,
      overflowY: "auto",
    },
  },
  MenuListProps: {
    dense: false,
    sx: {
      py: 0,
    },
  },
};

export default function AttendanceSpecialLeave() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  function getTodayDate() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const [open, setOpen] = useState(true);
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [marriageDate, setMarriageDate] = useState(getTodayDate());
  const [funeralRelation, setFuneralRelation] = useState("Parents");
  const [funeralDate, setFuneralDate] = useState(getTodayDate());
  const [familyCareYear, setFamilyCareYear] = useState(String(currentYear));
  const [spouseDeliveryDate, setSpouseDeliveryDate] = useState(getTodayDate());
  const [publicStartDate, setPublicStartDate] = useState(getTodayDate());
  const [publicStartHour, setPublicStartHour] = useState("00");
  const [publicStartMinute, setPublicStartMinute] = useState("00");
  const [publicEndDate, setPublicEndDate] = useState(getTodayDate());
  const [publicEndHour, setPublicEndHour] = useState("00");
  const [publicEndMinute, setPublicEndMinute] = useState("00");
  const [fileNames, setFileNames] = useState([]);

  function formatDateSlash(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  }

  function addDays(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date;
  }

  function getMaternityCheckupExpiryRange(dateString) {
    if (!dateString) return "-";

    const start = addDays(dateString, -300);
    const end = addDays(dateString, 15);

    return `${formatDateSlash(start)} - ${formatDateSlash(end)}`;
  }

  function getMarriageExpiryRange(dateString) {
    if (!dateString) return "-";

    const start = addDays(dateString, -10);
    const end = addDays(dateString, 80);

    return `${formatDateSlash(start)} ~ ${formatDateSlash(end)}`;
  }

  function getFuneralExpiryDate(dateString) {
    if (!dateString) return "-";

    const end = addDays(dateString, 100);
    return formatDateSlash(end);
  }

  function getPublicLeaveTotal(
    startDate,
    startHour,
    startMinute,
    endDate,
    endHour,
    endMinute,
  ) {
    if (!startDate || !endDate) return "0 時 0 分";

    const start = new Date(
      `${startDate}T${startHour || "00"}:${startMinute || "00"}:00`,
    );
    const end = new Date(
      `${endDate}T${endHour || "00"}:${endMinute || "00"}:00`,
    );

    const diffMs = end.getTime() - start.getTime();

    if (Number.isNaN(diffMs) || diffMs <= 0) return "0 時 0 分";

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours} 時 ${minutes} 分`;
  }

  const selectedLeave = SPECIAL_LEAVE_OPTIONS.find(
    (item) => item.value === leaveType,
  );

  const selectedFuneralRelation = FUNERAL_RELATION_OPTIONS.find(
    (item) => item.value === funeralRelation,
  );

  const handleClose = () => {
    setOpen(false);
    navigate("/attendance");
  };

  const handleConfirm = () => {
    console.log({
      reason,
      leaveType,
      marriageDate,
      funeralRelation,
      funeralDate,
      familyCareYear,
      spouseDeliveryDate,
      publicStartDate,
      publicStartHour,
      publicStartMinute,
      publicEndDate,
      publicEndHour,
      publicEndMinute,
      files: fileNames,
    });
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      fullScreen={isMobile}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          overflow: "hidden",
          width: { xs: "100%", sm: "auto" },
          maxWidth: { xs: "100%", sm: undefined },
          height: { xs: "100%", sm: "auto" },
          m: { xs: 0, sm: 2 },
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
          onClick={handleClose}
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
            gridTemplateColumns: { xs: "1fr", sm: "110px 1fr" },
            rowGap: "18px",
            columnGap: "28px",
            alignItems: "start",
            maxWidth: "900px",
          }}
        >
          <LabelCell required>事由</LabelCell>
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={4}
              value={reason}
              onChange={(e) => {
                if (e.target.value.length <= 250) {
                  setReason(e.target.value);
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
              字數限制 250 字，已輸入 {reason.length} 字
            </Typography>
          </Box>

          <LabelCell required>假別</LabelCell>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Box sx={{ width: "100%", maxWidth: "270px" }}>
              <FormControl fullWidth>
                <Select
                  displayEmpty
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{
                    height: "38px",
                    fontSize: "15px",
                  }}
                >
                  <MenuItem value="" disabled>
                    請選擇
                  </MenuItem>
                  {SPECIAL_LEAVE_OPTIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {leaveType &&
            leaveType !== "funeral" &&
            leaveType !== "public" &&
            leaveType !== "injury-leave" &&
            leaveType !== "unpaid-sick" ? (
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#4b5563",
                  whiteSpace: "nowrap",
                }}
              >
                可用：{selectedLeave?.available || "-"}
              </Typography>
            ) : null}
          </Box>

          {leaveType === "marriage" && (
            <>
              <LabelCell required>結婚登記日</LabelCell>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Box sx={{ width: "100%", maxWidth: "270px" }}>
                  <TextField
                    fullWidth
                    type="date"
                    value={marriageDate}
                    onChange={(e) => setMarriageDate(e.target.value)}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: "38px",
                        fontSize: "15px",
                      },
                      "& .MuiOutlinedInput-input": {
                        py: "8px",
                      },
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#4b5563",
                    whiteSpace: "nowrap",
                  }}
                >
                  有效期限：{getMarriageExpiryRange(marriageDate)}
                </Typography>
              </Box>
            </>
          )}

          {leaveType === "funeral" && (
            <>
              <LabelCell required>親屬稱謂</LabelCell>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Box sx={{ width: "100%", maxWidth: "270px" }}>
                  <FormControl fullWidth>
                    <Select
                      value={funeralRelation}
                      onChange={(e) => setFuneralRelation(e.target.value)}
                      MenuProps={selectMenuProps}
                      sx={{
                        height: "38px",
                        fontSize: "15px",
                      }}
                    >
                      {FUNERAL_RELATION_OPTIONS.map((item) => (
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
                    color: "#4b5563",
                    whiteSpace: "nowrap",
                  }}
                >
                  可用：{selectedFuneralRelation?.text || "-"}
                </Typography>
              </Box>

              <LabelCell required>親屬死亡日</LabelCell>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Box sx={{ width: "100%", maxWidth: "270px" }}>
                  <TextField
                    fullWidth
                    type="date"
                    value={funeralDate}
                    onChange={(e) => setFuneralDate(e.target.value)}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: "38px",
                        fontSize: "15px",
                      },
                      "& .MuiOutlinedInput-input": {
                        py: "8px",
                      },
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#4b5563",
                    whiteSpace: "nowrap",
                  }}
                >
                  ~ {getFuneralExpiryDate(funeralDate)}
                </Typography>
              </Box>
            </>
          )}

          {leaveType === "family-care" && (
            <>
              <LabelCell required>年度</LabelCell>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Box sx={{ width: "100%", maxWidth: "270px" }}>
                  <FormControl fullWidth>
                    <Select
                      value={familyCareYear}
                      onChange={(e) => setFamilyCareYear(e.target.value)}
                      MenuProps={selectMenuProps}
                      sx={{
                        height: "38px",
                        fontSize: "15px",
                      }}
                    >
                      {YEAR_OPTIONS.map((year) => (
                        <MenuItem key={year} value={String(year)}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#4b5563",
                    whiteSpace: "nowrap",
                  }}
                >
                  可用：56 時 0 分
                </Typography>
              </Box>
            </>
          )}

          {leaveType === "maternity-checkup" && (
            <>
              <LabelCell required>配偶分娩日</LabelCell>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <Box sx={{ width: "100%", maxWidth: "270px" }}>
                  <TextField
                    fullWidth
                    type="date"
                    value={spouseDeliveryDate}
                    onChange={(e) => setSpouseDeliveryDate(e.target.value)}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: "38px",
                        fontSize: "15px",
                      },
                      "& .MuiOutlinedInput-input": {
                        py: "8px",
                      },
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#4b5563",
                    whiteSpace: "nowrap",
                  }}
                >
                  有效期限：{getMaternityCheckupExpiryRange(spouseDeliveryDate)}
                </Typography>
              </Box>
            </>
          )}

          {(leaveType === "public" ||
            leaveType === "injury-leave" ||
            leaveType === "unpaid-sick") && (
            <>
              <LabelCell required>日期/時間</LabelCell>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxWidth: "420px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "stretch", sm: "center" },
                        gap: { xs: "8px", sm: "8px" },
                      }}
                    >
                      <Box sx={{ width: { xs: "100%", sm: "150px" } }}>
                        <TextField
                          fullWidth
                          type="date"
                          value={publicStartDate}
                          onChange={(e) => setPublicStartDate(e.target.value)}
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "38px",
                              fontSize: "15px",
                            },
                            "& .MuiOutlinedInput-input": {
                              py: "8px",
                            },
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: { xs: "100%", sm: "auto" },
                          gap: { xs: "0", sm: "8px" },
                        }}
                      >
                        <Typography
                          sx={{
                            display: { xs: "none", sm: "block" },
                            fontSize: "18px",
                            color: "#4b5563",
                            lineHeight: 1,
                          }}
                        >
                          ：
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr auto 1fr",
                              sm: "70px auto 70px",
                            },
                            alignItems: "center",
                            columnGap: "8px",
                            width: { xs: "100%", sm: "auto" },
                          }}
                        >
                          <FormControl fullWidth>
                            <Select
                              value={publicStartHour}
                              onChange={(e) =>
                                setPublicStartHour(e.target.value)
                              }
                              MenuProps={selectMenuProps}
                              sx={{
                                height: "38px",
                                fontSize: "15px",
                              }}
                            >
                              {HOUR_OPTIONS.map((hour) => (
                                <MenuItem key={hour} value={hour}>
                                  {hour}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Typography
                            sx={{
                              fontSize: "18px",
                              color: "#4b5563",
                              lineHeight: 1,
                              textAlign: "center",
                            }}
                          >
                            ：
                          </Typography>

                          <FormControl fullWidth>
                            <Select
                              value={publicStartMinute}
                              onChange={(e) =>
                                setPublicStartMinute(e.target.value)
                              }
                              MenuProps={selectMenuProps}
                              sx={{
                                height: "38px",
                                fontSize: "15px",
                              }}
                            >
                              {MINUTE_OPTIONS.map((minute) => (
                                <MenuItem key={minute} value={minute}>
                                  {minute}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>

                      <Typography
                        sx={{
                          display: { xs: "none", sm: "block" },
                          fontSize: "18px",
                          color: "#4b5563",
                          lineHeight: 1,
                        }}
                      >
                        ~
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "center", sm: "flex-start" },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "18px",
                          color: "#4b5563",
                          lineHeight: 1,
                          display: { xs: "block", sm: "none" },
                          px: "4px",
                        }}
                      >
                        ~
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "stretch", sm: "center" },
                        gap: { xs: "8px", sm: "8px" },
                      }}
                    >
                      <Box sx={{ width: { xs: "100%", sm: "150px" } }}>
                        <TextField
                          fullWidth
                          type="date"
                          value={publicEndDate}
                          onChange={(e) => setPublicEndDate(e.target.value)}
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "38px",
                              fontSize: "15px",
                            },
                            "& .MuiOutlinedInput-input": {
                              py: "8px",
                            },
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: { xs: "100%", sm: "auto" },
                          gap: { xs: "0", sm: "8px" },
                        }}
                      >
                        <Typography
                          sx={{
                            display: { xs: "none", sm: "block" },
                            fontSize: "18px",
                            color: "#4b5563",
                            lineHeight: 1,
                          }}
                        >
                          ：
                        </Typography>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr auto 1fr",
                              sm: "70px auto 70px",
                            },
                            alignItems: "center",
                            columnGap: "8px",
                            width: { xs: "100%", sm: "auto" },
                          }}
                        >
                          <FormControl fullWidth>
                            <Select
                              value={publicEndHour}
                              onChange={(e) => setPublicEndHour(e.target.value)}
                              MenuProps={selectMenuProps}
                              sx={{
                                height: "38px",
                                fontSize: "15px",
                              }}
                            >
                              {HOUR_OPTIONS.map((hour) => (
                                <MenuItem key={hour} value={hour}>
                                  {hour}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Typography
                            sx={{
                              fontSize: "18px",
                              color: "#4b5563",
                              lineHeight: 1,
                              textAlign: "center",
                            }}
                          >
                            ：
                          </Typography>

                          <FormControl fullWidth>
                            <Select
                              value={publicEndMinute}
                              onChange={(e) =>
                                setPublicEndMinute(e.target.value)
                              }
                              MenuProps={selectMenuProps}
                              sx={{
                                height: "38px",
                                fontSize: "15px",
                              }}
                            >
                              {MINUTE_OPTIONS.map((minute) => (
                                <MenuItem key={minute} value={minute}>
                                  {minute}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    </Box>

                    <Typography
                      sx={{
                        mt: "4px",
                        fontSize: "14px",
                        color: "#4b5563",
                        whiteSpace: "nowrap",
                      }}
                    >
                      總計：
                      {getPublicLeaveTotal(
                        publicStartDate,
                        publicStartHour,
                        publicStartMinute,
                        publicEndDate,
                        publicEndHour,
                        publicEndMinute,
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </>
          )}

          <LabelCell>附件</LabelCell>
          <Box>
            <Button
              variant="outlined"
              component="label"
              sx={{
                height: "38px",
                textTransform: "none",
                color: "#111827",
                borderColor: "#cfcfcf",
                mr: "10px",
              }}
            >
              選擇檔案
              <input
                hidden
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 3);
                  setFileNames(files.map((file) => file.name));
                }}
              />
            </Button>

            {fileNames.length > 0 ? (
              <Box sx={{ mt: "8px" }}>
                {fileNames.map((name) => (
                  <Typography
                    key={name}
                    sx={{
                      fontSize: "14px",
                      color: "#6b7280",
                      lineHeight: 1.5,
                    }}
                  >
                    {name}
                  </Typography>
                ))}
              </Box>
            ) : null}

            <Box sx={{ mt: "8px" }}>
              <Typography sx={{ fontSize: "14px", color: "#9ca3af" }}>
                *檔案格式限制為 Microsoft Office 文件, TXT文字檔, PDF, 壓縮檔,
                JPG, JPEG, GIF, PNG
              </Typography>
              <Typography sx={{ fontSize: "14px", color: "#9ca3af" }}>
                *檔案大小限制為 3 MB
              </Typography>
              <Typography sx={{ fontSize: "14px", color: "#9ca3af" }}>
                *最多上傳 3 個檔案
              </Typography>
            </Box>
          </Box>

          {selectedLeave?.rules?.length > 0 && (
            <>
              <Box />
              <Box
                sx={{
                  maxWidth: "700px",
                  bgcolor: "#f5f5f5",
                  px: "18px",
                  py: "16px",
                  mt: "6px",
                  border: "1px solid #e5e7eb",
                }}
              >
                {selectedLeave.rules.map((text, index) => (
                  <Typography
                    key={index}
                    sx={{
                      fontSize: "15px",
                      color: "#111827",
                      lineHeight: 1.9,
                      mt: index === 0 ? 0 : "4px",
                    }}
                  >
                    {text}
                  </Typography>
                ))}
              </Box>
            </>
          )}
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
          onClick={handleConfirm}
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
          onClick={handleClose}
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
  );
}
