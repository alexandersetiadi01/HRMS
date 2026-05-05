import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
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
  const displayFrom =
    totalRows === 0 ? 0 : (currentPage - 1) * DEFAULT_ROWS_PER_PAGE + 1;
  const displayTo =
    totalRows === 0
      ? 0
      : Math.min(currentPage * DEFAULT_ROWS_PER_PAGE, totalRows);

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
          disabled={currentPage === 1}
          onClick={onFirst}
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
            borderColor: "#d9d9d9",
            color: currentPage === 1 ? "#c8c8c8" : "#8a8a8a",
          }}
        >
          <KeyboardDoubleArrowLeftIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled={currentPage === 1}
          onClick={onPrev}
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
            borderColor: "#d9d9d9",
            color: currentPage === 1 ? "#c8c8c8" : "#8a8a8a",
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
          頁，共 {totalPages} 頁
        </Typography>

        <Button
          variant="outlined"
          disabled={currentPage === totalPages}
          onClick={onNext}
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
            borderColor: "#d9d9d9",
            color: currentPage === totalPages ? "#c8c8c8" : "#8a8a8a",
          }}
        >
          <KeyboardArrowRightIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled={currentPage === totalPages}
          onClick={onLast}
          sx={{
            minWidth: "24px",
            width: "24px",
            height: "24px",
            p: 0,
            borderColor: "#d9d9d9",
            color: currentPage === totalPages ? "#c8c8c8" : "#8a8a8a",
          }}
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

function SidebarMenu({ accentColor, title, items, activeKey, onChange }) {
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

      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <Box
            key={item.key}
            onClick={() => onChange(item.key)}
            sx={{
              minHeight: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: "12px",
              borderBottom: "1px solid #e5e5e5",
              color: isActive ? accentColor : "#c9c9c9",
              fontWeight: isActive ? 700 : 500,
              fontSize: "15px",
              textAlign: "center",
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
  return (
    <Box
      sx={{
        border: "1px solid #d3d3d3",
        bgcolor: "#ffffff",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: columns
            .map((item) => item.width || "1fr")
            .join(" "),
          minHeight: "38px",
          alignItems: "center",
          background: "linear-gradient(to bottom, #f7f7f7, #dddddd)",
          borderBottom: "1px solid #d3d3d3",
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
              borderRight: column.withDivider ? "1px solid #d3d3d3" : "none",
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
              {column.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {rows.length === 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: columns
              .map((item) => item.width || "1fr")
              .join(" "),
            minHeight: "36px",
            alignItems: "center",
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
              }}
            >
              {emptyText}
            </Typography>
          </Box>

          {columns.slice(1).map((col) => (
            <Box key={col.key} />
          ))}
        </Box>
      ) : (
        rows.map((row, rowIndex) => (
          <Box
            key={row.id || rowIndex}
            onClick={row.onRowClick || undefined}
            sx={{
              display: "grid",
              gridTemplateColumns: columns
                .map((item) => item.width || "1fr")
                .join(" "),
              minHeight: "50px",
              alignItems: "center",
              borderBottom:
                rowIndex === rows.length - 1 ? "none" : "1px solid #d3d3d3",
              transition: "background-color 0.2s ease",
              cursor: row.onRowClick ? "pointer" : "default",
              "&:hover": {
                bgcolor: row.hoverBg || "#fafafa",
              },
            }}
          >
            {columns.map((column) => (
              <Box
                key={column.key}
                sx={{
                  px: "12px",
                  py: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    column.align === "center" ? "center" : "flex-start",
                }}
              >
                {column.type ? (
                  renderSpecialCell(column, row, {
                    onToggleCheckbox,
                    onDeleteRow,
                    onOpenDetail,
                  })
                ) : (
                  <DefaultCell
                    value={row[column.key]}
                    align={column.align || "left"}
                    wrap={column.wrap !== false}
                    sx={column.cellSx || {}}
                  />
                )}
              </Box>
            ))}
          </Box>
        ))
      )}
    </Box>
  );
}

export default function InternalModule({
  title,
  accentColor,
  sidebarTitle,
  sidebarItems,
  actionButtons = [],
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

  const restoreKey = useMemo(
    () => `internal-module-restore:${location.pathname}`,
    [location.pathname],
  );

  const fallbackKey =
    defaultSidebarKey ||
    sidebarItems?.[0]?.key ||
    sidebarItems?.[0]?.label ||
    "";

  const [internalActiveKey, setInternalActiveKey] = useState(() => {
    try {
      const shouldRestore = window.sessionStorage.getItem(restoreKey) === "1";

      if (shouldRestore) {
        const saved = window.sessionStorage.getItem(storageKey);
        const valid = sidebarItems?.some((item) => item.key === saved);
        return valid ? saved : fallbackKey;
      }

      return fallbackKey;
    } catch {
      return fallbackKey;
    }
  });
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
    try {
      window.sessionStorage.setItem(storageKey, activeKey);
    } catch {
      //
    }
  }, [activeKey, storageKey]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        window.sessionStorage.setItem(restoreKey, "1");
      } catch {
        //
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [restoreKey]);

  useEffect(() => {
    return () => {
      try {
        window.sessionStorage.removeItem(restoreKey);
      } catch {
        //
      }
    };
  }, [location.pathname, restoreKey]);

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
          alignItems: "flex-start",
          gap: "20px",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            mt: "46px",
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

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              mb: "12px",
              minHeight: "34px",
            }}
          >
            {actionButtons.map((button) => (
              <Button
                key={button.label}
                variant="outlined"
                onClick={button.onClick}
                sx={{
                  minWidth: button.minWidth || "98px",
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
