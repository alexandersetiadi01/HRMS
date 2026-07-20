import {
  isValidElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import Breadcrumb from "../Utils/Breadcrumb";

const DEFAULT_ROWS_PER_PAGE = 10;

function InternalActionDialog({ open, title, content, onClose }) {
  if (!content) return null;

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
          width: "640px",
          maxWidth: "calc(100vw - 64px)",
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
        }}
      >
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          {title || "詳細內容"}
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
          px: "14px",
          pt: "14px",
          pb: 0,
        }}
      >
        <Box
          sx={{
            border: "1px solid #d8d8d8",
            borderRadius: "4px",
            bgcolor: "#f7f7f7",
            p: "14px",
          }}
        >
          {content.title ? (
            <Typography
              sx={{
                fontSize: "15px",
                color: "#555555",
                mb: "14px",
              }}
            >
              標題：{content.title}
            </Typography>
          ) : null}

          {content.body ? (
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
              }}
            >
              {content.body}
            </Box>
          ) : null}

          {content.shopName ? (
            <Typography
              sx={{
                fontSize: "15px",
                color: "#444444",
                mb: "10px",
              }}
            >
              {content.shopName}
            </Typography>
          ) : null}

          {content.ratingText ? (
            <Typography
              sx={{
                fontSize: "15px",
                color: "#ff3b30",
                fontWeight: 700,
                mb: "10px",
              }}
            >
              {content.ratingText}
            </Typography>
          ) : null}

          {content.deadlineText ? (
            <Typography
              sx={{
                fontSize: "15px",
                color: "#ff3b30",
                fontWeight: 700,
              }}
            >
              {content.deadlineText}
            </Typography>
          ) : null}
        </Box>

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
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({ open, onCancel, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          borderRadius: "6px",
          width: "320px",
          maxWidth: "calc(100vw - 32px)",
        },
      }}
    >
      <DialogContent
        sx={{
          px: "20px",
          pt: "20px",
          pb: "16px",
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: "15px", mb: "20px", color: "#333333" }}>
          確定要刪除這筆資料嗎？
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              minWidth: "80px",
              borderColor: "#c5c5c5",
              color: "#555555",
              fontSize: "15px",
            }}
          >
            取消
          </Button>

          <Button
            variant="contained"
            onClick={onConfirm}
            sx={{
              minWidth: "80px",
              bgcolor: "#ef4444",
              fontSize: "15px",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#dc2626",
                boxShadow: "none",
              },
            }}
          >
            確定
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function PaginationBar({
  totalRows,
  currentPage,
  totalPages,
  onFirst,
  onPrev,
  onNext,
  onLast,
}) {
  const displayFrom = totalRows === 0
    ? 0
    : (
      (currentPage - 1)
      * DEFAULT_ROWS_PER_PAGE
    ) + 1;

  const displayTo = totalRows === 0
    ? 0
    : Math.min(
      currentPage * DEFAULT_ROWS_PER_PAGE,
      totalRows,
    );

  const firstPageDisabled = currentPage <= 1;

  const lastPageDisabled = (
    currentPage >= totalPages
  );

  const navigationButtonSx = {
    minWidth: "24px",
    width: "24px",
    height: "24px",
    p: 0,
    flexShrink: 0,
    borderColor: "#d9d9d9",
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
          aria-label="第一頁"
          disabled={firstPageDisabled}
          onClick={onFirst}
          sx={{
            ...navigationButtonSx,
            color: firstPageDisabled
              ? "#c8c8c8"
              : "#8a8a8a",
          }}
        >
          <KeyboardDoubleArrowLeftIcon
            sx={{ fontSize: "18px" }}
          />
        </Button>

        <Button
          variant="outlined"
          aria-label="上一頁"
          disabled={firstPageDisabled}
          onClick={onPrev}
          sx={{
            ...navigationButtonSx,
            color: firstPageDisabled
              ? "#c8c8c8"
              : "#8a8a8a",
          }}
        >
          <KeyboardArrowLeftIcon
            sx={{ fontSize: "18px" }}
          />
        </Button>

        <Typography
          sx={{
            ml: {
              xs: 0,
              sm: "4px",
            },
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
            color: "#333333",
          }}
        >
          第
        </Typography>

        <Box
          sx={{
            width: {
              xs: "34px",
              sm: "40px",
            },
            height: "24px",
            border: "1px solid #8f8f8f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: "4px",
            bgcolor: "#ffffff",
            color: "#333333",
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
            flexShrink: 0,
          }}
        >
          {currentPage}
        </Box>

        <Typography
          sx={{
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
            color: "#333333",
          }}
        >
          頁，共 {totalPages} 頁
        </Typography>

        <Button
          variant="outlined"
          aria-label="下一頁"
          disabled={lastPageDisabled}
          onClick={onNext}
          sx={{
            ...navigationButtonSx,
            color: lastPageDisabled
              ? "#c8c8c8"
              : "#8a8a8a",
          }}
        >
          <KeyboardArrowRightIcon
            sx={{ fontSize: "18px" }}
          />
        </Button>

        <Button
          variant="outlined"
          aria-label="最後一頁"
          disabled={lastPageDisabled}
          onClick={onLast}
          sx={{
            ...navigationButtonSx,
            color: lastPageDisabled
              ? "#c8c8c8"
              : "#8a8a8a",
          }}
        >
          <KeyboardDoubleArrowRightIcon
            sx={{ fontSize: "18px" }}
          />
        </Button>
      </Box>

      <Typography
        sx={{
          width: {
            xs: "100%",
            md: "auto",
          },
          fontSize: {
            xs: "14px",
            sm: "15px",
          },
          color: "#1f2f4a",
          textAlign: {
            xs: "center",
            md: "right",
          },
        }}
      >
        顯示 {displayFrom} - {displayTo} 筆，共{" "}
        {totalRows} 筆
      </Typography>
    </Box>
  );
}

function SidebarMenu({
  accentColor,
  title,
  items,
  activeKey,
  onChange,
}) {
  return (
    <Box
      sx={{
        width: {
          xs: "100%",
          lg: "168px",
        },
        border: "1px solid #e0e0e0",
        bgcolor: "#f7f7f7",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          borderTop: `5px solid ${accentColor}`,
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
            color: accentColor,
            textAlign: "center",
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "row",
            lg: "column",
          },
          overflowX: {
            xs: "auto",
            lg: "visible",
          },
        }}
      >
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <Box
              key={item.key}
              onClick={() => onChange(item.key)}
              sx={{
                minWidth: {
                  xs: "140px",
                  sm: 0,
                  lg: "auto",
                },
                flex: {
                  xs: "1 0 auto",
                  sm: "1 1 0",
                  lg: "0 0 auto",
                },
                minHeight: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: "12px",
                borderRight: {
                  xs: "1px solid #e5e5e5",
                  lg: "none",
                },
                borderBottom: "1px solid #e5e5e5",
                color: isActive
                  ? accentColor
                  : "#c9c9c9",
                fontWeight: isActive ? 700 : 500,
                fontSize: "15px",
                textAlign: "center",
                whiteSpace: "nowrap",
                cursor: "pointer",
                userSelect: "none",
                "&:hover": {
                  color: accentColor,
                  bgcolor: "#fafafa",
                },
              }}
            >
              {item.label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function DefaultCell({ value, align = "left", wrap = true, sx = {} }) {
  return (
    <Typography
      sx={{
        fontSize: "15px",
        color: "#333333",
        textAlign: align,
        whiteSpace: wrap ? "normal" : "nowrap",
        overflow: wrap ? "visible" : "hidden",
        textOverflow: wrap ? "clip" : "ellipsis",
        wordBreak: "break-word",
        ...sx,
      }}
    >
      {value}
    </Typography>
  );
}

function renderSpecialCell(column, row, handlers) {
  if (column.type === "statusPill") {
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "52px",
          height: "18px",
          px: "8px",
          borderRadius: "2px",
          bgcolor: "#c7c7c7",
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {row[column.key]}
      </Box>
    );
  }

  if (column.type === "checkbox") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Checkbox
          checked={Boolean(row[column.key])}
          onChange={() => handlers.onToggleCheckbox?.(row.id, column.key)}
          size="small"
          sx={{
            p: 0,
            color: "#8a8a8a",
            "&.Mui-checked": {
              color: "#8a8a8a",
            },
          }}
        />
      </Box>
    );
  }

  if (column.type === "delete") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <IconButton
          size="small"
          onClick={() => handlers.onDeleteRow?.(row.id)}
          sx={{ p: 0, color: "#8a8a8a" }}
        >
          <DeleteOutlineIcon sx={{ fontSize: "20px" }} />
        </IconButton>
      </Box>
    );
  }

  if (column.type === "actions") {
    const actions = Array.isArray(row[column.key]) ? row[column.key] : [];

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "6px",
          flexWrap: "wrap",
        }}
      >
        {actions.map((action, actionIndex) => (
          <Tooltip
            key={`${row.id || "row"}-${action.label || "action"}-${actionIndex}`}
            title={action.label || ""}
          >
            <span>
              <IconButton
                size="small"
                disabled={action.disabled}
                onClick={(event) => {
                  event.stopPropagation();

                  if (typeof action.onClick === "function") {
                    action.onClick(row);
                  }
                }}
                sx={{
                  p: 0,
                  color: action.color || "#6d6d6d",
                  "&:hover": {
                    color: action.hoverColor || action.color || "#333333",
                    bgcolor: "transparent",
                  },
                }}
              >
                {action.icon}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Box>
    );
  }

  if (column.type === "search") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <IconButton
          size="small"
          onClick={() => handlers.onOpenDetail?.(row)}
          sx={{ p: 0, color: "#6d6d6d" }}
        >
          <SearchIcon sx={{ fontSize: "24px" }} />
        </IconButton>
      </Box>
    );
  }

  return null;
}

function DataTable({
  columns,
  rows,
  emptyText = "查無資料",
  onToggleCheckbox,
  onDeleteRow,
  onOpenDetail,
}) {
  const theme = useTheme();

  const useCardLayout = useMediaQuery(
    theme.breakpoints.down("md"),
  );

  const handlers = {
    onToggleCheckbox,
    onDeleteRow,
    onOpenDetail,
  };

  const renderCell = (
    column,
    row,
    compact = false,
  ) => {
    if (column.type) {
      return renderSpecialCell(
        column,
        row,
        handlers,
      );
    }

    const value = row[column.key];

    if (isValidElement(value)) {
      return value;
    }

    return (
      <DefaultCell
        value={value}
        align={
          compact
            ? "left"
            : column.align || "left"
        }
        wrap={
          compact
            ? true
            : column.wrap !== false
        }
        sx={column.cellSx || {}}
      />
    );
  };

  if (useCardLayout) {
    if (rows.length === 0) {
      return (
        <Box
          sx={{
            border: "1px solid #d3d3d3",
            bgcolor: "#ffffff",
            px: "14px",
            py: "22px",
          }}
        >
          <Typography
            sx={{
              fontSize: "15px",
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            {emptyText}
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: "grid",
          gap: "12px",
        }}
      >
        {rows.map((row, rowIndex) => (
          <Box
            key={row.id || rowIndex}
            onClick={
              row.onRowClick || undefined
            }
            sx={{
              position: "relative",
              border: "1px solid #d3d3d3",
              borderRadius: "6px",
              bgcolor: row.isHighlighted
                ? "#fff7cc"
                : "#ffffff",
              overflow: "hidden",
              cursor: row.onRowClick
                ? "pointer"
                : "default",
              transition:
                "background-color 0.2s ease",
              "&:hover": {
                bgcolor: row.isHighlighted
                  ? "#fff1a8"
                  : row.hoverBg || "#fafafa",
              },
            }}
          >
            {row.isUnreadNotification ? (
              <Box
                component="span"
                aria-label="未讀項目"
                sx={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  bgcolor: "#ef4444",
                  zIndex: 1,
                }}
              />
            ) : null}

            {columns.map(
              (column, columnIndex) => (
                <Box
                  key={column.key}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "88px minmax(0, 1fr)",
                      sm: "140px minmax(0, 1fr)",
                    },
                    alignItems: "start",
                    borderBottom: (
                      columnIndex
                      === columns.length - 1
                    )
                      ? "none"
                      : "1px solid #e5e7eb",
                  }}
                >
                  <Typography
                    sx={{
                      alignSelf: "stretch",
                      display: "flex",
                      alignItems: "center",
                      px: "10px",
                      py: "10px",
                      bgcolor: "#f7f7f7",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#475569",
                      wordBreak: "keep-all",
                    }}
                  >
                    {column.mobileLabel
                      || column.label}
                  </Typography>

                  <Box
                    sx={{
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "flex-start",
                      px: "12px",
                      py: "10px",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {renderCell(
                      column,
                      row,
                      true,
                    )}
                  </Box>
                </Box>
              ),
            )}
          </Box>
        ))}
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
          minWidth: "900px",
          border: "1px solid #d3d3d3",
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: columns
              .map(
                (column) => (
                  column.width || "1fr"
                ),
              )
              .join(" "),
            minHeight: "38px",
            alignItems: "center",
            background: (
              "linear-gradient("
              + "to bottom, "
              + "#f7f7f7, "
              + "#dddddd"
              + ")"
            ),
            borderBottom:
              "1px solid #d3d3d3",
          }}
        >
          {columns.map((column) => (
            <Box
              key={column.key}
              sx={{
                px: "12px",
                minHeight: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRight:
                  column.withDivider
                    ? "1px solid #d3d3d3"
                    : "none",
              }}
            >
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#333333",
                  textAlign: "center",
                  whiteSpace:
                    column.headerWrap === false
                      ? "nowrap"
                      : "normal",
                  wordBreak:
                    column.headerWrap === false
                      ? "keep-all"
                      : "break-word",
                }}
              >
                {column.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {rows.length === 0 ? (
          <Box
            sx={{
              minHeight: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: "12px",
              py: "10px",
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                color: "#6b7280",
              }}
            >
              {emptyText}
            </Typography>
          </Box>
        ) : (
          rows.map((row, rowIndex) => (
            <Box
              key={row.id || rowIndex}
              onClick={
                row.onRowClick || undefined
              }
              sx={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: columns
                  .map(
                    (column) => (
                      column.width || "1fr"
                    ),
                  )
                  .join(" "),
                minHeight: "50px",
                alignItems: "center",
                borderBottom: (
                  rowIndex
                  === rows.length - 1
                )
                  ? "none"
                  : "1px solid #d3d3d3",
                transition:
                  "background-color 0.2s ease",
                cursor: row.onRowClick
                  ? "pointer"
                  : "default",
                bgcolor: row.isHighlighted
                  ? "#fff7cc"
                  : "transparent",
                "&:hover": {
                  bgcolor: row.isHighlighted
                    ? "#fff1a8"
                    : row.hoverBg
                      || "#fafafa",
                },
              }}
            >
              {row.isUnreadNotification ? (
                <Box
                  component="span"
                  aria-label="未讀項目"
                  sx={{
                    position: "absolute",
                    top: "6px",
                    left: "6px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    bgcolor: "#ef4444",
                    zIndex: 1,
                  }}
                />
              ) : null}

              {columns.map((column) => (
                <Box
                  key={column.key}
                  sx={{
                    minWidth: 0,
                    px: "12px",
                    py: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      column.align === "center"
                        ? "center"
                        : "flex-start",
                  }}
                >
                  {renderCell(
                    column,
                    row,
                    false,
                  )}
                </Box>
              ))}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export default function InternalModule({
  title,
  accentColor,
  sidebarTitle,
  sidebarItems,
  actionButtons = [],
  toolbarContent = null,
  columns,
  rows,
  emptyText = "查無資料",
  defaultSidebarKey,
  activeSidebarKey,
  onSidebarChange,
  rowsVersion,
}) {
  const location = useLocation();

  const storageKey = useMemo(
    () => `internal-module-active:${location.pathname}`,
    [location.pathname],
  );

  const fallbackKey =
    defaultSidebarKey ||
    sidebarItems?.[0]?.key ||
    sidebarItems?.[0]?.label ||
    "";

  const getSavedActiveKey = () => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      const valid = sidebarItems?.some((item) => item.key === saved);

      return valid ? saved : fallbackKey;
    } catch {
      return fallbackKey;
    }
  };

  const [internalActiveKey, setInternalActiveKey] = useState(getSavedActiveKey);
  const activeKey = activeSidebarKey ?? internalActiveKey;

  const handleSidebarChange = (nextKey) => {
    setInternalActiveKey(nextKey);

    if (typeof onSidebarChange === "function") {
      onSidebarChange(nextKey);
    }
  };

  const [rowStateMap, setRowStateMap] = useState({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPayload, setDetailPayload] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const valid = sidebarItems?.some((item) => item.key === activeKey);
    if (!valid) {
      handleSidebarChange(fallbackKey);
    }
  }, [activeKey, fallbackKey, sidebarItems]);

  useEffect(() => {
    const savedKey = getSavedActiveKey();

    if (savedKey && savedKey !== activeKey) {
      setInternalActiveKey(savedKey);

      if (typeof onSidebarChange === "function") {
        onSidebarChange(savedKey);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, activeKey);
    } catch {
      //
    }
  }, [activeKey, storageKey]);

  const activeItem = useMemo(() => {
    return (
      sidebarItems.find((item) => item.key === activeKey) ||
      sidebarItems[0] || {
        columns,
        rows,
        emptyText,
      }
    );
  }, [sidebarItems, activeKey, columns, rows, emptyText]);

  const currentColumns = activeItem.columns || columns;
  const currentEmptyText = activeItem.emptyText || emptyText;

  const sourceRows = useMemo(
    () => activeItem.rows || rows || [],
    [activeItem.rows, rows],
  );

  const stateMapKey = activeKey;

  useEffect(() => {
    setRowStateMap((prev) => ({
      ...prev,
      [stateMapKey]: sourceRows.map((row) => ({ ...row })),
    }));
  }, [sourceRows, stateMapKey, rowsVersion]);

  const currentRows = rowStateMap[stateMapKey] || sourceRows;
  const totalRows = currentRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / DEFAULT_ROWS_PER_PAGE));
  const currentPage = 1;

  const handleToggleCheckbox = (rowId, key) => {
    setRowStateMap((prev) => ({
      ...prev,
      [stateMapKey]: (prev[stateMapKey] || sourceRows).map((row) =>
        row.id === rowId ? { ...row, [key]: !row[key] } : row,
      ),
    }));
  };

  const handleDeleteRow = (rowId) => {
    setDeleteTarget(rowId);
  };

  const confirmDelete = () => {
    if (deleteTarget == null) return;

    setRowStateMap((prev) => ({
      ...prev,
      [stateMapKey]: (prev[stateMapKey] || sourceRows).filter(
        (row) => row.id !== deleteTarget,
      ),
    }));

    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleOpenDetail = (row) => {
    if (!row.detailDialog) return;
    setDetailPayload(row.detailDialog);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
  };

  return (
    <Box>
      <Breadcrumb rootLabel="首頁" currentLabel={title} mb="14px" />
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
          mb: "18px",
        }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            lg: "row",
          },
          alignItems: "flex-start",
          gap: {
            xs: "16px",
            lg: "20px",
          },
        }}
      >
        <Box
          sx={{
            width: {
              xs: "100%",
              lg: "auto",
            },
            flexShrink: 0,
            mt: {
              xs: 0,
              lg: "46px",
            },
          }}
        >
          <SidebarMenu
            accentColor={accentColor}
            title={sidebarTitle}
            items={sidebarItems}
            activeKey={activeKey}
            onChange={handleSidebarChange}
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
              display: "flex",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              justifyContent: toolbarContent
                ? "space-between"
                : "flex-end",
              alignItems: {
                xs: "stretch",
                sm: "center",
              },
              gap: "10px",
              mb: "12px",
              minHeight: "34px",
              flexWrap: "wrap",
            }}
          >
            {toolbarContent ? (
              <Box
                sx={{
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                }}
              >
                {toolbarContent}
              </Box>
            ) : (
              <Box />
            )}

            <Box
              sx={{
                width: {
                  xs: "100%",
                  sm: "auto",
                },
                display: "flex",
                alignItems: "center",
                justifyContent: {
                  xs: "stretch",
                  sm: "flex-end",
                },
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {actionButtons.map((button) => (
                <Button
                  key={button.label}
                  variant="outlined"
                  onClick={button.onClick}
                  sx={{
                    flex: {
                      xs: "1 1 140px",
                      sm: "0 0 auto",
                    },
                    minWidth: {
                      xs: 0,
                      sm: button.minWidth || "98px",
                    },
                    height: "34px",
                    px: "14px",
                    borderColor: "#c5c5c5",
                    color: "#333333",
                    fontSize: "15px",
                    bgcolor: "#ffffff",
                    whiteSpace: "nowrap",
                  }}
                >
                  {button.label}
                </Button>
              ))}
            </Box>
          </Box>

          <DataTable
            columns={currentColumns}
            rows={currentRows}
            emptyText={currentEmptyText}
            onToggleCheckbox={handleToggleCheckbox}
            onDeleteRow={handleDeleteRow}
            onOpenDetail={handleOpenDetail}
          />

          <PaginationBar
            totalRows={totalRows}
            currentPage={currentPage}
            totalPages={totalPages}
            onFirst={() => {}}
            onPrev={() => {}}
            onNext={() => {}}
            onLast={() => {}}
          />
        </Box>
      </Box>

      <InternalActionDialog
        open={detailOpen}
        title={detailPayload?.dialogTitle}
        content={detailPayload}
        onClose={handleCloseDetail}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
