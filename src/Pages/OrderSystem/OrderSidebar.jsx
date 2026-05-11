import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";

const sidebarButtonStyle = (active) => ({
  justifyContent: "flex-start",
  borderRadius: "10px",
  paddingTop: "10px",
  paddingBottom: "10px",
  fontSize: "14px",
  fontWeight: active ? 700 : 500,
  backgroundColor: active ? "#e0f2fe" : "#ffffff",
  color: active ? "#0284c7" : "#111827",
  border: active
    ? "1px solid #7dd3fc"
    : "1px solid #e5e7eb",
  "&:hover": {
    backgroundColor: active ? "#dbeafe" : "#f9fafb",
  },
});

export default function OrderSidebar({
  activeTab,
  onChangeTab,
  onCreateOrder,
}) {
  return (
    <Box
      sx={{
        width: {
          xs: "100%",
          md: "250px",
        },
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          padding: "16px",
        }}
      >
        <Stack spacing={1.5}>
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            訂購系統
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={onCreateOrder}
            sx={{
              borderRadius: "10px",
              height: "42px",
              fontSize: "14px",
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "none",
            }}
          >
            新增訂單
          </Button>

          <Stack spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => onChangeTab("progress")}
              sx={sidebarButtonStyle(
                activeTab === "progress"
              )}
            >
              進行中之訂單
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => onChangeTab("deadline")}
              sx={sidebarButtonStyle(
                activeTab === "deadline"
              )}
            >
              截止訂購訂單
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => onChangeTab("stores")}
              sx={sidebarButtonStyle(
                activeTab === "stores"
              )}
            >
              店家管理
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}