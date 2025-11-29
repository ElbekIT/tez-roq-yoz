import React from 'react';
import TypingTest from '../components/TypingTest';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] w-full px-4">
      <div className="w-full max-w-5xl">
        <TypingTest />
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl w-full text-text-secondary text-sm">
        <div className="flex flex-col gap-2">
          <span className="text-accent font-bold text-lg">tez</span>
          <p>Yozish tezligingizni oshiring va do'stlaringiz bilan raqobatlashing.</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-accent font-bold text-lg">aniq</span>
          <p>Xatolarsiz yozishni o'rganing. Aniqlik - professionalizm belgisi.</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-accent font-bold text-lg">oson</span>
          <p>Minimalistik dizayn va qulay interfeys. Chalg'ituvchi narsalar yo'q.</p>
        </div>
      </div>
      
      <footer className="mt-20 mb-8 text-text-secondary text-xs flex gap-6">
        <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
        <a href="#" className="hover:text-text-primary transition-colors">Support</a>
        <a href="#" className="hover:text-text-primary transition-colors">GitHub</a>
        <a href="#" className="hover:text-text-primary transition-colors">Discord</a>
        <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
      </footer>
    </div>
  );
};

export default Home;