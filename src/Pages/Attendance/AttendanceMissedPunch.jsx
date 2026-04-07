import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { getTodayDate, LabelCell } from "../../Components/GlobalComponent";
import {
  HOURS,
  MINUTES_60,
  selectMenuProps,
} from "../../Utils/Attendance/SharedForm";

const TYPE_OPTIONS = [
  { value: "missed-in", label: "上班" },
  { value: "missed-out", label: "下班" },
  { value: "rest-start", label: "休息開始" },
  { value: "rest-end", label: "休息結束" },
];

const LOCATION_OPTIONS = [
  { value: "office", label: "台灣水禾" },
  { value: "post office", label: "林口郵局" },
  { value: "other", label: "其他" },
];

export default function AttendanceMissedPunch() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [open, setOpen] = useState(true);
  const [date, setDate] = useState(getTodayDate());
  const [type, setType] = useState("");
  const [timeHour, setTimeHour] = useState("");
  const [timeMinute, setTimeMinute] = useState("");
  const [location, setLocation] = useState("");
  const [locationDesc, setLocationDesc] = useState("");
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setOpen(false);
    navigate("/attendance");
  };

  const handleConfirm = () => {
    console.log({
      date,
      type,
      timeHour,
      timeMinute,
      location,
      locationDesc,
      reason,
    });
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          overflow: "hidden",
          m: { xs: 0, sm: 4 },
          height: { xs: "100%", sm: "auto" },
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
          忘打卡申請
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
            gridTemplateColumns: { xs: "1fr", sm: "90px 1fr" },
            rowGap: "18px",
            columnGap: "28px",
            alignItems: "start",
            maxWidth: "760px",
          }}
        >
          <LabelCell required>日期</LabelCell>
          <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: "270px" } }}>
            <TextField
              fullWidth
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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

          <LabelCell required>類型</LabelCell>
          <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: "270px" } }}>
            <FormControl fullWidth>
              <Select
                displayEmpty
                value={type}
                onChange={(e) => setType(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{
                  height: "38px",
                  fontSize: "15px",
                }}
              >
                <MenuItem value="" disabled>
                  請選擇
                </MenuItem>
                {TYPE_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <LabelCell required>時間</LabelCell>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              maxWidth: { xs: "100%", sm: "270px" },
            }}
          >
            <FormControl
              sx={{
                width: { xs: "calc((100% - 22px) / 2)", sm: "124px" },
                flexShrink: 0,
              }}
            >
              <Select
                displayEmpty
                value={timeHour}
                onChange={(e) => setTimeHour(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{
                  height: "38px",
                  fontSize: "15px",
                }}
              >
                <MenuItem value="" disabled>
                  請選擇
                </MenuItem>
                {HOURS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box
              sx={{
                width: "22px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: "18px",
                  color: "#374151",
                  lineHeight: 1,
                }}
              >
                :
              </Typography>
            </Box>

            <FormControl
              sx={{
                width: { xs: "calc((100% - 22px) / 2)", sm: "124px" },
                flexShrink: 0,
              }}
            >
              <Select
                displayEmpty
                value={timeMinute}
                onChange={(e) => setTimeMinute(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{
                  height: "38px",
                  fontSize: "15px",
                }}
              >
                <MenuItem value="" disabled>
                  請選擇
                </MenuItem>
                {MINUTES_60.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <LabelCell required>地點</LabelCell>
          <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: "270px" } }}>
            <FormControl fullWidth>
              <Select
                displayEmpty
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{
                  height: "38px",
                  fontSize: "15px",
                }}
              >
                <MenuItem value="" disabled>
                  請選擇
                </MenuItem>
                {LOCATION_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {location === "other" && (
            <>
              <LabelCell required>地點說明</LabelCell>
              <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: "550px" } }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  value={locationDesc}
                  onChange={(e) => {
                    if (e.target.value.length <= 250) {
                      setLocationDesc(e.target.value);
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
                    fontSize: "14px",
                    color: "#9ca3af",
                  }}
                >
                  字數限制 250 字，已輸入 {locationDesc.length} 字
                </Typography>
              </Box>
            </>
          )}

          <LabelCell>事由</LabelCell>
          <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: "550px" } }}>
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