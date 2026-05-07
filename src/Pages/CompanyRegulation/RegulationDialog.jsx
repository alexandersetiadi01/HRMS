import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function Field({ label, value }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: "14px",
          color: "#9ca3af",
          mb: "4px",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: "18px",
          color: "#333333",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {value || "--"}
      </Typography>
    </Box>
  );
}

export default function RegulationDialog({
  open,
  item,
  loading = false,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "980px",
          maxWidth: "calc(100vw - 48px)",
          borderRadius: "4px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          height: "38px",
          minHeight: "38px",
          px: "12px",
          py: 1,
          mb: 2,
          bgcolor: "#000000",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "15px",
          fontWeight: 700,
        }}
      >
        <Typography
          sx={{
            fontSize: "18px",
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
            p: "4px",
          }}
        >
          <CloseIcon sx={{ fontSize: "20px" }} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: "24px",
          py: "14px",
          bgcolor: "#ffffff",
        }}
      >
        {loading ? (
          <Box
            sx={{
              minHeight: "520px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={30} />
          </Box>
        ) : (
          <>
            <Typography
              sx={{
                fontSize: "20px",
                fontWeight: 500,
                color: "#333333",
                mb: "18px",
              }}
            >
              {item?.title || "--"}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "80px",
                rowGap: "14px",
                mb: "20px",
                px: "14px",
              }}
            >
              <Field label="發佈時間" value={item?.publishTime} />
              <Field label="修訂日期" value={item?.revisedDate} />

              <Field label="文件編號" value={item?.fileCode} />
              <Field label="版本" value={item?.version} />

              <Field label="負責單位" value={item?.ownerUnit} />
              <Field label="聯絡人" value={item?.contactPerson} />
            </Box>

            <Box
              sx={{
                height: "500px",
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                bgcolor: "#f3f3f3",
                px: "14px",
                py: "16px",
                fontSize: "16px",
                color: "#111827",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {item?.content || "--"}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: "20px",
          py: "10px",
          borderTop: "1px solid #d1d5db",
          bgcolor: "#ffffff",
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            minWidth: "74px",
            height: "34px",
            fontSize: "14px",
            color: "#333333",
            borderColor: "#c7c7c7",
          }}
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}