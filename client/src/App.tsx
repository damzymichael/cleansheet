import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import Home from "./pages/Home";

function App() {
    return (
        <ThemeProvider defaultTheme="system" storageKey="cleansheet-ui-theme">
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
