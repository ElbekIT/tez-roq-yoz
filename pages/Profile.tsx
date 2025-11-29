import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Activity, Clock, Target, Zap, Keyboard, Calendar } from 'lucide-react';
import { getDatabase, ref, get } from 'firebase/database';
import { User as UserType } from '../types';

const Profile: React.FC = () => {
  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userId } = useParams(); // Get user ID from URL if present
  const db = getDatabase();

  useEffect(() => {
    const fetchUserData = async () => {
      let targetUid = userId;

      // If no userId in URL, check local storage (current logged in user)
      if (!targetUid) {
        const localUser = localStorage.getItem('sozUser');
        if (localUser) {
          const parsedUser = JSON.parse(localUser);
          targetUid = parsedUser.uid;
        } else {
          // If no login and no ID, redirect to register
          navigate('/register');
          return;
        }
      }

      if (!targetUid) return;

      try {
        const userRef = ref(db, `users/${targetUid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUserData(snapshot.val());
        } else {
          // User not found in DB
          console.error("User not found");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [db, navigate, userId]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-80px)]"><div className="w-10 h-10 border-4 border-bg-tertiary border-t-accent rounded-full animate-spin"></div></div>;
  }

  if (!userData) {
    return <div className="text-center py-20 text-text-secondary">Foydalanuvchi topilmadi.</div>;
  }

  const joinDate = new Date(userData.registeredAt || Date.now()).toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  const totalTimeHours = Math.floor((userData.totalTime || 0) / 3600);
  const totalTimeMinutes = Math.floor(((userData.totalTime || 0) % 3600) / 60);
  const timeString = `${String(totalTimeHours).padStart(2, '0')}:${String(totalTimeMinutes).padStart(2, '0')}:${String((userData.totalTime || 0) % 60).padStart(2, '0')}`;

  const gameHistory = userData.gameHistory || [];
  const recentTests = [...gameHistory].reverse().slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 font-mono">
      {/* Profile Header */}
      <div className="bg-bg-secondary rounded-xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -mr-10 -mt-10"></div>
        
        <div className="flex items-center gap-6 z-10">
          <div className="relative">
            {userData.photoURL ? (
              <img src={userData.photoURL} alt={userData.name} className="w-24 h-24 rounded-full object-cover border-4 border-bg-tertiary" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-bg-tertiary flex items-center justify-center text-4xl font-bold text-text-secondary border-4 border-bg-primary">
                {userData.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-bg-primary px-2 py-1 rounded text-xs border border-bg-tertiary text-text-secondary">
              LVL {Math.floor((userData.score || 0) / 100) + 1}
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-text-primary">{userData.name}</h1>
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Calendar className="w-3 h-3" />
              <span>Joined {joinDate}</span>
            </div>
            {userData.email && (
               <div className="text-xs text-text-secondary/50 mt-1">{userData.email}</div>
            )}
          </div>
        </div>

        {/* Quick Stats - Big Numbers */}
        <div className="flex-1 flex justify-around md:justify-end gap-8 md:gap-12 z-10 mt-6 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-bg-tertiary pt-6 md:pt-0">
          <div className="text-center">
            <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Tests Started</div>
            <div className="text-3xl font-bold text-text-primary">{userData.gamesPlayed || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Tests Completed</div>
            <div className="text-3xl font-bold text-text-primary">{gameHistory.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Time Typing</div>
            <div className="text-3xl font-bold text-text-primary">{timeString}</div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatBox label="15 Seconds Best" value={userData.maxWPM || '-'} sub="wpm" />
        <StatBox label="60 Seconds Best" value="-" sub="wpm" /> {/* Placeholder logic needed for distinct modes */}
        <StatBox label="Average WPM" value={Math.round(userData.avgWPM || 0)} sub="last 10 tests" />
        <StatBox label="Average Accuracy" value={`${Math.round(userData.accuracy || 0)}%`} sub="last 10 tests" />
      </div>

      {/* History Section */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end border-b border-bg-tertiary pb-2">
          <h3 className="text-xl text-text-primary">Recent Tests</h3>
        </div>

        {recentTests.length > 0 ? (
          <div className="grid gap-2">
             {/* History Header */}
             <div className="grid grid-cols-5 md:grid-cols-6 px-4 py-2 text-xs text-text-secondary uppercase font-bold tracking-wider">
               <div className="col-span-1">wpm</div>
               <div className="col-span-1">accuracy</div>
               <div className="col-span-1">mode</div>
               <div className="col-span-1 hidden md:block">score</div>
               <div className="col-span-2 text-right">date</div>
             </div>
             
             {/* History Rows */}
             {recentTests.map((test, i) => (
               <div key={i} className="grid grid-cols-5 md:grid-cols-6 px-4 py-3 bg-bg-secondary/50 rounded hover:bg-bg-secondary transition-colors items-center text-sm">
                 <div className="col-span-1 text-2xl font-bold text-text-primary">{test.wpm}</div>
                 <div className="col-span-1 text-text-primary">{test.accuracy}%</div>
                 <div className="col-span-1 text-text-secondary text-xs">{test.mode}</div>
                 <div className="col-span-1 hidden md:block text-text-secondary">{test.score}</div>
                 <div className="col-span-2 text-right text-text-secondary text-xs">
                   {new Date(test.timestamp).toLocaleString('en-GB', { 
                     day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                   })}
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="py-12 text-center text-text-secondary bg-bg-secondary/20 rounded-lg">
            No test history available.
          </div>
        )}
      </div>
    </div>
  );
};

const StatBox = ({ label, value, sub }: { label: string, value: string | number, sub: string }) => (
  <div className="bg-bg-secondary p-6 rounded-xl flex flex-col justify-between h-32 hover:bg-bg-secondary/80 transition-colors cursor-default">
    <div className="text-xs text-text-secondary uppercase font-bold">{label}</div>
    <div className="text-4xl font-bold text-text-primary truncate">{value}</div>
    <div className="text-xs text-text-secondary/50">{sub}</div>
  </div>
);

export default Profile;