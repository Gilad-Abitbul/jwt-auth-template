import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { useState } from 'react';
import GlobalStyle from './styles/GlobalStyle';
import { lightTheme, darkTheme } from './styles/themes';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import EmailVerified from './pages/EmailVerified';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/login"
            element={
              <LoginPage
                toggleTheme={() => setIsDarkMode((prev) => !prev)}
                isDarkMode={isDarkMode}
              />
            }
          />
          <Route
            path="/signup"
            element={
              <SignupPage
                toggleTheme={() => setIsDarkMode((prev) => !prev)}
                isDarkMode={isDarkMode}
              />
            }
          />
          <Route path="/home" element={<HomePage />} />
          <Route path="/email-verified" element={<EmailVerified />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;