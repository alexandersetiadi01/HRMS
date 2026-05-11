export function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("zh-TW");
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

export function formatDateTimeInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getStoreFullAddress(store) {
  const country = store?.country || "";
  const city = store?.city || "";
  const district = store?.district || "";
  const address = store?.address || "";

  return `${country}${city}${district}${address}`.trim();
}

export function getStoreRegion(store) {
  const city = store?.city || "";
  const district = store?.district || "";

  return `${city}${district}`.trim();
}

export function getStoreCategoryText(categories) {
  if (!Array.isArray(categories)) {
    return "";
  }

  return categories
    .map((category) => {
      if (typeof category === "string") {
        return category;
      }

      return category?.category_name || "";
    })
    .filter(Boolean)
    .join("、");
}

export function normalizeMenuItems(menuItems) {
  if (!Array.isArray(menuItems)) {
    return [];
  }

  return menuItems
    .map((item) => ({
      menu_id: item.menu_id || null,
      menu_name: item.menu_name || "",
      price: item.price ?? "",
    }))
    .filter((item) => item.menu_name !== "" || item.price !== "");
}

export function normalizeStorePayload(form) {
  return {
    store_name: form.store_name || "",
    branch_name: form.branch_name || "",
    phone: form.phone || "",
    country: form.country || "",
    city: form.city || "",
    district: form.district || "",
    address: form.address || "",
    categories: Array.isArray(form.categories)
      ? form.categories
          .map((category) => {
            if (typeof category === "string") {
              return category;
            }

            return category?.category_name || "";
          })
          .filter(Boolean)
      : [],
    menu_items: normalizeMenuItems(form.menu_items).map((item) => ({
      menu_id: item.menu_id || null,
      menu_name: item.menu_name,
      price: Number(item.price || 0),
    })),
  };
}

export function buildEmptyMenuItem() {
  return {
    menu_id: null,
    menu_name: "",
    price: "",
  };
}

export function buildEmptyStoreForm() {
  return {
    store_name: "",
    branch_name: "",
    phone: "",
    country: "台灣",
    city: "",
    district: "",
    address: "",
    categories: [],
    menu_items: [buildEmptyMenuItem()],
  };
}

export function getStoreMenus(store) {
  if (Array.isArray(store?.menu_items)) {
    return normalizeMenuItems(store.menu_items);
  }

  if (Array.isArray(store?.menus)) {
    return normalizeMenuItems(store.menus);
  }

  return [buildEmptyMenuItem()];
}

export function buildEmptyOrderDetail() {
  return {
    menu_id: "",
    quantity: 1,
  };
}

export function buildEmptyEmployeeOrder() {
  return {
    employee_id: "",
    payment_status: "未付款",
    note: "",
    details: [buildEmptyOrderDetail()],
  };
}

export function buildEmptyOrderForm() {
  return {
    title: "",
    store_id: "",
    description: "",
    start_at: "",
    deadline_at: "",
    order_items: [buildEmptyEmployeeOrder()],
  };
}

export function getStoreMenusForOrder(store) {
  if (!store) {
    return [];
  }

  if (Array.isArray(store.menus)) {
    return store.menus;
  }

  if (Array.isArray(store.menu_items)) {
    return store.menu_items;
  }

  return [];
}

export function calculateOrderTotals(orderItems, menus) {
  const menuMap = new Map(
    (Array.isArray(menus) ? menus : []).map((menu) => [
      Number(menu.menu_id),
      Number(menu.price || 0),
    ]),
  );

  let totalQty = 0;
  let totalAmount = 0;
  let participantCount = 0;

  (Array.isArray(orderItems) ? orderItems : []).forEach((item) => {
    const details = Array.isArray(item.details) ? item.details : [];
    let hasValidDetail = false;

    details.forEach((detail) => {
      const menuId = Number(detail.menu_id || 0);
      const quantity = Number(detail.quantity || 0);
      const price = menuMap.get(menuId) || 0;

      if (menuId > 0 && quantity > 0) {
        hasValidDetail = true;
        totalQty += quantity;
        totalAmount += price * quantity;
      }
    });

    if (Number(item.employee_id || 0) > 0 && hasValidDetail) {
      participantCount += 1;
    }
  });

  return {
    participantCount,
    totalQty,
    totalAmount,
  };
}

export function normalizeOrderPayload(form) {
  return {
    title: form.title || "",
    store_id: Number(form.store_id || 0),
    description: form.description || "",
    start_at: form.start_at || "",
    deadline_at: form.deadline_at || "",
    order_items: Array.isArray(form.order_items)
      ? form.order_items
          .map((item) => ({
            employee_id: Number(item.employee_id || 0),
            payment_status: item.payment_status || "未付款",
            note: item.note || "",
            details: Array.isArray(item.details)
              ? item.details
                  .map((detail) => ({
                    menu_id: Number(detail.menu_id || 0),
                    quantity: Number(detail.quantity || 0),
                  }))
                  .filter(
                    (detail) =>
                      detail.menu_id > 0 && detail.quantity > 0,
                  )
              : [],
          }))
          .filter(
            (item) =>
              item.employee_id > 0 && item.details.length > 0,
          )
      : [],
  };
}

export function isOrderInProgress(order) {
  const status = order?.status || "";

  return !["已完成", "已截止", "已結案", "已取消"].includes(status);
}

export function isOrderClosed(order) {
  return !isOrderInProgress(order);
}