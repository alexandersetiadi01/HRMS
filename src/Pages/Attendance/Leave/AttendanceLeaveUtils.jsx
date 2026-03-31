import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Breadcrumbs,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import { Link as RouterLink } from "react-router-dom";

const DATE_WIDTH = 140;
const TIME_WIDTH = 70;

function Label({ children }) {
  return (
    <Box
      sx={{
        bgcolor: "#2f2f2f",
        color: "#fff",
        px: "16px",
        py: "14px",
        fontSize: "14px",
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        fontWeight: 700,
      }}
    >
      {children}
    </Box>
  );
}

function LeaveTypeRow({
  row,
  leaveTypes,
  leaveHourOptions,
  selectMenuProps,
  onChangeType,
  onChangeHours,
  onRemove,
}) {
  return (
    <Box
      sx={{
        mb: "8px",
        width: "fit-content",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          mb: "4px",
        }}
      >
        <Box
          sx={{
            width: "18px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CancelIcon
            onClick={onRemove}
            sx={{
              color: "#7b7b7b",
              fontSize: "18px",
              cursor: "pointer",
            }}
          />
        </Box>

        <FormControl sx={{ width: "200px", flexShrink: 0 }}>
          <Select
            displayEmpty
            value={row.leaveType}
            onChange={(e) => onChangeType(e.target.value)}
            MenuProps={selectMenuProps}
            sx={{
              height: "32px",
              fontSize: "14px",
            }}
          >
            <MenuItem value="">
              請選擇假別
            </MenuItem>
            {leaveTypes.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ width: "150px", flexShrink: 0 }}>
          <Select
            displayEmpty
            value={row.leaveHours}
            onChange={(e) => onChangeHours(e.target.value)}
            MenuProps={selectMenuProps}
            sx={{
              height: "32px",
              fontSize: "14px",
            }}
          >
            <MenuItem value="">
              請選擇
            </MenuItem>
            {leaveHourOptions.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography
          sx={{
            fontSize: "14px",
            color: "#1f3b67",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {row.leaveType === "paid-sick" ? "有薪病假剩餘：240 時 0 分" : "剩餘：- 時 - 分"}
        </Typography>
      </Box>

      <Box sx={{ pl: "26px" }}>
        <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
          {row.leaveHours
            ? `(至少須申請 ${row.leaveHours} 時 0 分且申請時數須為 ${row.leaveHours} 時 0 分的倍數)`
            : "(至少須申請·時·分且申請時數須為·時·分的倍數)"}
        </Typography>
      </Box>
    </Box>
  );
}

export default function AttendanceLeaveDesktop(props) {
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    startHour,
    setStartHour,
    startMin,
    setStartMin,
    endHour,
    setEndHour,
    endMin,
    setEndMin,
    reason,
    setReason,
    agent,
    setAgent,
    isProxyApproval,
    setIsProxyApproval,
    selectedFormTypes,
    handleToggleFormType,
    leaveRows,
    handleRemoveLeaveRow,
    updateLeaveRow,
    handleAddLeaveRow,
    totalLeaveHours,
    specialOpen,
    setSpecialOpen,
    specialReason,
    setSpecialReason,
    specialLeaveType,
    setSpecialLeaveType,
    specialFiles,
    setSpecialFiles,
    selectMenuProps,
    hours,
    minutes,
    leaveTypes,
    leaveHourOptions,
    specialLeaveTypes,
    agentOptions,
    formTypes,
  } = props;

  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: "18px", color: "#9ca3af" }} />}
        sx={{ mb: "10px" }}
      >
        <Link
          component={RouterLink}
          to="/attendance"
          underline="hover"
          sx={{
            fontSize: "14px",
            color: "#6b7280",
            textDecoration: "none",
            "&:hover": {
              color: "#0c93d4",
            },
          }}
        >
          個人專區
        </Link>

        <Typography
          sx={{
            fontSize: "14px",
            color: "#111827",
            fontWeight: 700,
          }}
        >
          請假
        </Typography>
      </Breadcrumbs>

      <Typography sx={{ fontSize: "22px", fontWeight: 700, mb: "16px" }}>
        請假
      </Typography>

      <Box
        sx={{
          width: "100%",
          border: "1px solid #d1d5db",
          bgcolor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "165px minmax(0, 1fr)",
            borderBottom: "1px solid #d1d5db",
          }}
        >
          <Label>* 日期/時間</Label>

          <Box sx={{ p: "16px" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                mb: "12px",
              }}
            >
              <TextField
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{
                  width: `${DATE_WIDTH}px`,
                  "& .MuiInputBase-root": {
                    height: "38px",
                  },
                }}
              />

              <FormControl sx={{ width: `${TIME_WIDTH}px` }}>
                <Select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{ height: "38px", fontSize: "15px" }}
                >
                  {hours.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography sx={{ fontSize: "18px", color: "#374151" }}>:</Typography>

              <FormControl sx={{ width: `${TIME_WIDTH}px` }}>
                <Select
                  value={startMin}
                  onChange={(e) => setStartMin(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{ height: "38px", fontSize: "15px" }}
                >
                  {minutes.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography sx={{ fontSize: "18px", color: "#374151" }}>~</Typography>

              <TextField
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{
                  width: `${DATE_WIDTH}px`,
                  "& .MuiInputBase-root": {
                    height: "38px",
                  },
                }}
              />

              <FormControl sx={{ width: `${TIME_WIDTH}px` }}>
                <Select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{ height: "38px", fontSize: "15px" }}
                >
                  {hours.map((h) => (
                    <MenuItem key={h} value={h}>
                      {h}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography sx={{ fontSize: "18px", color: "#374151" }}>:</Typography>

              <FormControl sx={{ width: `${TIME_WIDTH}px` }}>
                <Select
                  value={endMin}
                  onChange={(e) => setEndMin(e.target.value)}
                  MenuProps={selectMenuProps}
                  sx={{ height: "38px", fontSize: "15px" }}
                >
                  {minutes.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography sx={{ ml: "8px", fontSize: "14px", color: "#1f3b67" }}>
                總計：8 時 0 分
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                mb: "8px",
              }}
            >
              {leaveRows.map((row) => (
                <LeaveTypeRow
                  key={row.id}
                  row={row}
                  leaveTypes={leaveTypes}
                  leaveHourOptions={leaveHourOptions}
                  selectMenuProps={selectMenuProps}
                  onRemove={() => handleRemoveLeaveRow(row.id)}
                  onChangeType={(value) => updateLeaveRow(row.id, "leaveType", value)}
                  onChangeHours={(value) => updateLeaveRow(row.id, "leaveHours", value)}
                />
              ))}
            </Box>

            <Box
              onClick={handleAddLeaveRow}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "#1d73b2",
                fontSize: "14px",
                cursor: "pointer",
                mb: "12px",
              }}
            >
              <AddCircleIcon sx={{ fontSize: "18px" }} />
              新增
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: "10px",
                gap: "12px",
              }}
            >
              <Typography sx={{ fontSize: "14px", color: "#1f3b67" }}>
                總計：{totalLeaveHours} 時 0 分，不足 8 時 0 分
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <Typography sx={{ fontSize: "13px", color: "#9ca3af" }}>
                  找不到可用假別?
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setSpecialOpen(true)}
                  sx={{
                    minWidth: "88px",
                    height: "28px",
                    fontSize: "12px",
                    bgcolor: "#101b4d",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#0c1438",
                      boxShadow: "none",
                    },
                  }}
                >
                  特殊假別申請
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                height: "22px",
                bgcolor: "#e5e9f0",
                width: "100%",
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "165px minmax(0, 1fr)",
            borderBottom: "1px solid #d1d5db",
          }}
        >
          <Label>事由</Label>

          <Box sx={{ p: "16px" }}>
            <TextField
              fullWidth
              multiline
              minRows={6}
              value={reason}
              onChange={(e) => {
                if (e.target.value.length <= 250) {
                  setReason(e.target.value);
                }
              }}
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: "15px",
                },
              }}
            />
            <Typography sx={{ mt: "8px", fontSize: "13px", color: "#9ca3af" }}>
              字數限制 250 字，已輸入 {reason.length} 字
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "165px minmax(0, 1fr)",
            borderBottom: "1px solid #d1d5db",
          }}
        >
          <Label>代理人</Label>

          <Box sx={{ p: "16px" }}>
            <FormControl sx={{ width: "170px", mb: "10px" }}>
              <Select
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{ height: "32px", fontSize: "14px" }}
              >
                {agentOptions.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", alignItems: "center", gap: "18px", mb: "10px", flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: "14px", color: "#374151" }}>
                *是否代理簽核
              </Typography>

              <RadioGroup
                row
                value={isProxyApproval}
                onChange={(e) => setIsProxyApproval(e.target.value)}
                sx={{ gap: "8px" }}
              >
                <FormControlLabel value="yes" control={<Radio size="small" />} label="是" />
                <FormControlLabel value="no" control={<Radio size="small" />} label="否" />
              </RadioGroup>
            </Box>

            {isProxyApproval === "yes" ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: "14px", color: "#374151" }}>
                  *表單類型
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                  {formTypes.map((item) => (
                    <FormControlLabel
                      key={item.key}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedFormTypes.includes(item.key)}
                          onChange={() => handleToggleFormType(item.key)}
                        />
                      }
                      label={item.label}
                    />
                  ))}
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "165px minmax(0, 1fr)",
          }}
        >
          <Label>附件</Label>

          <Box sx={{ p: "16px" }}>
            <Button variant="outlined" component="label" sx={{ mb: "8px" }}>
              選擇檔案
              <input hidden type="file" multiple />
            </Button>

            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              檔案格式限制為 Microsoft Office 文件、TXT文字檔、PDF、JPG、JPEG、GIF、PNG
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              檔案大小限制為 3 MB
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
              最多上傳 3 個檔案
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "16px", gap: "10px" }}>
        <Button
          variant="contained"
          sx={{
            bgcolor: "#101b4d",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#0c1438",
              boxShadow: "none",
            },
          }}
        >
          申請
        </Button>
        <Button variant="outlined">取消</Button>
      </Box>

      <Dialog
        open={specialOpen}
        onClose={() => setSpecialOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: "6px",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#101b4d",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 700,
            px: "18px",
            py: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: "18px", fontWeight: 700 }}>
            特殊假別申請
          </Typography>

          <IconButton
            onClick={() => setSpecialOpen(false)}
            size="small"
            sx={{
              color: "#ffffff",
              p: 0,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            px: { xs: "20px", sm: "36px", md: "44px" },
            py: "28px",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "90px 1fr" },
              rowGap: "18px",
              columnGap: "28px",
              alignItems: "start",
              maxWidth: "760px",
            }}
          >
            <Box sx={{ pt: "8px", fontSize: "15px", color: "#374151", whiteSpace: "nowrap" }}>
              <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
                *
              </Box>
              事由
            </Box>

            <Box>
              <TextField
                fullWidth
                multiline
                minRows={4}
                value={specialReason}
                onChange={(e) => {
                  if (e.target.value.length <= 250) {
                    setSpecialReason(e.target.value);
                  }
                }}
                sx={{
                  maxWidth: "550px",
                  "& .MuiInputBase-root": {
                    fontSize: "15px",
                  },
                }}
              />
              <Typography
                sx={{
                  mt: "8px",
                  fontSize: "14px",
                  color: "#9ca3af",
                }}
              >
                字數限制 250 字，已輸入 {specialReason.length} 字
              </Typography>
            </Box>

            <Box sx={{ pt: "8px", fontSize: "15px", color: "#374151", whiteSpace: "nowrap" }}>
              <Box component="span" sx={{ color: "#ef4444", mr: "2px" }}>
                *
              </Box>
              假別
            </Box>

            <FormControl sx={{ width: "270px" }}>
              <Select
                displayEmpty
                value={specialLeaveType}
                onChange={(e) => setSpecialLeaveType(e.target.value)}
                MenuProps={selectMenuProps}
                sx={{
                  height: "38px",
                  fontSize: "15px",
                }}
              >
                <MenuItem value="" disabled>
                  請選擇
                </MenuItem>
                {specialLeaveTypes.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ pt: "8px", fontSize: "15px", color: "#374151", whiteSpace: "nowrap" }}>
              附件
            </Box>

            <Box>
              <Button variant="outlined" component="label" sx={{ mb: "8px" }}>
                選擇檔案
                <input
                  hidden
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setSpecialFiles(files.slice(0, 3));
                  }}
                />
              </Button>

              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                *檔案格式限制為 Microsoft Office 文件, TXT文字檔, PDF, 壓縮檔, JPG, JPEG, GIF, PNG
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                *檔案大小限制為 3 MB
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6b7280" }}>
                *最多上傳 3 個檔案
              </Typography>

              {specialFiles.length > 0 ? (
                <Box sx={{ mt: "10px" }}>
                  {specialFiles.map((file) => (
                    <Typography key={file.name} sx={{ fontSize: "13px", color: "#374151" }}>
                      {file.name}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: "18px",
            py: "12px",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button
            variant="contained"
            sx={{
              minWidth: "64px",
              height: "36px",
              bgcolor: "#101b4d",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#0c1438",
                boxShadow: "none",
              },
            }}
          >
            確定
          </Button>

          <Button
            variant="outlined"
            onClick={() => setSpecialOpen(false)}
            sx={{
              minWidth: "64px",
              height: "36px",
              color: "#374151",
              borderColor: "#9ca3af",
            }}
          >
            取消
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}