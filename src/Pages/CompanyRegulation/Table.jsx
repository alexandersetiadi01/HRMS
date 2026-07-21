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

  const mobileIndent = Math.min(level, 3) * 12;
  const tabletIndent = Math.min(level, 4) * 18;

  if (node.type === "group") {
    const group = node.data || {};
    const groupId =
      group.id || group.groupId || group.rule_group_id;

    const folderOpen =
      openGroupIds?.[groupId] !== false;

    const childNodes = getChildNodes(group);

    return (
      <Box key={`mobile-group-${groupId}`}>
        <Box
          onClick={() => onToggleGroup(groupId)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minWidth: 0,
            gap: {
              xs: "8px",
              sm: "12px",
            },
            pl: {
              xs: `${10 + mobileIndent}px`,
              sm: `${14 + tabletIndent}px`,
            },
            pr: {
              xs: "10px",
              sm: "14px",
            },
            py: {
              xs: "11px",
              sm: "14px",
            },
            cursor: "pointer",
            borderBottom: "1px solid #e5e7eb",
            bgcolor:
              level === 0 ? "#f8fafc" : "#ffffff",
            "&:hover": {
              bgcolor: "#f0f9ff",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              minWidth: 0,
              gap: {
                xs: "8px",
                sm: "10px",
              },
            }}
          >
            <FolderIcon
              sx={{
                fontSize: {
                  xs: "23px",
                  sm: "28px",
                },
                color: "#1f94d2",
                flexShrink: 0,
              }}
            />

            <Typography
              sx={{
                minWidth: 0,
                fontSize: {
                  xs: "14px",
                  sm: "15px",
                },
                fontWeight: level === 0 ? 700 : 600,
                color: "#333333",
                lineHeight: 1.5,
                whiteSpace: "normal",
                overflowWrap: "anywhere",
              }}
            >
              {formatValue(
                group.name || group.group_name,
              )}
            </Typography>
          </Box>

          <ChevronRightIcon
            sx={{
              fontSize: {
                xs: "22px",
                sm: "24px",
              },
              color: "#94a3b8",
              transform: folderOpen
                ? "rotate(90deg)"
                : "rotate(0deg)",
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
          />
        </Box>

        {folderOpen ? (
          <Box>
            {childNodes.length === 0 ? (
              <Typography
                sx={{
                  pl: {
                    xs: `${42 + mobileIndent}px`,
                    sm: `${56 + tabletIndent}px`,
                  },
                  pr: {
                    xs: "10px",
                    sm: "14px",
                  },
                  py: {
                    xs: "10px",
                    sm: "12px",
                  },
                  borderBottom:
                    "1px solid #ececec",
                  fontSize: {
                    xs: "13px",
                    sm: "14px",
                  },
                  color: "#94a3b8",
                }}
              >
                此資料夾尚無資料
              </Typography>
            ) : (
              childNodes.map(
                (childNode, index) => (
                  <MobileNode
                    key={getNodeKey(
                      childNode,
                      `${groupId}-${index}`,
                    )}
                    node={childNode}
                    level={level + 1}
                    openGroupIds={openGroupIds}
                    onToggleGroup={onToggleGroup}
                    onOpenItem={onOpenItem}
                  />
                ),
              )
            )}
          </Box>
        ) : null}
      </Box>
    );
  }

  const item = node.data || {};
  const ruleId =
    item.id || item.ruleId || item.rule_id;

  return (
    <Box
      key={`mobile-rule-${ruleId}`}
      onClick={() => onOpenItem(item)}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        minWidth: 0,
        gap: {
          xs: "9px",
          sm: "12px",
        },
        pl: {
          xs: `${22 + mobileIndent}px`,
          sm: `${30 + tabletIndent}px`,
        },
        pr: {
          xs: "10px",
          sm: "14px",
        },
        py: {
          xs: "13px",
          sm: "16px",
        },
        cursor: "pointer",
        borderBottom: "1px solid #ececec",
        bgcolor: "#ffffff",
        "&:hover": {
          bgcolor: "#f8fafc",
        },
      }}
    >
      <DescriptionIcon
        sx={{
          mt: "1px",
          fontSize: {
            xs: "21px",
            sm: "24px",
          },
          color: "#49b7ea",
          flexShrink: 0,
        }}
      />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            minWidth: 0,
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
            fontWeight: 500,
            color: "#222222",
            lineHeight: 1.55,
            whiteSpace: "normal",
            overflowWrap: "anywhere",
          }}
        >
          {formatValue(item.title)}
        </Typography>

        <Typography
          sx={{
            mt: "4px",
            display: {
              xs: "none",
              sm: "block",
            },
            fontSize: "13px",
            color: "#64748b",
            lineHeight: 1.5,
            overflowWrap: "anywhere",
          }}
        >
          負責單位：
          {getRuleValue(item, [
            "ownerUnit",
            "responsible_unit",
          ])}
          {"　"}文件編號：
          {getRuleValue(item, [
            "fileCode",
            "rule_code",
          ])}
        </Typography>
      </Box>

      <LaunchIcon
        sx={{
          mt: "2px",
          fontSize: {
            xs: "18px",
            sm: "20px",
          },
          color: "#94a3b8",
          flexShrink: 0,
        }}
      />
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
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        bgcolor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: {
          xs: "6px",
          sm: "8px",
        },
        overflow: "hidden",
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
      ) : rows.length === 0 ? (
        <Box
          sx={{
            minHeight: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: "12px",
          }}
        >
          <Typography
            sx={{
              fontSize: {
                xs: "14px",
                sm: "15px",
              },
              color: "#666666",
              textAlign: "center",
            }}
          >
            尚無資料可顯示
          </Typography>
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