import { Box, Typography } from "@mui/material";

export function DesktopTable({ rows, onOpenItem }) {
  return (
    <Box>
      <Box
        sx={{
          border: "1px solid #d3d3d3",
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 28% 32%",
            minHeight: "38px",
            alignItems: "center",
            px: "8px",
            background: "linear-gradient(to bottom, #f7f7f7, #dddddd)",
            borderBottom: "1px solid #d3d3d3",
          }}
        >
          <Typography
            sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
          >
            標題
          </Typography>
          <Typography
            sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
          >
            發佈者
          </Typography>
          <Typography
            sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
          >
            發佈時間
          </Typography>
        </Box>

        {rows.map((item) => (
          <Box
            key={item.id}
            onClick={() => onOpenItem(item)}
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 28% 32%",
              minHeight: "38px",
              alignItems: "center",
              px: "8px",
              cursor: "pointer",
              borderBottom: "1px solid #d3d3d3",
              "&:hover": {
                bgcolor: "#fafafa",
              },
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                color: "#1f2f4a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.title}
            </Typography>

            <Typography
              sx={{
                fontSize: "15px",
                color: "#1f2f4a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.publisher}
            </Typography>

            <Typography
              sx={{
                fontSize: "15px",
                color: "#1f2f4a",
                whiteSpace: "nowrap",
              }}
            >
              {item.publishTime}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function MobileList({ rows, onOpenItem }) {
  return (
    <Box
      sx={{
        border: "1px solid #d3d3d3",
        bgcolor: "#ffffff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr",
          minHeight: "38px",
          alignItems: "center",
          px: "8px",
          background: "linear-gradient(to bottom, #f7f7f7, #dddddd)",
          borderBottom: "1px solid #d3d3d3",
        }}
      >
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#333333",
            pr: "8px",
          }}
        >
          標題
        </Typography>

        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#333333",
            pr: "8px",
          }}
        >
          發佈者
        </Typography>

        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#333333",
          }}
        >
          發佈時間
        </Typography>
      </Box>

      {rows.map((item) => (
        <Box
          key={item.id}
          onClick={() => onOpenItem(item)}
          sx={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            alignItems: "start",
            px: "8px",
            py: "10px",
            cursor: "pointer",
            borderBottom: "1px solid #d3d3d3",
            "&:last-of-type": {
              borderBottom: "none",
            },
            "&:hover": {
              bgcolor: "#fafafa",
            },
          }}
        >
          <Typography
            sx={{
              fontSize: "14px",
              color: "#1f2f4a",
              fontWeight: 700,
              pr: "8px",
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {item.title}
          </Typography>

          <Typography
            sx={{
              fontSize: "14px",
              color: "#1f2f4a",
              pr: "8px",
              lineHeight: 1.5,
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {item.publisher}
          </Typography>

          <Typography
            sx={{
              fontSize: "14px",
              color: "#1f2f4a",
              lineHeight: 1.5,
              whiteSpace: "normal",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {item.publishTime}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}