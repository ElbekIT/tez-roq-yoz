
import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Check, X, MessageSquare } from 'lucide-react';
import { getDatabase, ref, onValue, push, set, get, update, remove } from 'firebase/database';
import { User, FriendRequest } from '../types';
import { useNavigate } from 'react-router-dom';

const Friends: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'requests' | 'add'>('list');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  const db = getDatabase();
  const navigate = useNavigate();
  const currentUserStr = localStorage.getItem('sozUser');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (!currentUser) return;

    // Load Friends
    const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
    onValue(friendsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFriends(Object.values(data));
      } else {
        setFriends([]);
      }
    });

    // Load Requests
    const requestsRef = ref(db, `users/${currentUser.uid}/friendRequests`);
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reqs = Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          requestId: key
        }));
        setRequests(reqs);
      } else {
        setRequests([]);
      }
    });
  }, [db, currentUser]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchResults([]);

    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const allUsers = Object.values(snapshot.val()) as User[];
        const results = allUsers.filter(u => 
          u.uid !== currentUser.uid && 
          u.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (targetUser: User) => {
    if (!currentUser) return;
    
    // Add request to target user
    const targetRef = ref(db, `users/${targetUser.uid}/friendRequests`);
    const newReqRef = push(targetRef);
    
    await set(newReqRef, {
      uid: currentUser.uid,
      name: currentUser.name,
      photoURL: currentUser.photoURL || '',
      timestamp: Date.now(),
      status: 'pending'
    });

    alert("Do'stlik so'rovi yuborildi!");
    setSearchResults(prev => prev.filter(u => u.uid !== targetUser.uid));
  };

  const acceptRequest = async (req: any) => {
    if (!currentUser) return;

    // Add to my friends
    await set(ref(db, `users/${currentUser.uid}/friends/${req.uid}`), {
      uid: req.uid,
      name: req.name,
      photoURL: req.photoURL,
      since: Date.now()
    });

    // Add me to their friends
    await set(ref(db, `users/${req.uid}/friends/${currentUser.uid}`), {
      uid: currentUser.uid,
      name: currentUser.name,
      photoURL: currentUser.photoURL,
      since: Date.now()
    });

    // Remove request
    await remove(ref(db, `users/${currentUser.uid}/friendRequests/${req.requestId}`));
  };

  const rejectRequest = async (requestId: string) => {
    if (!currentUser) return;
    await remove(ref(db, `users/${currentUser.uid}/friendRequests/${requestId}`));
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 font-mono pb-24">
      <h1 className="text-3xl font-bold text-text-primary mb-8 flex items-center gap-3">
        <Users className="w-8 h-8 text-accent" />
        Do'stlar
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-bg-tertiary">
        <button 
          onClick={() => setActiveTab('list')}
          className={`pb-2 px-4 font-bold transition-colors ${activeTab === 'list' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Do'stlarim ({friends.length})
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`pb-2 px-4 font-bold transition-colors ${activeTab === 'requests' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
        >
          So'rovlar ({requests.length})
        </button>
        <button 
          onClick={() => setActiveTab('add')}
          className={`pb-2 px-4 font-bold transition-colors ${activeTab === 'add' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Qo'shish
        </button>
      </div>

      {/* Friends List */}
      {activeTab === 'list' && (
        <div className="grid gap-4">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <div key={friend.uid} className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 flex items-center justify-between hover:border-accent transition-colors">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/profile/${friend.uid}`)}>
                  {friend.photoURL ? (
                    <img src={friend.photoURL} alt={friend.name} className="w-12 h-12 rounded-full border-2 border-bg-tertiary" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-lg">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-text-primary">{friend.name}</h3>
                    <p className="text-xs text-text-secondary">Do'st</p>
                  </div>
                </div>
                <button className="p-2 bg-bg-primary rounded-lg text-text-secondary hover:text-accent hover:bg-bg-tertiary transition-colors" title="Xabar yozish">
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-text-secondary bg-bg-secondary/20 rounded-xl">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Hozircha do'stlaringiz yo'q.</p>
              <button onClick={() => setActiveTab('add')} className="text-accent hover:underline mt-2">Do'st qidirish</button>
            </div>
          )}
        </div>
      )}

      {/* Requests */}
      {activeTab === 'requests' && (
        <div className="grid gap-4">
          {requests.length > 0 ? (
            requests.map((req) => (
              <div key={req.requestId} className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {req.photoURL ? (
                    <img src={req.photoURL} alt={req.name} className="w-12 h-12 rounded-full border-2 border-bg-tertiary" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-lg">
                      {req.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-text-primary">{req.name}</h3>
                    <p className="text-xs text-text-secondary">Do'stlik so'rovi</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptRequest(req)} className="p-2 bg-success text-white rounded-lg hover:opacity-90 transition-opacity">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => rejectRequest(req.requestId)} className="p-2 bg-error text-white rounded-lg hover:opacity-90 transition-opacity">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-text-secondary bg-bg-secondary/20 rounded-xl">
              <p>Yangi so'rovlar yo'q.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Friend */}
      {activeTab === 'add' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Foydalanuvchi ismini qidiring..."
                className="w-full bg-bg-secondary border border-bg-tertiary rounded-xl py-3 pl-12 pr-4 text-text-primary outline-none focus:border-accent transition-colors"
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="px-6 bg-accent text-bg-primary font-bold rounded-xl hover:bg-opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '...' : 'Qidirish'}
            </button>
          </div>

          <div className="grid gap-4">
            {searchResults.map((u) => (
              <div key={u.uid} className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/profile/${u.uid}`)}>
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.name} className="w-12 h-12 rounded-full border-2 border-bg-tertiary" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-lg">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-text-primary">{u.name}</h3>
                    <p className="text-xs text-text-secondary">LVL {Math.floor((u.score || 0) / 100) + 1}</p>
                  </div>
                </div>
                <button 
                  onClick={() => sendRequest(u)}
                  className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-accent hover:text-bg-primary rounded-lg transition-colors font-bold text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Qo'shish</span>
                </button>
              </div>
            ))}
            {searchResults.length === 0 && searchQuery && !loading && (
              <div className="text-center py-10 text-text-secondary">
                Hech kim topilmadi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
