import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import Home from "./pages/Home";
import { Components } from "./pages/Components";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
    return (
        <Router>
            <ThemeProvider defaultTheme="system" storageKey="cleansheet-ui-theme">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="components" element={<Components />} />
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<Signup />} />
                </Routes>
            </ThemeProvider>
        </Router>
    );
}

export default App;
