import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Keyboard, Trophy, User, Users, Swords, LogOut, LogIn, Settings, Home } from 'lucide-react';
import { auth } from '../firebase';
import { User as UserType } from '../types';
import { getDatabase, ref, onValue } from 'firebase/database';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userStr = localStorage.getItem('sozUser');
  const user: UserType | null = userStr ? JSON.parse(userStr) : null;
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (user) {
      const db = getDatabase();
      const requestsRef = ref(db, `users/${user.uid}/friendRequests`);
      onValue(requestsRef, (snapshot) => {
        if (snapshot.exists()) {
          setRequestCount(Object.keys(snapshot.val()).length);
        } else {
          setRequestCount(0);
        }
      });
    }
  }, [user?.uid]);

  // Improved active state detection that handles sub-routes
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    if (window.confirm("Rostdan ham chiqmoqchimisiz?")) {
      try {
        await auth.signOut();
        localStorage.removeItem('sozUser');
        navigate('/');
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  // Helper to scroll to top on navigation instantly for snappy feel
  const onNavClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-4 max-w-7xl mx-auto w-full sticky top-0 z-[9999] bg-bg-primary/95 backdrop-blur-md border-b border-transparent transition-all duration-300 select-none">
        <Link to="/" onClick={onNavClick} className="flex items-center gap-3 group">
          <Keyboard className="w-8 h-8 text-accent group-hover:animate-pulse transition-transform group-hover:scale-110" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-text-primary tracking-tighter leading-none">tez roq yoz</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-medium group-hover:text-accent transition-colors hidden sm:block">professional</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 bg-bg-secondary/80 px-2 py-1.5 rounded-xl border border-bg-tertiary backdrop-blur-sm shadow-sm">
          <Link to="/" onClick={onNavClick} className={`p-2 rounded-lg transition-all ${isActive('/') ? 'text-accent bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'}`} title="Bosh sahifa">
            <Keyboard className="w-5 h-5" />
          </Link>
          <Link to="/leaderboard" onClick={onNavClick} className={`p-2 rounded-lg transition-all ${isActive('/leaderboard') ? 'text-accent bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'}`} title="Reyting">
            <Trophy className="w-5 h-5" />
          </Link>
          <Link to="/battle" onClick={onNavClick} className={`p-2 rounded-lg transition-all ${isActive('/battle') ? 'text-accent bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'}`} title="Battle">
            <Swords className="w-5 h-5" />
          </Link>
          
          {user && (
            <>
              <div className="w-px h-5 bg-bg-tertiary mx-1"></div>
              <Link to="/friends" onClick={onNavClick} className={`p-2 rounded-lg transition-all relative ${isActive('/friends') ? 'text-accent bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'}`} title="Do'stlar">
                <Users className="w-5 h-5" />
                {requestCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                )}
              </Link>
              <Link to="/profile" onClick={onNavClick} className={`p-2 rounded-lg transition-all ${isActive('/profile') ? 'text-accent bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'}`} title="Profil">
                <User className="w-5 h-5" />
              </Link>
            </>
          )}
          
          <Link to="/settings" onClick={onNavClick} className={`p-2 rounded-lg transition-all ${isActive('/settings') ? 'text-accent bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'}`} title="Sozlamalar">
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-text-primary">{user.name}</div>
              <div className="text-xs text-text-secondary">LVL {Math.floor((user.score || 0) / 100) + 1}</div>
            </div>
            <div className="relative group cursor-pointer" onClick={() => navigate('/profile')}>
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full border-2 border-bg-tertiary group-hover:border-accent transition-colors object-cover shadow-sm" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-10 h-10 rounded-full bg-accent text-bg-primary flex items-center justify-center font-bold text-lg border-2 border-bg-tertiary group-hover:border-accent transition-colors ${user.photoURL ? 'hidden' : ''}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-bg-secondary rounded-full flex items-center justify-center border border-bg-tertiary text-error hover:bg-error hover:text-white transition-all shadow-md z-10 hidden md:flex"
                title="Chiqish"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <Link 
            to="/register" 
            onClick={onNavClick}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-xl border border-bg-tertiary transition-all font-bold text-sm hover:border-accent group"
          >
            <LogIn className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors" />
            <span>Kirish</span>
          </Link>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-bg-secondary/95 backdrop-blur-md border-t border-bg-tertiary z-[9999] px-6 py-2 pb-safe shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.3)] touch-manipulation select-none">
        <div className="flex justify-between items-center max-w-sm mx-auto">
          <Link to="/" onClick={onNavClick} className={`flex flex-col items-center gap-1 p-2 transition-colors active:scale-95 ${isActive('/') ? 'text-accent' : 'text-text-secondary'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Uya</span>
          </Link>
          <Link to="/leaderboard" onClick={onNavClick} className={`flex flex-col items-center gap-1 p-2 transition-colors active:scale-95 ${isActive('/leaderboard') ? 'text-accent' : 'text-text-secondary'}`}>
            <Trophy className="w-6 h-6" />
            <span className="text-[10px] font-medium">Reyting</span>
          </Link>
          <Link to="/battle" onClick={onNavClick} className={`flex flex-col items-center gap-1 p-2 transition-colors active:scale-95 ${isActive('/battle') ? 'text-accent' : 'text-text-secondary'}`}>
            <Swords className="w-6 h-6" />
            <span className="text-[10px] font-medium">Battle</span>
          </Link>
          {user && (
             <Link to="/friends" onClick={onNavClick} className={`flex flex-col items-center gap-1 p-2 relative transition-colors active:scale-95 ${isActive('/friends') ? 'text-accent' : 'text-text-secondary'}`}>
               <Users className="w-6 h-6" />
               {requestCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>}
               <span className="text-[10px] font-medium">Do'stlar</span>
             </Link>
          )}
          <Link to={user ? "/profile" : "/register"} onClick={onNavClick} className={`flex flex-col items-center gap-1 p-2 transition-colors active:scale-95 ${isActive('/profile') || isActive('/register') ? 'text-accent' : 'text-text-secondary'}`}>
            {user && user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className={`w-6 h-6 rounded-full border ${isActive('/profile') ? 'border-accent' : 'border-transparent'} object-cover`} />
            ) : (
                <User className="w-6 h-6" />
            )}
            <span className="text-[10px] font-medium">{user ? 'Profil' : 'Kirish'}</span>
          </Link>
        </div>
      </div>
      
      {/* Add bottom padding for content on mobile so it's not hidden by nav */}
      <div className="md:hidden h-20"></div>
    </>
  );
};

export default Navbar;