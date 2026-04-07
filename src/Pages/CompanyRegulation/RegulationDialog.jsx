import { Box, Button, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function RegulationDialog({ open, item, onClose }) {
  if (!item) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={false}
      fullWidth={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: "4px" },
          overflow: { xs: "auto", md: "hidden" },
          m: { xs: 0, md: "32px" },
          width: { xs: "100%", md: "980px" },
          maxWidth: { xs: "100%", md: "calc(100vw - 64px)" },
          height: { xs: "100%", md: "760px" },
          maxHeight: { xs: "100%", md: "calc(100vh - 64px)" },
        },
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          height: "38px",
          bgcolor: "#000000",
          alignItems: "center",
          justifyContent: "space-between",
          px: "14px",
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          規章內容
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#ffffff",
            p: 0,
          }}
        >
          <CloseIcon sx={{ fontSize: "18px" }} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: { xs: "18px", md: "20px" },
          pt: { xs: "18px", md: 0 },
          pb: { xs: "18px", md: 0 },
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflowY: { xs: "auto", md: "hidden" },
        }}
      >
        <Box
          sx={{
            py: { xs: 0, md: "12px" },
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#333333",
              mb: "18px",
              flexShrink: 0,
            }}
          >
            {item.title}
          </Typography>

          <Box
            sx={{
              display: { xs: "flex", md: "grid" },
              flexDirection: { xs: "column", md: "unset" },
              gridTemplateColumns: { md: "1fr 1fr" },
              columnGap: "44px",
              rowGap: { xs: "14px", md: "10px" },
              mb: { xs: "20px", md: "16px" },
              px: { xs: 0, md: "20px" },
              flexShrink: 0,
            }}
          >
            <Box>
              <Typography
                sx={{ fontSize: "14px", color: "#b0b0b0", mb: "4px" }}
              >
                發佈時間
              </Typography>
              <Typography
                sx={{ fontSize: "18px", color: "#333333", lineHeight: 1.4 }}
              >
                {item.publishTime || "--"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ fontSize: "14px", color: "#b0b0b0", mb: "4px" }}
              >
                修訂日期
              </Typography>
              <Typography
                sx={{ fontSize: "18px", color: "#333333", lineHeight: 1.4 }}
              >
                {item.revisedDate || "--"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ fontSize: "14px", color: "#b0b0b0", mb: "4px" }}
              >
                文件編號
              </Typography>
              <Typography
                sx={{ fontSize: "18px", color: "#333333", lineHeight: 1.4 }}
              >
                {item.fileCode || "--"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ fontSize: "14px", color: "#b0b0b0", mb: "4px" }}
              >
                版本
              </Typography>
              <Typography
                sx={{ fontSize: "18px", color: "#333333", lineHeight: 1.4 }}
              >
                {item.version || "--"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ fontSize: "14px", color: "#b0b0b0", mb: "4px" }}
              >
                負責單位
              </Typography>
              <Typography
                sx={{ fontSize: "18px", color: "#333333", lineHeight: 1.4 }}
              >
                {item.ownerUnit || "--"}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{ fontSize: "14px", color: "#b0b0b0", mb: "4px" }}
              >
                聯絡人
              </Typography>
              <Typography
                sx={{ fontSize: "18px", color: "#333333", lineHeight: 1.4 }}
              >
                {item.contactPerson || "--"}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              mx: { xs: 0, md: "6px" },
              // mb: { xs: "20px", md: 0 }, 
              bgcolor: { xs: "#ffffff", md: "#f3f3f3" },
              border: "1px solid #ececec",
              flex: { xs: "unset", md: 1 },
              minHeight: { xs: "auto", md: 0 },
              overflowY: { xs: "visible", md: "auto" },
              px: "14px",
              py: { xs: "14px", md: "16px" },
              whiteSpace: "pre-wrap",
              lineHeight: { xs: 1.9, md: 1.8 },
              fontSize: "14px",
              color: "#333333",
            }}
          >
            {item.content}
          </Box>
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            borderTop: "1px solid #d7d7d7",
            py: "10px",
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              minWidth: "76px",
              height: "34px",
              borderColor: "#c5c5c5",
              color: "#555555",
              fontSize: "15px",
              bgcolor: "#ffffff",
            }}
          >
            關閉
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}