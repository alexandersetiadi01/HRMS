const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.origin}/hrms-wp/wp-json/hrms/v1`;

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem("token");

  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// ======================
// TASK ASSIGNEES (MAIN LIST)
// ======================

export async function fetchMyTasks(employeeId) {
  const res = await fetch(
    `${API_BASE}/task-assignees?employee_id=${employeeId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) throw new Error("Failed to fetch tasks");

  const data = await res.json();
  return data?.data || [];
}

// ======================
// TASK DETAIL
// ======================

export async function fetchTaskDetail(taskId) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch task detail");

  const data = await res.json();
  return data?.data || null;
}

// ======================
// REPLIES
// ======================

export async function fetchTaskReplies(taskId, employeeId) {
  const res = await fetch(
    `${API_BASE}/task-replies?task_id=${taskId}&employee_id=${employeeId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) throw new Error("Failed to fetch replies");

  const data = await res.json();
  return data?.data || [];
}

// ======================
// ATTACHMENTS
// ======================

export async function fetchTaskAttachments(taskId) {
  const res = await fetch(
    `${API_BASE}/task-attachments?task_id=${taskId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) throw new Error("Failed to fetch attachments");

  const data = await res.json();
  return data?.data || [];
}

export async function fetchReplyAttachments(replyId) {
  const res = await fetch(
    `${API_BASE}/task-attachments?task_reply_id=${replyId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) throw new Error("Failed to fetch reply attachments");

  const data = await res.json();
  return data?.data || [];
}

// ======================
// SUBMIT REPLY (WITH FILE)
// ======================

export async function submitTaskReply({
  task_id,
  task_assignee_id,
  employee_id,
  reply_content,
  file,
}) {
  const formData = new FormData();

  formData.append("task_id", task_id);
  formData.append("task_assignee_id", task_assignee_id);
  formData.append("employee_id", employee_id);
  formData.append("reply_content", reply_content);

  if (file) {
    formData.append("reply_file", file);
  }

  const res = await fetch(`${API_BASE}/task-replies`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to submit reply");

  const data = await res.json();
  return data?.data;
}