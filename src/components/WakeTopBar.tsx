import React, { useState, useEffect } from "react";
import { X, Settings, Wifi, Battery, ShieldCheck } from "lucide-react";

interface WakeTopBarProps {
  onClose: () => void;
}

const WakeTopBar: React.FC<WakeTopBarProps> = ({ onClose }) => {
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  // Monitor real device battery status if available via browser API
  useEffect(() => {
    // @ts-ignore - Navigator might have experimental battery API support
    if (navigator.getBattery) {
      // @ts-ignore
      navigator.getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        };
        updateBattery();
        battery.addEventListener("levelchange", updateBattery);
        battery.addEventListener("chargingchange", updateBattery);
        return () => {
          battery.removeEventListener("levelchange", updateBattery);
          battery.removeEventListener("chargingchange", updateBattery);
        };
      });
    }
  }, []);

  return (
    <div className="w-full flex items-center justify-between px-6 pt-6 pb-4 bg-gradient-to-b from-black/60 to-transparent relative z-50 select-none">
      
      {/* Left side: Brand Identity & Secure Indicator */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-sm animate-pulse" />
          <ShieldCheck className="h-5 w-5 text-sky-400 relative z-10" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-wider text-white uppercase font-sans">
            ALSA Smart Wake
          </span>
          <span className="text-[10px] text-sky-400/80 font-medium tracking-wide">
            Secure Edge Session
          </span>
        </div>
      </div>

      {/* Right side: System Metrics & Interaction Actions */}
      <div className="flex items-center gap-4">
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Wifi className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[11px] font-medium text-gray-300 font-mono">
            Online
          </span>
        </div>

        {/* Battery Capacity Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Battery className={`h-3.5 w-3.5 ${isCharging ? "text-green-400 animate-pulse" : "text-sky-400"}`} />
          <span className="text-[11px] font-medium text-gray-300 font-mono">
            {batteryLevel}%
          </span>
        </div>

        {/* System Customization Button */}
        <button
          type="button"
          className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all backdrop-blur-md"
          aria-label="Wake Settings"
        >
          <Settings className="h-4 w-4 text-sky-300" />
        </button>

        {/* Instant Session Exit Switch */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sky-300 hover:text-white hover:bg-blue-500/20 active:scale-95 transition-all backdrop-blur-md"
          aria-label="Close Session"
        >
          <X className="h-4 w-4" />
        </button>
        
      </div>
    </div>
  );
};

export default WakeTopBar;
