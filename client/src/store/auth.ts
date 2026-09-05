import { create } from "zustand";

interface AuthState {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
    // Check localStorage for initial state so that reloads don't flash the login screen
    isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
    login: () => {
        localStorage.setItem("isAuthenticated", "true");
        set({ isAuthenticated: true });
    },
    logout: () => {
        console.log("Logout");
        localStorage.removeItem("isAuthenticated");
        set({ isAuthenticated: false });
    },
}));
