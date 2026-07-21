import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
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
import useNotifications from "../Contexts/UseNotification";
import useNotificationHighlight from "../Utils/Notifications/UseNotificationHighlight";

const ACCENT_COLOR = "#35b8ec";
const DEFAULT_ROWS_PER_PAGE = 10;

const LATEST_NEWS_CATEGORY_STORAGE_KEY = "latest-news-active-category-id";

function getStoredCategoryId() {
  try {
    return (
      window.sessionStorage.getItem(LATEST_NEWS_CATEGORY_STORAGE_KEY) || ""
    );
  } catch {
    return "";
  }
}

function setStoredCategoryId(categoryId) {
  try {
    window.sessionStorage.setItem(
      LATEST_NEWS_CATEGORY_STORAGE_KEY,
      String(categoryId || ""),
    );
  } catch {
    //
  }
}

function getPageStorageKey(categoryId) {
  return `latest-news-page-${categoryId || "default"}`;
}

function getStoredPage(categoryId) {
  try {
    const value = Number(
      window.sessionStorage.getItem(getPageStorageKey(categoryId)),
    );

    return Number.isFinite(value) && value > 0 ? value : 1;
  } catch {
    return 1;
  }
}

function setStoredPage(categoryId, page) {
  try {
    window.sessionStorage.setItem(
      getPageStorageKey(categoryId),
      String(Math.max(1, Number(page) || 1)),
    );
  } catch {
    //
  }
}

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
        width: {
          xs: "100%",
          md: "168px",
        },
        border: "1px solid #e0e0e0",
        bgcolor: "#f7f7f7",
        overflow: "hidden",
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
            fontSize: {
              xs: "15px",
              sm: "16px",
            },
            fontWeight: 700,
            color: ACCENT_COLOR,
            textAlign: "center",
          }}
        >
          消息分類
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(3, minmax(0, 1fr))",
            sm: "repeat(auto-fit, minmax(120px, 1fr))",
            md: "minmax(0, 1fr)",
          },
          overflow: "visible",
        }}
      >
        {categories.length === 0 ? (
          <Box
            sx={{
              width: "100%",
              minHeight: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: "12px",
              borderBottom: "1px solid #e5e5e5",
              color: "#c9c9c9",
              fontWeight: 400,
              fontSize: {
                xs: "14px",
                sm: "15px",
              },
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
                  minWidth: 0,
                  width: "100%",
                  minHeight: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: {
                    xs: "6px",
                    sm: "10px",
                    md: "12px",
                  },
                  borderRight: {
                    xs: "1px solid #e5e5e5",
                    md: "none",
                  },
                  borderBottom: "1px solid #e5e5e5",
                  color: isActive ? ACCENT_COLOR : "#c9c9c9",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: {
                    xs: "13px",
                    sm: "14px",
                    md: "15px",
                  },
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordBreak: "keep-all",
                  overflowWrap: "anywhere",
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
    </Box>
  );
}

function PaginationBar({ totalRows, currentPage, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalRows / DEFAULT_ROWS_PER_PAGE));

  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const displayFrom =
    totalRows === 0 ? 0 : (safePage - 1) * DEFAULT_ROWS_PER_PAGE + 1;

  const displayTo = Math.min(safePage * DEFAULT_ROWS_PER_PAGE, totalRows);

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);

    onPageChange(nextPage);
  };

  return (
    <Box
      sx={{
        mt: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: {
          xs: "center",
          md: "space-between",
        },
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <Box
        sx={{
          width: {
            xs: "100%",
            md: "auto",
          },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: {
            xs: "5px",
            sm: "8px",
          },
          whiteSpace: "nowrap",
        }}
      >
        <Button
          variant="outlined"
          disabled={safePage <= 1}
          onClick={() => goToPage(1)}
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
          }}
        >
          <KeyboardDoubleArrowLeftIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled={safePage <= 1}
          onClick={() => goToPage(safePage - 1)}
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
          }}
        >
          <KeyboardArrowLeftIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Typography
          sx={{
            fontSize: {
              xs: "13px",
              sm: "14px",
              md: "15px",
            },
            color: "#333333",
            ml: {
              xs: 0,
              sm: "4px",
            },
          }}
        >
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
            fontSize: {
              xs: "13px",
              sm: "14px",
              md: "15px",
            },
            color: "#333333",
            bgcolor: "#ffffff",
          }}
        >
          {safePage}
        </Box>

        <Typography
          sx={{
            fontSize: {
              xs: "13px",
              sm: "14px",
              md: "15px",
            },
            color: "#333333",
          }}
        >
          頁，共 {totalPages} 頁
        </Typography>

        <Button
          variant="outlined"
          disabled={safePage >= totalPages}
          onClick={() => goToPage(safePage + 1)}
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
          }}
        >
          <KeyboardArrowRightIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled={safePage >= totalPages}
          onClick={() => goToPage(totalPages)}
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
          }}
        >
          <KeyboardDoubleArrowRightIcon sx={{ fontSize: "18px" }} />
        </Button>
      </Box>

      <Typography
        sx={{
          width: {
            xs: "100%",
            md: "auto",
          },
          fontSize: {
            xs: "13px",
            sm: "14px",
            md: "15px",
          },
          color: "#1f2f4a",
          textAlign: {
            xs: "center",
            md: "right",
          },
        }}
      >
        顯示 {displayFrom} - {displayTo} 筆，共 {totalRows} 筆
      </Typography>
    </Box>
  );
}

function NewsList({
  loading,
  errorMessage,
  rows,
  highlightedNewsId,
  isSourceUnread,
  onOpenDetail,
}) {
  const theme = useTheme();
  const useCardLayout = useMediaQuery(theme.breakpoints.down("md"));

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #d3d3d3",
          borderRadius: {
            xs: "6px",
            md: 0,
          },
          bgcolor: "#ffffff",
        }}
      >
        <CircularProgress size={26} />
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box
        sx={{
          minHeight: "44px",
          display: "flex",
          alignItems: "center",
          px: "12px",
          py: "10px",
          border: "1px solid #d3d3d3",
          borderRadius: {
            xs: "6px",
            md: 0,
          },
          bgcolor: "#ffffff",
        }}
      >
        <Typography
          sx={{
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
            color: "#dc2626",
            overflowWrap: "anywhere",
          }}
        >
          {errorMessage}
        </Typography>
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: {
            xs: "center",
            md: "flex-start",
          },
          px: "12px",
          py: "10px",
          border: "1px solid #d3d3d3",
          borderRadius: {
            xs: "6px",
            md: 0,
          },
          bgcolor: "#ffffff",
        }}
      >
        <Typography
          sx={{
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
            color: "#333333",
          }}
        >
          查無資料
        </Typography>
      </Box>
    );
  }

  if (useCardLayout) {
    return (
      <Box
        sx={{
          display: "grid",
          gap: {
            xs: "10px",
            sm: "12px",
          },
        }}
      >
        {rows.map((row, index) => {
          const isHighlighted =
            Number(row.news_id) === Number(highlightedNewsId);

          return (
            <Box
              key={row.news_id || index}
              onClick={() => onOpenDetail(row)}
              sx={{
                border: "1px solid #d3d3d3",
                borderRadius: "6px",
                bgcolor: isHighlighted ? "#fff7cc" : "#ffffff",
                overflow: "hidden",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                "&:hover": {
                  bgcolor: isHighlighted ? "#fff1a8" : "#fafafa",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  px: {
                    xs: "10px",
                    sm: "12px",
                  },
                  py: "11px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {isSourceUnread("news", row.news_id) ? (
                  <Box
                    component="span"
                    aria-label="未讀最新消息"
                    sx={{
                      width: "8px",
                      height: "8px",
                      mt: "6px",
                      borderRadius: "50%",
                      bgcolor: "#ef4444",
                      flexShrink: 0,
                    }}
                  />
                ) : null}

                <Typography
                  sx={{
                    minWidth: 0,
                    fontSize: {
                      xs: "14px",
                      sm: "15px",
                    },
                    fontWeight: 700,
                    color: "#333333",
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.title || "-"}
                </Typography>
              </Box>

              {[
                {
                  label: "發布開始",
                  value: formatDateTime(row.publish_start),
                },
                {
                  label: "發布結束",
                  value: formatDateTime(row.publish_end),
                },
              ].map((field, fieldIndex) => (
                <Box
                  key={field.label}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "88px minmax(0, 1fr)",
                      sm: "140px minmax(0, 1fr)",
                    },
                    borderBottom:
                      fieldIndex === 1 ? "none" : "1px solid #e5e7eb",
                  }}
                >
                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: {
                        xs: "8px",
                        sm: "10px",
                      },
                      py: "10px",
                      bgcolor: "#f7f7f7",
                      fontSize: {
                        xs: "12px",
                        sm: "13px",
                      },
                      fontWeight: 700,
                      color: "#475569",
                      wordBreak: "keep-all",
                    }}
                  >
                    {field.label}
                  </Typography>

                  <Typography
                    sx={{
                      minWidth: 0,
                      px: {
                        xs: "10px",
                        sm: "12px",
                      },
                      py: "10px",
                      fontSize: {
                        xs: "14px",
                        sm: "15px",
                      },
                      color: "#333333",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {field.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <Box
        sx={{
          minWidth: "700px",
          border: "1px solid #d3d3d3",
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 160px 160px",
            minHeight: "38px",
            alignItems: "center",
            background: "linear-gradient(to bottom, #f7f7f7, #dddddd)",
            borderBottom: "1px solid #d3d3d3",
          }}
        >
          {["標題", "發布開始", "發布結束"].map((label) => (
            <Box
              key={label}
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
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {rows.map((row, index) => {
          const isHighlighted =
            Number(row.news_id) === Number(highlightedNewsId);

          return (
            <Box
              key={row.news_id || index}
              onClick={() => onOpenDetail(row)}
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 160px 160px",
                minHeight: "50px",
                alignItems: "center",
                borderBottom:
                  index === rows.length - 1 ? "none" : "1px solid #d3d3d3",
                cursor: "pointer",
                bgcolor: isHighlighted ? "#fff7cc" : "transparent",
                transition: "background-color 0.2s ease",
                "&:hover": {
                  bgcolor: isHighlighted ? "#fff1a8" : "#fafafa",
                },
              }}
            >
              <Box
                sx={{
                  minWidth: 0,
                  px: "12px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {isSourceUnread("news", row.news_id) ? (
                  <Box
                    component="span"
                    aria-label="未讀最新消息"
                    sx={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      bgcolor: "#ef4444",
                      flexShrink: 0,
                      mr: "8px",
                    }}
                  />
                ) : null}

                <Typography
                  sx={{
                    minWidth: 0,
                    fontSize: "15px",
                    color: "#333333",
                    overflowWrap: "anywhere",
                  }}
                >
                  {row.title || "-"}
                </Typography>
              </Box>

              {[row.publish_start, row.publish_end].map((value, valueIndex) => (
                <Box
                  key={valueIndex}
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
                    {formatDateTime(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        })}
      </Box>
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
          m: {
            xs: "8px",
            sm: "32px",
          },
          width: {
            xs: "calc(100vw - 16px)",
            sm: "760px",
          },
          maxWidth: "760px",
          maxHeight: {
            xs: "calc(100dvh - 16px)",
            sm: "calc(100dvh - 64px)",
          },
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
          px: {
            xs: "10px",
            sm: "14px",
          },
          gap: "12px",
        }}
      >
        <Typography
          sx={{
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
            fontWeight: 700,
            color: "#ffffff",
            overflowWrap: "anywhere",
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

      <DialogContent
        sx={{
          px: {
            xs: "10px",
            sm: "16px",
          },
          py: {
            xs: "12px",
            sm: "16px",
          },
        }}
      >
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
            <Typography
              sx={{
                fontSize: {
                  xs: "12px",
                  sm: "13px",
                },
                color: "#6b7280",
                mb: "14px",
              }}
            >
              發布時間：{formatDateTime(news?.publish_start)}
            </Typography>

            <Box
              sx={{
                border: "1px solid #dddddd",
                borderRadius: "4px",
                bgcolor: "#ffffff",
                p: {
                  xs: "10px",
                  sm: "14px",
                },
                whiteSpace: "pre-wrap",
                lineHeight: 1.8,
                fontSize: {
                  xs: "14px",
                  sm: "15px",
                },
                color: "#444444",
                mb: "14px",
                minHeight: {
                  xs: "70px",
                  sm: "90px",
                },
                overflowWrap: "anywhere",
              }}
            >
              {news?.content || "-"}
            </Box>

            <Typography
              sx={{
                fontSize: {
                  xs: "14px",
                  sm: "15px",
                },
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
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                  height: "34px",
                  borderColor: "#c5c5c5",
                  color: "#555555",
                  fontSize: {
                    xs: "14px",
                    sm: "15px",
                  },
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
  const { isSourceUnread, markSourceAsRead } = useNotifications();

  const { highlightedId: highlightedNewsId } = useNotificationHighlight();

  const resolvedHighlightRef = useRef(0);

  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(getStoredCategoryId);
  const [currentPage, setCurrentPage] = useState(() => {
    return getStoredPage(getStoredCategoryId());
  });
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
          const storedCategoryId = getStoredCategoryId();
          const storedExists = activeRows.some((category) => {
            return (
              String(category.news_category_id) === String(storedCategoryId)
            );
          });

          const nextCategoryId = storedExists
            ? storedCategoryId
            : String(activeRows[0].news_category_id);

          setActiveCategoryId(nextCategoryId);
          setStoredCategoryId(nextCategoryId);
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
    if (highlightedNewsId <= 0) {
      resolvedHighlightRef.current = 0;
      return undefined;
    }

    if (
      categories.length === 0 ||
      resolvedHighlightRef.current === highlightedNewsId
    ) {
      return undefined;
    }

    let alive = true;
    resolvedHighlightRef.current = highlightedNewsId;

    async function selectHighlightedCategory() {
      try {
        const detail = await fetchNewsDetail(highlightedNewsId);

        const categoryId = String(detail?.news_category_id || "");

        const categoryExists = categories.some(
          (item) => String(item.news_category_id) === categoryId,
        );

        if (alive && categoryId && categoryExists) {
          setActiveCategoryId(categoryId);
          setStoredCategoryId(categoryId);
        }
      } catch {
        // Keep the current category if the target cannot be resolved.
      }
    }

    selectHighlightedCategory();

    return () => {
      alive = false;
    };
  }, [categories, highlightedNewsId]);

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

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(newsRows.length / DEFAULT_ROWS_PER_PAGE),
    );

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      setStoredPage(activeCategoryId, totalPages);
    }
  }, [activeCategoryId, currentPage, newsRows.length]);

  useEffect(() => {
    if (highlightedNewsId <= 0 || newsRows.length === 0) {
      return;
    }

    const rowIndex = newsRows.findIndex((row) => {
      return Number(row.news_id) === highlightedNewsId;
    });

    if (rowIndex < 0) {
      return;
    }

    const targetPage = Math.floor(rowIndex / DEFAULT_ROWS_PER_PAGE) + 1;

    setCurrentPage(targetPage);

    setStoredPage(activeCategoryId, targetPage);
  }, [activeCategoryId, highlightedNewsId, newsRows]);

  const visibleRows = useMemo(() => {
    const startIndex = (currentPage - 1) * DEFAULT_ROWS_PER_PAGE;
    return newsRows.slice(startIndex, startIndex + DEFAULT_ROWS_PER_PAGE);
  }, [currentPage, newsRows]);

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

      try {
        await markSourceAsRead("news", newsId);
      } catch {
        /*
         * Keep the news detail open if notification
         * synchronization temporarily fails.
         */
      }
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

  const handleCategoryChange = (categoryId) => {
    const nextCategoryId = String(categoryId);
    const nextPage = getStoredPage(nextCategoryId);

    setActiveCategoryId(nextCategoryId);
    setStoredCategoryId(nextCategoryId);
    setCurrentPage(nextPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setStoredPage(activeCategoryId, page);
  };

  return (
    <Box>
      <Breadcrumb rootLabel="首頁" currentLabel="最新消息" mb="14px" />

      <Typography
        sx={{
          fontSize: {
            xs: "17px",
            sm: "18px",
          },
          fontWeight: 700,
          color: "#111827",
          mb: {
            xs: "16px",
            md: "18px",
          },
        }}
      >
        最新消息
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          alignItems: "flex-start",
          gap: {
            xs: "16px",
            md: "20px",
          },
        }}
      >
        <Box
          sx={{
            width: {
              xs: "100%",
              md: "auto",
            },
            flexShrink: 0,
            mt: {
              xs: 0,
              md: "46px",
            },
          }}
        >
          <SidebarMenu
            categories={categories}
            activeCategoryId={activeCategoryId}
            onChange={handleCategoryChange}
          />
        </Box>

        <Box
          sx={{
            width: "100%",
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: {
                xs: "none",
                md: "block",
              },
              mb: "12px",
              minHeight: "34px",
            }}
          />

          <NewsList
            loading={loadingCategories || loadingNews}
            errorMessage={errorMessage}
            rows={visibleRows}
            highlightedNewsId={highlightedNewsId}
            isSourceUnread={isSourceUnread}
            onOpenDetail={handleOpenDetail}
          />

          <PaginationBar
            totalRows={newsRows.length}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
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
