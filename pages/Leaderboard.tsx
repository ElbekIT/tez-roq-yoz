
import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, query, orderByChild, limitToLast, push, set, get } from 'firebase/database';
import { User } from '../types';
import { Trophy, Crown, Medal, UserPlus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Record<string, any>>({});
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  
  const db = getDatabase();
  const navigate = useNavigate();
  
  const currentUserStr = localStorage.getItem('sozUser');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    // Fetch users ordered by score
    const usersRef = query(ref(db, 'users'), orderByChild('score'), limitToLast(50));
    
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList: User[] = Object.values(data);
        // Sort by score descending
        usersList.sort((a, b) => (b.score || 0) - (a.score || 0));
        setUsers(usersList);
      }
      setLoading(false);
    });

    // Fetch my friends to disable button
    if (currentUser) {
      const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
      onValue(friendsRef, (snapshot) => {
        if (snapshot.exists()) {
          setFriends(snapshot.val());
        }
      });
    }

    return () => unsubscribeUsers();
  }, [db, currentUser]);

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

  const sendFriendRequest = async (e: React.MouseEvent, targetUser: User) => {
    e.stopPropagation(); // Prevent row click
    if (!currentUser) {
      navigate('/register');
      return;
    }

    if (sentRequests[targetUser.uid]) return;

    try {
      // Check if request already exists (client side check for UX)
      // Real check happens on Firebase rules or backend usually, but here we do simple client logic
      const targetRef = ref(db, `users/${targetUser.uid}/friendRequests`);
      const newReqRef = push(targetRef);
      
      await set(newReqRef, {
        uid: currentUser.uid,
        name: currentUser.name,
        photoURL: currentUser.photoURL || '',
        timestamp: Date.now(),
        status: 'pending'
      });

      setSentRequests(prev => ({...prev, [targetUser.uid]: true}));
      alert(`${targetUser.name} ga do'stlik so'rovi yuborildi!`);
    } catch (error) {
      console.error("Error sending request", error);
    }
  };

  return (
    <div className="flex flex-col items-start w-full max-w-6xl mx-auto px-4 py-6 md:py-12 font-mono pb-24">
      <div className="flex flex-col gap-2 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl text-text-primary">All-time Score Leaderboard</h1>
        <p className="text-text-secondary text-sm">Top 50 typists by total score</p>
      </div>

      {loading ? (
        <div className="w-full flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-bg-tertiary border-t-accent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg -mx-4 md:mx-0 px-4 md:px-0">
          <div className="min-w-[600px] md:min-w-[800px] w-full">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 py-3 text-xs text-text-secondary uppercase tracking-wider font-bold">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4 md:col-span-4 pl-2">Name</div>
              <div className="col-span-1 text-right hidden md:block">WPM</div>
              <div className="col-span-1 text-right hidden md:block">Acc</div>
              <div className="col-span-2 text-right hidden md:block">Games</div>
              <div className="col-span-3 md:col-span-2 text-right">Score</div>
              <div className="col-span-1 md:col-span-1 text-right">Action</div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-1">
              {users.map((user, index) => {
                const isMe = currentUser?.uid === user.uid;
                const isFriend = friends[user.uid];
                const isRequested = sentRequests[user.uid];
                
                return (
                  <div 
                    key={index}
                    onClick={() => handleRowClick(user.uid)}
                    className={`grid grid-cols-12 gap-2 md:gap-4 px-4 py-3 items-center rounded bg-bg-secondary/50 hover:bg-bg-secondary transition-colors border-l-4 cursor-pointer ${index === 0 ? 'border-yellow-400' : 'border-transparent'}`}
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

                    {/* Name & Avatar & Status */}
                    <div className="col-span-4 md:col-span-4 flex items-center gap-3 pl-2">
                      <div className="relative">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.name} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-[10px] font-bold text-text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {/* Online Status Dot */}
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-bg-secondary ${user.status === 'online' ? 'bg-success' : 'bg-gray-500'}`}></div>
                      </div>
                      
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className={`${index === 0 ? 'text-text-primary font-bold' : 'text-text-primary'} truncate max-w-[100px] md:max-w-[180px]`}>
                            {user.name}
                          </span>
                          {index === 0 && (
                            <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded font-bold hidden sm:inline-block">
                              KING
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="col-span-1 text-right text-text-primary hidden md:block">
                      {Math.round(user.avgWPM || 0)}
                    </div>
                    <div className="col-span-1 text-right text-text-primary hidden md:block">
                      {Math.round(user.accuracy || 0)}%
                    </div>
                    <div className="col-span-2 text-right text-text-primary hidden md:block">
                      {user.gamesPlayed || 0}
                    </div>
                    
                    {/* Score */}
                    <div className="col-span-3 md:col-span-2 text-right font-bold text-accent">
                      {Math.floor(user.score || 0).toLocaleString()}
                    </div>
                    
                    {/* Action (Add Friend) */}
                    <div className="col-span-1 md:col-span-1 flex justify-end">
                      {!isMe && !isFriend && (
                        <button 
                          onClick={(e) => sendFriendRequest(e, user)}
                          className={`p-1.5 rounded transition-colors ${isRequested ? 'text-success cursor-default' : 'text-text-secondary hover:text-accent hover:bg-bg-tertiary'}`}
                          title={isRequested ? "Yuborilgan" : "Do'stlik taklif qilish"}
                          disabled={!!isRequested}
                        >
                          {isRequested ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

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
