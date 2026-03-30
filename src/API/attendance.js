import http from "./http";

export async function apiClockIn(payload) {
  const res = await http.post("/clock-in", payload);
  return res.data;
}

export async function apiClockOut(payload) {
  const res = await http.post("/clock-out", payload);
  return res.data;
}

export async function apiTodayStatus() {
  const res = await http.get("/today-status");
  return res.data;
}