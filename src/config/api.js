const normalizeBaseUrl = (value = "") => value.trim().replace(/\/+$/, "");

const envBaseUrl = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL || "");
const isLocalhost =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const API_BASE_URL = envBaseUrl || (isLocalhost ? "http://127.0.0.1:5000" : "");

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

