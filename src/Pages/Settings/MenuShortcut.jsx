import { useMemo, useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import { Navigate, useNavigate } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Breadcrumb from "../../Utils/Breadcrumb";
import {
  getMenuItemsByIds,
  getMobileDrawerCandidates,
  renderMenuIcon,
} from "../../Utils/Menu/MenuRegistry";
import {
  loadMobileDrawerShortcutIds,
  saveMobileDrawerShortcutIds,
} from "../../Utils/Menu/MobileShortcutSettings";

function moveItem(array, fromIndex, toIndex) {
  const newArray = [...array];
  const [moved] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, moved);
  return newArray;
}

function RowContent({
  item,
  isEnabled,
  enabledIndex,
  enabledLength,
  onToggle,
  onMove,
  dragHandleProps,
  isDragging = false,
}) {
  return (
    <Box
      sx={{
        px: "12px",
        minHeight: "88px",
        display: "grid",
        gridTemplateColumns: "54px minmax(0, 1fr) auto auto",
        alignItems: "center",
        columnGap: "10px",
        bgcolor: isDragging ? "#f8fbff" : "#ffffff",
      }}
    >
      <Box
        sx={{
          width: "44px",
          height: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: isEnabled ? 1 : 0.75,
        }}
      >
        {renderMenuIcon(item.iconKey, {
          size: 38,
          color: "#1098dc",
        })}
      </Box>

      <Typography
        sx={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#1f2937",
          lineHeight: 1.3,
          minWidth: 0,
          wordBreak: "break-word",
          opacity: isEnabled ? 1 : 0.9,
        }}
      >
        {item.label}
      </Typography>

      <Switch
        checked={isEnabled}
        onChange={() => onToggle(item.id)}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        sx={{
          mr: "2px",
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "#ffffff",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            bgcolor: "#1098dc",
            opacity: 1,
          },
          "& .MuiSwitch-track": {
            bgcolor: "#bdbdbd",
            opacity: 1,
          },
        }}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          color: isEnabled ? "#b7bcc5" : "#d6dbe1",
        }}
      >
        <IconButton
          size="small"
          disabled={!isEnabled || enabledIndex <= 0}
          onClick={() => onMove(item.id, "up")}
          sx={{ color: "inherit" }}
        >
          <KeyboardArrowUpRoundedIcon />
        </IconButton>

        <IconButton
          size="small"
          disabled={
            !isEnabled ||
            enabledIndex === -1 ||
            enabledIndex >= enabledLength - 1
          }
          onClick={() => onMove(item.id, "down")}
          sx={{ color: "inherit" }}
        >
          <KeyboardArrowDownRoundedIcon />
        </IconButton>

        <IconButton
          size="small"
          disabled={!isEnabled}
          sx={{
            color: "inherit",
            touchAction: "none",
            cursor: isEnabled ? "grab" : "default",
            "&:active": {
              cursor: isEnabled ? "grabbing" : "default",
            },
          }}
          {...(dragHandleProps || {})}
        >
          <DragIndicatorRoundedIcon sx={{ fontSize: "24px" }} />
        </IconButton>
      </Box>
    </Box>
  );
}

function SortableActiveRow({
  item,
  enabledIndex,
  enabledLength,
  onToggle,
  onMove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.75 : 1,
      }}
    >
      <RowContent
        item={item}
        isEnabled
        enabledIndex={enabledIndex}
        enabledLength={enabledLength}
        onToggle={onToggle}
        onMove={onMove}
        isDragging={isDragging}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </Box>
  );
}

function InactiveRow({ item, onToggle }) {
  return (
    <RowContent
      item={item}
      isEnabled={false}
      enabledIndex={-1}
      enabledLength={0}
      onToggle={onToggle}
      onMove={() => {}}
      dragHandleProps={null}
    />
  );
}

export default function MenuShortcutsPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const [enabledIds, setEnabledIds] = useState(loadMobileDrawerShortcutIds());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    })
  );

  const candidates = useMemo(() => getMobileDrawerCandidates(), []);
  const enabledSet = useMemo(() => new Set(enabledIds), [enabledIds]);

  const enabledItems = useMemo(() => getMenuItemsByIds(enabledIds), [enabledIds]);

  const disabledItems = useMemo(() => {
    return candidates.filter((item) => !enabledSet.has(item.id));
  }, [candidates, enabledSet]);

  if (isDesktop) {
    return <Navigate to="/" replace />;
  }

  const updateEnabledIds = (nextIds) => {
    setEnabledIds(nextIds);
    saveMobileDrawerShortcutIds(nextIds);
  };

  const handleToggle = (id) => {
    if (enabledSet.has(id)) {
      updateEnabledIds(enabledIds.filter((itemId) => itemId !== id));
      return;
    }

    updateEnabledIds([...enabledIds, id]);
  };

  const handleMove = (id, direction) => {
    const index = enabledIds.indexOf(id);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      updateEnabledIds(moveItem(enabledIds, index, index - 1));
    }

    if (direction === "down" && index < enabledIds.length - 1) {
      updateEnabledIds(moveItem(enabledIds, index, index + 1));
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = enabledIds.indexOf(active.id);
    const newIndex = enabledIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    updateEnabledIds(arrayMove(enabledIds, oldIndex, newIndex));
  };

  return (
    <Box>
      <Breadcrumb
        rootLabel="設定"
        rootTo="/settings"
        currentLabel="選單設置"
        mb="10px"
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          mb: "14px",
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{
            ml: "-8px",
            color: "#b2b7c1",
          }}
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: "20px" }} />
        </IconButton>

        <Typography
          sx={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          選單設置
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={enabledIds}
            strategy={verticalListSortingStrategy}
          >
            {enabledItems.map((item, index) => (
              <Box key={item.id}>
                <SortableActiveRow
                  item={item}
                  enabledIndex={index}
                  enabledLength={enabledIds.length}
                  onToggle={handleToggle}
                  onMove={handleMove}
                />
                <Divider />
              </Box>
            ))}
          </SortableContext>
        </DndContext>

        {disabledItems.map((item, index) => (
          <Box key={item.id}>
            <InactiveRow item={item} onToggle={handleToggle} />
            {index !== disabledItems.length - 1 && <Divider />}
          </Box>
        ))}
      </Box>
    </Box>
  );
}