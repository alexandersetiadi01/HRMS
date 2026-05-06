import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from "@mui/icons-material/Launch";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

function formatValue(value) {
  return value || "--";
}

function getNodeKey(node, fallback = "") {
  return `${node?.type || "node"}-${
    node?.data?.id ||
    node?.data?.groupId ||
    node?.data?.ruleId ||
    node?.data?.rule_id ||
    fallback
  }`;
}

function getRuleValue(item, keys = []) {
  for (const key of keys) {
    if (item?.[key]) return item[key];
  }

  return "--";
}

function getChildNodes(group = {}) {
  const childGroups = Array.isArray(group.children)
    ? group.children.map((child) => ({
        type: "group",
        data: child,
      }))
    : [];

  const childRules = Array.isArray(group.rules)
    ? group.rules.map((rule) => ({
        type: "rule",
        data: rule,
      }))
    : [];

  return [...childGroups, ...childRules];
}

function DesktopNode({
  node,
  level = 0,
  openGroupIds,
  onToggleGroup,
  onOpenItem,
}) {
  if (!node) return null;

  if (node.type === "group") {
    const group = node.data || {};
    const groupId = group.id || group.groupId || group.rule_group_id;
    const folderOpen = openGroupIds?.[groupId] !== false;
    const childNodes = getChildNodes(group);

    return (
      <Box key={`desktop-group-${groupId}`}>
        <Box
          onClick={() => onToggleGroup(groupId)}
          sx={{
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            cursor: "pointer",
            color: "#333333",
            pl: `${level * 22}px`,
          }}
        >
          {folderOpen ? (
            <ExpandMoreIcon sx={{ fontSize: "18px", color: "#8d8d8d" }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: "18px", color: "#8d8d8d" }} />
          )}

          <FolderIcon sx={{ fontSize: "20px", color: "#8d8d8d" }} />

          <Typography
            sx={{
              fontSize: "15px",
              fontWeight: 700,
              wordBreak: "break-word",
              whiteSpace: "normal",
            }}
          >
            {formatValue(group.name || group.group_name)}
          </Typography>
        </Box>

        {folderOpen ? (
          <Box sx={{ pt: "8px" }}>
            {childNodes.map((childNode, index) => (
              <DesktopNode
                key={getNodeKey(childNode, `${groupId}-${index}`)}
                node={childNode}
                level={level + 1}
                openGroupIds={openGroupIds}
                onToggleGroup={onToggleGroup}
                onOpenItem={onOpenItem}
              />
            ))}
          </Box>
        ) : null}
      </Box>
    );
  }

  const item = node.data || {};
  const ruleId = item.id || item.ruleId || item.rule_id;

  return (
    <Box
      key={`desktop-rule-${ruleId}`}
      sx={{
        display: "grid",
        gridTemplateColumns: "38% 15% 12% 11% 10% 10% 4%",
        minHeight: "54px",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          minWidth: 0,
          pl: `${22 + level * 22}px`,
          pr: "8px",
        }}
      >
        <DescriptionIcon sx={{ fontSize: "18px", color: "#9a9a9a" }} />

        <Typography
          onClick={() => onOpenItem(item)}
          sx={{
            fontSize: "15px",
            color: "#222222",
            cursor: "pointer",
            wordBreak: "break-word",
            whiteSpace: "normal",
            lineHeight: 1.5,
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          {formatValue(item.title)}
        </Typography>
      </Box>

      <Typography sx={{ fontSize: "15px", color: "#333333", wordBreak: "break-word" }}>
        {getRuleValue(item, ["ownerUnit", "responsible_unit"])}
      </Typography>

      <Typography sx={{ fontSize: "15px", color: "#333333", wordBreak: "break-word" }}>
        {getRuleValue(item, ["contactPerson", "contact_person"])}
      </Typography>

      <Typography sx={{ fontSize: "15px", color: "#333333", wordBreak: "break-word" }}>
        {getRuleValue(item, ["publishTime", "publishDate", "published_at"])}
      </Typography>

      <Typography sx={{ fontSize: "15px", color: "#333333", wordBreak: "break-word" }}>
        {getRuleValue(item, ["revisedDate", "revised_at"])}
      </Typography>

      <Typography sx={{ fontSize: "15px", color: "#333333", wordBreak: "break-word" }}>
        {getRuleValue(item, ["fileCode", "rule_code"])}
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
  );
}

export function DesktopTable({
  rows = [],
  loading = false,
  openGroupIds = {},
  onToggleGroup,
  onOpenItem,
}) {
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
        {["公司規章", "負責單位", "聯絡人", "發佈時間", "修訂日期", "文件編號", "檔案"].map(
          (label) => (
            <Typography
              key={label}
              sx={{ fontSize: "15px", fontWeight: 700, color: "#333333" }}
            >
              {label}
            </Typography>
          ),
        )}
      </Box>

      <Box sx={{ px: "20px", pt: "10px" }}>
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
        ) : rows.length === 0 ? (
          <Box
            sx={{
              minHeight: "180px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              color: "#666666",
            }}
          >
            尚無資料可顯示
          </Box>
        ) : (
          rows.map((node, index) => (
            <DesktopNode
              key={getNodeKey(node, index)}
              node={node}
              openGroupIds={openGroupIds}
              onToggleGroup={onToggleGroup}
              onOpenItem={onOpenItem}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

function MobileNode({
  node,
  level = 0,
  openGroupIds,
  onToggleGroup,
  onOpenItem,
}) {
  if (!node) return null;

  if (node.type === "group") {
    const group = node.data || {};
    const groupId = group.id || group.groupId || group.rule_group_id;
    const folderOpen = openGroupIds?.[groupId] !== false;
    const childNodes = getChildNodes(group);

    return (
      <Box key={`mobile-group-${groupId}`}>
        <Box
          onClick={() => onToggleGroup(groupId)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            px: "16px",
            py: "14px",
            ml: `${level * 18}px`,
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
                wordBreak: "break-word",
                whiteSpace: "normal",
              }}
            >
              {formatValue(group.name || group.group_name)}
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
          <Box>
            {childNodes.map((childNode, index) => (
              <MobileNode
                key={getNodeKey(childNode, `${groupId}-${index}`)}
                node={childNode}
                level={level + 1}
                openGroupIds={openGroupIds}
                onToggleGroup={onToggleGroup}
                onOpenItem={onOpenItem}
              />
            ))}
          </Box>
        ) : null}
      </Box>
    );
  }

  const item = node.data || {};
  const ruleId = item.id || item.ruleId || item.rule_id;

  return (
    <Box
      key={`mobile-rule-${ruleId}`}
      onClick={() => onOpenItem(item)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        px: "10px",
        py: "18px",
        ml: `${22 + level * 18}px`,
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
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {formatValue(item.title)}
      </Typography>
    </Box>
  );
}

export function MobileList({
  rows = [],
  loading = false,
  openGroupIds = {},
  onToggleGroup,
  onOpenItem,
}) {
  return (
    <Box sx={{ bgcolor: "#ffffff" }}>
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
      ) : rows.length === 0 ? (
        <Box
          sx={{
            minHeight: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "15px",
            color: "#666666",
          }}
        >
          尚無資料可顯示
        </Box>
      ) : (
        rows.map((node, index) => (
          <MobileNode
            key={getNodeKey(node, index)}
            node={node}
            openGroupIds={openGroupIds}
            onToggleGroup={onToggleGroup}
            onOpenItem={onOpenItem}
          />
        ))
      )}
    </Box>
  );
}