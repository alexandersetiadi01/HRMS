import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { LabelCell } from "../../Components/GlobalComponent";

const rows = [
  ["電話(市話)", ""],
  ["電話(手機)", "0972948684"],
  ["戶籍地址", "新北市三重區仁義街225巷15號四樓"],
  ["聯絡地址", "新北市三重區仁義街225巷15號四樓"],
  ["分機", ""],
  ["公務手機", ""],
  ["私人信箱", ""],
  ["緊急聯絡人", ""],
  ["緊急聯絡人關係", ""],
  ["電話(市話)", ""],
  ["電話(手機)", ""],
];

const textFieldSx = {
  "& .MuiInputBase-root": {
    height: "38px",
    fontSize: "15px",
    bgcolor: "#ffffff",
  },
  "& .MuiOutlinedInput-input": {
    px: "12px",
    py: "8px",
  },
};

const dialogLabelSx = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  pt: 0,
  pr: "4px",
  fontSize: "15px",
  color: "#374151",
  whiteSpace: "nowrap",
  lineHeight: 1.2,
};

function ContactInformationEditDialog({ open, onClose }) {
  const theme = useTheme();
  const isDialogMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [form, setForm] = useState({
    tel: "",
    mobile: "0972948684",
    registeredAddress: "新北市三重區仁義街225巷15號四樓",
    contactAddress: "新北市三重區仁義街225巷15號四樓",
    extension: "",
    officeMobile: "",
    personalEmail: "",
    emergencyContact: "",
    emergencyRelation: "",
    emergencyTel: "",
    emergencyMobile: "",
    amendReason: "",
    attachment: null,
  });

  const setField = (key) => (event) => {
    const value =
      key === "attachment"
        ? event.target.files?.[0] || null
        : event.target.value;

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const formGridTemplateColumns = isDialogMobile
    ? "98px minmax(0, 1fr)"
    : "170px minmax(0, 1fr)";

  const labelSx = {
    ...dialogLabelSx,
    ...(isDialogMobile
      ? {
          fontSize: "14px",
          pr: "8px",
        }
      : {}),
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isDialogMobile}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: isDialogMobile ? "100%" : "900px",
          maxWidth: isDialogMobile ? "100%" : "95vw",
          height: isDialogMobile ? "100%" : "auto",
          maxHeight: isDialogMobile ? "100%" : "calc(100vh - 32px)",
          m: 0,
          borderRadius: 0,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          height: isDialogMobile ? "64px" : "70px",
          px: "12px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#1e88cf",
          color: "#ffffff",
        }}
      >
        <Typography
          sx={{
            fontSize: isDialogMobile ? "16px" : "18px",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          申請修改資料
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            p: 0,
            color: "#ffffff",
          }}
        >
          <CloseIcon sx={{ fontSize: isDialogMobile ? "22px" : "24px" }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: isDialogMobile ? "30px" : "14px",
          py: "12px",
          bgcolor: "#f3f3f3",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: formGridTemplateColumns,
            columnGap: isDialogMobile ? "0px" : "18px",
            rowGap: "14px",
            alignItems: "center",
          }}
        >
          <LabelCell sx={labelSx}>電話(市話)：</LabelCell>
          <TextField
            value={form.tel}
            onChange={setField("tel")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell required sx={labelSx}>
            電話(手機)：
          </LabelCell>
          <TextField
            value={form.mobile}
            onChange={setField("mobile")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell required sx={labelSx}>
            戶籍地址：
          </LabelCell>
          <TextField
            value={form.registeredAddress}
            onChange={setField("registeredAddress")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell required sx={labelSx}>
            聯絡地址：
          </LabelCell>
          <TextField
            value={form.contactAddress}
            onChange={setField("contactAddress")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>分機：</LabelCell>
          <TextField
            value={form.extension}
            onChange={setField("extension")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>公務手機：</LabelCell>
          <TextField
            value={form.officeMobile}
            onChange={setField("officeMobile")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>私人信箱：</LabelCell>
          <TextField
            value={form.personalEmail}
            onChange={setField("personalEmail")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>緊急聯絡人：</LabelCell>
          <TextField
            value={form.emergencyContact}
            onChange={setField("emergencyContact")}
            fullWidth
            sx={textFieldSx}
          />

          <Box />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#9ca3af",
                lineHeight: 1.6,
                wordBreak: "break-word",
              }}
            >
              * 因應GDPR相關法規，若新增緊急聯絡人為歐盟居民，依法
              <br />
              不得蒐集低於13歲以下未成年兒童個資；若為13~16歲兒
              <br />
              童，請取得法定代理人同意聲明書。
            </Typography>
          </Box>

          <LabelCell sx={labelSx}>緊急聯絡人關係：</LabelCell>
          <TextField
            value={form.emergencyRelation}
            onChange={setField("emergencyRelation")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>電話(市話)：</LabelCell>
          <TextField
            value={form.emergencyTel}
            onChange={setField("emergencyTel")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>電話(手機)：</LabelCell>
          <TextField
            value={form.emergencyMobile}
            onChange={setField("emergencyMobile")}
            fullWidth
            sx={textFieldSx}
          />
        </Box>

        <Box
          sx={{
            mt: "18px",
            pt: "14px",
            borderTop: "1px solid #dddddd",
            display: "grid",
            gridTemplateColumns: formGridTemplateColumns,
            columnGap: isDialogMobile ? "0px" : "18px",
            rowGap: "10px",
            alignItems: "center",
          }}
        >
          <LabelCell required sx={labelSx}>
            修改原因：
          </LabelCell>
          <TextField
            value={form.amendReason}
            onChange={setField("amendReason")}
            fullWidth
            sx={textFieldSx}
          />

          <LabelCell sx={labelSx}>上傳證明文件：</LabelCell>
          <Box sx={{ minWidth: 0 }}>
            <TextField
              fullWidth
              type="file"
              onChange={setField("attachment")}
              inputProps={{
                accept: ".doc,.docx,.txt,.pdf,.jpg,.jpeg,.png",
              }}
              sx={{
                "& .MuiInputBase-root": {
                  height: "38px",
                  bgcolor: "#ffffff",
                  fontSize: "13px",
                },
                "& .MuiOutlinedInput-input": {
                  px: "10px",
                  py: "8px",
                },
                "& input[type='file']": {
                  minWidth: 0,
                  width: "100%",
                },
                "& input[type='file']::file-selector-button": {
                  marginRight: "8px",
                  height: "24px",
                },
              }}
            />
          </Box>

          <Box />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "12px",
                color: "#9ca3af",
                lineHeight: 1.8,
                wordBreak: "break-word",
              }}
            >
              * 格式限Microsoft Office文件、TXT純文字、壓縮檔、PDF
              <br />* 檔案大小限制為 300KB
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: isDialogMobile ? "12px" : "24px",
          py: "12px",
          bgcolor: "#f3f3f3",
          justifyContent: "flex-end",
          gap: "8px",
          flexShrink: 0,
          borderTop: isDialogMobile ? "1px solid #dddddd" : "none",
          position: isDialogMobile ? "sticky" : "static",
          bottom: 0,
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            minWidth: "54px",
            height: "34px",
            fontSize: "13px",
            bgcolor: "#1e88cf",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#1976d2",
              boxShadow: "none",
            },
          }}
        >
          確定
        </Button>

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: "54px",
            height: "34px",
            fontSize: "13px",
            color: "#4b5563",
            borderColor: "#cfcfcf",
            bgcolor: "#ffffff",
          }}
        >
          取消
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ContactInformationTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [openEditDialog, setOpenEditDialog] = useState(false);

  if (isMobile) {
    return (
      <Box sx={{ bgcolor: "#ffffff" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            px: "12px",
            pt: "8px",
          }}
        >
          <IconButton size="small" onClick={() => setOpenEditDialog(true)}>
            <EditIcon sx={{ fontSize: "18px", color: "#111827" }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            mx: "12px",
            overflow: "hidden",
          }}
        >
          {rows.map(([label, value], index) => (
            <Box
              key={`${label}-${index}`}
              sx={{
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                borderBottom:
                  index !== rows.length - 1 ? "1px solid #e5e7eb" : "none",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#f3f4f6",
                  px: "10px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {label}
                </Typography>
              </Box>

              <Box
                sx={{
                  px: "12px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "15px",
                    color: "#111827",
                    wordBreak: "break-word",
                  }}
                >
                  {value || "-"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <ContactInformationEditDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#f5f5f5",
        p: { xs: "16px", md: "18px 24px" },
        minHeight: "400px",
      }}
    >
      <IconButton
        size="small"
        onClick={() => setOpenEditDialog(true)}
        sx={{
          position: "absolute",
          right: "12px",
          top: "12px",
        }}
      >
        <EditIcon sx={{ fontSize: "18px", color: "#111827" }} />
      </IconButton>

      <Box
        sx={{
          width: "100%",
          maxWidth: "640px",
          mx: "auto",
          display: "grid",
          rowGap: "10px",
        }}
      >
        {rows.map(([label, value], index) => (
          <Box
            key={`${label}-${index}`}
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "110px minmax(0, 1fr)",
                md: "170px minmax(0, 1fr)",
              },
              columnGap: "16px",
              alignItems: "start",
            }}
          >
            <Typography
              sx={{
                fontSize: "16px",
                color: "#1f2937",
                textAlign: "right",
              }}
            >
              {label}：
            </Typography>

            <Typography
              sx={{
                fontSize: "16px",
                color: "#1f2937",
                wordBreak: "break-word",
              }}
            >
              {value || ""}
            </Typography>
          </Box>
        ))}
      </Box>

      <ContactInformationEditDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
      />
    </Box>
  );
}
