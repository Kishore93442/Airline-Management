import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken = null;
let refreshPromise = null;
let onAuthenticationFailure = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const setAuthenticationFailureHandler = (handler) => {
  onAuthenticationFailure = handler;
};

// Read a cookie from the browser
function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : null;
}

// Obtain CSRF cookie before protected POST requests
export const getCSRFToken = async () => {
  await api.get("auth/csrf/");

  const csrfToken = getCookie("csrftoken");

  if (!csrfToken) {
    throw new Error("CSRF cookie was not set by Django.");
  }

  return csrfToken;
};

// Refresh access token using HttpOnly refresh cookie
export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const csrfToken = await getCSRFToken();

      const response = await axios.post(
        `${api.defaults.baseURL}auth/refresh/`,
        {},
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": csrfToken,
          },
        },
      );

      setAccessToken(response.data.access);

      return response.data.access;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

// Attach access token and CSRF token to requests
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  const method = config.method?.toLowerCase();

  if (["post", "put", "patch", "delete"].includes(method)) {
    const csrfToken = getCookie("csrftoken");

    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
  }

  return config;
});

// Automatically refresh access token when it expires
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("auth/login/") ||
      originalRequest?.url?.includes("auth/refresh/") ||
      originalRequest?.url?.includes("auth/logout/")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      onAuthenticationFailure?.();

      return Promise.reject(refreshError);
    }
  },
);

export default api;
