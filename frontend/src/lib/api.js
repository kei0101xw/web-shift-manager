// src/lib/api.js
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api/v1";

function buildQuery(params) {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(
    ([k, v]) => v != null && q.append(k, String(v))
  );
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function request(
  path,
  { method = "GET", headers = {}, body, params } = {}
) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}${buildQuery(params)}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (location.pathname !== "/loginemployee")
      location.assign("/loginemployee");
    // ここで return しないと下の .ok 判定で落ち続けるので空で返す
    throw Object.assign(new Error("unauthorized"), { status: 401 });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error("api_error"), {
      status: res.status,
      data: err,
    });
  }

  return res.status === 204 ? null : res.json();
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) =>
    request(path, { ...opts, method: "PATCH", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

// 好み・互換用：前に出した apiFetch も同じ実体を指すように
export const apiFetch = request;
