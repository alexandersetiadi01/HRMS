import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

const blocks = [
  { title: "學歷資料", key: "education" },
  { title: "證照資料", key: "certificate" },
];

const EDUCATION_CATEGORY_OPTIONS = [
  "高中職以下",
  "高中",
  "專科/副學士",
  "四技",
  "二技",
  "學士",
  "碩士",
  "博士",
];

const DEPARTMENT_CATEGORY_OPTIONS = [
  "人文學類",
  "外語學類",
  "教育學類",
  "商業及管理學類",
  "社會及行為科學學類",
  "社會服務學類",
  "法律學類",
  "設計學類",
  "傳播學類",
  "電算機學類",
  "數學及統計學類",
  "工程學類",
  "民生學類",
  "生命科學學類",
  "自然科學學類",
  "建築及都市規劃學類",
  "農林食品科學學類",
  "運輸服務學類",
  "醫藥衛生學類",
  "獸醫學類",
  "藝術學類",
  "環境保護學類",
  "軍警國防安全學類",
  "體育休閒學類",
  "其他學類",
];

const dropdownMenuProps = {
  disableScrollLock: true,
  PaperProps: {
    sx: {
      maxHeight: 240,
      overflowY: "auto",
      mt: "2px",
    },
  },
  MenuListProps: {
    sx: {
      py: 0,
      maxHeight: 240,
    },
  },
  anchorOrigin: {
    vertical: "bottom",
    horizontal: "left",
  },
  transformOrigin: {
    vertical: "top",
    horizontal: "left",
  },
};

function RequiredLabel({ children, required = false, mobile = false }) {
  return (
    <Typography
      sx={{
        fontSize: mobile ? "15px" : "16px",
        color: "#2d3945",
        textAlign: mobile ? "left" : "right",
        whiteSpace: "nowrap",
        fontWeight: mobile ? 700 : 400,
      }}
    >
      {required ? (
        <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
          *
        </Box>
      ) : null}
      {children}：
    </Typography>
  );
}

export default function EducationCertificateTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);

  const [isHighestEducation, setIsHighestEducation] = useState("否");
  const [educationCategory, setEducationCategory] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [departmentCategory, setDepartmentCategory] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [studyType, setStudyType] = useState("");
  const [studyStatus, setStudyStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [schoolRegion, setSchoolRegion] = useState("");
  const [proofFileName, setProofFileName] = useState("");

  const [certificateName, setCertificateName] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [acquiredDate, setAcquiredDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [permanentValid, setPermanentValid] = useState(false);
  const [certificateNote, setCertificateNote] = useState("");
  const [certificateFileName, setCertificateFileName] = useState("");

  const handleOpen = (key) => {
    if (key === "education") setEducationDialogOpen(true);
    if (key === "certificate") setCertificateDialogOpen(true);
  };

  const handleCloseEducation = () => {
    setEducationDialogOpen(false);
  };

  const handleCloseCertificate = () => {
    setCertificateDialogOpen(false);
  };

  const dialogPaperSx = {
    borderRadius: isMobile ? 0 : "6px",
    overflow: "hidden",
    width: "100%",
    maxWidth: isMobile ? "100%" : undefined,
    height: isMobile ? "100dvh" : "auto",
    maxHeight: isMobile ? "100dvh" : "calc(100% - 64px)",
    m: isMobile ? 0 : 4,
  };

  const formGridSx = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "160px minmax(0, 1fr)",
    rowGap: isMobile ? "12px" : "14px",
    columnGap: "26px",
    alignItems: isMobile ? "start" : "center",
  };

  const fieldBoxSx = {
    width: "100%",
  };

  return (
    <>
      <Box
        sx={{
          bgcolor: "#ffffff",
          minHeight: isMobile ? "unset" : "260px",
        }}
      >
        {blocks.map((item, index) => (
          <Box
            key={item.title}
            sx={{
              minHeight: isMobile ? "72px" : "80px",
              px: isMobile ? "16px" : 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom:
                index !== blocks.length - 1 ? "1px solid #ececec" : "none",
            }}
          >
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              {item.title}
            </Typography>

            <IconButton
              size="small"
              onClick={() => handleOpen(item.key)}
              sx={{ mr: isMobile ? "-4px" : 0 }}
            >
              <AddIcon
                sx={{
                  fontSize: "28px",
                  color: "#111827",
                  fontWeight: 700,
                }}
              />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Dialog
        open={educationDialogOpen}
        onClose={handleCloseEducation}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#2085c7",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 700,
            px: "18px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
            申請修改資料
          </Typography>

          <IconButton onClick={handleCloseEducation} size="small" sx={{ color: "#ffffff", p: 0 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: "18px", sm: "34px", md: "42px" },
            py: "26px",
            flex: 1,
            overflowY: "auto",
          }}
        >
          <Box sx={formGridSx}>
            <RequiredLabel required mobile={isMobile}>最高學歷</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <RadioGroup
                row
                value={isHighestEducation}
                onChange={(e) => setIsHighestEducation(e.target.value)}
                sx={{ gap: "10px", flexWrap: "wrap" }}
              >
                <FormControlLabel value="是" control={<Radio size="small" />} label="是" />
                <FormControlLabel value="否" control={<Radio size="small" />} label="否" />
              </RadioGroup>
            </Box>

            <RequiredLabel required mobile={isMobile}>學歷類別</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <FormControl fullWidth>
                <Select
                  value={educationCategory}
                  onChange={(e) => setEducationCategory(e.target.value)}
                  displayEmpty
                  MenuProps={dropdownMenuProps}
                  sx={{ height: "38px", fontSize: "15px" }}
                >
                  <MenuItem value=""></MenuItem>
                  {EDUCATION_CATEGORY_OPTIONS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <RequiredLabel required mobile={isMobile}>學校</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <RequiredLabel required mobile={isMobile}>科系類別</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <FormControl fullWidth>
                <Select
                  value={departmentCategory}
                  onChange={(e) => setDepartmentCategory(e.target.value)}
                  displayEmpty
                  MenuProps={dropdownMenuProps}
                  sx={{ height: "38px", fontSize: "15px" }}
                >
                  <MenuItem value=""></MenuItem>
                  {DEPARTMENT_CATEGORY_OPTIONS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <RequiredLabel required mobile={isMobile}>科系名稱</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <RequiredLabel mobile={isMobile}>就學類別</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <RadioGroup
                row
                value={studyType}
                onChange={(e) => setStudyType(e.target.value)}
                sx={{ gap: "6px", flexWrap: "wrap" }}
              >
                <FormControlLabel value="日間部" control={<Radio size="small" />} label="日間部" />
                <FormControlLabel value="夜間部" control={<Radio size="small" />} label="夜間部" />
                <FormControlLabel value="其他" control={<Radio size="small" />} label="其他(進修部或在職專班)" />
              </RadioGroup>
            </Box>

            <RequiredLabel required mobile={isMobile}>就學狀態</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <RadioGroup
                row
                value={studyStatus}
                onChange={(e) => setStudyStatus(e.target.value)}
                sx={{ gap: "6px", flexWrap: "wrap" }}
              >
                <FormControlLabel value="畢業" control={<Radio size="small" />} label="畢業" />
                <FormControlLabel value="就學中" control={<Radio size="small" />} label="就學中" />
                <FormControlLabel value="肄業" control={<Radio size="small" />} label="肄業" />
              </RadioGroup>
            </Box>

            <RequiredLabel mobile={isMobile}>就學開始時間</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <RequiredLabel mobile={isMobile}>就學結束時間</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <RequiredLabel mobile={isMobile}>學校所在地區</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                value={schoolRegion}
                onChange={(e) => setSchoolRegion(e.target.value)}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <RequiredLabel mobile={isMobile}>上傳證明文件</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <Button
                variant="outlined"
                component="label"
                sx={{
                  height: "38px",
                  textTransform: "none",
                  color: "#111827",
                  borderColor: "#cfcfcf",
                  mr: "10px",
                  mb: "8px",
                }}
              >
                Choose File
                <input
                  hidden
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setProofFileName(file ? file.name : "");
                  }}
                />
              </Button>

              <Typography
                component="span"
                sx={{
                  fontSize: "14px",
                  color: "#9ca3af",
                }}
              >
                {proofFileName || "No file chosen"}
              </Typography>

              <Box sx={{ mt: "8px" }}>
                <Typography sx={{ fontSize: "13px", color: "#b0b5bf" }}>
                  * 格式限Microsoft Office文件、TXT純文字、壓縮檔、PDF
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#b0b5bf" }}>
                  * 檔案大小限制為 300KB
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: "18px",
            py: "12px",
            justifyContent: "flex-end",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <Button
            variant="contained"
            sx={{
              minWidth: "88px",
              height: "36px",
              bgcolor: "primary",
              color: "#ffffff",
            }}
          >
            確認上傳
          </Button>

          <Button
            variant="outlined"
            onClick={handleCloseEducation}
            sx={{
              minWidth: "64px",
              height: "36px",
              color: "#ffffff",
              bgcolor: "#e90000",
              border: "none"
            }}
          >
            取消
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={certificateDialogOpen}
        onClose={handleCloseCertificate}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#2085c7",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 700,
            px: "18px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
            申請修改資料
          </Typography>

          <IconButton onClick={handleCloseCertificate} size="small" sx={{ color: "#ffffff", p: 0 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: "18px", sm: "34px", md: "42px" },
            py: "26px",
            flex: 1,
            overflowY: "auto",
          }}
        >
          <Box sx={formGridSx}>
            <RequiredLabel required mobile={isMobile}>證照名稱</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                value={certificateName}
                onChange={(e) => setCertificateName(e.target.value)}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <RequiredLabel mobile={isMobile}>發照單位</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <RequiredLabel mobile={isMobile}>取得日期</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                type="date"
                value={acquiredDate}
                onChange={(e) => setAcquiredDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <RequiredLabel mobile={isMobile}>到期日期</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={permanentValid}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <Box />
            <Box sx={fieldBoxSx}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={permanentValid}
                    onChange={(e) => setPermanentValid(e.target.checked)}
                    size="small"
                  />
                }
                label="永久有效"
                sx={{
                  m: 0,
                  "& .MuiFormControlLabel-label": {
                    fontSize: "16px",
                    color: "#2d3945",
                  },
                }}
              />
            </Box>

            <RequiredLabel mobile={isMobile}>備註</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <TextField
                fullWidth
                value={certificateNote}
                onChange={(e) => setCertificateNote(e.target.value)}
                sx={{
                  "& .MuiInputBase-root": {
                    height: "38px",
                    fontSize: "15px",
                  },
                }}
              />
            </Box>

            <RequiredLabel mobile={isMobile}>上傳證明文件</RequiredLabel>
            <Box sx={fieldBoxSx}>
              <Button
                variant="outlined"
                component="label"
                sx={{
                  height: "38px",
                  textTransform: "none",
                  color: "#111827",
                  borderColor: "#cfcfcf",
                  mr: "10px",
                  mb: "8px",
                }}
              >
                Choose File
                <input
                  hidden
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setCertificateFileName(file ? file.name : "");
                  }}
                />
              </Button>

              <Typography
                component="span"
                sx={{
                  fontSize: "14px",
                  color: "#9ca3af",
                }}
              >
                {certificateFileName || "No file chosen"}
              </Typography>

              <Box sx={{ mt: "8px" }}>
                <Typography sx={{ fontSize: "13px", color: "#b0b5bf" }}>
                  * 格式限Microsoft Office文件、TXT純文字、壓縮檔、PDF
                </Typography>
                <Typography sx={{ fontSize: "13px", color: "#b0b5bf" }}>
                  * 檔案大小限制為 300KB
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: "18px",
            py: "12px",
            justifyContent: "flex-end",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <Button
            variant="contained"
            sx={{
              minWidth: "88px",
              height: "36px",
              bgcolor: "primary",
              color: "#ffffff",
              boxShadow: "none",
            }}
          >
            確認上傳
          </Button>

          <Button
            variant="outlined"
            onClick={handleCloseCertificate}
            sx={{
              minWidth: "64px",
              height: "36px",
              color: "#ffffff",
              bgcolor: "#e90000",
              border: "none"
            }}
          >
            取消
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}