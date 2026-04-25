const normalizeBaseUrl = (value = "") => value.trim().replace(/\/+$/, "");

const envBaseUrl = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL || "");
const isLocalhost =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const API_BASE_URL = envBaseUrl || (isLocalhost ? "http://localhost:5000" : "");
export const API_CONFIG_ERROR = API_BASE_URL
  ? ""
  : "Chưa cấu hình REACT_APP_API_BASE_URL cho frontend production.";

export const apiUrl = (path = "") => {
  if (!API_BASE_URL) {
    throw new Error(API_CONFIG_ERROR);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
