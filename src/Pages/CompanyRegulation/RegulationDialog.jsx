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
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: {
            xs: "13px",
            sm: "14px",
          },
          color: "#9ca3af",
          mb: "4px",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: {
            xs: "15px",
            sm: "17px",
            md: "18px",
          },
          color: "#333333",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
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
          width: {
            xs: "calc(100vw - 16px)",
            sm: "calc(100vw - 48px)",
            md: "980px",
          },
          maxWidth: "980px",
          maxHeight: {
            xs: "calc(100dvh - 16px)",
            sm: "calc(100dvh - 48px)",
          },
          m: {
            xs: "8px",
            sm: "24px",
          },
          borderRadius: {
            xs: "6px",
            sm: "4px",
          },
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          minHeight: {
            xs: "42px",
            sm: "46px",
          },
          px: {
            xs: "10px",
            sm: "14px",
          },
          py: "6px",
          bgcolor: "#000000",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Typography
          sx={{
            minWidth: 0,
            fontSize: {
              xs: "16px",
              sm: "18px",
            },
            fontWeight: 700,
            color: "#ffffff",
            overflowWrap: "anywhere",
          }}
        >
          規章內容
        </Typography>

        <IconButton
          aria-label="關閉規章內容"
          onClick={onClose}
          size="small"
          sx={{
            color: "#ffffff",
            p: "4px",
            flexShrink: 0,
          }}
        >
          <CloseIcon
            sx={{
              fontSize: {
                xs: "20px",
                sm: "22px",
              },
            }}
          />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: {
            xs: "10px",
            sm: "20px",
            md: "24px",
          },
          py: {
            xs: "12px",
            sm: "16px",
          },
          bgcolor: "#ffffff",
        }}
      >
        {loading ? (
          <Box
            sx={{
              minHeight: {
                xs: "300px",
                sm: "460px",
                md: "520px",
              },
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
                fontSize: {
                  xs: "17px",
                  sm: "19px",
                  md: "20px",
                },
                fontWeight: 500,
                color: "#333333",
                lineHeight: 1.5,
                mb: {
                  xs: "16px",
                  sm: "18px",
                },
                overflowWrap: "anywhere",
              }}
            >
              {item?.title || "--"}
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                columnGap: {
                  sm: "36px",
                  md: "80px",
                },
                rowGap: {
                  xs: "12px",
                  sm: "16px",
                },
                mb: {
                  xs: "18px",
                  sm: "20px",
                },
                px: {
                  xs: "2px",
                  sm: "10px",
                  md: "14px",
                },
              }}
            >
              <Field
                label="發佈時間"
                value={item?.publishTime}
              />
              <Field
                label="修訂日期"
                value={item?.revisedDate}
              />

              <Field
                label="文件編號"
                value={item?.fileCode}
              />
              <Field
                label="版本"
                value={item?.version}
              />

              <Field
                label="負責單位"
                value={item?.ownerUnit}
              />
              <Field
                label="聯絡人"
                value={item?.contactPerson}
              />
            </Box>

            <Box
              sx={{
                height: {
                  xs: "min(330px, 42dvh)",
                  sm: "420px",
                  md: "500px",
                },
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: {
                  xs: "4px",
                  sm: 0,
                },
                bgcolor: "#f3f3f3",
                px: {
                  xs: "10px",
                  sm: "14px",
                },
                py: {
                  xs: "12px",
                  sm: "16px",
                },
                fontSize: {
                  xs: "14px",
                  sm: "15px",
                  md: "16px",
                },
                color: "#111827",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {item?.content || "--"}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: {
            xs: "10px",
            sm: "20px",
          },
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
            width: {
              xs: "100%",
              sm: "auto",
            },
            height: {
              xs: "38px",
              sm: "34px",
            },
            fontSize: {
              xs: "14px",
              sm: "15px",
              md: "14px",
            },
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