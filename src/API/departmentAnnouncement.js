import http from "./http";

function unwrapResponse(response, fallback) {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (payload?.data !== undefined) return payload.data;

  return payload ?? fallback;
}

function buildParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    }),
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 16);
}

function formatPublisher(item = {}) {
  const departmentName = String(item.unit_names || "").trim();
  const publisherName = String(item.publisher_name || item.publisher || "").trim();

  return `${departmentName || "-"}/${publisherName || "-"}`;
}

export function mapDepartmentAnnouncement(item = {}) {
  return {
    ...item,
    id: item.department_announcement_id ?? item.id ?? "",
    title: item.title || "-",
    publisher: formatPublisher(item),
    publishTime: formatDateTime(item.published_at || item.publishTime),
    content: item.content || "",
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
  };
}

export async function fetchDepartmentAnnouncements(params = {}) {
  const response = await http.get("/department-announcements", {
    params: buildParams({
      scope: "mine",
      ...params,
    }),
  });

  const rows = unwrapResponse(response, []);
  return Array.isArray(rows) ? rows.map(mapDepartmentAnnouncement) : [];
}

export async function fetchDepartmentAnnouncementDetail(announcementId) {
  const response = await http.get(`/department-announcements/${announcementId}`);

  const item = unwrapResponse(response, null);
  return item ? mapDepartmentAnnouncement(item) : null;
}