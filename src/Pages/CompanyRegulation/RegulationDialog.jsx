import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function Field({ label, value }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "90px minmax(0,1fr)",
          md: "120px minmax(0,1fr)",
        },
        columnGap: "12px",
        rowGap: "6px",
        alignItems: "start",
      }}
    >
      <Typography
        sx={{
          fontSize: "13px",
          color: "#6b7280",
          lineHeight: 1.7,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: "14px",
          color: "#111827",
          lineHeight: 1.7,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
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
  const title = item?.title || "--";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "8px",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: "20px",
          py: "14px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.4,
          }}
        >
          {title}
        </Typography>

        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: { xs: "14px", md: "20px" },
          py: { xs: "14px", md: "18px" },
          bgcolor: "#f9fafb",
        }}
      >
        {loading ? (
          <Box
            sx={{
              minHeight: "240px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={30} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: { xs: "14px", md: "18px" },
                  py: { xs: "14px", md: "16px" },
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <Field
                  label="文件編號"
                  value={item?.fileCode}
                />

                <Field
                  label="版本"
                  value={item?.version}
                />

                <Field
                  label="狀態"
                  value={item?.status}
                />

                <Field
                  label="負責單位"
                  value={item?.ownerUnit}
                />

                <Field
                  label="聯絡人"
                  value={item?.contactPerson}
                />

                <Field
                  label="發佈時間"
                  value={item?.publishTime}
                />

                <Field
                  label="修訂日期"
                  value={item?.revisedDate}
                />
              </Box>

              <Divider />

              <Box
                sx={{
                  px: { xs: "14px", md: "18px" },
                  py: { xs: "14px", md: "18px" },
                  bgcolor: "#ffffff",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#111827",
                    mb: "12px",
                  }}
                >
                  規章內容
                </Typography>

                <Box
                  sx={{
                    minHeight: "220px",
                    px: { xs: "12px", md: "16px" },
                    py: { xs: "12px", md: "14px" },
                    border: "1px solid #e5e7eb",
                    bgcolor: "#fafafa",
                    borderRadius: "4px",
                    fontSize: "14px",
                    color: "#111827",
                    lineHeight: 1.9,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {item?.content || "--"}
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}