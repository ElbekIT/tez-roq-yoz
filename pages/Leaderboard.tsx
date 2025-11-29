import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { User } from '../types';
import { Trophy, Crown, Medal, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getDatabase();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch users ordered by score
    const usersRef = query(ref(db, 'users'), orderByChild('score'), limitToLast(50));
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList: User[] = Object.values(data);
        // Sort by score descending (Firebase returns ascending)
        usersList.sort((a, b) => (b.score || 0) - (a.score || 0));
        setUsers(usersList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return "text-yellow-400"; // Gold
    if (index === 1) return "text-gray-300";   // Silver
    if (index === 2) return "text-amber-600";  // Bronze
    return "text-text-secondary";
  };

  const handleRowClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="flex flex-col items-start w-full max-w-6xl mx-auto px-4 py-12 font-mono">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl text-text-primary">All-time Score Leaderboard</h1>
        <p className="text-text-secondary text-sm">Top 50 typists by total score</p>
      </div>

      {loading ? (
        <div className="w-full flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-bg-tertiary border-t-accent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg">
          <div className="min-w-[800px] w-full">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs text-text-secondary uppercase tracking-wider font-bold">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4 pl-2">Name</div>
              <div className="col-span-1 text-right">WPM</div>
              <div className="col-span-1 text-right">Acc</div>
              <div className="col-span-2 text-right">Games</div>
              <div className="col-span-2 text-right">Score</div>
              <div className="col-span-1 text-right">Date</div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-1">
              {users.map((user, index) => (
                <div 
                  key={index}
                  onClick={() => handleRowClick(user.uid)}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 items-center rounded bg-bg-secondary/50 hover:bg-bg-secondary transition-colors border-l-4 cursor-pointer ${index === 0 ? 'border-yellow-400' : 'border-transparent'}`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {index === 0 ? (
                      <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ) : index < 3 ? (
                      <Medal className={`w-5 h-5 ${getRankStyle(index)}`} />
                    ) : (
                      <span className="text-text-secondary font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* Name & Avatar */}
                  <div className="col-span-4 flex items-center gap-3 pl-2">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.name} 
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center text-[10px] font-bold text-text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`${index === 0 ? 'text-text-primary font-bold' : 'text-text-primary'} truncate max-w-[200px]`}>
                        {user.name}
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded font-bold">
                          KING
                        </span>
                      )}
                      {user.score && user.score > 1000 && (
                        <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-bold">
                          PRO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="col-span-1 text-right text-text-primary">
                    {Math.round(user.avgWPM || 0)}
                  </div>
                  <div className="col-span-1 text-right text-text-primary">
                    {Math.round(user.accuracy || 0)}%
                  </div>
                  <div className="col-span-2 text-right text-text-primary">
                    {user.gamesPlayed || 0}
                  </div>
                  <div className="col-span-2 text-right font-bold text-accent">
                    {Math.floor(user.score || 0).toLocaleString()}
                  </div>
                  
                  {/* Date */}
                  <div className="col-span-1 text-right text-xs text-text-secondary whitespace-nowrap">
                    {user.registeredAt ? formatDate(user.registeredAt) : '-'}
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="py-20 text-center text-text-secondary bg-bg-secondary/20 rounded-lg">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Hozircha ma'lumot yo'q</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;