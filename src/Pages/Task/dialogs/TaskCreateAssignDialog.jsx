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
      <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#ffffff" }}>
        {title}
      </Typography>

      <IconButton onClick={onClose} size="small" sx={{ color: "#ffffff", p: 0 }}>
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
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id],
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "600px",
          maxWidth: "calc(100vw - 48px)",
          borderRadius: "4px",
          overflow: "hidden",
        },
      }}
    >
      <DialogHeader title="新增指派事項" onClose={onClose} />

      <Tabs value={tab} onChange={(e, v) => setTab(v)}>
        <Tab label="建立任務" />
        <Tab label="指派員工" />
      </Tabs>

      <DialogContent sx={{ p: "16px" }}>
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

            <Box sx={{ mt: "16px", display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleCreateTask}
                disabled={loading}
              >
                下一步
              </Button>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            {employees.map((emp) => (
              <Box
                key={emp.employee_id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: "6px",
                }}
              >
                <Checkbox
                  checked={selectedEmployeeIds.includes(emp.employee_id)}
                  onChange={() => toggleEmployee(emp.employee_id)}
                />

                <Typography>
                  {emp.employee_id} {emp.display_name}
                </Typography>
              </Box>
            ))}

            <Box sx={{ mt: "16px", display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleAssign}
                disabled={loading}
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