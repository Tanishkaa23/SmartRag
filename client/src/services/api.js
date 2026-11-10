import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    Accept: "application/json",
  },
});

const TOKEN_KEY = "smartrag_token";

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = getAuthToken();
    const requestUrl = error.config?.url || "";
    const isPublicAuthRequest = requestUrl.includes("/api/auth/login") || requestUrl.includes("/api/auth/register");
    if (error.response?.status === 401 && token && !isPublicAuthRequest) {
      clearAuthToken();
      window.dispatchEvent(new Event("smartrag:unauthorized"));
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export const registerRequest = async (credentials) => {
  const { data } = await api.post("/api/auth/register", credentials);
  return data;
};

export const loginRequest = async (credentials) => {
  const { data } = await api.post("/api/auth/login", credentials);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/api/auth/me");
  return data.user;
};

export const getDocuments = async () => {
  const { data } = await api.get("/api/documents");
  return data.documents || [];
};

export const uploadDocuments = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("file", file));
  const { data } = await api.post("/api/documents/upload", formData);
  return data;
};

export const deleteDocument = async (id) => {
  const { data } = await api.delete(`/api/documents/${id}`);
  return data;
};

export const getAnalytics = async () => {
  const { data } = await api.get("/api/analytics/overview");
  return data.analytics || {};
};

export const getChats = async () => {
  const { data } = await api.get("/api/chat/history");
  return data.chats || [];
};

export const getChat = async (id) => {
  const { data } = await api.get(`/api/chat/history/${id}`);
  return data.chat;
};

export const createChat = async (title) => {
  const { data } = await api.post("/api/chat/history", { title });
  return data.chat;
};

export const sendMessage = async ({ query, chatId, documentIds, mode = "auto" }) => {
  const { data } = await api.post("/api/chat", {
    query,
    chatId,
    documentIds,
    mode,
  });
  return data;
};

export const deleteChat = async (id) => {
  const { data } = await api.delete(`/api/chat/history/${id}`);
  return data;
};

export const getErrorMessage = (error) => {
  const failedDocuments = error.response?.data?.failedDocuments;
  if (Array.isArray(failedDocuments) && failedDocuments.length) {
    return failedDocuments
      .map((item) => `${item.filename}: ${item.error}`)
      .join(" ");
  }
  return error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again.";
};
