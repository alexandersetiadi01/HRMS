import {
  Box,
  IconButton,
  Typography,
} from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export default function OrderPagination({
  page = 1,
  totalPages = 1,
  onChangePage,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "8px",
        marginTop: "16px",
      }}
    >
      <IconButton
        disabled={page <= 1}
        onClick={() => onChangePage(page - 1)}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
        }}
      >
        <ChevronLeftIcon />
      </IconButton>

      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 500,
          minWidth: "80px",
          textAlign: "center",
        }}
      >
        {page} / {totalPages}
      </Typography>

      <IconButton
        disabled={page >= totalPages}
        onClick={() => onChangePage(page + 1)}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
        }}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}