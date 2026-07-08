import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, X, Play, Pause, List, Search, Volume2, SkipBack, SkipForward } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { LOCAL_SONGS, LocalSong, findSong } from '@/utils/localMusic';

interface MusicPlayerProps {
  song: string | null;
  onClose: () => void;
}

export const MusicPlayer = ({ song, onClose }: MusicPlayerProps) => {
  const [filteredSongs, setFilteredSongs] = useState<LocalSong[]>(LOCAL_SONGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<LocalSong | null>(null);
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume / 100;
    
    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      // Auto-play next song
      playNextSong();
    });
    
    audioRef.current.addEventListener('timeupdate', () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    });
    
    audioRef.current.addEventListener('loadedmetadata', () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auto-play when song prop changes
  useEffect(() => {
    if (song) {
      const match = findSong(song);
      if (match) {
        handlePlaySong(match);
      } else {
        // Show song list for user to choose
        setShowList(true);
        setSearchQuery(song);
      }
    }
  }, [song]);

  // Filter songs based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSongs(LOCAL_SONGS);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSongs(LOCAL_SONGS.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query) ||
        s.keywords.some(k => k.includes(query))
      ));
    }
  }, [searchQuery]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handlePlaySong = (songInfo: LocalSong) => {
    if (!audioRef.current) return;
    
    audioRef.current.src = songInfo.path;
    audioRef.current.play();
    setCurrentSong(songInfo);
    setIsPlaying(true);
    setShowList(false);
    setProgress(0);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const playNextSong = () => {
    if (!currentSong) return;
    const currentIndex = LOCAL_SONGS.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % LOCAL_SONGS.length;
    handlePlaySong(LOCAL_SONGS[nextIndex]);
  };

  const playPrevSong = () => {
    if (!currentSong) return;
    const currentIndex = LOCAL_SONGS.findIndex(s => s.id === currentSong.id);
    const prevIndex = currentIndex === 0 ? LOCAL_SONGS.length - 1 : currentIndex - 1;
    handlePlaySong(LOCAL_SONGS[prevIndex]);
  };

  const handleClose = () => {
    handleStop();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!song) return null;

  return (
    <Card className="fixed bottom-24 right-4 p-4 bg-background/95 backdrop-blur border shadow-lg w-96 z-50 animate-fade-in max-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-medium text-sm">Music Player</span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowList(!showList)} 
            className="h-8 w-8"
            title="Song List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Current song display */}
      {currentSong ? (
        <div className="mb-3 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm font-medium truncate">{currentSong.name}</p>
          <p className="text-xs text-muted-foreground truncate">{currentSong.artist}</p>
          
          {/* Progress bar */}
          <div className="mt-2 space-y-1">
            <Slider
              value={[progress]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-3">
          Searching for: "{song}"
        </p>
      )}
      
      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="icon" onClick={playPrevSong} className="h-9 w-9">
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button
          variant={isPlaying ? "secondary" : "default"}
          size="sm"
          onClick={togglePlayPause}
          className="flex-1"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-2" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" /> Play
            </>
          )}
        </Button>
        
        <Button variant="ghost" size="icon" onClick={playNextSong} className="h-9 w-9">
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <Slider
          value={[volume]}
          max={100}
          step={1}
          onValueChange={(v) => setVolume(v[0])}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8">{volume}%</span>
      </div>

      {/* Song list */}
      {showList && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <ScrollArea className="flex-1 max-h-48">
            <div className="space-y-1">
              {filteredSongs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No songs found
                </p>
              ) : (
                filteredSongs.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handlePlaySong(s)}
                    className={`w-full text-left p-2 rounded-lg hover:bg-primary/10 transition-colors ${
                      currentSong?.id === s.id ? 'bg-primary/20' : ''
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.artist}</p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
};