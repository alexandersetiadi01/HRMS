import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Link,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import Breadcrumb from "../../../Utils/Breadcrumb";
import AppSnackbar from "../../../Components/AppSnackbar";
import FormDialog from "../../../Components/FormDialog";
import { getStoredAuthUser } from "../../../API/auth";
import { hasAttendancePermission } from "../../../Utils/AttendancePermissions";
import { DesktopTable, MobileList } from "./Table";
import {
  createDepartmentAnnouncement,
  fetchDepartmentAnnouncementDetail,
  fetchDepartmentAnnouncements,
  fetchDepartmentAnnouncementUnits,
  uploadDepartmentAnnouncementAttachment,
} from "../../../API/departmentAnnouncement";
import useNotifications from "../../../Contexts/UseNotification";
import useNotificationHighlight from "../../../Utils/Notifications/UseNotificationHighlight";

function getLocalDateTimeValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  return new Date(
    now.getTime() - offset * 60000,
  )
    .toISOString()
    .slice(0, 16);
}

function toApiDateTime(value) {
  const text = String(value || "").trim();

  return text
    ? `${text.replace("T", " ")}:00`
    : "";
}

function createAnnouncementForm() {
  return {
    unit_ids: [],
    title: "",
    content: "",
    published_at: getLocalDateTimeValue(),
    status: "發布",
  };
}

function AnnouncementDialog({ open, item, loading = false, onClose }) {
  if (!item && !loading) return null;

  const attachments = Array.isArray(item?.attachments) ? item.attachments : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: "4px" },
          overflow: "hidden",
          m: { xs: 0, md: "32px" },
          width: { xs: "100%", md: "980px" },
          maxWidth: { xs: "100%", md: "calc(100vw - 64px)" },
          height: { xs: "100%", md: "auto" },
          maxHeight: { xs: "100%", md: "calc(100vh - 64px)" },
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
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          {loading ? "讀取中..." : item?.title}
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
          px: { xs: "16px", md: "10px" },
          pt: "14px",
          pb: "0",
        }}
      >
        {loading ? (
          <Box
            sx={{
              minHeight: { xs: "180px", md: "260px" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box sx={{ px: { xs: 0, md: "0" } }}>
            <Typography
              sx={{
                fontSize: "16px",
                color: "#444444",
                mb: "12px",
              }}
            >
              發佈時間：{item?.publishTime || "-"}
            </Typography>

            <Typography
              sx={{
                fontSize: "16px",
                color: "#444444",
                mb: "10px",
              }}
            >
              內容:
            </Typography>

            <Box
              sx={{
                fontSize: "16px",
                color: "#444444",
                whiteSpace: "pre-wrap",
                lineHeight: 1.8,
                minHeight: { xs: "auto", md: "260px" },
              }}
            >
              {item?.content || "-"}
            </Box>

            {attachments.length > 0 && (
              <Box
                sx={{
                  mt: "18px",
                  pt: "12px",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "16px",
                    color: "#444444",
                    mb: "8px",
                  }}
                >
                  附件:
                </Typography>

                {attachments.map((attachment) => (
                  <Box
                    key={
                      attachment.department_attachment_id ||
                      attachment.id ||
                      attachment.file_url ||
                      attachment.file_name
                    }
                    sx={{ mb: "6px" }}
                  >
                    <Link
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{
                        fontSize: "15px",
                        color: "#1f2f4a",
                        wordBreak: "break-word",
                      }}
                    >
                      {attachment.file_name || "查看附件"}
                    </Link>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        <Box
          sx={{
            mt: "16px",
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

function PaginationBar({ totalRows, currentPage }) {
  return (
    <Box
      sx={{
        mt: "24px",
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
          disabled
          sx={{ minWidth: "24px", width: "24px", height: "24px", p: 0 }}
        >
          <KeyboardDoubleArrowLeftIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled
          sx={{ minWidth: "24px", width: "24px", height: "24px", p: 0 }}
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
          頁，共 1 頁
        </Typography>

        <Button
          variant="outlined"
          disabled
          sx={{ minWidth: "24px", width: "24px", height: "24px", p: 0 }}
        >
          <KeyboardArrowRightIcon sx={{ fontSize: "18px" }} />
        </Button>

        <Button
          variant="outlined"
          disabled
          sx={{ minWidth: "24px", width: "24px", height: "24px", p: 0 }}
        >
          <KeyboardDoubleArrowRightIcon sx={{ fontSize: "18px" }} />
        </Button>
      </Box>

      <Typography sx={{ fontSize: "15px", color: "#1f2f4a" }}>
        顯示 {totalRows > 0 ? 1 : 0} - {totalRows} 筆，共 {totalRows} 筆
      </Typography>
    </Box>
  );
}

export default function CompanyAnnouncement() {
  const {
    isSourceUnread,
    markSourceAsRead,
  } = useNotifications();

  const {
    highlightedId,
  } = useNotificationHighlight();

  const [rows, setRows] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [announcementUnits, setAnnouncementUnits] = useState([]);
  const [createForm, setCreateForm] = useState(createAnnouncementForm);
  const [createFiles, setCreateFiles] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const authUser = getStoredAuthUser();

  const canManageAnnouncements = hasAttendancePermission(
    authUser,
    "attendance_department_announcement_manage",
  );

  const currentPage = 1;

  useEffect(() => {
    let active = true;

    async function loadAnnouncements() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchDepartmentAnnouncements({
          scope: canManageAnnouncements
            ? "all"
            : "mine",
        });

        if (active) {
          setRows(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "讀取部門公告失敗。",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAnnouncements();

    return () => {
      active = false;
    };
  }, [canManageAnnouncements]);

  const handleOpenCreate = async () => {
    setCreateForm(createAnnouncementForm());
    setCreateFiles([]);
    setCreateOpen(true);

    try {
      const units =
        await fetchDepartmentAnnouncementUnits();

      setAnnouncementUnits(
        Array.isArray(units)
          ? units
          : [],
      );
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "讀取部門資料失敗。",
      });
    }
  };

  const handleCreateAnnouncement = async () => {
    const title = String(
      createForm.title || "",
    ).trim();

    const content = String(
      createForm.content || "",
    ).trim();

    if (!title) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "請填寫公告標題。",
      });
      return;
    }

    if (!content) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "請填寫公告內容。",
      });
      return;
    }

    if (
      !Array.isArray(createForm.unit_ids) ||
      createForm.unit_ids.length === 0
    ) {
      setSnackbar({
        open: true,
        severity: "warning",
        message: "請選擇公告部門。",
      });
      return;
    }

    setCreateSubmitting(true);

    try {
      const result =
        await createDepartmentAnnouncement({
          unit_ids: createForm.unit_ids.map(Number),
          title,
          content,
          published_at: toApiDateTime(
            createForm.published_at,
          ),
          status: createForm.status,
        });

      const announcementId = Number(
        result?.department_announcement_id || 0,
      );

      const uploadResults =
        announcementId > 0
          ? await Promise.allSettled(
              createFiles.map((file) =>
                uploadDepartmentAnnouncementAttachment(
                  announcementId,
                  file,
                ),
              ),
            )
          : [];

      const uploadFailed =
        uploadResults.some(
          (item) =>
            item.status === "rejected",
        );

      const data =
        await fetchDepartmentAnnouncements({
          scope: "all",
        });

      setRows(data);
      setCreateOpen(false);
      setCreateFiles([]);

      setSnackbar({
        open: true,
        severity: uploadFailed
          ? "warning"
          : "success",
        message: uploadFailed
          ? "公告已建立，但部分附件上傳失敗。"
          : "部門公告已建立。",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "新增部門公告失敗。",
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenDialog = async (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
    setDetailLoading(true);

    try {
      const detail = (
        await fetchDepartmentAnnouncementDetail(
          item.id,
        )
      );

      setSelectedItem(detail || item);

      try {
        await markSourceAsRead(
          "department_announcement",
          item.id,
        );
      } catch {
        /*
         * Keep the announcement open if notification
         * synchronization temporarily fails.
         */
      }
    } catch {
      setSelectedItem(item);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDetailLoading(false);
  };

  return (
    <Box>
      <Breadcrumb rootLabel="首頁" currentLabel="部門公告" mb="14px" />

      <Box
        sx={{
          mb: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          部門公告
        </Typography>

        {canManageAnnouncements ? (
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={handleOpenCreate}
          >
            新增公告
          </Button>
        ) : null}
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: "40px" }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!loading && error && (
        <Typography sx={{ fontSize: "15px", color: "#b91c1c" }}>
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <DesktopTable
              rows={rows}
              onOpenItem={handleOpenDialog}
              highlightedId={highlightedId}
              isSourceUnread={(sourceId) => {
                return isSourceUnread(
                  "department_announcement",
                  sourceId,
                );
              }}
            />

            {rows.length === 0 && (
              <Typography
                sx={{
                  fontSize: "15px",
                  color: "#6b7280",
                  mt: "14px",
                }}
              >
                目前沒有部門公告。
              </Typography>
            )}

            <PaginationBar totalRows={rows.length} currentPage={currentPage} />
          </Box>

          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <MobileList
              rows={rows}
              onOpenItem={handleOpenDialog}
              highlightedId={highlightedId}
              isSourceUnread={(sourceId) => {
                return isSourceUnread(
                  "department_announcement",
                  sourceId,
                );
              }}
            />

            {rows.length === 0 && (
              <Typography
                sx={{
                  fontSize: "15px",
                  color: "#6b7280",
                  mt: "14px",
                }}
              >
                目前沒有部門公告。
              </Typography>
            )}
          </Box>
        </>
      )}

      <FormDialog
        open={createOpen}
        title="新增部門公告"
        submitting={createSubmitting}
        submitLabel="新增公告"
        onClose={() => {
          if (createSubmitting) return;

          setCreateOpen(false);
          setCreateFiles([]);
        }}
        onSubmit={handleCreateAnnouncement}
      >
        <TextField
          select
          required
          fullWidth
          label="公告部門"
          size="small"
          value={createForm.unit_ids}
          onChange={(event) =>
            setCreateForm((current) => ({
              ...current,
              unit_ids: event.target.value,
            }))
          }
          SelectProps={{
            multiple: true,
          }}
        >
          {announcementUnits.map((unit) => (
            <MenuItem
              key={unit.unit_id}
              value={String(unit.unit_id)}
            >
              {unit.unit_name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          required
          fullWidth
          label="標題"
          size="small"
          value={createForm.title}
          onChange={(event) =>
            setCreateForm((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
        />

        <TextField
          required
          fullWidth
          multiline
          minRows={6}
          label="內容"
          value={createForm.content}
          onChange={(event) =>
            setCreateForm((current) => ({
              ...current,
              content: event.target.value,
            }))
          }
        />

        <TextField
          required
          fullWidth
          type="datetime-local"
          label="發布時間"
          size="small"
          value={createForm.published_at}
          onChange={(event) =>
            setCreateForm((current) => ({
              ...current,
              published_at: event.target.value,
            }))
          }
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />

        <TextField
          select
          required
          fullWidth
          label="狀態"
          size="small"
          value={createForm.status}
          onChange={(event) =>
            setCreateForm((current) => ({
              ...current,
              status: event.target.value,
            }))
          }
        >
          <MenuItem value="發布">
            發布
          </MenuItem>

          <MenuItem value="未發布">
            未發布
          </MenuItem>
        </TextField>

        <Box>
          <Button
            component="label"
            variant="outlined"
          >
            選擇附件
            <input
              hidden
              multiple
              type="file"
              onChange={(event) =>
                setCreateFiles(
                  Array.from(
                    event.target.files || [],
                  ),
                )
              }
            />
          </Button>

          {createFiles.length > 0 ? (
            <Typography
              sx={{
                mt: "8px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              已選擇 {createFiles.length} 個附件
            </Typography>
          ) : null}
        </Box>
      </FormDialog>

      <AppSnackbar
        open={snackbar.open}
        severity={snackbar.severity}
        message={snackbar.message}
        onClose={() =>
          setSnackbar((current) => ({
            ...current,
            open: false,
          }))
        }
      />

      <AnnouncementDialog
        open={dialogOpen}
        item={selectedItem}
        loading={detailLoading}
        onClose={handleCloseDialog}
      />
    </Box>
  );
}
