import axios from "axios";
import { useAuthStore } from "@/store/auth";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const api = axios.create({
    baseURL,
    withCredentials: true,
});

// Separate, un-intercepted instance used ONLY for the refresh call and login.
export const api_instance = axios.create({
    baseURL,
    withCredentials: true,
});

// Prevents multiple concurrent refresh attempts if multiple requests fail at once
let isRefreshing = false;
// Queue to hold pending requests while the token is refreshing
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
    response => {
        // If the request succeeds, simply return the response
        return response;
    },
    async error => {
        const originalRequest = error.config;

        // Check if it's a 401 Unauthorized error and we haven't already retried this request
        if (error.response?.status === 401 && !originalRequest._retry) {
            // If a refresh is already in progress, add this request to the queue
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return api(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Attempt to hit the refresh endpoint using the plain, un-intercepted client.
                // Because withCredentials is true, the refresh_token cookie will be sent automatically.
                await api_instance.post("/auth/refresh");
                console.log("Is refreshing");
                // If successful, release the queue
                processQueue(null);

                // Retry the original request that failed
                return api(originalRequest);
            } catch (refreshError) {
                // If the refresh fails (e.g., refresh token is expired/invalid), reject all queued requests
                processQueue(refreshError as Error);

                // Log out and redirect to login page
                const { logout } = useAuthStore.getState();
                logout();
                window.location.replace("/login");

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);
