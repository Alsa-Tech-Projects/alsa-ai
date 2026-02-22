import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Cloud, Droplets, Wind, MapPin, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import CircularSiriWave from '@/components/CircularSiriWave';

interface RightPanelProps {
  user: Record<string, unknown>;
  bridgeConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  toggleVoice: () => void;
  onOpenMemory: () => void;
  backupKeyActive?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface WeatherData {
  temp: number;
  humidity: number;
  wind: number;
  description: string;
  city: string;
}

interface WeatherForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  description: string;
}

const RightPanel = ({
  user,
  bridgeConnected,
  isListening,
  isSpeaking,
  toggleVoice,
  onOpenMemory,
  backupKeyActive = false,
  isCollapsed = false,
  onToggleCollapse,
}: RightPanelProps) => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastDay[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [todoItems, setTodoItems] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    fetchWeather();
    loadTodos();

    const id = window.setInterval(() => {
      fetchWeather();
    }, 10 * 60 * 1000); // Refresh every 10 mins

    return () => window.clearInterval(id);
  }, []);

  const loadTodos = () => {
    const saved = localStorage.getItem('alsa_todos');
    if (saved) {
      try {
        setTodoItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading todos:', e);
      }
    }
  };

  const saveTodos = (items: string[]) => {
    localStorage.setItem('alsa_todos', JSON.stringify(items));
    setTodoItems(items);
  };

  const weatherCodeToText = (code: number): string => {
    // Open-Meteo weather codes
    if ([0].includes(code)) return 'clear sky';
    if ([1, 2, 3].includes(code)) return 'partly cloudy';
    if ([45, 48].includes(code)) return 'fog';
    if ([51, 53, 55].includes(code)) return 'drizzle';
    if ([61, 63, 65].includes(code)) return 'rain';
    if ([66, 67].includes(code)) return 'freezing rain';
    if ([71, 73, 75, 77].includes(code)) return 'snow';
    if ([80, 81, 82].includes(code)) return 'rain showers';
    if ([85, 86].includes(code)) return 'snow showers';
    if ([95, 96, 99].includes(code)) return 'thunderstorm';
    return 'weather';
  };

  const fetchWeather = async () => {
    setLoadingWeather(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 5 * 60 * 1000,
        });
      });

      setLocationDenied(false);
      const { latitude, longitude } = position.coords;

      // Open-Meteo: no API key needed
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=7`
      );
      const data = await res.json();

      if (!res.ok) throw new Error('Weather fetch failed');

      setWeather({
        temp: Math.round(data.current.temperature_2m),
        humidity: Math.round(data.current.relative_humidity_2m),
        wind: Math.round(data.current.wind_speed_10m),
        description: weatherCodeToText(Number(data.current.weather_code)),
        city: 'Current Location',
      });

      const formattedForecast: WeatherForecastDay[] = (data.daily.time || []).map((date: string, idx: number) => ({
        date,
        tempMax: Math.round(data.daily.temperature_2m_max?.[idx] ?? 0),
        tempMin: Math.round(data.daily.temperature_2m_min?.[idx] ?? 0),
        description: weatherCodeToText(Number(data.daily.weather_code?.[idx] ?? 0)),
      }));
      setForecast(formattedForecast);
    } catch (error) {
      console.warn('Weather fetch failed:', error);
      setLocationDenied(true);
      setWeather(null);
      setForecast([]);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Collapsed state - show only toggle button
  if (isCollapsed) {
    return (
      <div className="h-full flex items-center justify-center p-2 bg-[#0a0a0a] border-l border-white/5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
          title="Show Right Panel"
        >
          <PanelRightOpen className="w-5 h-5 text-white/60" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full border-l border-white/5 flex flex-col bg-[#0a0a0a]">
      {/* Collapse Toggle Button */}
      {onToggleCollapse && (
        <div className="p-2 border-b border-white/5 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg hover:bg-white/5"
            title="Hide Right Panel"
          >
            <PanelRightClose className="w-4 h-4 text-white/40 hover:text-white/60" />
          </Button>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* User Info */}
          <div className="space-y-1 text-center">
            <p className="text-[8px] font-black text-blue-500 uppercase tracking-[0.4em]">Biometric Active</p>
            <p className="text-[9px] text-white/20 uppercase tracking-widest">User: {user?.email?.split('@')[0] || 'Authorized'}</p>
            
            {backupKeyActive && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-[8px] text-green-400">Backup Key Active</span>
              </div>
            )}
          </div>

          {/* Voice Orb */}
          <div className="relative group cursor-pointer flex justify-center" onClick={toggleVoice}>
            <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${isListening ? 'bg-blue-600/20 opacity-100' : 'opacity-0'}`}></div>
            <CircularSiriWave isSpeaking={isSpeaking} isListening={isListening} size={180} />
          </div>

          {/* Weather Widget */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                <Cloud className="w-3 h-3" /> Weather Forecast
              </span>
              <button onClick={fetchWeather} className="text-[8px] text-blue-400 hover:text-blue-300">Refresh</button>
            </div>
            
            {loadingWeather ? (
              <p className="text-[10px] text-white/40">Synchronizing with satellite...</p>
            ) : locationDenied ? (
              <p className="text-[10px] text-white/40">
                Location access denied. Please enable GPS for weather updates.
              </p>
            ) : weather ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">{weather.temp}°C</span>
                  <span className="text-[9px] text-white/60 capitalize italic">{weather.description}</span>
                </div>
                <div className="text-[8px] text-white/40 flex items-center gap-1">
                  <MapPin className="w-2 h-2" /> {weather.city}
                </div>
                <div className="flex gap-3 text-[9px] text-white/50">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" /> {weather.humidity}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-blue-400" /> {weather.wind} km/h
                  </span>
                </div>

                {forecast.length > 0 && (
                  <div className="pt-2 border-t border-white/10 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {forecast.map((d, i) => (
                        <div key={i} className="bg-black/20 border border-white/5 rounded-lg p-2">
                          <div className="text-[9px] text-white/60">
                            {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                          </div>
                          <div className="text-[10px] text-white/80 font-semibold">
                            {d.tempMax}° / {d.tempMin}°
                          </div>
                          <div className="text-[7px] text-white/30 capitalize truncate">{d.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-white/40">Weather data offline</p>
            )}
          </div>
          {/* System Stats */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-mono text-white/30 px-1">
              <span>NEURAL LOAD</span>
              <span>{bridgeConnected ? '24%' : '0%'}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full bg-blue-600 transition-all duration-1000 ${bridgeConnected ? 'w-1/4' : 'w-0'}`}></div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/5 space-y-2">
        <Button
          variant="outline"
          className="w-full border-white/5 bg-white/[0.02] hover:bg-white/5 text-[9px] py-4 rounded-xl tracking-widest font-bold text-white/40 group"
          onClick={onOpenMemory}
        >
          <span className="group-hover:text-white transition-colors">ACCESS NEURAL MEMORY</span>
        </Button>
        <div className="flex justify-center">
          <Settings className="w-4 h-4 text-white/10 hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/settings')} />
        </div>
      </div>
    </div>
  );
};

export default RightPanel;