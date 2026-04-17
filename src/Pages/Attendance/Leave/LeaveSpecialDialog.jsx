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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function LeaveSpecialDialog({
  open,
  onClose,
  specialReason,
  setSpecialReason,
  specialLeaveType,
  setSpecialLeaveType,
  specialFiles,
  setSpecialFiles,
  specialLeaveTypes,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          onClick={onClose}
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
              sx={{
                height: "38px",
                fontSize: "15px",
              }}
            >
              <MenuItem value="" disabled>
                請選擇
              </MenuItem>
              {specialLeaveTypes.map((item) => (
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
          onClick={onClose}
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