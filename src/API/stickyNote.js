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

export async function fetchStickyNotes(params = {}) {
  const response = await http.get("/sticky-notes", {
    params: buildParams(params),
  });

  return unwrapResponse(response, []);
}

export async function createStickyNote({ receiver_employee_ids, content }) {
  const response = await http.post("/sticky-notes", {
    receiver_employee_ids,
    content,
  });

  return unwrapResponse(response, null);
}

export async function markStickyNoteRead(stickyNoteId) {
  const response = await http.post(`/sticky-notes/${stickyNoteId}/read`);

  return unwrapResponse(response, null);
}

export async function deleteStickyNote(stickyNoteId, box = "sent") {
  const response = await http.delete(`/sticky-notes/${stickyNoteId}`, {
    params: buildParams({ box }),
  });

  return unwrapResponse(response, null);
}

export async function fetchStickyNoteEmployees() {
  const response = await http.get("/employees");

  return unwrapResponse(response, []);
}