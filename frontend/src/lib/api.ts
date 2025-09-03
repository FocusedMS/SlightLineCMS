import axios from "axios";
import toast from "react-hot-toast";

// Resolve API base URL with a safety override: some environments/browser caches
// may still inject an old VITE_API_BASE_URL pointing to :5000. If so, force the
// known-good development port 62816.
const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
const resolvedBase = !envBase || /:5000\b/.test(envBase)
  ? "http://localhost:62816"
  : envBase;

const api = axios.create({
  baseURL: resolvedBase,
  withCredentials: false,
  timeout: 15000,
});

// ---- Helpers --------------------------------------------------------------

function deriveActionMessage(url?: string, fallback = "Done") {
  if (!url) return fallback;
  const last = url.split("?")[0].split("/").pop() || "";
  if (/approve/i.test(last)) return "Post approved";
  if (/reject/i.test(last)) return "Post rejected";
  if (/create|add|publish/i.test(last)) return "Created";
  if (/update|edit/i.test(last)) return "Updated";
  if (/delete|remove/i.test(last)) return "Deleted";
  return fallback;
}

function getServerErrorMessage(err: any) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.title ||
    err?.message ||
    "Something went wrong"
  );
}

// ---- Request: attach token -----------------------------------------------

api.interceptors.request.use((cfg) => {
  let token = localStorage.getItem("token") || "";
  if (!token) {
    try {
      token = JSON.parse(localStorage.getItem("user") || "{}")?.token || "";
    } catch {}
  }
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ---- Response: normalize + toasts ----------------------------------------

api.interceptors.response.use(
  (res) => {
    // If backend responded with 204 No Content, fabricate a small payload
    // so the UI can still show a confirmation.
    if (res.status === 204) {
      const msg = deriveActionMessage(res.config?.url, "Action completed");
      res = {
        ...res,
        status: 200,
        data: { success: true, message: msg },
      } as typeof res;
    }

    // Optional success toast per request:
    // api.post(url, data, { showSuccessToast: true, successMessage?: "..." })
    const show = (res.config as any)?.showSuccessToast;
    if (show) {
      const userMsg =
        (res.config as any)?.successMessage ||
        res?.data?.message ||
        deriveActionMessage(res.config?.url, "Done");
      toast.success(userMsg);
    }

    return res;
  },
  (err) => {
    const status = err?.response?.status;
    const serverMsg = getServerErrorMessage(err);

    if (status === 401) {
      toast.error("Session expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // window.location.href = "/login"; // optional redirect
    } else if (status === 403) {
      toast.error("You don’t have permission to do that.");
    } else if (status === 404) {
      toast.error("Not found.");
    } else {
      toast.error(serverMsg);
    }
    return Promise.reject(err);
  }
);

export { api };

/**
 * Optional convenience helpers for moderation actions.
 * Use these if you want out-of-the-box success toasts:
 *
 *   await moderation.approve(id)
 *   await moderation.reject(id, reason)
 */
export const moderation = {
  approve(postId: number | string) {
    return api.post(
      `/api/moderation/posts/${postId}/approve`,
      null,
      { showSuccessToast: true } as any
    );
  },
  reject(postId: number | string, reason: string) {
    return api.post(
      `/api/moderation/posts/${postId}/reject`,
      { reason },
      { showSuccessToast: true } as any
    );
  },
};
