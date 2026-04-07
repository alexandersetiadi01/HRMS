import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import Breadcrumb from "../../../Utils/Breadcrumb";
import { DesktopTable, MobileList } from "./Table";
import { ANNOUNCEMENTS } from "./Data";

function AnnouncementDialog({ open, item, onClose }) {
  if (!item) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: "4px" },
          overflow: "hidden",
          m: { xs: 0, md: "32px" },
          width: { xs: "100%", md: "980px" },
          maxWidth: { xs: "100%", md: "calc(100vw - 64px)" },
          height: { xs: "100%", md: "auto" },
          maxHeight: { xs: "100%", md: "calc(100vh - 64px)" },
        },
      }}
    >
      <Box
        sx={{
          height: "40px",
          bgcolor: "#000000",
          display: "flex",
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
          {item.title}
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
          px: { xs: "16px", md: "10px" },
          pt: "14px",
          pb: "0",
        }}
      >
        <Box sx={{ px: { xs: 0, md: "0" } }}>
          <Typography
            sx={{
              fontSize: "16px",
              color: "#444444",
              mb: "12px",
            }}
          >
            發佈時間：{item.publishTime}
          </Typography>

          <Typography
            sx={{
              fontSize: "16px",
              color: "#444444",
              mb: "10px",
            }}
          >
            內容:
          </Typography>

          <Box
            sx={{
              fontSize: "16px",
              color: "#444444",
              whiteSpace: "pre-wrap",
              lineHeight: 1.8,
              minHeight: { xs: "auto", md: "260px" },
            }}
          >
            {item.content.replace(/^發佈時間：.*\n內容:\n?/, "")}
          </Box>
        </Box>

        <Box
          sx={{
            mt: "16px",
            borderTop: "1px solid #d7d7d7",
            py: "10px",
            display: "flex",
            justifyContent: "flex-end",
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

function PaginationBar({ totalRows, currentPage }) {
  return (
    <Box
      sx={{
        mt: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Button
          variant="outlined"
          disabled
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
            borderColor: "#d9d9d9",
            color: "#c8c8c8",
          }}
        >
          <KeyboardDoubleArrowLeftIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
            borderColor: "#d9d9d9",
            color: "#c8c8c8",
          }}
        >
          <KeyboardArrowLeftIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Typography sx={{ fontSize: "15px", color: "#333333", ml: "4px" }}>
          第
        </Typography>

        <Box
          sx={{
            width: "40px",
            height: "24px",
            border: "1px solid #8f8f8f",
            display: "flex",
            alignItems: "center",
            px: "8px",
            fontSize: "15px",
            color: "#333333",
            bgcolor: "#ffffff",
          }}
        >
          {currentPage}
        </Box>

        <Typography sx={{ fontSize: "15px", color: "#333333" }}>
          頁，共 1 頁
        </Typography>

        <Button
          variant="outlined"
          disabled
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
            borderColor: "#d9d9d9",
            color: "#c8c8c8",
          }}
        >
          <KeyboardArrowRightIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
            borderColor: "#d9d9d9",
            color: "#c8c8c8",
          }}
        >
          <KeyboardDoubleArrowRightIcon sx={{ fontSize: "18px" }} />
        </Button>
      </Box>

      <Typography sx={{ fontSize: "15px", color: "#1f2f4a" }}>
        顯示 1 - {totalRows} 筆，共 {totalRows} 筆
      </Typography>
    </Box>
  );
}

export default function CompanyAnnouncement() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const currentPage = 1;

  const rows = useMemo(() => ANNOUNCEMENTS, []);

  const handleOpenDialog = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <Box>
      <Breadcrumb rootLabel="首頁" currentLabel="部門公告" mb="14px" />
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
          mb: "60px",
        }}
      >
        部門公告
      </Typography>

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DesktopTable rows={rows} onOpenItem={handleOpenDialog} />
        <PaginationBar totalRows={rows.length} currentPage={currentPage} />
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MobileList rows={rows} onOpenItem={handleOpenDialog} />
      </Box>

      <AnnouncementDialog
        open={dialogOpen}
        item={selectedItem}
        onClose={handleCloseDialog}
      />
    </Box>
  );
}
