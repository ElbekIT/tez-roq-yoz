import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Battle from './pages/Battle';
import Settings from './pages/Settings';

// Ultra-Strict Security Component
const Security = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J (Console/Inspect)
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 67 || e.keyCode === 74)) {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }

      // Ctrl+S (Save)
      if (e.ctrlKey && (e.keyCode === 83)) {
        e.preventDefault();
        return false;
      }
    };

    // DevTools Detection Loop (Debugger Trap)
    const devToolsDetector = setInterval(() => {
      const startTime = performance.now();
      // debugger; // This triggers breakpoint if devtools is open
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        // Devtools detected
        alert("Xavfsizlik tizimi: Dasturchi vositalarini ishlatish taqiqlangan!");
        window.location.reload();
      }
    }, 1000);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(devToolsDetector);
    };
  }, []);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userStr = localStorage.getItem('sozUser');
  const location = useLocation();

  if (!userStr) {
    return <Navigate to="/register" state={{ from: location }} replace />;
  }

  // Check if banned
  const user = JSON.parse(userStr);
  if (user.banned) {
    localStorage.clear();
    return <div className="min-h-screen flex items-center justify-center bg-black text-red-600 font-bold text-3xl text-center p-10">
      SIZNING AKKAUNTINGIZ CHEAT ISHLATGANINGIZ UCHUN BLOKLANDI!
    </div>;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent selection:text-bg-primary transition-colors duration-200">
        <Security />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Public Profile Route (can be viewed by anyone, or enforce login if desired) */}
          <Route path="/profile/:userId" element={<Profile />} />

          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/friends" element={
            <ProtectedRoute>
              <div className="p-8 text-center">Tez orada...</div>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;