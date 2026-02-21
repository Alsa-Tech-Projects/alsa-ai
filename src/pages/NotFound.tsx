import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  // Chingari (Sparks) ke liye animation variants
  const sparkVariants = {
    animate: {
      opacity: [0, 1, 0],
      scale: [1, 1.5, 1],
      transition: {
        duration: 0.2,
        repeat: Infinity,
        repeatDelay: Math.random() * 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden text-white font-sans">
      
      {/* Robot Container */}
      <div className="relative mb-8">
        {/* Robot Body (Bottom Part) */}
        <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-800 border-4 border-gray-600 rounded-xl flex items-center justify-center relative">
            <div className="w-20 h-4 bg-red-600/20 animate-pulse rounded-full" /> {/* Control Panel light */}
        </div>

        {/* Broken Head (Disconnected and Tilted) */}
        <motion.div 
          initial={{ y: -20, rotate: -25 }}
          animate={{ y: [ -20, -15, -20], rotate: [-25, -20, -25] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-4 w-24 h-20 md:w-36 md:h-28 bg-gray-700 border-4 border-gray-500 rounded-lg"
        >
          {/* Eyes */}
          <div className="flex justify-around mt-4 px-2">
            <div className="w-4 h-4 md:w-6 md:h-6 bg-red-500 rounded-full shadow-[0_0_10px_red] animate-ping" />
            <div className="w-4 h-4 md:w-6 md:h-6 bg-gray-900 rounded-full border-2 border-gray-500" />
          </div>
          {/* Broken Neck Wires */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <div className="w-1 h-8 bg-red-500 rounded-full" />
            <div className="w-1 h-5 bg-yellow-500 rounded-full" />
          </div>
        </motion.div>

        {/* Chingari (Sparks) Animation */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              variants={sparkVariants}
              animate="animate"
              className="absolute w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_5px_#60a5fa]"
              style={{
                top: Math.random() * -20,
                left: (Math.random() - 0.5) * 60,
              }}
            />
          ))}
        </div>
      </div>

      {/* Text Section */}
      <div className="text-center z-10">
        <h1 className="text-6xl md:text-8xl font-black text-gray-500 mb-2 tracking-tighter">404</h1>
        <h2 className="text-xl md:text-3xl font-bold mb-4">SYSTEM ERROR: HEAD NOT FOUND</h2>
        <p className="text-gray-400 max-w-xs md:max-w-md mx-auto mb-8 text-sm md:text-base">
          Lagta hai robot ka dimaag chal gaya (literally!). Ye page ya toh delete ho chuka hai ya kabhi tha hi nahi.
        </p>

        {/* Home Button */}
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
        >
          BACK TO HOME
        </button>
      </div>

      {/* Background Glitch Effect (Static/Overlay) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
  );
};

export default NotFound;
