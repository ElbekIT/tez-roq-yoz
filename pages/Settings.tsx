
import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Type, Volume2, Gamepad2, Trash2, RefreshCcw } from 'lucide-react';

const Settings: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  // Font state
  const [font, setFont] = useState(localStorage.getItem('font') || 'JetBrains Mono');
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize') || '16'));

  // Game state
  const [defaultTime, setDefaultTime] = useState(parseInt(localStorage.getItem('defaultTime') || '30'));
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('soundEnabled') !== 'false');
  const [smoothCaret, setSmoothCaret] = useState(localStorage.getItem('smoothCaret') !== 'false');

  useEffect(() => {
    // Apply settings to DOM
    document.body.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--font-family', `"${font}"`);
    document.documentElement.style.fontSize = `${fontSize}px`;
    document.documentElement.style.setProperty('--animation-duration', smoothCaret ? '1s' : '0s');

    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('font', font);
    localStorage.setItem('fontSize', fontSize.toString());
    localStorage.setItem('defaultTime', defaultTime.toString());
    localStorage.setItem('soundEnabled', soundEnabled.toString());
    localStorage.setItem('smoothCaret', smoothCaret.toString());
  }, [theme, font, fontSize, defaultTime, soundEnabled, smoothCaret]);

  const themes = [
    { id: 'dark', name: 'Dark', color: '#1a1a1a' },
    { id: 'light', name: 'Light', color: '#ffffff' },
    { id: 'blue', name: 'Blue', color: '#0f172a' },
    { id: 'green', name: 'Green', color: '#052e16' },
    { id: 'purple', name: 'Purple', color: '#2e1065' },
  ];

  const fonts = ['JetBrains Mono', 'Roboto Mono', 'Fira Code'];

  const resetSettings = () => {
    if (confirm("Barcha sozlamalarni zavod holatiga qaytarmoqchimisiz?")) {
      localStorage.removeItem('theme');
      localStorage.removeItem('font');
      localStorage.removeItem('fontSize');
      localStorage.removeItem('defaultTime');
      localStorage.removeItem('soundEnabled');
      localStorage.removeItem('smoothCaret');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 font-mono pb-24">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-8 flex items-center gap-3">
        <Monitor className="w-6 h-6 md:w-8 md:h-8 text-accent" />
        Sozlamalar
      </h1>

      <div className="grid gap-6 md:gap-8">
        
        {/* Appearance Section */}
        <section className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Type className="w-5 h-5 text-accent" />
            Ko'rinish (Appearance)
          </h2>
          
          <div className="space-y-6">
            {/* Theme */}
            <div>
              <label className="block text-text-secondary text-xs md:text-sm font-bold mb-3 uppercase tracking-wider">Mavzu (Theme)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${theme === t.id ? 'border-accent bg-bg-tertiary' : 'border-bg-tertiary hover:bg-bg-primary'}`}
                  >
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full shadow-lg" style={{ backgroundColor: t.color }}></div>
                    <span className="text-[10px] md:text-xs font-medium text-text-secondary">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-text-secondary text-xs md:text-sm font-bold mb-3 uppercase tracking-wider">Shrift Turi</label>
              <div className="flex flex-wrap gap-2">
                {fonts.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFont(f)}
                    className={`px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm border transition-all ${font === f ? 'bg-accent text-bg-primary border-accent font-bold' : 'bg-bg-primary text-text-secondary border-bg-tertiary hover:border-text-secondary'}`}
                    style={{ fontFamily: f }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-text-secondary text-xs md:text-sm font-bold mb-3 uppercase tracking-wider">Shrift O'lchami: {fontSize}px</label>
              <input 
                type="range" 
                min="12" 
                max="24" 
                value={fontSize} 
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>
        </section>

        {/* Game Behavior Section */}
        <section className="bg-bg-secondary border border-bg-tertiary rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-accent" />
            O'yin (Game)
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Default Time */}
            <div>
              <label className="block text-text-secondary text-xs md:text-sm font-bold mb-3 uppercase tracking-wider">Standart Vaqt</label>
              <div className="flex gap-2 bg-bg-primary p-1 rounded-lg w-fit border border-bg-tertiary overflow-x-auto max-w-full">
                {[15, 30, 60, 120].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDefaultTime(t)}
                    className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-md text-xs md:text-sm transition-all whitespace-nowrap ${defaultTime === t ? 'bg-accent text-bg-primary font-bold shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-bg-primary rounded-xl border border-bg-tertiary">
                <div className="flex items-center gap-3">
                  <Volume2 className={`w-5 h-5 ${soundEnabled ? 'text-accent' : 'text-text-secondary'}`} />
                  <span className="text-text-primary font-medium text-sm md:text-base">Tovush effektlari</span>
                </div>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-10 h-5 md:w-12 md:h-6 rounded-full p-1 transition-colors duration-300 ${soundEnabled ? 'bg-accent' : 'bg-bg-tertiary'}`}
                >
                  <div className={`w-3 h-3 md:w-4 md:h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${soundEnabled ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-bg-primary rounded-xl border border-bg-tertiary">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center font-serif italic text-accent">I</div>
                  <span className="text-text-primary font-medium text-sm md:text-base">Silliq kursor</span>
                </div>
                <button 
                  onClick={() => setSmoothCaret(!smoothCaret)}
                  className={`w-10 h-5 md:w-12 md:h-6 rounded-full p-1 transition-colors duration-300 ${smoothCaret ? 'bg-accent' : 'bg-bg-tertiary'}`}
                >
                  <div className={`w-3 h-3 md:w-4 md:h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${smoothCaret ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-error/5 border border-error/20 rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-error mb-6 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Xavfli Hudud
          </h2>

          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={resetSettings}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-bg-primary text-text-primary border border-bg-tertiary rounded-xl hover:bg-bg-secondary hover:border-text-secondary transition-all text-sm md:text-base"
            >
              <RefreshCcw className="w-4 h-4" />
              Sozlamalarni tiklash
            </button>
            
            <button 
              onClick={() => alert("Hozircha hisobni o'chirish imkoni yo'q, lekin biz ustida ishlayapmiz!")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-error/10 text-error border border-error/20 rounded-xl hover:bg-error hover:text-white transition-all text-sm md:text-base"
            >
              <Trash2 className="w-4 h-4" />
              Hisobni o'chirish
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Settings;
