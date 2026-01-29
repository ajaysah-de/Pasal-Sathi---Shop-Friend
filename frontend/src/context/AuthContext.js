import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// Remove trailing slash if present to avoid double slashes
const API_BASE = process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, "") || "";
const API = `${API_BASE}/api`;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("pasal_token"));
  const [shopName, setShopName] = useState(
    localStorage.getItem("shop_name") || "",
  );
  const [shopNameEn, setShopNameEn] = useState(
    localStorage.getItem("shop_name_en") || "",
  );
  const [isSetup, setIsSetup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if shop is set up
  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const res = await axios.get(`${API}/auth/check`);
      setIsSetup(res.data.is_setup);
      if (res.data.shop_name) {
        setShopName(res.data.shop_name);
      }
    } catch (err) {
      console.error("Setup check failed:", err);
      setIsSetup(false);
    } finally {
      setLoading(false);
    }
  };

  const setupShop = async (pin, shopNameNp, shopNameEnglish) => {
    const res = await axios.post(`${API}/auth/setup`, {
      pin,
      shop_name: shopNameNp,
      shop_name_en: shopNameEnglish,
    });

    const { access_token, shop_name, shop_name_en } = res.data;
    localStorage.setItem("pasal_token", access_token);
    localStorage.setItem("shop_name", shop_name);
    localStorage.setItem("shop_name_en", shop_name_en);
    setToken(access_token);
    setShopName(shop_name);
    setShopNameEn(shop_name_en);
    setIsSetup(true);
    return res.data;
  };

  const login = async (pin) => {
    const res = await axios.post(`${API}/auth/login`, { pin });

    const { access_token, shop_name, shop_name_en } = res.data;
    localStorage.setItem("pasal_token", access_token);
    localStorage.setItem("shop_name", shop_name);
    localStorage.setItem("shop_name_en", shop_name_en);
    setToken(access_token);
    setShopName(shop_name);
    setShopNameEn(shop_name_en);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("pasal_token");
    localStorage.removeItem("shop_name");
    localStorage.removeItem("shop_name_en");
    setToken(null);
    setShopName("");
    setShopNameEn("");
  };

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const value = {
    token,
    shopName,
    shopNameEn,
    isSetup,
    loading,
    isAuthenticated: !!token,
    setupShop,
    login,
    logout,
    getAuthHeader,
    checkSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
