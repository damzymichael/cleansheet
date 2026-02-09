import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import Home from "./pages/Home";
import { Components } from "./pages/Components";

function App() {
    return (
        <Router>
            <ThemeProvider defaultTheme="system" storageKey="cleansheet-ui-theme">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="components" element={<Components />} />
                </Routes>
            </ThemeProvider>
        </Router>
    );
}

export default App;
