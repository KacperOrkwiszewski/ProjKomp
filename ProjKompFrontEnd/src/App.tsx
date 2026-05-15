import { useMemo, useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Timetable from "./components/Timetable";
import { LoginPage } from "./pages/LoginPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { useAuth } from "./auth/AuthContext";
import footerLogo from "./assets/logo-pl.png";
import { ThemeMode, THEME_STORAGE_KEY, getPreferredTheme } from "./utils/ThemeUtils";
import { motion } from "framer-motion";
import { hoverTapScale } from "./utils/MotionUtils";
import "./App.css";

import "../src/assets/TitilliumWeb-Bold-normal.js";
import "../src/assets/TitilliumWeb-Regular-normal.js";

function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

function AppContent() {
  const { width, height } = useWindowSize();
  const [, setIsEditBarVisible] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getPreferredTheme);
  const { user, login, logout } = useAuth();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((previousTheme) => (previousTheme === "dark" ? "light" : "dark"));
  };

  const handleLogout = async () => {
    await logout();
  };

  const contentWidth = Math.min(980, Math.max(760, width * 0.72));
  const CELL_WIDTH_BONUS = 8;
  const CELL_HEIGHT_BONUS = 2;

  const rawGridWidth = contentWidth - 74;
  const colWidth = Math.max(48, Math.floor(rawGridWidth / 12) + CELL_WIDTH_BONUS);
  const gridWidth = colWidth * 12;

  const rawGridHeight = Math.min(380, Math.max(260, height * 0.38));
  const rowHeight = Math.max(34, Math.floor(rawGridHeight / 5) + CELL_HEIGHT_BONUS);
  const gridHeight = rowHeight * 5;
  const headerHeight = Math.max(24, Math.round(rowHeight * 0.65));

  function remToPx(rem: number) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  const gridProps = useMemo(() => ({
    rows: 5,
    cols: 12,
    gridWidth,
    gridHeight,
    rowHeights: [1, 1, 1, 1, 1],
    StartPoint: { x: remToPx(5), y: headerHeight },
    Bin: {
      StartPoint: { x: gridWidth, y: gridHeight + headerHeight},
      height: 62,
      width: 230,
    } 
  }), [gridHeight, gridWidth, headerHeight]);

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-title">WIRTUALNY PLAN ZAJĘĆ POLITECHNIKI ŁÓDZKIEJ</div>
        <div className="app-user">
          <button
            type="button"
            className="app-theme-toggle"
            aria-label="Przelacz motyw"
            onClick={handleThemeToggle}
          >
            <i
              className={`pi ${theme === "dark" ? "pi-sun" : "pi-moon"}`}
            />
          </button>
          {user ? (
            <>
              <span className="app-user-email" title={user.email}>{user.displayName}</span>
              <motion.button 
                type="button" 
                className="app-login-btn app-logout-btn"
                onClick={handleLogout}
                {...hoverTapScale}
              >
                Wyloguj
              </motion.button>
            </>
          ) : (
            <motion.button type="button" className="app-login-btn" onClick={login} {...hoverTapScale}>
              
              <i className="pi pi-user"></i>
              Logowanie
            </motion.button>
          )}
        </div>
      </header>
      <Timetable
        gridProps={gridProps}
        theme={theme}
        onEditBarVisibilityChange={setIsEditBarVisible}
      />

      <footer className="app-footer">
        <div className="app-footer-logo" aria-label="Logo Politechniki Łódzkiej">
          <img className="app-footer-logo-image" src={footerLogo} alt="" aria-hidden="true" />
        </div>
        <div className="app-footer-content">
          <p>Projekt kompetencyjny</p>
          <p>AI powered Class Plan for Lodz University of Technology</p>
          <p>Opiekun projektu: dr. inż Zbigniew Chaniecki</p>
          <p>Wykonawcy:</p>
          <p>Kacper Orkwiszewski</p>
          <p>Krzysztof Wojtal</p>
          <p>Stanislaw Jaworski</p>
          <p>Witold Struminski</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;