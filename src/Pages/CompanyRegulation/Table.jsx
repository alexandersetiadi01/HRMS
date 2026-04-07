import { Box, IconButton, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from "@mui/icons-material/Launch";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";


export function DesktopTable({ folderOpen, onToggleFolder, rows, onOpenItem }) {
  return (
    <Box
      sx={{
        border: "1px solid #d3d3d3",
        bgcolor: "#ffffff",
        minHeight: "560px",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "38% 15% 12% 11% 10% 10% 4%",
          minHeight: "38px",
          alignItems: "center",
          px: "10px",
          background: "linear-gradient(to bottom, #f7f7f7, #dddddd)",
          borderBottom: "1px solid #d3d3d3",
        }}
      >
        <Typography
          sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
        >
          公司規章
        </Typography>
        <Typography
          sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
        >
          負責單位
        </Typography>
        <Typography
          sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
        >
          聯絡人
        </Typography>
        <Typography
          sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
        >
          發佈時間
        </Typography>
        <Typography
          sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
        >
          修訂日期
        </Typography>
        <Typography
          sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
        >
          文件編號
        </Typography>
        <Typography
          sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
        >
          檔案
        </Typography>
      </Box>

      <Box sx={{ px: "20px", pt: "10px" }}>
        <Box
          onClick={onToggleFolder}
          sx={{
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            cursor: "pointer",
            color: "#333333",
          }}
        >
          {folderOpen ? (
            <ExpandMoreIcon sx={{ fontSize: "18px", color: "#8d8d8d" }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: "18px", color: "#8d8d8d" }} />
          )}
          <FolderIcon sx={{ fontSize: "20px", color: "#8d8d8d" }} />
          <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
            一般員工請假相關
          </Typography>
        </Box>

        {folderOpen ? (
          <Box sx={{ pt: "12px" }}>
            {rows.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "38% 15% 12% 11% 10% 10% 4%",
                  minHeight: "54px",
                  alignItems: "center",
                  pl: "36px",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minWidth: 0,
                  }}
                >
                  <DescriptionIcon
                    sx={{ fontSize: "18px", color: "#9a9a9a" }}
                  />
                  <Typography
                    onClick={() => onOpenItem(item)}
                    sx={{
                      fontSize: "15px",
                      color: "#222222",
                      cursor: "pointer",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {item.title}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: "15px", color: "#333333" }}>
                  {item.ownerUnit}
                </Typography>
                <Typography sx={{ fontSize: "15px", color: "#333333" }}>
                  {item.contactPerson}
                </Typography>
                <Typography sx={{ fontSize: "15px", color: "#333333" }}>
                  {item.publishDate}
                </Typography>
                <Typography sx={{ fontSize: "15px", color: "#333333" }}>
                  {item.revisedDate}
                </Typography>
                <Typography sx={{ fontSize: "15px", color: "#333333" }}>
                  {item.fileCode}
                </Typography>

                <IconButton
                  onClick={() => onOpenItem(item)}
                  size="small"
                  sx={{
                    width: "28px",
                    height: "28px",
                    color: "#808080",
                  }}
                >
                  <LaunchIcon sx={{ fontSize: "18px" }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

export function MobileList({ folderOpen, onToggleFolder, rows, onOpenItem }) {
  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
      }}
    >
      <Box
        onClick={onToggleFolder}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          px: "16px",
          py: "14px",
          cursor: "pointer",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <FolderIcon sx={{ fontSize: "28px", color: "#1f94d2" }} />
          <Typography
            sx={{
              fontSize: "15px",
              color: "#333333",
              minWidth: 0,
            }}
          >
            一般員工請假相關
          </Typography>
        </Box>

        <ChevronRightIcon
          sx={{
            fontSize: "24px",
            color: "#d1d5db",
            transform: folderOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        />
      </Box>

      {folderOpen ? (
        <Box sx={{ px: "16px" }}>
          {rows.map((item) => (
            <Box
              key={item.id}
              onClick={() => onOpenItem(item)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                px: "10px",
                py: "18px",
                ml: "22px",
                cursor: "pointer",
                borderBottom: "1px solid #ececec",
                "&:last-of-type": {
                  borderBottom: "none",
                },
              }}
            >
              <DescriptionIcon sx={{ fontSize: "24px", color: "#49b7ea" }} />

              <Typography
                sx={{
                  fontSize: "15px",
                  color: "#222222",
                  lineHeight: 1.5,
                }}
              >
                {item.title}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}