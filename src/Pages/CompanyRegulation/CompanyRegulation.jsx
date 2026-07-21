import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputBase,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RegulationDialog from "./RegulationDialog";
import { DesktopTable, MobileList } from "./Table";
import Breadcrumb from "../../Utils/Breadcrumb";
import {
  fetchCompanyRuleDetail,
  fetchCompanyRules,
} from "../../API/companyRule";

export default function CompanyRegulations() {
  const [keyword, setKeyword] = useState("");
  const [searchText, setSearchText] = useState("");
  const [treeRows, setTreeRows] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openGroupIds, setOpenGroupIds] = useState({});
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const hasRows = useMemo(() => {
    return Array.isArray(treeRows) && treeRows.length > 0;
  }, [treeRows]);

  const loadCompanyRules = async (params = {}) => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchCompanyRules(params);
      const nextTree = Array.isArray(result.tree) ? result.tree : [];

      setTreeRows(nextTree);

      const defaultOpenState = {};

      nextTree.forEach((node) => {
        if (node?.type === "group" && node?.data?.id) {
          defaultOpenState[node.data.id] = true;
        }
      });

      setOpenGroupIds(defaultOpenState);
    } catch (err) {
      setError(err?.response?.data?.message || "公司規章資料讀取失敗。");
      setTreeRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyRules();
  }, []);

  const handleSearch = () => {
    const nextSearchText = keyword.trim();
    setSearchText(nextSearchText);
    loadCompanyRules({ s: nextSearchText });
  };

  const handleKeywordKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleToggleGroup = (groupId) => {
    setOpenGroupIds((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleOpenDialog = async (item) => {
    const ruleId = item?.ruleId || item?.id;

    if (!ruleId) return;

    setDetailLoading(true);
    setDialogOpen(true);
    setSelectedItem(item);

    try {
      const detail = await fetchCompanyRuleDetail(ruleId);
      setSelectedItem(detail || item);
    } catch (err) {
      setError(err?.response?.data?.message || "公司規章內容讀取失敗。");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setDetailLoading(false);
  };

  return (
    <Box>
      <Breadcrumb rootLabel="首頁" currentLabel="公司規章" mb="14px" />

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
        公司規章
      </Typography>

      {error ? (
        <Alert
          severity="error"
          sx={{
            mb: "14px",
            "& .MuiAlert-message": {
              minWidth: 0,
              fontSize: {
                xs: "14px",
                sm: "15px",
              },
              overflowWrap: "anywhere",
            },
          }}
        >
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          justifyContent: "flex-end",
          alignItems: "center",
          gridTemplateColumns: {
            xs: searchText ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)",
            sm: searchText ? "minmax(0, 1fr) auto auto" : "minmax(0, 1fr) auto",
            md: searchText ? "202px auto auto" : "202px auto",
          },
          gap: {
            xs: "8px",
            sm: "10px",
          },
          mb: "14px",
          ml: {
            xs: 0,
            sm: "auto",
          },
          width: {
            xs: "100%",
            sm: "min(100%, 560px)",
            md: "auto",
          },
        }}
      >
        <InputBase
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={handleKeywordKeyDown}
          placeholder="請輸入關鍵字"
          sx={{
            gridColumn: {
              xs: "1 / -1",
              sm: "auto",
            },
            width: "100%",
            height: {
              xs: "38px",
              sm: "34px",
              md: "30px",
            },
            px: {
              xs: "10px",
              md: "8px",
            },
            border: "1px solid #cfcfcf",
            bgcolor: "#ffffff",
            fontSize: {
              xs: "14px",
              sm: "15px",
              md: "14px",
            },
            color: "#333333",
          }}
        />

        <Button
          variant="outlined"
          startIcon={
            <SearchIcon
              sx={{
                display: {
                  xs: "inline-flex",
                  md: "none",
                },
              }}
            />
          }
          onClick={handleSearch}
          disabled={loading}
          sx={{
            minWidth: 0,
            width: "100%",
            height: {
              xs: "38px",
              sm: "34px",
              md: "30px",
            },
            px: {
              xs: "10px",
              sm: "16px",
            },
            borderColor: "#c3c3c3",
            color: "#333333",
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
            bgcolor: "#ffffff",
          }}
        >
          搜尋
        </Button>

        {searchText ? (
          <Button
            variant="outlined"
            onClick={() => {
              setKeyword("");
              setSearchText("");
              loadCompanyRules();
            }}
            disabled={loading}
            sx={{
              minWidth: 0,
              width: "100%",
              height: {
                xs: "38px",
                sm: "34px",
                md: "30px",
              },
              px: {
                xs: "10px",
                sm: "16px",
              },
              borderColor: "#c3c3c3",
              color: "#333333",
              fontSize: {
                xs: "14px",
                sm: "15px",
              },
              bgcolor: "#ffffff",
            }}
          >
            清除
          </Button>
        ) : null}
      </Box>

      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <DesktopTable
          rows={treeRows}
          loading={loading}
          openGroupIds={openGroupIds}
          onToggleGroup={handleToggleGroup}
          onOpenItem={handleOpenDialog}
        />
      </Box>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <MobileList
          rows={treeRows}
          loading={loading}
          openGroupIds={openGroupIds}
          onToggleGroup={handleToggleGroup}
          onOpenItem={handleOpenDialog}
        />
      </Box>

      <RegulationDialog
        open={dialogOpen}
        item={selectedItem}
        loading={detailLoading}
        onClose={handleCloseDialog}
      />
    </Box>
  );
}
