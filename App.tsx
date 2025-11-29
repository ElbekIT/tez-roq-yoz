
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Battle from './pages/Battle';
import Settings from './pages/Settings';
import Friends from './pages/Friends';
import { getDatabase, ref, onDisconnect, set, onValue } from 'firebase/database';

// Presence & Security Component
const AppManager = () => {
  useEffect(() => {
    // --- Security Logic ---
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I/C/J, Ctrl+U, Ctrl+S
      if (e.keyCode === 123 || 
         (e.ctrlKey && e.shiftKey && [73, 67, 74].includes(e.keyCode)) || 
         (e.ctrlKey && [85, 83].includes(e.keyCode))) {
        e.preventDefault();
        return false;
      }
    };

    const devToolsDetector = setInterval(() => {
      const startTime = performance.now();
      // debugger; 
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        // Devtools detected
      }
    }, 1000);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // --- Presence Logic (Online/Offline) ---
    const userStr = localStorage.getItem('sozUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      const db = getDatabase();
      const connectedRef = ref(db, ".info/connected");
      const userStatusRef = ref(db, "users/" + user.uid + "/status");

      const unsubscribe = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          // We're connected (or reconnected)!
          onDisconnect(userStatusRef).set("offline");
          set(userStatusRef, "online");
        }
      });

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        clearInterval(devToolsDetector);
        unsubscribe();
        // Set offline when component unmounts (e.g. closing window)
        set(userStatusRef, "offline");
      };
    }

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
        <AppManager />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Public Profile Route */}
          <Route path="/profile/:userId" element={<Profile />} />

          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/friends" element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;
