const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `${window.location.origin}/hrms-wp/wp-json/hrms/v1`;

function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem("hrms_auth_token");

  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

async function parseResponse(res, fallback = null) {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || data?.data?.message || "Request failed");
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (data?.data !== undefined) {
    return data.data;
  }

  return data ?? fallback;
}

// ======================
// EMPLOYEES
// ======================

export async function fetchEmployees() {
  const res = await fetch(`${API_BASE}/employees`, {
    headers: getAuthHeaders(),
  });

  return parseResponse(res, []);
}

// ======================
// TASKS
// ======================

export async function fetchTasks(params = {}) {
  const res = await fetch(`${API_BASE}/tasks${buildQuery(params)}`, {
    headers: getAuthHeaders(),
  });

  return parseResponse(res, []);
}

export async function fetchCreatedTasks(creatorEmployeeId) {
  const res = await fetch(
    `${API_BASE}/tasks${buildQuery({
      creator_employee_id: creatorEmployeeId,
    })}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(res, []);
}

export async function fetchTaskDetail(taskId) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    headers: getAuthHeaders(),
  });

  return parseResponse(res, null);
}

export async function createTask({
  creator_employee_id,
  title,
  description,
  start_date,
  due_date,
}) {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      creator_employee_id,
      title,
      description,
      start_date,
      due_date,
    }),
  });

  return parseResponse(res, null);
}

// ======================
// TASK ASSIGNEES
// ======================

export async function fetchMyTasks(employeeId) {
  const res = await fetch(
    `${API_BASE}/task-assignees${buildQuery({
      employee_id: employeeId,
    })}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(res, []);
}

export async function fetchPendingTaskAssignments(employeeId) {
  const assignedToMe = await fetchMyTasks(employeeId);

  const createdByMeRes = await fetch(
    `${API_BASE}/task-assignees${buildQuery({
      creator_employee_id: employeeId,
    })}`,
    {
      headers: getAuthHeaders(),
    }
  );

  const createdByMe = await parseResponse(createdByMeRes, []);

  const merged = [
    ...(Array.isArray(assignedToMe) ? assignedToMe : []),
    ...(Array.isArray(createdByMe) ? createdByMe : []),
  ];

  const map = new Map();

  merged.forEach((row) => {
    const key = row.task_assignee_id || `${row.task_id}-${row.employee_id}`;
    map.set(String(key), row);
  });

  return Array.from(map.values());
}

export async function fetchTaskAssigneesByTask(taskId) {
  const res = await fetch(
    `${API_BASE}/task-assignees${buildQuery({
      task_id: taskId,
    })}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(res, []);
}

export async function fetchAssignedTaskRows(employeeId) {
  return fetchMyTasks(employeeId);
}

export async function assignTask({ task_id, employee_ids }) {
  const res = await fetch(`${API_BASE}/task-assignees`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      task_id,
      employee_ids,
    }),
  });

  return parseResponse(res, null);
}

// ======================
// REPLIES
// ======================

export async function fetchTaskReplies(taskId, employeeId) {
  const res = await fetch(
    `${API_BASE}/task-replies${buildQuery({
      task_id: taskId,
      employee_id: employeeId,
    })}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(res, []);
}

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

  return parseResponse(res, null);
}

// ======================
// ATTACHMENTS
// ======================

export async function fetchTaskAttachments(taskId) {
  const res = await fetch(
    `${API_BASE}/task-attachments${buildQuery({
      task_id: taskId,
    })}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(res, []);
}

export async function fetchReplyAttachments(replyId) {
  const res = await fetch(
    `${API_BASE}/task-attachments${buildQuery({
      task_reply_id: replyId,
    })}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return parseResponse(res, []);
}