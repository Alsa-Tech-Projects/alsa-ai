import React from 'react';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  return (
    // Background hamesha black rahega aur screen ke hisaab se adjust hoga
    <div className="min-h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-6 text-white overflow-hidden selection:bg-red-500">
      
      {/* Robot Container - Responsive size */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-[280px] sm:max-w-[350px] aspect-square">
        
        {/* Broken Floating Head */}
        <motion.div 
          initial={{ y: -10, rotate: -15 }}
          animate={{ 
            y: [-15, -30, -15],
            rotate: [-15, -10, -15],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 z-20 w-32 h-24 sm:w-40 sm:h-32 bg-zinc-800 rounded-2xl border-b-[6px] border-r-[6px] border-black shadow-2xl flex flex-col p-4"
        >
          <div className="flex justify-between w-full">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-600 rounded-full shadow-[0_0_15px_red] animate-pulse" />
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-zinc-900 rounded-full border-2 border-zinc-700" />
          </div>
          <div className="mt-auto w-10 h-1 bg-zinc-700 rounded-full" />
        </motion.div>

        {/* Robot Body */}
        <div className="mt-16 w-32 h-32 sm:w-44 sm:h-44 bg-zinc-900 rounded-3xl border-b-[10px] border-r-[10px] border-black flex items-center justify-center relative overflow-hidden">
           {/* Exposed Sparking Wires */}
           <div className="flex gap-2 rotate-180 mb-4">
              <div className="w-1 sm:w-1.5 h-8 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-1 sm:w-1.5 h-12 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 sm:w-1.5 h-10 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.4s]" />
           </div>
        </div>

        {/* Electrical Sparks (Chingari) */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0, 1, 0],
                x: [0, (Math.random() - 0.5) * 200],
                y: [0, (Math.random() - 0.5) * 200],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: Math.random() * 1.5,
              }}
              className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-300 rounded-full shadow-[0_0_10px_cyan]"
            />
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="text-center z-30 mt-6 max-w-sm px-4">
        <h1 className="text-6xl sm:text-8xl font-black text-zinc-800 leading-none">404</h1>
        <h2 className="text-lg sm:text-2xl font-bold text-red-500 mt-2 tracking-widest uppercase">
          System Headless
        </h2>
        <p className="text-zinc-500 text-sm sm:text-base mt-4 mb-8">
           Are you a hacker, brother? Or have you lost your way? This page was not found in our database.
        </p>

        {/* Home Button */}
        <a
          href="/"
          className="inline-block w-full sm:w-auto px-8 py-3.5 bg-white text-black font-bold rounded-xl transition-transform active:scale-95 shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
        >
          BACK TO SAFE ZONE
        </a>
      </div>

      {/* Ground Glow */}
      <div className="fixed bottom-0 w-full h-40 bg-gradient-to-t from-red-900/10 to-transparent pointer-events-none" />
    </div>
  );
};

export default NotFound;
