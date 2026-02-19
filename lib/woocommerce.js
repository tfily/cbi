const WC_REST_BASE =
  process.env.WC_REST_URL ||
  (process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL
    ? `${process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL}/wp-json/wc/v3`
    : "");

function getAuthHeader() {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error("Missing WooCommerce API credentials.");
  }
  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

async function wcFetch(path, options = {}) {
  if (!WC_REST_BASE) {
    throw new Error("WooCommerce REST base URL is not configured.");
  }

  const res = await fetch(`${WC_REST_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WooCommerce API error: ${res.status} ${body}`);
  }

  return res.json();
}

export async function createWooOrder(payload) {
  return wcFetch("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWooOrder(orderId, payload) {
  return wcFetch(`/orders/${orderId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getWooOrder(orderId) {
  if (!orderId) {
    throw new Error("Missing order ID.");
  }
  return wcFetch(`/orders/${orderId}`, {
    method: "GET",
  });
}

export async function listWooOrders(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return wcFetch(`/orders${suffix}`, {
    method: "GET",
  });
}

export async function deleteWooOrder(orderId, force = true) {
  if (!orderId) {
    throw new Error("Missing order ID.");
  }
  return wcFetch(`/orders/${orderId}?force=${force ? "true" : "false"}`, {
    method: "DELETE",
  });
}
