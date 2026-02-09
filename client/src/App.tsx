import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import Home from "./pages/Home";
import { Components } from "./pages/Components";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Entries from "./pages/Entries";
import Clothes from "./pages/Clothes";
import Customers from "./pages/Customers";
import Staff from "./pages/Staff";

function App() {
    return (
        <Router>
            <ThemeProvider defaultTheme="system" storageKey="cleansheet-ui-theme">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="entries" element={<Entries />} />
                    <Route path="clothes" element={<Clothes />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="staff" element={<Staff />} />
                    <Route path="components" element={<Components />} />
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<Signup />} />
                </Routes>
            </ThemeProvider>
        </Router>
    );
}

export default App;
