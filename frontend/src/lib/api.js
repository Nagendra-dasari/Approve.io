import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1",
  timeout: 15000,
});

let authContextBridge = {
  getRefreshToken: () => null,
  getTenantContext: () => null,
  setTokens: () => {},
  logout: () => {},
};

export function registerAuthBridge(bridge) {
  authContextBridge = { ...authContextBridge, ...bridge };
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenantContext = authContextBridge.getTenantContext();
  if (tenantContext) {
    config.headers["X-Tenant-Id"] = tenantContext;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = authContextBridge.getRefreshToken();
      if (!refreshToken) {
        authContextBridge.logout();
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
          .then((res) => {
            authContextBridge.setTokens({
              accessToken: res.data.accessToken,
              refreshToken: res.data.refreshToken,
            });
            return res.data.accessToken;
          })
          .catch((refreshError) => {
            authContextBridge.logout();
            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const nextAccessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default api;
