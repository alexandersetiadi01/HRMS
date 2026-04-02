import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import CloseIcon from "@mui/icons-material/Close";
import Breadcrumb from "../../Utils/Breadcrumb";

const leaveBalanceData = [
  {
    id: "annual",
    name: "特休",
    available: "56 時 0 分",
    used: "0 時 0 分",
    remaining: "56 時 0 分",
    details: [
      {
        validPeriod: "2026/08/18~2028/08/17",
        remaining: "56 時 0 分",
      },
    ],
  },
  {
    id: "personal",
    name: "事假",
    available: "112 時 0 分",
    used: "24 時 0 分",
    remaining: "88 時 0 分",
    details: [
      {
        validPeriod: "2026/01/01~2026/12/31",
        remaining: "88 時 0 分",
      },
    ],
  },
  {
    id: "sick",
    name: "有薪病假",
    available: "240 時 0 分",
    used: "0 時 0 分",
    remaining: "240 時 0 分",
    details: [
      {
        validPeriod: "2026/01/01~2026/12/31",
        remaining: "240 時 0 分",
      },
    ],
  },
];

function LeaveDetailDialog({ open, onClose, leaveItem }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const details = leaveItem?.details || [];
  const totalPages = Math.max(1, Math.ceil(details.length / rowsPerPage));

  const currentRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return details.slice(start, start + rowsPerPage);
  }, [details, page, rowsPerPage]);

  const startIndex = details.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIndex =
    details.length === 0 ? 0 : Math.min(page * rowsPerPage, details.length);

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  const handleClose = () => {
    setPage(1);
    setRowsPerPage(10);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth={false}
      PaperProps={{
        sx: {
          width: isMobile ? "calc(100vw - 24px)" : "850px",
          maxWidth: "95vw",
          borderRadius: isMobile ? "6px" : "4px",
          overflow: "hidden",
          m: isMobile ? "12px" : 0,
        },
      }}
    >
      <Box
        sx={{
          height: isMobile ? "36px" : "36px",
          px: isMobile ? "12px" : "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#10224f",
          color: "#ffffff",
        }}
      >
        <Typography
          sx={{
            fontSize: isMobile ? "14px" : "14px",
            fontWeight: 700,
          }}
        >
          {leaveItem?.name || ""}明細
        </Typography>

        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            p: 0,
            color: "#ffffff",
          }}
        >
          <CloseIcon sx={{ fontSize: "18px" }} />
        </IconButton>
      </Box>

      <Box
        sx={{
          px: isMobile ? "12px" : "28px",
          pt: isMobile ? "14px" : "30px",
          pb: 0,
          bgcolor: "#ffffff",
        }}
      >
        {isMobile ? (
          <Box
            sx={{
              border: "1px solid #d8d8d8",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                bgcolor: "#d4d4d4",
                display: "grid",
                gridTemplateColumns: "1.4fr 0.8fr",
              }}
            >
              <Box
                sx={{
                  px: "12px",
                  py: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                有效期限
              </Box>
              <Box
                sx={{
                  px: "12px",
                  py: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                剩餘
              </Box>
            </Box>

            {currentRows.map((row, index) => (
              <Box
                key={`${row.validPeriod}-${index}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 0.8fr",
                  borderTop: index === 0 ? "none" : "1px solid #d8d8d8",
                }}
              >
                <Box
                  sx={{
                    px: "12px",
                    py: "12px",
                    fontSize: "14px",
                    color: "#374151",
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                  }}
                >
                  {row.validPeriod}
                </Box>
                <Box
                  sx={{
                    px: "12px",
                    py: "12px",
                    fontSize: "14px",
                    color: "#374151",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {row.remaining}
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Table
            sx={{
              "& .MuiTableCell-root": {
                borderBottom: "1px solid #d8d8d8",
                px: "10px",
                py: "12px",
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: "#d4d4d4" }}>
                <TableCell
                  sx={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  有效期限
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  剩餘
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {currentRows.map((row, index) => (
                <TableRow key={`${row.validPeriod}-${index}`}>
                  <TableCell sx={{ fontSize: "16px", color: "#374151" }}>
                    {row.validPeriod}
                  </TableCell>
                  <TableCell sx={{ fontSize: "16px", color: "#374151" }}>
                    {row.remaining}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Box
          sx={{
            mt: "10px",
            py: isMobile ? "8px" : "10px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            gap: isMobile ? "12px" : "12px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "6px" : "10px",
              flexWrap: "nowrap",
            }}
          >
            <IconButton
              size="small"
              disabled={page === 1}
              onClick={() => setPage(1)}
              sx={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                bgcolor: "#f3f4f6",
                width: isMobile ? "32px" : "auto",
                height: isMobile ? "32px" : "auto",
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <KeyboardDoubleArrowLeftIcon sx={{ fontSize: "18px" }} />
            </IconButton>

            <IconButton
              size="small"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              sx={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                bgcolor: "#f3f4f6",
                width: isMobile ? "32px" : "auto",
                height: isMobile ? "32px" : "auto",
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <KeyboardArrowLeftIcon sx={{ fontSize: "18px" }} />
            </IconButton>

            <Box
              sx={{
                minWidth: isMobile ? "48px" : "68px",
                height: "32px",
                px: isMobile ? "8px" : "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                color: "#9ca3af",
                bgcolor: "#f3f4f6",
                fontSize: isMobile ? "15px" : "16px",
              }}
            >
              {page}
            </Box>

            <Typography sx={{ fontSize: isMobile ? "15px" : "16px", color: "#374151" }}>
              / {totalPages}
            </Typography>

            <IconButton
              size="small"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              sx={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                bgcolor: "#f3f4f6",
                width: isMobile ? "32px" : "auto",
                height: isMobile ? "32px" : "auto",
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <KeyboardArrowRightIcon sx={{ fontSize: "18px" }} />
            </IconButton>

            <IconButton
              size="small"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
              sx={{
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                bgcolor: "#f3f4f6",
                width: isMobile ? "32px" : "auto",
                height: isMobile ? "32px" : "auto",
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <KeyboardDoubleArrowRightIcon sx={{ fontSize: "18px" }} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: isMobile ? "space-between" : "flex-end",
              gap: "10px",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <Select
              size="small"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              sx={{
                minWidth: isMobile ? "72px" : "72px",
                height: "34px",
                bgcolor: "#ffffff",
                fontSize: "14px",
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>

            <Typography
              sx={{
                fontSize: isMobile ? "15px" : "16px",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              {startIndex}-{endIndex} / {details.length}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          px: 0,
          py: 0,
          borderTop: "1px solid #d1d5db",
          display: "flex",
          justifyContent: "flex-end",
          bgcolor: "#ffffff",
        }}
      >
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            minWidth: "50px",
            height: "30px",
            mr: "8px",
            mb: "4px",
            mt: "4px",
            fontSize: "14px",
            bgcolor: "#10224f",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#0c1a3d",
              boxShadow: "none",
            },
          }}
        >
          關閉
        </Button>
      </Box>
    </Dialog>
  );
}

function MobileLeaveCard({ item, onOpenDetail }) {
  return (
    <Box
      sx={{
        border: "1px solid #cfcfcf",
        bgcolor: "#ffffff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          bgcolor: "#d1d1d1",
          px: "12px",
          py: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {item.name}
        </Typography>

        <IconButton
          onClick={() => onOpenDetail(item)}
          size="small"
          sx={{
            p: "2px",
          }}
        >
          <DescriptionOutlinedIcon
            sx={{
              fontSize: "22px",
              color: "#5b7287",
            }}
          />
        </IconButton>
      </Box>

      <Box
        sx={{
          px: "12px",
          py: "12px",
          display: "grid",
          rowGap: "10px",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "64px 1fr",
            columnGap: "10px",
            alignItems: "start",
          }}
        >
          <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>可用</Typography>
          <Typography sx={{ fontSize: "15px", color: "#111827" }}>{item.available}</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "64px 1fr",
            columnGap: "10px",
            alignItems: "start",
          }}
        >
          <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>已用</Typography>
          <Typography sx={{ fontSize: "15px", color: "#111827" }}>{item.used}</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "64px 1fr",
            columnGap: "10px",
            alignItems: "start",
          }}
        >
          <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>剩餘</Typography>
          <Typography sx={{ fontSize: "15px", color: "#111827" }}>{item.remaining}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function AttendanceLeaveBalance() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedLeave, setSelectedLeave] = useState(null);

  const handleOpenDetail = (leave) => {
    setSelectedLeave(leave);
  };

  const handleCloseDetail = () => {
    setSelectedLeave(null);
  };

  return (
    <Box>
      <Breadcrumb rootLabel="個人專區" currentLabel="剩餘假別" mb="14px" />

      <Typography
        sx={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#111827",
          mb: "16px",
        }}
      >
        剩餘假別
      </Typography>

      <Box
        sx={{
          border: "1px solid #9ca3af",
          bgcolor: "#ffffff",
          p: isMobile ? "12px" : "16px",
          minHeight: isMobile ? "auto" : "690px",
        }}
      >
        {isMobile ? (
          <Box sx={{ display: "grid", gap: "12px" }}>
            {leaveBalanceData.map((item) => (
              <MobileLeaveCard
                key={item.id}
                item={item}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </Box>
        ) : (
          <Table
            sx={{
              "& .MuiTableCell-root": {
                borderBottom: "1px solid #cfcfcf",
                px: "12px",
                py: "10px",
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: "#d1d1d1" }}>
                <TableCell sx={{ fontSize: "16px", fontWeight: 700 }}>
                  假別
                </TableCell>
                <TableCell sx={{ fontSize: "16px", fontWeight: 700 }}>
                  可用
                </TableCell>
                <TableCell sx={{ fontSize: "16px", fontWeight: 700 }}>
                  已用
                </TableCell>
                <TableCell sx={{ fontSize: "16px", fontWeight: 700 }}>
                  剩餘
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontSize: "16px", fontWeight: 700, width: "120px" }}
                >
                  詳細資訊
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {leaveBalanceData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ fontSize: "16px", color: "#111827" }}>
                    {item.name}
                  </TableCell>
                  <TableCell sx={{ fontSize: "16px", color: "#111827" }}>
                    {item.available}
                  </TableCell>
                  <TableCell sx={{ fontSize: "16px", color: "#111827" }}>
                    {item.used}
                  </TableCell>
                  <TableCell sx={{ fontSize: "16px", color: "#111827" }}>
                    {item.remaining}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpenDetail(item)}>
                      <DescriptionOutlinedIcon
                        sx={{
                          fontSize: "24px",
                          color: "#5b7287",
                        }}
                      />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      <LeaveDetailDialog
        open={Boolean(selectedLeave)}
        onClose={handleCloseDetail}
        leaveItem={selectedLeave}
      />
    </Box>
  );
}