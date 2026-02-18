// Local music library - songs stored in public/music folder
export interface LocalSong {
  id: string;
  name: string;
  artist: string;
  path: string;
  keywords: string[];
}

export const LOCAL_SONGS: LocalSong[] = [
  {
    id: '1',
    name:'aaj ki party',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/aaj-ki-party.mp3',
    keywords: ['party', 'dance', 'bollywood']
  },
  {
    id: '2',
    name: 'aaj ki raat',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/aaj-ki-raat.mp3',
    keywords: ['night', 'romantic', 'bollywood']
  },
  {
    id: '3',
    name: 'abhi na jao chhod kar',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/abhi-na-jao-chhod-kar.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '4',
    name: 'afsos',
    artist: 'Anuv Jain',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/afsos.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '5',
    name: 'Aatif Aslam - Hit Songs Mashup',
    artist: 'Aatif Aslam',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/aatif-aslam-hit-songs-mashup.mp3',
    keywords: ['mashup', 'bollywood', 'pop']
  },
  {
    id: '6',
    name: 'Baarishein ',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/baarishe.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '7',
    name: 'Baat Ban Jaye',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/baat-ban-jaye.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '8',
    name: 'badri ki dulhania',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/badri-ki-dulhania.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '9',
    name: 'chammak challo',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/chammak-challo.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '10',
    name: 'Deewaniyat',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/Deewaniyat.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '11',
    name: 'dil-badtameez',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/dil-badtameez.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '12',
    name: 'Dil Chahta Hai',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/dil-chahta-hai.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '13',
    name: 'Dil Dhadakne Do',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/dil-dhadakne-do.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '14',
    name: 'Finding Her',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/finding-her.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '15',
    name: 'Hamdard',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/Hamdard.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '16',
    name: 'Humnava',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/hamnava.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '17',
    name: 'Hona Tha Pyar',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/hona-tha-pyar.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '18',
    name: 'Husn - Anuv Jain',
    artist: 'Anuv Jain',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/husn-anuv-jain.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '19',
    name: 'iktara',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/iktara.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '20',
    name: 'Ik Tara Slowed-Reverb',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/iktara-slowd-reverb.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '21',
    name: 'Ilahi',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/ilahi.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '22',
    name: 'Ishq ',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/ishq.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '23',
    name: 'Ishq Di Baajiyaan',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/ishq-di-baajiyaan.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '24',
    name: 'Ishq Mashup',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/ishq-mashup-2.0.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '25',
    name: 'Jo Tum Mere Ho',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/jo-tum-mere-ho.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '26',
    name: 'kabira',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/kabira.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '27',
    name: 'Paar Chana De',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/mahiwalsong.mp3',
    keywords: ['romantic', 'bollywood', 'mahiwal', 'chana']
  },
  {
    id: '28',
    name: 'Sooraj Dooba Hain',
    artist: 'Arjit Singh',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/sooraj-dooba-hain.mp3',
    keywords: ['romantic', 'bollywood', 'Suraj duba hai', 'taraveller song']
  },
  {
    id: '29',
    name: 'Tailwinder - Hit Songs Mashup',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/talwiinder-hits.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '30',
    name: 'Tere Naam Se',
    artist: 'unknown',
    path:'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/tere-naam-se.mp3',
    keywords: ['romantic', 'bollywood']
  },
  {
    id: '31',
    name: 'Aala Hazrat Kalam',
    artist: 'Imam Ahmed Raza Khan',
    path: 'https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/songs/Lamyate%20Nazeerok%20Nee.mp3',
    keywords: ['romantic', 'bollywood']
}
];

// Find matching song by search query
export const findSong = (query: string): LocalSong | null => {
  const lowerQuery = query.toLowerCase().trim();
  
  // Exact name match
  let match = LOCAL_SONGS.find(s => 
    s.name.toLowerCase() === lowerQuery
  );
  if (match) return match;
  
  // Partial name match
  match = LOCAL_SONGS.find(s => 
    s.name.toLowerCase().includes(lowerQuery) ||
    lowerQuery.includes(s.name.toLowerCase())
  );
  if (match) return match;
  
  // Keyword match
  match = LOCAL_SONGS.find(s => 
    s.keywords.some(k => lowerQuery.includes(k) || k.includes(lowerQuery))
  );
  if (match) return match;
  
  // Artist match
  match = LOCAL_SONGS.find(s => 
    s.artist.toLowerCase().includes(lowerQuery)
  );
  
  return match || null;
};

// Audio player instance
let audioPlayer: HTMLAudioElement | null = null;

export const playLocalSong = (song: LocalSong): boolean => {
  try {
    // Stop current playback
    stopLocalSong();
    
    // Create new audio element
    audioPlayer = new Audio(song.path);
    audioPlayer.volume = 1.0;
    audioPlayer.play();
    
    return true;
  } catch (error) {
    console.error('Error playing song:', error);
    return false;
  }
};

export const stopLocalSong = (): void => {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer = null;
  }
};

export const isPlaying = (): boolean => {
  return audioPlayer !== null && !audioPlayer.paused;
};

export const setVolume = (volume: number): void => {
  if (audioPlayer) {
    audioPlayer.volume = Math.max(0, Math.min(1, volume));
  }
};

export const getCurrentSong = (): LocalSong | null => {
  if (!audioPlayer) return null;
  const path = audioPlayer.src;
  return LOCAL_SONGS.find(s => path.includes(s.path.split('/').pop() || '')) || null;
};
