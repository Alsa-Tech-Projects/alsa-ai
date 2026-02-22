import React from 'react';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-6 text-white overflow-hidden relative font-sans">
      
      {/* 2D Robot Assembly */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-[280px] sm:max-w-[350px] aspect-square">
        
        {/* Floating Broken Head (2D Style) */}
        <motion.div 
          initial={{ y: -15, rotate: -15 }}
          animate={{ 
            y: [-15, -35, -15],
            rotate: [-15, -10, -15],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 z-20 w-32 h-24 sm:w-40 sm:h-32 bg-zinc-800 rounded-2xl border-b-8 border-r-8 border-black shadow-2xl flex flex-col p-4"
        >
          {/* Eyes */}
          <div className="flex justify-between w-full">
            <motion.div 
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 1.5 }}
              className="w-5 h-5 sm:w-6 sm:h-6 bg-red-600 rounded-full shadow-[0_0_15px_red]" 
            />
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-zinc-900 rounded-full border-2 border-zinc-700" />
          </div>
          {/* Mouth Area */}
          <div className="mt-auto w-10 h-1 bg-zinc-700 rounded-full" />
        </motion.div>

        {/* Robot Body (2D Style) */}
        <div className="mt-16 w-32 h-32 sm:w-44 sm:h-44 bg-zinc-900 rounded-3xl border-b-[10px] border-r-[10px] border-black flex items-center justify-center relative overflow-hidden">
           {/* Exposed Wires */}
           <div className="flex gap-2 rotate-180 mb-4">
              <motion.div 
                animate={{ height: [15, 35, 15] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 bg-blue-500 rounded-full" 
              />
              <motion.div 
                animate={{ height: [25, 45, 25] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 bg-red-600 rounded-full" 
              />
              <motion.div 
                animate={{ height: [20, 40, 20] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 bg-yellow-500 rounded-full" 
              />
           </div>
        </div>

        {/* Sparks / Chingari Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0, 1, 0],
                x: [0, (Math.random() - 0.5) * 180],
                y: [0, (Math.random() - 0.5) * 180],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: Math.random() * 2,
              }}
              className="absolute top-1/2 left-1/2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_cyan]"
            />
          ))}
        </div>
      </div>

      {/* English Text Content */}
      <div className="text-center z-30 mt-8 max-w-sm px-4">
        <h1 className="text-6xl sm:text-8xl font-black text-zinc-800 leading-none select-none">404</h1>
        <h2 className="text-xl sm:text-3xl font-bold text-red-500 mt-2 tracking-tighter uppercase">
          Critical System Failure
        </h2>
        <p className="text-zinc-500 text-sm sm:text-base mt-4 mb-10 leading-relaxed">
          The requested unit could not be located. Our robot has lost its head searching for this page.
        </p>

        {/* Action Button */}
        <a
          href="/"
          className="inline-block w-full sm:w-auto px-10 py-4 bg-white text-black font-bold rounded-xl transition-all active:scale-95 shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:bg-zinc-200 uppercase tracking-widest text-sm"
        >
          Reboot to Home
        </a>
      </div>

      {/* Bottom Gradient Glow */}
      <div className="fixed bottom-0 w-full h-40 bg-gradient-to-t from-red-900/10 to-transparent pointer-events-none" />
    </div>
  );
};

export default NotFound;
          
