import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
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
import Breadcrumb from "../Utils/Breadcrumb";
import {
  fetchNewsCategories,
  fetchNewsDetail,
  fetchNewsList,
} from "../API/news";

const ACCENT_COLOR = "#35b8ec";
const DEFAULT_ROWS_PER_PAGE = 10;

function formatDateTime(value) {
  if (!value) return "-";

  const text = String(value).replace("T", " ");

  if (text.length >= 16) {
    return text.slice(0, 16);
  }

  return text;
}

function isImageFile(file) {
  const name = String(file?.file_name || file?.file_url || "").toLowerCase();

  return /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name);
}

function SidebarMenu({ categories, activeCategoryId, onChange }) {
  return (
    <Box
      sx={{
        width: "168px",
        border: "1px solid #e0e0e0",
        bgcolor: "#f7f7f7",
      }}
    >
      <Box
        sx={{
          borderTop: `5px solid ${ACCENT_COLOR}`,
          minHeight: "42px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #e5e5e5",
          px: "12px",
        }}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: ACCENT_COLOR,
            textAlign: "center",
          }}
        >
          消息分類
        </Typography>
      </Box>

      {categories.length === 0 ? (
        <Box
          sx={{
            minHeight: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: "12px",
            borderBottom: "1px solid #e5e5e5",
            color: "#c9c9c9",
            fontWeight: 500,
            fontSize: "15px",
            textAlign: "center",
          }}
        >
          無分類
        </Box>
      ) : (
        categories.map((category) => {
          const categoryId = String(category.news_category_id);
          const isActive = categoryId === String(activeCategoryId);

          return (
            <Box
              key={categoryId}
              onClick={() => onChange(categoryId)}
              sx={{
                minHeight: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: "12px",
                borderBottom: "1px solid #e5e5e5",
                color: isActive ? ACCENT_COLOR : "#c9c9c9",
                fontWeight: isActive ? 700 : 500,
                fontSize: "15px",
                textAlign: "center",
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  color: ACCENT_COLOR,
                  bgcolor: "#fafafa",
                },
              }}
            >
              {category.category_name || "-"}
            </Box>
          );
        })
      )}
    </Box>
  );
}

function PaginationBar({ totalRows }) {
  const currentPage = 1;
  const totalPages = Math.max(1, Math.ceil(totalRows / DEFAULT_ROWS_PER_PAGE));
  const displayFrom = totalRows === 0 ? 0 : 1;
  const displayTo = Math.min(DEFAULT_ROWS_PER_PAGE, totalRows);

  return (
    <Box
      sx={{
        mt: "18px",
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
          sx={{ minWidth: "24px", width: "24px", height: "24px", p: 0 }}
        >
          <KeyboardDoubleArrowLeftIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled
          sx={{ minWidth: "24px", width: "24px", height: "24px", p: 0 }}
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
          頁，共 {totalPages} 頁
        </Typography>

        <Button
          variant="outlined"
          disabled
          sx={{ minWidth: "24px", width: "24px", height: "24px", p: 0 }}
        >
          <KeyboardArrowRightIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled
          sx={{ minWidth: "24px", width: "24px", height: "24px", p: 0 }}
        >
          <KeyboardDoubleArrowRightIcon sx={{ fontSize: "18px" }} />
        </Button>
      </Box>

      <Typography sx={{ fontSize: "15px", color: "#1f2f4a" }}>
        顯示 {displayFrom} - {displayTo} 筆，共 {totalRows} 筆
      </Typography>
    </Box>
  );
}

function NewsDetailDialog({ open, loading, news, onClose }) {
  const attachments = Array.isArray(news?.attachments) ? news.attachments : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: "4px",
          overflow: "hidden",
          m: "32px",
          width: "760px",
          maxWidth: "calc(100vw - 64px)",
        },
      }}
    >
      <Box
        sx={{
          minHeight: "40px",
          bgcolor: ACCENT_COLOR,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "14px",
          gap: "12px",
        }}
      >
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#ffffff",
            wordBreak: "break-word",
          }}
        >
          {news?.title || "訊息內容"}
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "#ffffff", p: 0 }}
        >
          <CloseIcon sx={{ fontSize: "18px" }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: "16px", py: "16px" }}>
        {loading ? (
          <Box
            sx={{
              minHeight: "180px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Typography sx={{ fontSize: "13px", color: "#6b7280", mb: "14px" }}>
              發布時間：{formatDateTime(news?.publish_start)}
            </Typography>

            <Box
              sx={{
                border: "1px solid #dddddd",
                borderRadius: "4px",
                bgcolor: "#ffffff",
                p: "14px",
                whiteSpace: "pre-wrap",
                lineHeight: 1.8,
                fontSize: "15px",
                color: "#444444",
                mb: "14px",
                minHeight: "90px",
                wordBreak: "break-word",
              }}
            >
              {news?.content || "-"}
            </Box>

            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#333333",
                mb: "8px",
              }}
            >
              附件
            </Typography>

            {attachments.length === 0 ? (
              <Typography sx={{ fontSize: "14px", color: "#777777" }}>
                無附件
              </Typography>
            ) : (
              <Box sx={{ display: "grid", gap: "12px" }}>
                {attachments.map((file) => {
                  const isImage = isImageFile(file);

                  return (
                    <Box
                      key={file.news_attachment_id || file.file_url}
                      sx={{
                        bgcolor: "#ffffff",
                        p: isImage ? "0" : "8px 0",
                      }}
                    >
                      {/* IMAGE */}
                      {isImage && file.file_url ? (
                        <Box
                          component="img"
                          src={file.file_url}
                          alt={file.file_name || "附件圖片"}
                          sx={{
                            display: "block",
                            width: "100%",
                            maxWidth: "420px", // ✅ limit width
                            maxHeight: "260px", // ✅ limit height
                            objectFit: "contain",
                            mx: "auto", // center image
                          }}
                        />
                      ) : null}

                      {/* FILE (NON-IMAGE) */}
                      {!isImage && file.file_url ? (
                        <Typography
                          component="a"
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontSize: "14px",
                            color: "#1976d2",
                            textDecoration: "none",
                            wordBreak: "break-all",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {file.file_name || "開啟附件"}
                        </Typography>
                      ) : null}
                    </Box>
                  );
                })} 
              </Box>
            )}

            <Box
              sx={{
                mt: "18px",
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function LatestNews() {
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [newsRows, setNewsRows] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailNews, setDetailNews] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadCategories() {
      setLoadingCategories(true);
      setErrorMessage("");

      try {
        const result = await fetchNewsCategories();
        const activeRows = (Array.isArray(result) ? result : []).filter(
          (item) => {
            const status = String(item.status || "");
            return status === "" || status === "啟用" || status === "active";
          },
        );

        if (!alive) return;

        setCategories(activeRows);

        if (activeRows.length > 0) {
          setActiveCategoryId(String(activeRows[0].news_category_id));
        }
      } catch (error) {
        if (!alive) return;
        setErrorMessage(error?.message || "讀取消息分類失敗。");
      } finally {
        if (alive) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeCategoryId) {
      setNewsRows([]);
      return;
    }

    let alive = true;

    async function loadNews() {
      setLoadingNews(true);
      setErrorMessage("");

      try {
        const result = await fetchNewsList({
          news_category_id: activeCategoryId,
          status: "發布",
        });

        if (!alive) return;

        setNewsRows(Array.isArray(result) ? result : []);
      } catch (error) {
        if (!alive) return;
        setErrorMessage(error?.message || "讀取最新消息失敗。");
      } finally {
        if (alive) {
          setLoadingNews(false);
        }
      }
    }

    loadNews();

    return () => {
      alive = false;
    };
  }, [activeCategoryId]);

  const visibleRows = useMemo(() => {
    return newsRows.slice(0, DEFAULT_ROWS_PER_PAGE);
  }, [newsRows]);

  const handleOpenDetail = async (row) => {
    const newsId = row?.news_id;

    if (!newsId) {
      return;
    }

    setDetailOpen(true);
    setDetailLoading(true);
    setDetailNews(row);

    try {
      const detail = await fetchNewsDetail(newsId);
      setDetailNews(detail || row);
    } catch (error) {
      setDetailNews({
        ...row,
        content: error?.message || "讀取訊息內容失敗。",
        attachments: [],
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailNews(null);
  };

  return (
    <Box>
      <Breadcrumb rootLabel="首頁" currentLabel="最新消息" mb="14px" />

      <Typography
        sx={{ fontSize: "18px", fontWeight: 700, color: "#111827", mb: "18px" }}
      >
        最新消息
      </Typography>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
        <Box sx={{ flexShrink: 0, mt: "46px" }}>
          <SidebarMenu
            categories={categories}
            activeCategoryId={activeCategoryId}
            onChange={setActiveCategoryId}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ mb: "12px", minHeight: "34px" }} />

          <Box sx={{ border: "1px solid #d3d3d3", bgcolor: "#ffffff" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 160px",
                minHeight: "38px",
                alignItems: "center",
                background: "linear-gradient(to bottom, #f7f7f7, #dddddd)",
                borderBottom: "1px solid #d3d3d3",
              }}
            >
              <Box
                sx={{
                  px: "12px",
                  minHeight: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#333333",
                    textAlign: "center",
                  }}
                >
                  標題
                </Typography>
              </Box>

              <Box
                sx={{
                  px: "12px",
                  minHeight: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#333333",
                    textAlign: "center",
                  }}
                >
                  發布開始
                </Typography>
              </Box>

              <Box
                sx={{
                  px: "12px",
                  minHeight: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#333333",
                    textAlign: "center",
                  }}
                >
                  發布結束
                </Typography>
              </Box>
            </Box>

            {loadingCategories || loadingNews ? (
              <Box
                sx={{
                  minHeight: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={26} />
              </Box>
            ) : errorMessage ? (
              <Box
                sx={{
                  minHeight: "36px",
                  display: "flex",
                  alignItems: "center",
                  px: "12px",
                  py: "10px",
                }}
              >
                <Typography sx={{ fontSize: "15px", color: "#dc2626" }}>
                  {errorMessage}
                </Typography>
              </Box>
            ) : visibleRows.length === 0 ? (
              <Box
                sx={{
                  minHeight: "36px",
                  display: "flex",
                  alignItems: "center",
                  px: "12px",
                  py: "10px",
                }}
              >
                <Typography sx={{ fontSize: "15px", color: "#333333" }}>
                  查無資料
                </Typography>
              </Box>
            ) : (
              visibleRows.map((row, index) => (
                <Box
                  key={row.news_id || index}
                  onClick={() => handleOpenDetail(row)}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 160px",
                    minHeight: "50px",
                    alignItems: "center",
                    borderBottom:
                      index === visibleRows.length - 1
                        ? "none"
                        : "1px solid #d3d3d3",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                    "&:hover": {
                      bgcolor: "#fafafa",
                    },
                  }}
                >
                  <Box
                    sx={{
                      px: "12px",
                      py: "10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "15px",
                        color: "#333333",
                        wordBreak: "break-word",
                      }}
                    >
                      {row.title || "-"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      px: "12px",
                      py: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "15px",
                        color: "#333333",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDateTime(row.publish_start)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      px: "12px",
                      py: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "15px",
                        color: "#333333",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDateTime(row.publish_end)}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          <PaginationBar totalRows={newsRows.length} />
        </Box>
      </Box>

      <NewsDetailDialog
        open={detailOpen}
        loading={detailLoading}
        news={detailNews}
        onClose={handleCloseDetail}
      />
    </Box>
  );
}
