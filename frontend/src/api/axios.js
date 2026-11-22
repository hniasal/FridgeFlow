import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("fridgeflow_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response &&
      [401, 403].includes(error.response.status)
    ) {
      const isAuthRoute = error.config?.url?.includes("/auth/");
      const publicPaths = ["/", "/login", "/register"];
      if (!isAuthRoute && !publicPaths.includes(window.location.pathname)) {
        localStorage.removeItem("fridgeflow_token");
        localStorage.removeItem("fridgeflow_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
