import http from "./http";

function unwrapData(response, fallback = null) {
  return response?.data?.data ?? fallback;
}

export async function getProbationCases() {
  const response = await http.get("/attendance/probation");

  const data = unwrapData(response, []);

  return Array.isArray(data) ? data : [];
}

export async function getProbationCase(caseId) {
  const response = await http.get(
    `/attendance/probation/${caseId}`,
  );

  return unwrapData(response, null);
}

export async function getProbationEvaluation(caseId, month) {
  const response = await http.get(
    `/attendance/probation/${caseId}/evaluation/${Number(month)}`,
  );

  return unwrapData(response, null);
}

export async function saveProbationDraft(
  caseId,
  month,
  payload = {},
) {
  const response = await http.put(
    `/attendance/probation/${caseId}/evaluation/${Number(month)}/draft`,
    payload,
  );

  return unwrapData(response, null);
}

export async function submitProbationEvaluation(
  caseId,
  month,
  payload = {},
) {
  const response = await http.post(
    `/attendance/probation/${caseId}/evaluation/${Number(month)}/submit`,
    payload,
  );

  return unwrapData(response, null);
}

export async function createProbation(payload = {}) {
  const response = await http.post(
    "/attendance/probation",
    payload,
  );

  return unwrapData(response, null);
}

export async function updateProbation(
  caseId,
  payload = {},
) {
  const response = await http.patch(
    `/attendance/probation/${caseId}`,
    payload,
  );

  return unwrapData(response, null);
}