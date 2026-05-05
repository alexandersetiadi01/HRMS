import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

export default function RecipientSelectDialog({
  open,
  employees = [],
  selectedRecipients = [],
  onClose,
  onConfirm,
  getEmployeeLabel,
}) {
  const [keyword, setKeyword] = useState("");
  const [leftSelectedIds, setLeftSelectedIds] = useState([]);
  const [rightSelectedIds, setRightSelectedIds] = useState([]);
  const [draftSelected, setDraftSelected] = useState([]);

  useEffect(() => {
    if (open) {
      setKeyword("");
      setLeftSelectedIds([]);
      setRightSelectedIds([]);
      setDraftSelected(selectedRecipients || []);
    }
  }, [open, selectedRecipients]);

  const selectedIdSet = useMemo(() => {
    return new Set(draftSelected.map((item) => Number(item.employee_id)));
  }, [draftSelected]);

  const availableEmployees = useMemo(() => {
    const searchText = keyword.trim().toLowerCase();

    return employees.filter((employee) => {
      const employeeId = Number(employee.employee_id);

      if (selectedIdSet.has(employeeId)) return false;
      if (!searchText) return true;

      return getEmployeeLabel(employee).toLowerCase().includes(searchText);
    });
  }, [employees, selectedIdSet, keyword, getEmployeeLabel]);

  const handleAdd = () => {
    const ids = new Set(leftSelectedIds.map(Number));
    const toAdd = availableEmployees.filter((employee) =>
      ids.has(Number(employee.employee_id))
    );

    setDraftSelected((prev) => [...prev, ...toAdd]);
    setLeftSelectedIds([]);
  };

  const handleRemove = () => {
    const ids = new Set(rightSelectedIds.map(Number));

    setDraftSelected((prev) =>
      prev.filter((employee) => !ids.has(Number(employee.employee_id)))
    );

    setRightSelectedIds([]);
  };

  const toggleLeft = (employeeId) => {
    setLeftSelectedIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleRight = (employeeId) => {
    setRightSelectedIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "700px",
          maxWidth: "calc(100vw - 48px)",
          borderRadius: "4px",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          height: "40px",
          bgcolor: "#000000",
          color: "#ffffff",
          px: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: "15px", fontWeight: 700 }}>
          選擇人員
        </Typography>

        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            width: "18px",
            height: "18px",
            bgcolor: "#8a8a8a",
            color: "#000000",
            p: 0,
            "&:hover": { bgcolor: "#a3a3a3" },
          }}
        >
          <CloseIcon sx={{ fontSize: "15px" }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: "8px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 1fr",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", gap: "6px", mb: "6px" }}>
              <TextField
                size="small"
                placeholder="選擇部門"
                sx={{
                  width: "118px",
                  "& input": { fontSize: "14px", py: "5px" },
                }}
              />

              <TextField
                size="small"
                placeholder="姓名關鍵字"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                sx={{
                  width: "118px",
                  "& input": { fontSize: "14px", py: "5px" },
                }}
              />

              <Button
                variant="outlined"
                sx={{
                  minWidth: "34px",
                  width: "34px",
                  p: 0,
                  borderColor: "#c5c5c5",
                  color: "#777777",
                }}
              >
                <SearchIcon />
              </Button>
            </Box>

            <Box
              sx={{
                height: "380px",
                border: "1px solid #d0d0d0",
                bgcolor: "#ffffff",
                overflowY: "auto",
              }}
            >
              {availableEmployees.length === 0 ? (
                <Typography sx={{ fontSize: "14px", textAlign: "center", mt: "18px" }}>
                  查無資料
                </Typography>
              ) : (
                availableEmployees.map((employee) => {
                  const employeeId = Number(employee.employee_id);
                  const active = leftSelectedIds.includes(employeeId);

                  return (
                    <Box
                      key={employeeId}
                      onClick={() => toggleLeft(employeeId)}
                      sx={{
                        px: "10px",
                        py: "8px",
                        cursor: "pointer",
                        bgcolor: active ? "#e5f1ff" : "transparent",
                        "&:hover": { bgcolor: active ? "#e5f1ff" : "#f5f5f5" },
                      }}
                    >
                      <Typography sx={{ fontSize: "14px" }}>
                        {getEmployeeLabel(employee)}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: "12px", justifyContent: "center" }}>
            <Button variant="outlined" onClick={handleAdd}>
              加入 &gt;&gt;
            </Button>

            <Button variant="outlined" onClick={handleRemove}>
              &lt;&lt; 移除
            </Button>
          </Box>

          <Box
            sx={{
              height: "421px",
              border: "1px solid #d0d0d0",
              bgcolor: "#ffffff",
              overflowY: "auto",
            }}
          >
            {draftSelected.length === 0 ? (
              <Typography sx={{ fontSize: "14px", textAlign: "center", mt: "18px" }}>
                查無資料
              </Typography>
            ) : (
              draftSelected.map((employee) => {
                const employeeId = Number(employee.employee_id);
                const active = rightSelectedIds.includes(employeeId);

                return (
                  <Box
                    key={employeeId}
                    onClick={() => toggleRight(employeeId)}
                    sx={{
                      px: "10px",
                      py: "8px",
                      cursor: "pointer",
                      bgcolor: active ? "#e5f1ff" : "transparent",
                      "&:hover": { bgcolor: active ? "#e5f1ff" : "#f5f5f5" },
                    }}
                  >
                    <Typography sx={{ fontSize: "14px" }}>
                      {getEmployeeLabel(employee)}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        <Box
          sx={{
            mt: "8px",
            pt: "6px",
            borderTop: "1px solid #d7d7d7",
            display: "flex",
            justifyContent: "flex-end",
            gap: "6px",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => onConfirm(draftSelected)}
            sx={{ minWidth: "76px", height: "34px" }}
          >
            確定
          </Button>

          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ minWidth: "76px", height: "34px" }}
          >
            取消
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}