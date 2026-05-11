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

export async function getOrderStores(params = {}) {
  const response = await http.get("/order-stores", {
    params: buildParams(params),
  });

  return unwrapResponse(response, []);
}

export async function getOrderStore(storeId) {
  const response = await http.get(`/order-stores/${storeId}`);

  return unwrapResponse(response, null);
}

export async function createOrderStore(payload) {
  const response = await http.post("/order-stores", payload);

  return unwrapResponse(response, null);
}

export async function updateOrderStore(storeId, payload) {
  const response = await http.put(`/order-stores/${storeId}`, payload);

  return unwrapResponse(response, null);
}

export async function deleteOrderStore(storeId) {
  const response = await http.delete(`/order-stores/${storeId}`);

  return unwrapResponse(response, null);
}

export async function createOrderMenu(payload) {
  const response = await http.post("/order-menus", payload);

  return unwrapResponse(response, null);
}

export async function updateOrderMenu(menuId, payload) {
  const response = await http.put(`/order-menus/${menuId}`, payload);

  return unwrapResponse(response, null);
}

export async function deleteOrderMenu(menuId) {
  const response = await http.delete(`/order-menus/${menuId}`);

  return unwrapResponse(response, null);
}

export async function getOrderList(params = {}) {
  const response = await http.get("/orders", {
    params: buildParams(params),
  });

  return unwrapResponse(response, []);
}

export async function getOrderDetail(orderId) {
  const response = await http.get(`/orders/${orderId}`);

  return unwrapResponse(response, null);
}

export async function createOrder(payload) {
  const response = await http.post("/orders", payload);

  return unwrapResponse(response, null);
}

export async function updateOrder(orderId, payload) {
  const response = await http.put(`/orders/${orderId}`, payload);

  return unwrapResponse(response, null);
}

export async function deleteOrder(orderId) {
  const response = await http.delete(`/orders/${orderId}`);

  return unwrapResponse(response, null);
}

export async function completeOrder(orderId) {
  const response = await http.post(`/orders/${orderId}/complete`);

  return unwrapResponse(response, null);
}

export async function createOrderItem(orderId, payload) {
  const response = await http.post(`/orders/${orderId}/items`, payload);

  return unwrapResponse(response, null);
}

export async function updateOrderItem(orderItemId, payload) {
  const response = await http.put(`/order-items/${orderItemId}`, payload);

  return unwrapResponse(response, null);
}

export async function deleteOrderItem(orderItemId) {
  const response = await http.delete(`/order-items/${orderItemId}`);

  return unwrapResponse(response, null);
}

export async function getOrderEmployees(params = {}) {
  const response = await http.get("/employees", {
    params: buildParams(params),
  });

  return unwrapResponse(response, []);
}