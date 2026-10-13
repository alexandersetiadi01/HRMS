import http from "./http";

function unwrapResponse(response, fallback) {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.data !== undefined) {
    return payload.data;
  }

  return payload ?? fallback;
}

function buildParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    })
  );
}

export async function fetchNewsCategories() {
  const response = await http.get("/news-categories");

  return unwrapResponse(response, []);
}

export async function fetchNewsList(params = {}) {
  const response = await http.get("/news", {
    params: buildParams(params),
  });

  return unwrapResponse(response, []);
}

export async function fetchNewsDetail(newsId) {
  const response = await http.get(`/news/${newsId}`);

  return unwrapResponse(response, null);
}

export async function fetchNewsUnits() {
  const response = await http.get("/org-units");

  const rows = unwrapResponse(response, []);
  return Array.isArray(rows) ? rows : [];
}

export async function createNews(payload = {}) {
  const response = await http.post(
    "/news",
    payload,
  );

  return unwrapResponse(response, {});
}

export async function uploadNewsAttachment(
  newsId,
  file,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await http.post(
    `/news/${newsId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return unwrapResponse(response, {});
}