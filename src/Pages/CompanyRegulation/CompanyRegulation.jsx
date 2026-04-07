import { useMemo, useState } from "react";
import {
  Box,
  Button,
  InputBase,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { REGULATION_ITEMS } from "./data";
import RegulationDialog from "./RegulationDialog";
import { DesktopTable, MobileList } from "./Table";

export default function CompanyRegulations() {
  const [keyword, setKeyword] = useState("");
  const [folderOpen, setFolderOpen] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const key = keyword.trim();
    if (!key) return REGULATION_ITEMS;

    return REGULATION_ITEMS.filter((item) => {
      const text = `${item.title} ${item.fileCode} ${item.folder}`;
      return text.includes(key);
    });
  }, [keyword]);

  const handleOpenDialog = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <Box>
      <Typography
        sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: "#111827",
          mb: "18px",
        }}
      >
        公司規章
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "10px",
          mb: "14px",
          flexWrap: "wrap",
        }}
      >
        <InputBase
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="請輸入關鍵字"
          sx={{
            width: { xs: "100%", sm: "260px", md: "202px" },
            height: "30px",
            px: "8px",
            border: "1px solid #cfcfcf",
            bgcolor: "#ffffff",
            fontSize: "14px",
            color: "#333333",
          }}
        />

        <Button
          variant="outlined"
          startIcon={
            <SearchIcon sx={{ display: { xs: "inline-flex", md: "none" } }} />
          }
          sx={{
            minWidth: "54px",
            height: "30px",
            px: "16px",
            borderColor: "#c3c3c3",
            color: "#333333",
            fontSize: "15px",
            bgcolor: "#ffffff",
          }}
        >
          搜尋
        </Button>
      </Box>

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DesktopTable
          folderOpen={folderOpen}
          onToggleFolder={() => setFolderOpen((prev) => !prev)}
          rows={filteredItems}
          onOpenItem={handleOpenDialog}
        />
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MobileList
          folderOpen={folderOpen}
          onToggleFolder={() => setFolderOpen((prev) => !prev)}
          rows={filteredItems}
          onOpenItem={handleOpenDialog}
        />
      </Box>

      <RegulationDialog
        open={dialogOpen}
        item={selectedItem}
        onClose={handleCloseDialog}
      />
    </Box>
  );
}
