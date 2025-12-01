
import React, { useState, useEffect, useRef } from 'react';
import { Swords, Users, LogOut, Play, Clock, Copy, ArrowRight, UserPlus } from 'lucide-react';
import { getDatabase, ref, set, get, onValue, update, remove } from 'firebase/database';
import { Room, BattlePlayer, User } from '../types';
import { useNavigate } from 'react-router-dom';

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const WORDS_LIST = [
  "olma", "nok", "uzum", "shaftoli", "gilos", "qovun", "tarvuz", "banan",
  "kitob", "qalam", "daftar", "stol", "stul", "deraza", "eshik", "kalit",
  "uy", "xona", "oshxona", "hammom", "yotoqxona", "bog'", "hovli", "ko'cha",
  "oy", "quyosh", "yulduz", "bulut", "yomg'ir", "qor", "shamol", "issiq",
  "suv", "choy", "qahva", "non", "guruch", "makaron", "go'sht", "baliq",
  "dasturlash", "texnologiya", "internet", "tarmoq", "xavfsizlik", "tizim"
];

const generateText = () => Array.from({ length: 30 }, () => WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)]).join(' ');

const Battle: React.FC = () => {
  const [view, setView] = useState<'lobby' | 'room' | 'race' | 'results'>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [onlineFriends, setOnlineFriends] = useState<User[]>([]);
  
  // Game State
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const db = getDatabase();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentUserStr = localStorage.getItem('sozUser');
  const currentUser: User | null = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    if (!currentUser) {
      navigate('/register');
      return;
    }

    // Fetch Online Friends
    const friendsRef = ref(db, `users/${currentUser.uid}/friends`);
    onValue(friendsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const friendsList = Object.values(data) as any[];
        const online: User[] = [];
        friendsList.forEach(friend => {
          const statusRef = ref(db, `users/${friend.uid}/status`);
          onValue(statusRef, (snap) => {
            if (snap.val() === 'online') {
              // Avoid duplicates if re-triggering
              setOnlineFriends(prev => {
                if (prev.find(f => f.uid === friend.uid)) return prev;
                return [...prev, friend];
              });
            } else {
              setOnlineFriends(prev => prev.filter(f => f.uid !== friend.uid));
            }
          });
        });
      }
    });
  }, [currentUser, navigate, db]);

  // Sync Room Data
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentRoom(data);
        
        if (data.status === 'racing' && view !== 'race') {
           setView('race');
           setText(data.text);
           setStartTime(Date.now());
           setTimeout(() => inputRef.current?.focus(), 100);
        } else if (data.status === 'finished' && view !== 'results') {
           setView('results');
        }
      } else {
        if (view !== 'lobby') {
          alert("Xona yopildi.");
          leaveRoom(true);
        }
      }
    });

    return () => unsubscribe();
  }, [roomCode, db, view]);

  const createRoom = async () => {
    if (!currentUser) return;
    const code = generateRoomCode();
    const roomRef = ref(db, `rooms/${code}`);
    
    const initialPlayer: BattlePlayer = {
      uid: currentUser.uid,
      name: currentUser.name,
      photoURL: currentUser.photoURL,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false
    };

    const newRoom: Room = {
      id: code,
      code: code,
      hostId: currentUser.uid,
      status: 'waiting',
      text: generateText(),
      players: { [currentUser.uid]: initialPlayer },
      createdAt: Date.now(),
      settings: { difficulty: 'medium', duration: 0 }
    };

    await set(roomRef, newRoom);
    setRoomCode(code);
    setView('room');
  };

  const joinRoom = async () => {
    if (!joinCode || !currentUser) return;
    
    const code = joinCode.toUpperCase();
    const roomRef = ref(db, `rooms/${code}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const room = snapshot.val();
      if (room.status !== 'waiting') {
        alert("O'yin allaqachon boshlangan!");
        return;
      }
      
      const newPlayer: BattlePlayer = {
        uid: currentUser.uid,
        name: currentUser.name,
        photoURL: currentUser.photoURL,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false
      };

      await update(ref(db, `rooms/${code}/players`), {
        [currentUser.uid]: newPlayer
      });
      
      setRoomCode(code);
      setView('room');
    } else {
      alert("Xona topilmadi!");
    }
  };

  const leaveRoom = async (force = false) => {
    if (!currentUser || !roomCode) {
      setView('lobby');
      setRoomCode('');
      return;
    }

    if (currentRoom?.hostId === currentUser.uid && !force) {
      if (confirm("Siz hostsiz. Xonani yopsangiz hamma chiqarib yuboriladi.")) {
        await remove(ref(db, `rooms/${roomCode}`));
      } else {
        return;
      }
    } else {
      await remove(ref(db, `rooms/${roomCode}/players/${currentUser.uid}`));
    }
    
    setView('lobby');
    setRoomCode('');
    setCurrentRoom(null);
    setIsFinished(false);
    setInput('');
    setWpm(0);
  };

  const startRace = async () => {
    if (!roomCode) return;
    await update(ref(db, `rooms/${roomCode}`), { status: 'starting' });
    
    let count = 5;
    const interval = setInterval(() => {
      setCountdown(count);
      count--;
      if (count < 0) {
        clearInterval(interval);
        setCountdown(null);
        update(ref(db, `rooms/${roomCode}`), { status: 'racing', startTime: Date.now() });
      }
    }, 1000);
  };

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !roomCode || isFinished) return;
    
    const value = e.target.value;
    setInput(value);

    const progressVal = Math.min(100, Math.round((value.length / text.length) * 100));
    const words = value.trim().split(' ').length;
    const minutes = (Date.now() - (currentRoom?.startTime || Date.now())) / 60000;
    const currentWpm = Math.round(words / minutes) || 0;

    let correct = 0;
    for(let i=0; i<value.length; i++) if(value[i] === text[i]) correct++;
    const acc = Math.round((correct / value.length) * 100) || 100;

    await update(ref(db, `rooms/${roomCode}/players/${currentUser.uid}`), {
      progress: progressVal,
      wpm: currentWpm,
      accuracy: acc
    });

    if (value === text) {
      setIsFinished(true);
      await update(ref(db, `rooms/${roomCode}/players/${currentUser.uid}`), {
        finished: true,
        wpm: currentWpm,
        progress: 100
      });
      
      const allFinished = Object.values(currentRoom?.players || {}).every(p => p.finished || p.uid === currentUser.uid);
      if (allFinished) {
        await update(ref(db, `rooms/${roomCode}`), { status: 'finished' });
      }
    }
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let color = 'text-text-secondary';
      if (index < input.length) {
        color = input[index] === char ? 'text-text-primary' : 'text-error';
      }
      return <span key={index} className={color}>{char}</span>;
    });
  };

  if (view === 'lobby') {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col items-center font-mono pb-24">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="w-8 h-8 md:w-10 md:h-10 text-accent" />
          <h1 className="text-2xl md:text-4xl font-bold text-text-primary">Battle Arena</h1>
        </div>
        <p className="text-text-secondary mb-10 text-center text-sm md:text-base">Do'stlar bilan bellashing va kim eng tez ekanligini aniqlang!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
          {/* Join Section */}
          <div className="bg-bg-secondary border-2 border-bg-tertiary rounded-2xl p-8 flex flex-col items-center shadow-lg">
            <div className="bg-bg-primary w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-success" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Poygaga Qo'shilish</h3>
            <p className="text-sm text-text-secondary mb-4">Do'stingizdan kodni oling</p>
            <div className="flex gap-2 w-full">
              <input 
                type="text" 
                placeholder="KOD"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                className="flex-1 bg-bg-primary border border-bg-tertiary rounded-lg px-3 py-3 text-center uppercase font-bold outline-none focus:border-accent text-lg tracking-widest"
              />
              <button 
                onClick={joinRoom}
                className="bg-accent text-bg-primary font-bold px-4 rounded-lg hover:opacity-90 flex items-center justify-center"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Create Section */}
          <div 
            onClick={createRoom}
            className="bg-bg-secondary border-2 border-bg-tertiary hover:border-accent rounded-2xl p-8 cursor-pointer transition-all group text-center flex flex-col items-center shadow-lg"
          >
            <div className="bg-bg-primary w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Swords className="w-7 h-7 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Poyga Yaratish</h3>
            <p className="text-sm text-text-secondary">Yangi xona oching</p>
          </div>
        </div>

        {/* Online Friends List for Challenge */}
        <div className="w-full max-w-3xl bg-bg-secondary border border-bg-tertiary rounded-xl p-6">
          <h3 className="text-text-primary font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            Online Do'stlar
          </h3>
          {onlineFriends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onlineFriends.map(friend => (
                <div key={friend.uid} className="flex items-center justify-between bg-bg-primary p-3 rounded-lg border border-bg-tertiary">
                  <div className="flex items-center gap-3">
                    {friend.photoURL ? (
                      <img src={friend.photoURL} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold">{friend.name.charAt(0)}</div>
                    )}
                    <span className="text-sm font-bold text-text-primary">{friend.name}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      await createRoom();
                      // In a real app, send invite notification here.
                      // For now, just create room and user can copy code.
                    }}
                    className="text-xs bg-bg-tertiary hover:bg-accent hover:text-bg-primary px-3 py-1.5 rounded transition-colors"
                  >
                    Battle!
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-sm text-center py-4">Hozircha hech kim online emas.</p>
          )}
        </div>
      </div>
    );
  }

  // Room, Race, Results views remain similar but ensure updated UI consistency...
  if (view === 'room') {
    const isHost = currentRoom?.hostId === currentUser?.uid;
    const playersList = Object.values(currentRoom?.players || {});

    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-12 font-mono">
        <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-8 text-center relative overflow-hidden">
          {countdown !== null ? (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary z-50">
              <div className="text-9xl font-bold text-accent animate-pulse">{countdown}</div>
            </div>
          ) : null}
          
          <div className="mb-8">
            <h2 className="text-text-secondary text-sm uppercase tracking-widest mb-2">Xona Kodi</h2>
            <div className="flex items-center justify-center gap-4 bg-bg-primary py-4 rounded-xl border border-bg-tertiary w-fit mx-auto px-8">
              <span className="text-4xl font-bold text-accent tracking-wider">{roomCode}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  alert("Kod nusxalandi!");
                }} 
                className="p-2 hover:bg-bg-tertiary rounded-lg text-text-secondary"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2">Ushbu kodni do'stlaringizga yuboring</p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              O'yinchilar ({playersList.length})
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {playersList.map(p => (
                <div key={p.uid} className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <div className="relative">
                    {p.photoURL ? (
                      <img src={p.photoURL} className="w-14 h-14 rounded-full border-2 border-bg-tertiary" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-xl">{p.name.charAt(0)}</div>
                    )}
                    {currentRoom?.hostId === p.uid && (
                      <span className="absolute -top-2 -right-2 text-xs bg-accent text-bg-primary px-1.5 py-0.5 rounded-full font-bold border border-bg-primary">HOST</span>
                    )}
                  </div>
                  <span className="text-xs text-text-primary font-bold">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => leaveRoom()}
              className="px-6 py-3 bg-bg-primary border border-bg-tertiary rounded-xl text-text-secondary hover:text-error hover:border-error transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Chiqish
            </button>
            {isHost && (
              <button 
                onClick={startRace}
                className="px-8 py-3 bg-accent text-bg-primary font-bold rounded-xl hover:bg-opacity-90 transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-accent/20"
              >
                <Play className="w-4 h-4" /> Boshlash
              </button>
            )}
          </div>
          {!isHost && <p className="mt-4 text-xs text-text-secondary animate-pulse">Host boshlashini kuting...</p>}
        </div>
      </div>
    );
  }

  // Reuse Race and Results view from previous implementation logic, just ensure styling matches
  if (view === 'race') {
    const playersList = Object.values(currentRoom?.players || {}).sort((a, b) => b.progress - a.progress);

    return (
      <div className="max-w-5xl mx-auto w-full px-4 py-8 font-mono flex flex-col gap-8">
        <div className="grid gap-3">
          {playersList.map(p => (
            <div key={p.uid} className={`bg-bg-secondary p-3 rounded-xl border ${p.uid === currentUser?.uid ? 'border-accent' : 'border-bg-tertiary'} transition-all duration-300`}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-text-primary flex items-center gap-2">
                  {p.name} {p.finished && '🏁'}
                </span>
                <span className="text-text-secondary">{p.wpm} WPM</span>
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${p.finished ? 'bg-success' : p.uid === currentUser?.uid ? 'bg-accent' : 'bg-text-secondary'}`} 
                  style={{ width: `${p.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {!isFinished ? (
          <div 
            className="relative w-full text-2xl leading-relaxed font-mono min-h-[150px] outline-none group cursor-text bg-bg-secondary/20 p-6 rounded-2xl border border-bg-tertiary"
            onClick={() => inputRef.current?.focus()}
          >
            <div className="pointer-events-none select-none">
              {renderText()}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInput}
              className="absolute inset-0 opacity-0 cursor-default"
              autoFocus
              autoComplete="off"
            />
          </div>
        ) : (
          <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-success mb-2">Tugadi!</h2>
            <p className="text-text-secondary">Boshqalar tugatishini kuting...</p>
          </div>
        )}
      </div>
    );
  }

  if (view === 'results') {
    const sortedPlayers = Object.values(currentRoom?.players || {}).sort((a, b) => b.wpm - a.wpm);

    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-12 font-mono">
        <div className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center text-text-primary mb-8 flex items-center justify-center gap-3">
            <Swords className="w-8 h-8 text-accent" />
            Natijalar
          </h2>

          <div className="space-y-4">
            {sortedPlayers.map((p, index) => (
              <div key={p.uid} className={`flex items-center justify-between p-4 rounded-xl ${index === 0 ? 'bg-yellow-400/10 border border-yellow-400/50' : 'bg-bg-primary border border-bg-tertiary'}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-bold w-8 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-text-secondary'}`}>
                    #{index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-text-primary">{p.name}</span>
                    <span className="text-xs text-text-secondary">{p.accuracy}% Acc</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-accent">{p.wpm} <span className="text-xs text-text-secondary">WPM</span></div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button onClick={() => leaveRoom()} className="px-6 py-3 bg-bg-primary border border-bg-tertiary rounded-xl hover:bg-bg-tertiary transition-colors">
              Lobbyga qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default Battle;
