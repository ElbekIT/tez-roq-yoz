import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Zap, Clock, Target, AlertTriangle } from 'lucide-react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { User, GameHistory } from '../types';

const WORDS_LIST = [
  "olma", "nok", "uzum", "shaftoli", "gilos", "qovun", "tarvuz", "banan",
  "kitob", "qalam", "daftar", "stol", "stul", "deraza", "eshik", "kalit",
  "uy", "xona", "oshxona", "hammom", "yotoqxona", "bog'", "hovli", "ko'cha",
  "oy", "quyosh", "yulduz", "bulut", "yomg'ir", "qor", "shamol", "issiq",
  "suv", "choy", "qahva", "non", "guruch", "makaron", "go'sht", "baliq",
  "bola", "qiz", "ona", "ota", "aka", "opa", "uka", "singil",
  "telefon", "kompyuter", "televizor", "muzlatgich", "dasturlash", "texnologiya",
  "internet", "sahifa", "tarmoq", "xavfsizlik", "tizim", "ma'lumot", "aloqa"
];

const generateWords = (count: number) => {
  return Array.from({ length: count }, () => WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)]).join(' ');
};

const TypingTest: React.FC = () => {
  const savedTime = parseInt(localStorage.getItem('defaultTime') || '30');
  
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(savedTime);
  const [isActive, setIsActive] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedTime, setSelectedTime] = useState(savedTime);
  const [isCheatDetected, setIsCheatDetected] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const db = getDatabase();

  // Anti-Cheat Variables
  const lastKeyTime = useRef<number>(0);
  const keyIntervals = useRef<number[]>([]);

  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTime]);

  const resetGame = () => {
    setText(generateWords(50));
    setInput('');
    setTimeLeft(selectedTime);
    setIsActive(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setIsCheatDetected(false);
    keyIntervals.current = [];
    lastKeyTime.current = 0;
    if (inputRef.current) inputRef.current.focus();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      finishGame();
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

  // Anti-Cheat Logic: Analyze typing rhythm
  const detectBot = (intervals: number[]): boolean => {
    if (intervals.length < 10) return false;

    // 1. Calculate Standard Deviation (Human typing is inconsistent)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Robots have very low standard deviation (perfect rhythm). Humans usually have > 20ms variance.
    // Extremely fast inputs (scripts) might have intervals < 10ms consistently.
    if (stdDev < 15 && mean < 100) return true; // Suspiciously consistent and fast

    return false;
  };

  const finishGame = async () => {
    setIsActive(false);
    setIsFinished(true);
    
    // Final Anti-Cheat Check
    const isBot = detectBot(keyIntervals.current);
    const isSuperHuman = wpm > 300; // World record is ~216 WPM. 300 is impossible for standard text.

    if (isBot || isSuperHuman) {
      setIsCheatDetected(true);
      return;
    }

    // Save stats
    const userStr = localStorage.getItem('sozUser');
    if (userStr) {
      const user: User = JSON.parse(userStr);
      const userRef = ref(db, `users/${user.uid}`);
      
      try {
        const snapshot = await get(userRef);
        const currentData = snapshot.val() || {};
        
        const newScore = (currentData.score || 0) + Math.floor(wpm / 2);
        const newGamesPlayed = (currentData.gamesPlayed || 0) + 1;
        // Simple moving average
        const newAvgWPM = Math.round(((currentData.avgWPM || 0) * (newGamesPlayed - 1) + wpm) / newGamesPlayed);
        
        // Prepare new history entry
        const newGameEntry: GameHistory = {
          wpm: wpm,
          accuracy: accuracy,
          timestamp: Date.now(),
          mode: `time ${selectedTime}`,
          score: Math.floor(wpm / 2),
          difficulty: 'normal'
        };

        const currentHistory = currentData.gameHistory || [];
        const updatedHistory = [...currentHistory, newGameEntry];

        const newData = {
          ...currentData,
          uid: user.uid,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          score: newScore,
          gamesPlayed: newGamesPlayed,
          avgWPM: newAvgWPM,
          maxWPM: Math.max(currentData.maxWPM || 0, wpm),
          accuracy: Math.round(((currentData.accuracy || 0) * (newGamesPlayed - 1) + accuracy) / newGamesPlayed),
          gameHistory: updatedHistory,
          totalTime: (currentData.totalTime || 0) + selectedTime
        };

        await set(userRef, newData);
        localStorage.setItem('sozUser', JSON.stringify(newData));
      } catch (error) {
        console.error("Error saving stats:", error);
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const now = performance.now();
    
    // Anti-Cheat: Record Interval
    if (lastKeyTime.current !== 0) {
      const interval = now - lastKeyTime.current;
      keyIntervals.current.push(interval);
    }
    lastKeyTime.current = now;

    if (!isActive && !isFinished) {
      setIsActive(true);
    }
    
    if (isFinished) return;

    const value = e.target.value;
    
    // Anti-Cheat: Paste Detection (Sudden large length change)
    if (value.length - input.length > 5) {
      alert("Nusxalash taqiqlanadi!");
      resetGame();
      return;
    }

    setInput(value);

    // Calculate stats in real-time
    const wordsTyped = value.trim().split(/\s+/).length;
    const timeElapsed = selectedTime - timeLeft;
    if (timeElapsed > 0) {
      const currentWpm = Math.round((wordsTyped / (timeElapsed / 60)));
      setWpm(currentWpm);
    }

    // Simple accuracy
    let correctChars = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === text[i]) correctChars++;
    }
    const currentAcc = value.length > 0 ? Math.round((correctChars / value.length) * 100) : 100;
    setAccuracy(currentAcc);
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let color = 'text-text-secondary';
      if (index < input.length) {
        color = input[index] === char ? 'text-text-primary' : 'text-error';
      }
      return <span key={index} className={`${color} ${index === input.length ? 'border-l-2 border-accent animate-caret' : ''}`}>{char}</span>;
    });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto mt-8 gap-12 font-mono">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between text-text-secondary text-sm">
        <div className="flex gap-2 bg-bg-secondary p-1 rounded-lg">
          {[15, 30, 60, 120].map(time => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`px-4 py-1.5 rounded transition-all ${selectedTime === time ? 'text-accent font-bold bg-bg-tertiary' : 'hover:text-text-primary hover:bg-bg-tertiary/50'}`}
            >
              {time}
            </button>
          ))}
        </div>
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-xl font-bold text-accent">{timeLeft}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="text-xl font-bold text-accent">{wpm}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="text-xl font-bold text-accent">{accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Typing Area */}
      <div 
        className="relative w-full text-3xl leading-relaxed break-all font-mono min-h-[200px] outline-none group cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="absolute inset-0 pointer-events-none transition-all duration-200" style={{ opacity: isActive ? 1 : 0.5, filter: isActive ? 'blur(0)' : 'blur(1px)' }}>
           {renderText()}
        </div>
        
        {/* Invisible Input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInput}
          className="absolute inset-0 opacity-0 cursor-default"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        
        {!isActive && !isFinished && input.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-lg pointer-events-none group-hover:text-text-primary transition-colors">
            <span className="bg-bg-secondary px-4 py-2 rounded-lg border border-bg-tertiary flex items-center gap-2">
              <span className="animate-pulse">Cursor</span>
              <span>yoki</span>
              <span className="px-2 py-0.5 bg-bg-tertiary rounded text-sm border border-bg-primary">TAB</span>
              <span>bosing</span>
            </span>
          </div>
        )}
      </div>

      {/* Restart Button */}
      <button 
        onClick={resetGame}
        className="mt-4 p-4 rounded-xl bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all group hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-accent/10"
        aria-label="Restart Test"
      >
        <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
      </button>

      {/* Result Modal */}
      {isFinished && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-bg-secondary p-10 rounded-3xl max-w-2xl w-full border border-bg-tertiary shadow-2xl transform scale-100 flex flex-col gap-8 relative overflow-hidden">
            
            {isCheatDetected ? (
              <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center text-center p-8 z-50">
                <AlertTriangle className="w-24 h-24 text-white mb-4 animate-bounce" />
                <h2 className="text-4xl font-bold text-white mb-2">CHEAT ANIQLANDI!</h2>
                <p className="text-white/80 text-lg">Sizning yozish usulingiz g'ayritabiiy (Robot yoki Skript). Natija bekor qilindi.</p>
                <button onClick={resetGame} className="mt-8 bg-white text-red-900 font-bold py-3 px-8 rounded-lg hover:bg-gray-200">
                  Qayta urinish
                </button>
              </div>
            ) : null}

            <h2 className="text-4xl font-bold text-accent text-center">Natija</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 bg-bg-primary p-6 rounded-2xl border border-bg-tertiary flex flex-col items-start gap-1 relative overflow-hidden group hover:border-accent transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-16 h-16 text-accent" />
                </div>
                <div className="text-sm font-bold text-text-secondary uppercase tracking-widest">WPM</div>
                <div className="text-6xl font-bold text-accent">{wpm}</div>
                <div className="text-xs text-text-secondary mt-2">Words Per Minute</div>
              </div>
              
              <div className="col-span-2 sm:col-span-1 bg-bg-primary p-6 rounded-2xl border border-bg-tertiary flex flex-col items-start gap-1 relative overflow-hidden group hover:border-accent transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Target className="w-16 h-16 text-accent" />
                </div>
                <div className="text-sm font-bold text-text-secondary uppercase tracking-widest">Aniqlik</div>
                <div className="text-6xl font-bold text-accent">{accuracy}%</div>
                <div className="text-xs text-text-secondary mt-2">Accuracy</div>
              </div>

              <div className="bg-bg-primary p-4 rounded-xl border border-bg-tertiary flex flex-col items-center">
                <div className="text-xs font-bold text-text-secondary uppercase">Raw</div>
                <div className="text-2xl font-bold text-text-primary">{wpm}</div>
              </div>
              <div className="bg-bg-primary p-4 rounded-xl border border-bg-tertiary flex flex-col items-center">
                <div className="text-xs font-bold text-text-secondary uppercase">Characters</div>
                <div className="text-2xl font-bold text-text-primary">{input.length}</div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-bg-tertiary">
              <button 
                onClick={resetGame}
                className="flex-1 bg-accent text-bg-primary font-bold py-4 rounded-xl hover:bg-[#d4a813] transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-95"
              >
                Qayta o'ynash
              </button>
              <button 
                onClick={() => alert("Skrinshot funksiyasi tez orada qo'shiladi!")}
                className="flex-1 bg-bg-tertiary text-text-primary font-bold py-4 rounded-xl hover:bg-[#4a4a4a] transition-all hover:shadow-lg active:scale-95"
              >
                Ulashish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingTest;