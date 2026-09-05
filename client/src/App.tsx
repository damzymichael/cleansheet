import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "./components/theme-provider";
import { useAuthStore } from "./store/auth";

import Home from "./pages/Home";
import { Components } from "./pages/Components";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Entries from "./pages/Entries";
import Clothes from "./pages/Clothes";
import Customers from "./pages/Customers";
import Staff from "./pages/Staff";

import NewEntry from "./pages/NewEntry";

import CustomerDetail from "./pages/CustomerDetail";
import Settings from "./pages/Settings";

import { Toaster } from "sonner";

// Initialize TanStack Query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function ToasterWithTheme() {
    const { theme } = useTheme();
    return <Toaster theme={theme as any} position="top-center" richColors />;
}

// Wrapper for routes that require authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

// Wrapper for routes that should NOT be accessible when logged in (like Login/Signup)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();

    if (isAuthenticated) {
        const from = location.state?.from?.pathname || "/";
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <ThemeProvider defaultTheme="system" storageKey="cleansheet-ui-theme">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
                        <Route path="signup" element={<PublicRoute><Signup /></PublicRoute>} />

                        {/* Protected Routes */}
                        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                        <Route path="entries" element={<ProtectedRoute><Entries /></ProtectedRoute>} />
                        <Route path="entries/new" element={<ProtectedRoute><NewEntry /></ProtectedRoute>} />
                        <Route path="clothes" element={<ProtectedRoute><Clothes /></ProtectedRoute>} />
                        <Route path="customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                        <Route path="customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
                        <Route path="staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
                        <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                        {/* Unprotected test route */}
                        <Route path="components" element={<Components />} />
                    </Routes>
                    <ToasterWithTheme />
                </ThemeProvider>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
