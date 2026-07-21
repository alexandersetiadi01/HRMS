import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Typography,
  Checkbox,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { createTask, assignTask, fetchEmployees } from "../../../API/task";

function DialogHeader({ title, onClose }) {
  return (
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
          fontSize: { xs: "14px", sm: "15px" },
          fontWeight: 700,
          color: "#ffffff",
        }}
      >
        {title}
      </Typography>

      <IconButton
        onClick={onClose}
        size="small"
        sx={{ color: "#ffffff", p: 0 }}
      >
        <CloseIcon sx={{ fontSize: "18px" }} />
      </IconButton>
    </Box>
  );
}

export default function TaskCreateAssignDialog({
  open,
  employeeId,
  onClose,
  onSuccess,
}) {
  const [tab, setTab] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [taskId, setTaskId] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    fetchEmployees()
      .then((res) => setEmployees(Array.isArray(res) ? res : []))
      .catch(() => setEmployees([]));
  }, [open]);

  const handleCreateTask = async () => {
    if (!title.trim()) {
      alert("請輸入標題");
      return;
    }

    if (!startDate || !dueDate) {
      alert("請選擇時間");
      return;
    }

    setLoading(true);

    try {
      const result = await createTask({
        creator_employee_id: employeeId,
        title,
        description,
        start_date: startDate,
        due_date: dueDate,
      });

      setTaskId(result?.task_id);
      setTab(1);
    } catch (error) {
      console.error(error);
      alert("建立任務失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!taskId) {
      alert("請先建立任務");
      return;
    }

    if (selectedEmployeeIds.length === 0) {
      alert("請選擇員工");
      return;
    }

    setLoading(true);

    try {
      await assignTask({
        task_id: taskId,
        employee_ids: selectedEmployeeIds,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      alert("指派失敗");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: {
            xs: "calc(100vw - 16px)",
            sm: "600px",
          },
          maxWidth: "600px",
          m: { xs: "8px", sm: "32px" },
          maxHeight: {
            xs: "calc(100dvh - 16px)",
            sm: "calc(100dvh - 64px)",
          },
          borderRadius: "4px",
          overflow: "hidden",
        },
      }}
    >
      <DialogHeader title="新增指派事項" onClose={onClose} />

      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: {
            xs: "42px",
            sm: "48px",
          },
          "& .MuiTab-root": {
            minHeight: {
              xs: "42px",
              sm: "48px",
            },
            fontSize: {
              xs: "13px",
              sm: "14px",
            },
          },
        }}
      >
        <Tab label="建立任務" />
        <Tab label="指派員工" />
      </Tabs>

      <DialogContent
        sx={{
          p: {
            xs: "10px",
            sm: "16px",
          },
          "& .MuiInputBase-input": {
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
          },
          "& .MuiInputLabel-root": {
            fontSize: {
              xs: "14px",
              sm: "15px",
            },
          },
        }}
      >
        {tab === 0 && (
          <Box>
            <TextField
              fullWidth
              label="標題"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: "10px" }}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="說明"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: "10px" }}
            />

            <TextField
              fullWidth
              type="datetime-local"
              label="開始時間"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ mb: "10px" }}
            />

            <TextField
              fullWidth
              type="datetime-local"
              label="截止時間"
              InputLabelProps={{ shrink: true }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <Box
              sx={{
                mt: "16px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="contained"
                onClick={handleCreateTask}
                disabled={loading}
                sx={{
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                }}
              >
                下一步
              </Button>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Box
              sx={{
                display: "grid",
                gap: "6px",
                maxHeight: {
                  xs: "48vh",
                  sm: "420px",
                },
                overflowY: "auto",
                pr: {
                  xs: 0,
                  sm: "4px",
                },
              }}
            >
              {employees.map((emp) => {
                const isSelected = selectedEmployeeIds.includes(
                  emp.employee_id,
                );

                return (
                  <Box
                    key={emp.employee_id}
                    onClick={() => toggleEmployee(emp.employee_id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      minWidth: 0,
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      px: {
                        xs: "6px",
                        sm: "8px",
                      },
                      py: "2px",
                      cursor: "pointer",
                      bgcolor: isSelected ? "#eff6ff" : "#ffffff",
                      "&:hover": {
                        bgcolor: isSelected ? "#dbeafe" : "#f9fafb",
                      },
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                      onChange={() => toggleEmployee(emp.employee_id)}
                      size="small"
                    />

                    <Typography
                      sx={{
                        minWidth: 0,
                        fontSize: {
                          xs: "14px",
                          sm: "15px",
                        },
                        overflowWrap: "anywhere",
                      }}
                    >
                      {emp.employee_id} {emp.display_name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                mt: "16px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="contained"
                onClick={handleAssign}
                disabled={loading}
                sx={{
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                }}
              >
                完成指派
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
