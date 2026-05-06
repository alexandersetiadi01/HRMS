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
  if (!value) return "--";

  return String(value).replace("T", " ").slice(0, 16);
}

export function mapCompanyRule(item = {}) {
  return {
    ...item,
    id: item.rule_id ?? item.id ?? "",
    ruleId: item.rule_id ?? item.id ?? "",
    groupId: item.group_id ?? 0,
    title: item.title || "--",
    ownerUnit: item.responsible_unit || "--",
    contactPerson: item.contact_person || "--",
    publishTime: formatDateTime(item.published_at),
    revisedDate: formatDateTime(item.revised_at),
    fileCode: item.rule_code || "--",
    version: item.version_no || "--",
    status: item.status || "--",
    content: item.content || "",
  };
}

export function mapCompanyRuleGroup(group = {}) {
  return {
    ...group,
    id: group.rule_group_id ?? group.id ?? "",
    groupId: group.rule_group_id ?? group.id ?? "",
    parentGroupId: group.parent_group_id ?? 0,
    name: group.group_name || group.name || "--",
    children: Array.isArray(group.children)
      ? group.children.map(mapCompanyRuleGroup)
      : [],
    rules: Array.isArray(group.rules)
      ? group.rules.map(mapCompanyRule)
      : [],
  };
}

export function mapCompanyRuleTreeNode(node = {}) {
  if (node.type === "group") {
    return {
      type: "group",
      data: mapCompanyRuleGroup(node.data),
    };
  }

  return {
    type: "rule",
    data: mapCompanyRule(node.data),
  };
}

export async function fetchCompanyRules(params = {}) {
  const response = await http.get("/company-rules", {
    params: buildParams(params),
  });

  const payload = unwrapResponse(response, {
    groups: [],
    rules: [],
    tree: [],
  });

  return {
    groups: Array.isArray(payload.groups)
      ? payload.groups.map(mapCompanyRuleGroup)
      : [],
    rules: Array.isArray(payload.rules)
      ? payload.rules.map(mapCompanyRule)
      : [],
    tree: Array.isArray(payload.tree)
      ? payload.tree.map(mapCompanyRuleTreeNode)
      : [],
  };
}

export async function fetchCompanyRuleDetail(ruleId) {
  const response = await http.get(`/company-rules/${ruleId}`);

  const item = unwrapResponse(response, null);
  return item ? mapCompanyRule(item) : null;
}