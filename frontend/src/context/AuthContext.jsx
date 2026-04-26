import { useMemo, useState } from "react";
import api from "../lib/api";
import { registerAuthBridge } from "../lib/api";
import AuthContext from "./auth-context";

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken"));
  const [tenantContextId, setTenantContextId] = useState(localStorage.getItem("tenantContextId") || "");
  const [user, setUser] = useState(
    localStorage.getItem("authUser") ? JSON.parse(localStorage.getItem("authUser")) : null,
  );
  const [permissionCodes, setPermissionCodes] = useState(
    localStorage.getItem("permissionCodes")
      ? JSON.parse(localStorage.getItem("permissionCodes"))
      : [],
  );
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const token = response.data?.accessToken;
      const nextRefreshToken = response.data?.refreshToken;
      const nextUser = response.data?.user || null;
      const nextPermissionCodes = response.data?.permissionCodes || [];

      if (!token || !nextRefreshToken) {
        throw new Error("Access token not returned by API.");
      }

      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", nextRefreshToken);
      localStorage.setItem("authUser", JSON.stringify(nextUser));
      localStorage.setItem("permissionCodes", JSON.stringify(nextPermissionCodes));
      localStorage.removeItem("tenantContextId");
      setAccessToken(token);
      setRefreshToken(nextRefreshToken);
      setUser(nextUser);
      setPermissionCodes(nextPermissionCodes);
      setTenantContextId("");
    } finally {
      setIsLoading(false);
    }
  };

  const setTokens = ({ accessToken: nextAccessToken, refreshToken: nextRefreshToken }) => {
    localStorage.setItem("accessToken", nextAccessToken);
    localStorage.setItem("refreshToken", nextRefreshToken);
    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);
  };

  const setTenantContext = (nextTenantId) => {
    const value = nextTenantId || "";
    if (value) {
      localStorage.setItem("tenantContextId", value);
    } else {
      localStorage.removeItem("tenantContextId");
    }
    setTenantContextId(value);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("permissionCodes");
    localStorage.removeItem("tenantContextId");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setPermissionCodes([]);
    setTenantContextId("");
  };

  registerAuthBridge({
    getRefreshToken: () => refreshToken,
    getTenantContext: () => tenantContextId || null,
    setTokens,
    logout,
  });

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      tenantContextId,
      permissionCodes,
      isAuthenticated: Boolean(accessToken),
      isLoading,
      login,
      setTenantContext,
      setTokens,
      logout,
    }),
    [accessToken, refreshToken, user, tenantContextId, permissionCodes, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
