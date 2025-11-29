
import React, { useState } from 'react';
import { Swords, Users, Lock, Trophy } from 'lucide-react';

const Battle: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('join');

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col items-center font-mono pb-24">
      <div className="flex items-center gap-3 mb-2">
        <Swords className="w-8 h-8 md:w-10 md:h-10 text-accent" />
        <h1 className="text-2xl md:text-4xl font-bold text-text-primary">Battle Arena</h1>
      </div>
      <p className="text-text-secondary mb-10 text-center text-sm md:text-base">Do'stlar bilan bellashing va kim eng tez ekanligini aniqlang!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full mb-8 md:mb-12">
        <div 
          className="bg-bg-secondary border-2 border-bg-tertiary hover:border-accent rounded-2xl p-6 md:p-8 cursor-pointer transition-all group text-center flex flex-col items-center"
          onClick={() => alert("Tez orada ishga tushadi!")}
        >
          <div className="bg-bg-primary w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Swords className="w-6 h-6 md:w-8 md:h-8 text-accent" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">Poyga Yaratish</h3>
          <p className="text-xs md:text-sm text-text-secondary">Yangi xona oching va do'stlarni taklif qiling</p>
        </div>

        <div 
          className="bg-bg-secondary border-2 border-bg-tertiary hover:border-accent rounded-2xl p-6 md:p-8 cursor-pointer transition-all group text-center flex flex-col items-center"
          onClick={() => alert("Tez orada ishga tushadi!")}
        >
          <div className="bg-bg-primary w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-success" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">Poygaga Qo'shilish</h3>
          <p className="text-xs md:text-sm text-text-secondary">Ochiq xonalarga kiring va bellashing</p>
        </div>

        <div 
          className="bg-bg-secondary border-2 border-bg-tertiary hover:border-accent rounded-2xl p-6 md:p-8 cursor-pointer transition-all group text-center flex flex-col items-center"
          onClick={() => alert("Tez orada ishga tushadi!")}
        >
          <div className="bg-bg-primary w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Lock className="w-6 h-6 md:w-8 md:h-8 text-error" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-text-primary mb-2">Maxfiy Xona</h3>
          <p className="text-xs md:text-sm text-text-secondary">Kod orqali do'stingiz xonasiga kiring</p>
        </div>
      </div>

      <div className="w-full bg-bg-secondary border border-bg-tertiary rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-text-primary">Faol Xonalar</h2>
        </div>
        
        <div className="text-center py-12 text-text-secondary">
          <div className="text-4xl mb-4">🏁</div>
          <p>Hozircha faol poygalar yo'q.</p>
          <p className="text-sm mt-2">Birinchi bo'lib yarating!</p>
        </div>
      </div>
    </div>
  );
};

export default Battle;
