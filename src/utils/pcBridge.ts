// pcBridge.ts - Full PC Control Bridge with Natural Language Support
const BRIDGE_URL = 'http://127.0.0.1:5001';

const getHeaders = () => ({
  'Content-Type': 'application/json',
});

export interface BridgeStatus {
  connected: boolean;
  message?: string;
}

export const checkBridgeConnection = async (): Promise<BridgeStatus> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      const j = await response.json().catch(() => ({}));
      return { connected: true, message: j.message || 'Bridge connected' };
    }
    return { connected: false, message: 'Bridge not responding' };
  } catch (error) {
    return { connected: false, message: 'Bridge not running' };
  }
};

// 110+ Website URLs for opening via PC Bridge
export const WEBSITES: Record<string, { name: string; url: string; category: string }> = {
  // Social Media
 // 'youtube': { name: 'YouTube', url: 'https://www.youtube.com', category: 'Social Media' },
  'facebook': { name: 'Facebook', url: 'https://www.facebook.com', category: 'Social Media' },
  'instagram': { name: 'Instagram', url: 'https://www.instagram.com', category: 'Social Media' },
  'twitter': { name: 'Twitter/X', url: 'https://twitter.com', category: 'Social Media' },
  'x': { name: 'X (Twitter)', url: 'https://x.com', category: 'Social Media' },
  'linkedin': { name: 'LinkedIn', url: 'https://www.linkedin.com', category: 'Social Media' },
  'snapchat': { name: 'Snapchat', url: 'https://www.snapchat.com', category: 'Social Media' },
  'tiktok': { name: 'TikTok', url: 'https://www.tiktok.com', category: 'Social Media' },
  'pinterest': { name: 'Pinterest', url: 'https://www.pinterest.com', category: 'Social Media' },
  'reddit': { name: 'Reddit', url: 'https://www.reddit.com', category: 'Social Media' },
  'tumblr': { name: 'Tumblr', url: 'https://www.tumblr.com', category: 'Social Media' },
  'whatsapp': { name: 'WhatsApp Web', url: 'https://web.whatsapp.com', category: 'Social Media' },
  'telegram': { name: 'Telegram Web', url: 'https://web.telegram.org', category: 'Social Media' },
  'discord': { name: 'Discord', url: 'https://discord.com', category: 'Social Media' },
  'quora': { name: 'Quora', url: 'https://www.quora.com', category: 'Social Media' },
  'threads': { name: 'Threads', url: 'https://www.threads.net', category: 'Social Media' },
  'mastodon': { name: 'Mastodon', url: 'https://mastodon.social', category: 'Social Media' },

  // Entertainment
  'netflix': { name: 'Netflix', url: 'https://www.netflix.com', category: 'Entertainment' },
 // 'spotify': { name: 'Spotify', url: 'https://open.spotify.com', category: 'Entertainment' },
  'primevideo': { name: 'Prime Video', url: 'https://www.primevideo.com', category: 'Entertainment' },
  'amazonprime': { name: 'Amazon Prime', url: 'https://www.primevideo.com', category: 'Entertainment' },
  'hotstar': { name: 'Disney+ Hotstar', url: 'https://www.hotstar.com', category: 'Entertainment' },
  'disneyplus': { name: 'Disney+', url: 'https://www.disneyplus.com', category: 'Entertainment' },
  'hulu': { name: 'Hulu', url: 'https://www.hulu.com', category: 'Entertainment' },
  'hbomax': { name: 'HBO Max', url: 'https://www.max.com', category: 'Entertainment' },
  'twitch': { name: 'Twitch', url: 'https://www.twitch.tv', category: 'Entertainment' },
  'soundcloud': { name: 'SoundCloud', url: 'https://soundcloud.com', category: 'Entertainment' },
  'applemusic': { name: 'Apple Music', url: 'https://music.apple.com', category: 'Entertainment' },
  'jiosaavn': { name: 'JioSaavn', url: 'https://www.jiosaavn.com', category: 'Entertainment' },
  'gaana': { name: 'Gaana', url: 'https://gaana.com', category: 'Entertainment' },
  'wynk': { name: 'Wynk Music', url: 'https://wynk.in', category: 'Entertainment' },
  'imdb': { name: 'IMDb', url: 'https://www.imdb.com', category: 'Entertainment' },
  'rottentomatoes': { name: 'Rotten Tomatoes', url: 'https://www.rottentomatoes.com', category: 'Entertainment' },
  'voot': { name: 'Voot', url: 'https://www.voot.com', category: 'Entertainment' },
  'zee5': { name: 'ZEE5', url: 'https://www.zee5.com', category: 'Entertainment' },
  'sonyliv': { name: 'SonyLIV', url: 'https://www.sonyliv.com', category: 'Entertainment' },
  'mxplayer': { name: 'MX Player', url: 'https://www.mxplayer.in', category: 'Entertainment' },
  'crunchyroll': { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', category: 'Entertainment' },

  // Productivity
//  'google': { name: 'Google', url: 'https://www.google.com', category: 'Productivity' },
  'gmail': { name: 'Gmail', url: 'https://mail.google.com', category: 'Productivity' },
  'drive': { name: 'Google Drive', url: 'https://drive.google.com', category: 'Productivity' },
  'docs': { name: 'Google Docs', url: 'https://docs.google.com', category: 'Productivity' },
  'sheets': { name: 'Google Sheets', url: 'https://sheets.google.com', category: 'Productivity' },
  'slides': { name: 'Google Slides', url: 'https://slides.google.com', category: 'Productivity' },
  'calendar': { name: 'Google Calendar', url: 'https://calendar.google.com', category: 'Productivity' },
  'meet': { name: 'Google Meet', url: 'https://meet.google.com', category: 'Productivity' },
  'outlook': { name: 'Outlook', url: 'https://outlook.live.com', category: 'Productivity' },
  'office': { name: 'Microsoft 365', url: 'https://www.office.com', category: 'Productivity' },
  'onedrive': { name: 'OneDrive', url: 'https://onedrive.live.com', category: 'Productivity' },
  'teams': { name: 'Microsoft Teams', url: 'https://teams.microsoft.com', category: 'Productivity' },
  'notion': { name: 'Notion', url: 'https://www.notion.so', category: 'Productivity' },
  'trello': { name: 'Trello', url: 'https://trello.com', category: 'Productivity' },
  'asana': { name: 'Asana', url: 'https://app.asana.com', category: 'Productivity' },
  'slack': { name: 'Slack', url: 'https://slack.com', category: 'Productivity' },
  'zoom': { name: 'Zoom', url: 'https://zoom.us', category: 'Productivity' },
  'dropbox': { name: 'Dropbox', url: 'https://www.dropbox.com', category: 'Productivity' },
  'evernote': { name: 'Evernote', url: 'https://www.evernote.com', category: 'Productivity' },
  'todoist': { name: 'Todoist', url: 'https://todoist.com', category: 'Productivity' },
  'clickup': { name: 'ClickUp', url: 'https://app.clickup.com', category: 'Productivity' },
  'monday': { name: 'Monday.com', url: 'https://monday.com', category: 'Productivity' },
  'airtable': { name: 'Airtable', url: 'https://airtable.com', category: 'Productivity' },
  'miro': { name: 'Miro', url: 'https://miro.com', category: 'Productivity' },
  'figma': { name: 'Figma', url: 'https://www.figma.com', category: 'Productivity' },
  'canva': { name: 'Canva', url: 'https://www.canva.com', category: 'Productivity' },

  // Developer Tools
  'github': { name: 'GitHub', url: 'https://github.com', category: 'Developer' },
  'gitlab': { name: 'GitLab', url: 'https://gitlab.com', category: 'Developer' },
  'bitbucket': { name: 'Bitbucket', url: 'https://bitbucket.org', category: 'Developer' },
  'stackoverflow': { name: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'Developer' },
  'codepen': { name: 'CodePen', url: 'https://codepen.io', category: 'Developer' },
  'replit': { name: 'Replit', url: 'https://replit.com', category: 'Developer' },
  'codesandbox': { name: 'CodeSandbox', url: 'https://codesandbox.io', category: 'Developer' },
  'jsfiddle': { name: 'JSFiddle', url: 'https://jsfiddle.net', category: 'Developer' },
  'vercel': { name: 'Vercel', url: 'https://vercel.com', category: 'Developer' },
  'netlify': { name: 'Netlify', url: 'https://www.netlify.com', category: 'Developer' },
  'heroku': { name: 'Heroku', url: 'https://www.heroku.com', category: 'Developer' },
  'aws': { name: 'AWS Console', url: 'https://aws.amazon.com/console', category: 'Developer' },
  'azure': { name: 'Azure Portal', url: 'https://portal.azure.com', category: 'Developer' },
  'firebase': { name: 'Firebase', url: 'https://console.firebase.google.com', category: 'Developer' },
  'supabase': { name: 'Supabase', url: 'https://supabase.com', category: 'Developer' },
  'docker': { name: 'Docker Hub', url: 'https://hub.docker.com', category: 'Developer' },
  'npm': { name: 'NPM', url: 'https://www.npmjs.com', category: 'Developer' },
  'pypi': { name: 'PyPI', url: 'https://pypi.org', category: 'Developer' },
  'mdn': { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', category: 'Developer' },
  'devto': { name: 'Dev.to', url: 'https://dev.to', category: 'Developer' },
  'hashnode': { name: 'Hashnode', url: 'https://hashnode.com', category: 'Developer' },
  'hackerrank': { name: 'HackerRank', url: 'https://www.hackerrank.com', category: 'Developer' },
  'leetcode': { name: 'LeetCode', url: 'https://leetcode.com', category: 'Developer' },
  'codeforces': { name: 'Codeforces', url: 'https://codeforces.com', category: 'Developer' },
  'kaggle': { name: 'Kaggle', url: 'https://www.kaggle.com', category: 'Developer' },
  'w3schools': { name: 'W3Schools', url: 'https://www.w3schools.com', category: 'Developer' },

  // Shopping
  'amazon': { name: 'Amazon', url: 'https://www.amazon.in', category: 'Shopping' },
  'flipkart': { name: 'Flipkart', url: 'https://www.flipkart.com', category: 'Shopping' },
  'myntra': { name: 'Myntra', url: 'https://www.myntra.com', category: 'Shopping' },
  'ajio': { name: 'AJIO', url: 'https://www.ajio.com', category: 'Shopping' },
  'meesho': { name: 'Meesho', url: 'https://www.meesho.com', category: 'Shopping' },
  'snapdeal': { name: 'Snapdeal', url: 'https://www.snapdeal.com', category: 'Shopping' },
  'ebay': { name: 'eBay', url: 'https://www.ebay.com', category: 'Shopping' },
  'aliexpress': { name: 'AliExpress', url: 'https://www.aliexpress.com', category: 'Shopping' },
  'nykaa': { name: 'Nykaa', url: 'https://www.nykaa.com', category: 'Shopping' },
  'zomato': { name: 'Zomato', url: 'https://www.zomato.com', category: 'Shopping' },
  'swiggy': { name: 'Swiggy', url: 'https://www.swiggy.com', category: 'Shopping' },
  'bigbasket': { name: 'BigBasket', url: 'https://www.bigbasket.com', category: 'Shopping' },
  'blinkit': { name: 'Blinkit', url: 'https://blinkit.com', category: 'Shopping' },

  // Education
  'coursera': { name: 'Coursera', url: 'https://www.coursera.org', category: 'Education' },
  'udemy': { name: 'Udemy', url: 'https://www.udemy.com', category: 'Education' },
  'edx': { name: 'edX', url: 'https://www.edx.org', category: 'Education' },
  'khanacademy': { name: 'Khan Academy', url: 'https://www.khanacademy.org', category: 'Education' },
  'skillshare': { name: 'Skillshare', url: 'https://www.skillshare.com', category: 'Education' },
  'pluralsight': { name: 'Pluralsight', url: 'https://www.pluralsight.com', category: 'Education' },
  'udacity': { name: 'Udacity', url: 'https://www.udacity.com', category: 'Education' },
  'codecademy': { name: 'Codecademy', url: 'https://www.codecademy.com', category: 'Education' },
  'freecodecamp': { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org', category: 'Education' },
  'brilliant': { name: 'Brilliant', url: 'https://brilliant.org', category: 'Education' },
  'duolingo': { name: 'Duolingo', url: 'https://www.duolingo.com', category: 'Education' },
  'unacademy': { name: 'Unacademy', url: 'https://unacademy.com', category: 'Education' },
  'byjus': { name: "BYJU'S", url: 'https://byjus.com', category: 'Education' },
  'vedantu': { name: 'Vedantu', url: 'https://www.vedantu.com', category: 'Education' },

  // AI Tools
  'chatgpt': { name: 'ChatGPT', url: 'https://chat.openai.com', category: 'AI Tools' },
  'claude': { name: 'Claude AI', url: 'https://claude.ai', category: 'AI Tools' },
  'gemini': { name: 'Alsa AI', url: 'https://alsa-ai.in', category: 'AI Tools' },
  'bard': { name: 'Google Bard', url: 'https://bard.google.com', category: 'AI Tools' },
  'bing': { name: 'Bing Chat', url: 'https://www.bing.com/chat', category: 'AI Tools' },
  'copilot': { name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com', category: 'AI Tools' },
  'perplexity': { name: 'Perplexity AI', url: 'https://www.perplexity.ai', category: 'AI Tools' },
  'midjourney': { name: 'Midjourney', url: 'https://www.midjourney.com', category: 'AI Tools' },
  'dalle': { name: 'DALL-E', url: 'https://labs.openai.com', category: 'AI Tools' },
  'stability': { name: 'Stability AI', url: 'https://stability.ai', category: 'AI Tools' },
  'huggingface': { name: 'Hugging Face', url: 'https://huggingface.co', category: 'AI Tools' },
  'runway': { name: 'Runway ML', url: 'https://runwayml.com', category: 'AI Tools' },
  'jasper': { name: 'Jasper AI', url: 'https://www.jasper.ai', category: 'AI Tools' },
  'writesonic': { name: 'Writesonic', url: 'https://writesonic.com', category: 'AI Tools' },
  'grammarly': { name: 'Grammarly', url: 'https://www.grammarly.com', category: 'AI Tools' },

  // News & Information
  'wikipedia': { name: 'Wikipedia', url: 'https://www.wikipedia.org', category: 'Information' },
  'bbc': { name: 'BBC News', url: 'https://www.bbc.com/news', category: 'Information' },
  'cnn': { name: 'CNN', url: 'https://www.cnn.com', category: 'Information' },
  'ndtv': { name: 'NDTV', url: 'https://www.ndtv.com', category: 'Information' },
  'times': { name: 'Times of India', url: 'https://timesofindia.indiatimes.com', category: 'Information' },
  'hindustan': { name: 'Hindustan Times', url: 'https://www.hindustantimes.com', category: 'Information' },
  'reuters': { name: 'Reuters', url: 'https://www.reuters.com', category: 'Information' },
  'bloomberg': { name: 'Bloomberg', url: 'https://www.bloomberg.com', category: 'Information' },
  'techcrunch': { name: 'TechCrunch', url: 'https://techcrunch.com', category: 'Information' },
  'theverge': { name: 'The Verge', url: 'https://www.theverge.com', category: 'Information' },
  'wired': { name: 'Wired', url: 'https://www.wired.com', category: 'Information' },
  'arstechnica': { name: 'Ars Technica', url: 'https://arstechnica.com', category: 'Information' },

  // Maps & Travel
  'maps': { name: 'Google Maps', url: 'https://maps.google.com', category: 'Travel' },
  'googlemaps': { name: 'Google Maps', url: 'https://maps.google.com', category: 'Travel' },
  'makemytrip': { name: 'MakeMyTrip', url: 'https://www.makemytrip.com', category: 'Travel' },
  'booking': { name: 'Booking.com', url: 'https://www.booking.com', category: 'Travel' },
  'airbnb': { name: 'Airbnb', url: 'https://www.airbnb.com', category: 'Travel' },
  'tripadvisor': { name: 'TripAdvisor', url: 'https://www.tripadvisor.com', category: 'Travel' },
  'uber': { name: 'Uber', url: 'https://www.uber.com', category: 'Travel' },
  'ola': { name: 'Ola', url: 'https://www.olacabs.com', category: 'Travel' },
  'irctc': { name: 'IRCTC', url: 'https://www.irctc.co.in', category: 'Travel' },
  'goibibo': { name: 'Goibibo', url: 'https://www.goibibo.com', category: 'Travel' },
  'yatra': { name: 'Yatra', url: 'https://www.yatra.com', category: 'Travel' },
  'cleartrip': { name: 'Cleartrip', url: 'https://www.cleartrip.com', category: 'Travel' },
  'skyscanner': { name: 'Skyscanner', url: 'https://www.skyscanner.com', category: 'Travel' },

  // Finance
  'paytm': { name: 'Paytm', url: 'https://paytm.com', category: 'Finance' },
  'phonepe': { name: 'PhonePe', url: 'https://www.phonepe.com', category: 'Finance' },
  'gpay': { name: 'Google Pay', url: 'https://pay.google.com', category: 'Finance' },
  'paypal': { name: 'PayPal', url: 'https://www.paypal.com', category: 'Finance' },
  'zerodha': { name: 'Zerodha', url: 'https://zerodha.com', category: 'Finance' },
  'groww': { name: 'Groww', url: 'https://groww.in', category: 'Finance' },
  'upstox': { name: 'Upstox', url: 'https://upstox.com', category: 'Finance' },
  'moneycontrol': { name: 'MoneyControl', url: 'https://www.moneycontrol.com', category: 'Finance' },

  // Gaming
  'steam': { name: 'Steam', url: 'https://store.steampowered.com', category: 'Gaming' },
  'epicgames': { name: 'Epic Games', url: 'https://store.epicgames.com', category: 'Gaming' },
  'roblox': { name: 'Roblox', url: 'https://www.roblox.com', category: 'Gaming' },
  'minecraft': { name: 'Minecraft', url: 'https://www.minecraft.net', category: 'Gaming' },
  'ign': { name: 'IGN', url: 'https://www.ign.com', category: 'Gaming' },
  'gamespot': { name: 'GameSpot', url: 'https://www.gamespot.com', category: 'Gaming' },
  'poki': { name: 'Poki Games', url: 'https://poki.com', category: 'Gaming' },
  'crazygames': { name: 'CrazyGames', url: 'https://www.crazygames.com', category: 'Gaming' },
};

// Universal command execution - no whitelist restrictions
export const sendCommand = async (command: string): Promise<{ success: boolean; message: string; output?: string }> => {
  try {
    console.log('Sending command to bridge:', command);
    const response = await fetch(`${BRIDGE_URL}/execute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ command }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.message || errorData.error || `Bridge returned ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success ?? true,
      message: data.message || 'Command executed',
      output: data.output || data.stdout || data.stderr
    };
  } catch (error: any) {
    console.error('Bridge connection error:', error);
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge. Make sure the bridge script is running.'
    };
  }
};

export interface SystemScanResult {
  success: boolean;
  data?: {
    applications: string[];
    commonFolders: string[];
    recentFiles: string[];
  };
  message?: string;
}

export const scanSystem = async (): Promise<SystemScanResult> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/scan`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    }
    return { success: false, message: 'Failed to scan system' };
  } catch (error) {
    return { success: false, message: 'Cannot connect to PC Bridge for scanning' };
  }
};

// Natural language command patterns for ALL languages
const MULTILANG_PATTERNS = {
  // Open patterns
  open: [
    /(?:open|launch|start|run|execute|kholna|kholo|khol|kholdo|chalu|shuru|chalayen|kholein|ouvrir|öffnen|abrir|启动|開く|열다)/i,
    /(?:bhai|yaar|please|plz|zara|jra|thoda)/i, // Hindi casual words
  ],
  // Close patterns
  close: [
    /(?:close|exit|quit|band|band\s*kar|band\s*karo|band\s*karden|hatao|fermer|schließen|cerrar|关闭|閉じる|닫다)/i,
  ],

  // Recording patterns
  recording: [
    /(?:record|recording|rec|screen\s*record|video\s*le|video\s*record|aufnehmen|enregistrer|grabar|录制|録画)/i,
  ],
  // Stop patterns
  stop: [
    /(?:stop|ruk|ruko|band|bas|rok|arrêter|stoppen|parar|停止|止める|멈춰)/i,
  ],
  // Power patterns
  shutdown: [
    /(?:shutdown|shut\s*down|power\s*off|band\s*karo|system\s*band|computer\s*band|éteindre|herunterfahren|apagar|关机|シャットダウン)/i,
  ],
  restart: [
    /(?:restart|reboot|dubara\s*chalu|phir\s*se\s*chalu|redémarrer|neustart|reiniciar|重启|再起動)/i,
  ],
  sleep: [
    /(?:sleep|hibernate|soja|so\s*ja|veille|ruhezustand|suspender|睡眠|スリープ)/i,
  ],
};

// Parse natural language input in ANY language
export const parseNaturalLanguage = (input: string): { action: string; target: string; params: Record<string, any> } | null => {
  const lowerInput = input.toLowerCase().trim();

  // Check for website opening (only when the user explicitly asks to open/visit)
  for (const [key, site] of Object.entries(WEBSITES)) {
    const matchesSite = lowerInput.includes(key) || lowerInput.includes(site.name.toLowerCase());
    if (!matchesSite) continue;

    const isOpenCommand = MULTILANG_PATTERNS.open.some((p) => p.test(lowerInput));
    if (isOpenCommand) {
      return { action: 'open_website', target: site.url, params: { name: site.name } };
    }
  }

  // Check for screen recording
  if (MULTILANG_PATTERNS.recording.some(p => p.test(lowerInput))) {
    const stopMatch = MULTILANG_PATTERNS.stop.some(p => p.test(lowerInput));
    if (stopMatch) {
      return { action: 'stop_recording', target: '', params: {} };
    }
    const durationMatch = lowerInput.match(/(\d+)\s*(?:sec|second|seconds|min|minute|minutes|सेकंड|मिनट)/i);
    return {
      action: 'start_recording',
      target: '',
      params: { duration: durationMatch ? parseInt(durationMatch[1]) : 30 }
    };
  }

  // Power commands
  if (MULTILANG_PATTERNS.shutdown.some(p => p.test(lowerInput))) {
    return { action: 'shutdown', target: '', params: {} };
  }
  if (MULTILANG_PATTERNS.restart.some(p => p.test(lowerInput))) {
    return { action: 'restart', target: '', params: {} };
  }
  if (MULTILANG_PATTERNS.sleep.some(p => p.test(lowerInput))) {
    return { action: 'sleep', target: '', params: {} };
  }

  // Application map - add "antigravity" as requested
  const appMap: Record<string, string> = {
    'notepad': 'notepad',
    'नोटपैड': 'notepad',
    'calculator': 'calc',
    'calc': 'calc',
    'कैलकुलेटर': 'calc',
    'paint': 'mspaint',
    'पेंट': 'mspaint',
    'chrome': 'chrome',
    'क्रोम': 'chrome',
    'firefox': 'firefox',
    'edge': 'msedge',
    'explorer': 'explorer',
    'file explorer': 'explorer',
    'फाइल': 'explorer',
    'cmd': 'cmd',
    'command prompt': 'cmd',
    'कमांड': 'cmd',
    'powershell': 'powershell',
    'task manager': 'taskmgr',
    'टास्क': 'taskmgr',
    'settings': 'ms-settings:',
    'सेटिंग्स': 'ms-settings:',
    'word': 'winword',
    'excel': 'excel',
    'powerpoint': 'powerpnt',
    'ppt': 'powerpnt',
    'outlook': 'outlook',
    'vscode': 'code',
    'vs code': 'code',
    'code': 'code',
    'visual studio code': 'code',
    'visual studio': 'devenv',
    'antigravity': 'code', // Opens VS Code for coding
    'vlc': 'vlc',
    'media player': 'wmplayer',
    'spotify': 'spotify',
    'telegram': 'telegram',
    'whatsapp': 'whatsapp',
    'discord': 'discord',
    'slack': 'slack',
    'zoom': 'zoom',
    'teams': 'msteams',
    'obs': 'obs64',
    'obs studio': 'obs64',
    'photoshop': 'photoshop',
    'premiere': 'premiere',
    'blender': 'blender',
    'android studio': 'studio64',
    'pycharm': 'pycharm64',
    'intellij': 'idea64',
    'sublime': 'sublime_text',
    'atom': 'atom',
    'terminal': 'wt', // Windows Terminal
    'git bash': 'git-bash',
  };

  // Check for app opening
  if (MULTILANG_PATTERNS.open.some(p => p.test(lowerInput))) {
    for (const [appName, appCmd] of Object.entries(appMap)) {
      if (lowerInput.includes(appName)) {
        // Check if there's a path specified
        const pathMatch = input.match(/(?:in|at|में|पर)\s+(.+?)(?:\s|$)/i);
        return {
          action: 'open_app',
          target: appCmd,
          params: { name: appName, path: pathMatch ? pathMatch[1].trim() : null }
        };
      }
    }
  }

  // Check for app closing
  if (MULTILANG_PATTERNS.close.some(p => p.test(lowerInput))) {
    for (const [appName, appCmd] of Object.entries(appMap)) {
      if (lowerInput.includes(appName)) {
        return { action: 'close_app', target: appCmd, params: { name: appName } };
      }
    }
    // Try to extract window name
    const windowMatch = input.match(/(?:close|band|hatao)\s+(.+)/i);
    if (windowMatch) {
      return { action: 'close_window', target: windowMatch[1].trim(), params: {} };
    }
  }

  return null;
};

// Execute system command with natural language support
export const executeSystemCommand = async (action: string): Promise<{ success: boolean; message: string; output?: string }> => {
  console.log('Executing system command:', action);

  // First try natural language parsing
  const parsed = parseNaturalLanguage(action);

  if (parsed) {
    switch (parsed.action) {
      case 'open_website':
        // Use the browser for websites (works even when bridge has run-command restrictions)
        window.open(parsed.target, '_blank', 'noopener,noreferrer');
        return { success: true, message: `Opening website` };

      case 'open_app': {
        // IMPORTANT: Bridge's /execute endpoint currently allows a limited set of safe commands.
        // We translate common intents to those allowed commands so users don't see "command not allowed".
        const target = (parsed.target || '').toLowerCase().trim();

        // VS Code / Antigravity support (open at any path)
        if (target === 'code') {
          if (parsed.params.path) {
            return await sendCommand(`vscode:${parsed.params.path}`);
          }
          return await sendCommand('code');
        }

        // Common Windows apps
        if (['chrome', 'cmd', 'explorer', 'calc', 'notepad', 'mspaint', 'taskmgr', 'control', 'ms-settings:'].includes(target)) {
          return await sendCommand(`start ${target}`);
        }

        // Fallback: try raw (bridge may still block)
        return await sendCommand(target);
      }

      case 'close_app':
      case 'close_window':
        return await closeWindow(parsed.target);
        
      case 'start_recording':
        return await startScreenRecording(parsed.params.duration);

      case 'stop_recording':
        return await stopScreenRecording();

      case 'shutdown':
        return await sendCommand('shutdown');

      case 'restart':
        return await sendCommand('restart');

      case 'sleep':
        return await sendCommand('sleep');
    }
  }

  // Fallback: Try to execute as raw command (no whitelist)
  return await sendCommand(action);
};

export const executePythonFile = async (filePath: string): Promise<{ success: boolean; message: string; output?: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/execute_python`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ file_path: filePath }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.message || errorData.error || `Failed to execute Python file`);
    }

    const data = await response.json();
    const output = data.stdout || data.stderr || '';
    return {
      success: data.returncode === 0,
      message: data.message,
      output: output
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge'
    };
  }
};

export const executeCmdCommand = async (command: string): Promise<{ success: boolean; message: string; output?: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/execute_cmd`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ command }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.message || errorData.error || `Failed to execute command`);
    }

    const data = await response.json();
    const output = data.stdout || data.stderr || '';
    return {
      success: data.returncode === 0,
      message: data.message,
      output: output
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge'
    };
  }
};

export const createProject = async (projectPath: string, files: Record<string, string>): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/create_project`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ project_path: projectPath, files }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.message || errorData.error || `Failed to create project`);
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge'
    };
  }
};

// Create a folder at any path
export const createFolder = async (folderPath: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/create_folder`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ folder_path: folderPath }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.message || errorData.error || `Failed to create folder`);
    }

    const data = await response.json();
    return { success: true, message: data.message || `Folder created: ${folderPath}` };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge'
    };
  }
};

// WhatsApp message automation
export const sendWhatsAppMsg = async (phone: string, message: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    console.log('Sending WhatsApp message to:', phone);
    const response = await fetch(`${BRIDGE_URL}/whatsapp-msg`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone, message })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      return { success: false, error: errorData.error || errorData.message || 'Failed to send WhatsApp message' };
    }

    return await response.json();
  } catch (error: any) {
    console.error('WhatsApp message error:', error);
    return { success: false, error: error.message || 'Cannot connect to PC Bridge for WhatsApp' };
  }
};

// Telegram message automation
export const sendTelegramMsg = async (link: string, message: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    console.log('Sending Telegram message to:', link);
    const response = await fetch(`${BRIDGE_URL}/telegram-msg`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ link, message })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      return { success: false, error: errorData.error || errorData.message || 'Failed to send Telegram message' };
    }

    return await response.json();
  } catch (error: any) {
    console.error('Telegram message error:', error);
    return { success: false, error: error.message || 'Cannot connect to PC Bridge for Telegram' };
  }
};

// Create a text file with content at any path
export const createTextFile = async (filePath: string, content: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/create_text_file`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ file_path: filePath, content }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.message || errorData.error || `Failed to create file`);
    }

    const data = await response.json();
    return { success: true, message: data.message || `File created: ${filePath}` };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge'
    };
  }
};

// Open website with search query
export const openWebsiteWithSearch = (platform: 'youtube' | 'spotify' | 'google', searchQuery: string): void => {
  const searchUrls: Record<string, string> = {
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
    spotify: `https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`,
    google: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
  };

  const url = searchUrls[platform];
  if (url) {
    window.open(url, '_blank');
  }
};

// Open custom app from user's configured apps
export const openCustomApp = async (appName: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Get custom apps from localStorage
    const customApps = JSON.parse(localStorage.getItem('alsa_custom_apps') || '[]');
    const app = customApps.find((a: any) => a.name.toLowerCase() === appName.toLowerCase());

    if (!app) {
      return { success: false, message: `Custom app "${appName}" not found in settings` };
    }

    const response = await fetch(`${BRIDGE_URL}/execute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ command: `start "" "${app.path}"` }),
    });

    if (!response.ok) {
      throw new Error('Failed to open app');
    }

    const data = await response.json();
    return { success: true, message: data.message || `Opened ${app.name}` };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge'
    };
  }
};

export const checkInstallation = async (software: string): Promise<{ success: boolean; installed: boolean; message: string; version?: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/check_installation`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ software }),
    });

    const data = await response.json();
    return {
      success: data.success,
      installed: data.installed,
      message: data.message,
      version: data.version
    };
  } catch (error: any) {
    return {
      success: false,
      installed: false,
      message: 'Cannot connect to PC Bridge'
    };
  }
};

export const adbConnect = async (ipAddress?: string): Promise<{ success: boolean; message: string; output?: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/adb_connect`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ip_address: ipAddress || '' }),
    });

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      output: data.output
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Cannot connect to PC Bridge for ADB'
    };
  }
};

export const adbCommand = async (command: string): Promise<{ success: boolean; message: string; output?: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/adb_command`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ command }),
    });

    const data = await response.json();
    const output = data.stdout || data.stderr || '';
    return {
      success: data.success,
      message: data.message,
      output: output
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Cannot connect to PC Bridge for ADB command'
    };
  }
};

// Screen recording functions
let recordingMediaRecorder: MediaRecorder | null = null;
let recordingChunks: Blob[] = [];
let recordingStream: MediaStream | null = null;

// Save recording to disk via PC Bridge
export const saveRecordingToDisk = async (
  blob: Blob,
  savePath: string
): Promise<{ success: boolean; message: string; filePath?: string }> => {
  try {
    // Convert blob to base64
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const filename = `recording-${Date.now()}.webm`;

    const response = await fetch(`${BRIDGE_URL}/save_recording`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        save_path: savePath,
        filename,
        data: base64
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to save recording');
    }

    return {
      success: true,
      message: data.message || 'Recording saved',
      filePath: data.file_path || `${savePath}\\${filename}`
    };
  } catch (error: any) {
    console.error('Failed to save recording via PC Bridge:', error);
    return {
      success: false,
      message: error.message || 'Failed to save recording to disk'
    };
  }
};

// Open folder in file explorer
export const openFolder = async (folderPath: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/open_folder`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ folder_path: folderPath })
    });
    const data = await response.json();
    return {
      success: data.success ?? true,
      message: data.message || 'Folder opened'
    };
  } catch (error: any) {
    // Fallback: try using run command
    return await runCommand(`explorer "${folderPath}"`);
  }
};

export const startScreenRecording = async (durationSeconds?: number): Promise<{ success: boolean; message: string }> => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'monitor' } as any,
      audio: true
    });

    recordingStream = stream;
    recordingChunks = [];
    recordingMediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    recordingMediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordingChunks.push(e.data);
      }
    };

    recordingMediaRecorder.onstop = async () => {
      const blob = new Blob(recordingChunks, { type: 'video/webm' });

      // Try to save to settings path via PC Bridge
      const outputPaths = localStorage.getItem('alsa_output_paths');
      let savePath = 'C:\\Users\\Mohd Eisa\\Videos\\Recordings';

      if (outputPaths) {
        try {
          const parsed = JSON.parse(outputPaths);
          if (parsed.recording) {
            savePath = parsed.recording;
          }
        } catch (e) {
          console.error('Failed to parse output paths:', e);
        }
      }

      // Try to save via PC Bridge
      const saveResult = await saveRecordingToDisk(blob, savePath);

      if (!saveResult.success) {
        // Fallback: Download via browser
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screen-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      }

      // Stop all tracks
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
        recordingStream = null;
      }

      // Dispatch event for UI to show "Open Folder" button
      window.dispatchEvent(new CustomEvent('recording-saved', {
        detail: {
          success: saveResult.success,
          filePath: saveResult.filePath,
          folderPath: savePath
        }
      }));
    };

    recordingMediaRecorder.start();

    // Auto-stop after duration
    if (durationSeconds && durationSeconds > 0) {
      setTimeout(() => {
        if (recordingMediaRecorder && recordingMediaRecorder.state === 'recording') {
          recordingMediaRecorder.stop();
        }
      }, durationSeconds * 1000);
    }

    return {
      success: true,
      message: `Recording started${durationSeconds ? ` for ${durationSeconds} seconds` : ''}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to start screen recording'
    };
  }
};

export const stopScreenRecording = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (recordingMediaRecorder && recordingMediaRecorder.state === 'recording') {
      recordingMediaRecorder.stop();
      return { success: true, message: 'Recording stopped and saved' };
    }
    return { success: false, message: 'No active recording to stop' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to stop recording'
    };
  }
};

export const closeWindow = async (windowName: string): Promise<{ success: boolean; message: string; output?: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/close_window`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ window_name: windowName })
    });
    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
      output: data.output
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Cannot connect to PC Bridge for window management'
    };
  }
};

export const runCommand = async (command: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/run_command`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ command })
    });
    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        message: `Failed: ${data.error}`
      };
    }

    return {
      success: data.success ?? true,
      message: data.message || `Command executed`
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge for run command'
    };
  }
};

export interface SlideData {
  title: string;
  content: string;
  layout?: 'title' | 'content' | 'two_column' | 'image';
}

export const createPowerPoint = async (
  filePath: string,
  title: string,
  slides: SlideData[],
  theme?: string
): Promise<{ success: boolean; message: string; file_path?: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/create_powerpoint`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        file_path: filePath,
        title,
        slides,
        theme: theme || 'professional'
      })
    });
    const data = await response.json();

    if (data.error) {
      return { success: false, message: data.error };
    }

    return {
      success: true,
      message: data.message || 'PowerPoint created',
      file_path: data.file_path
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge for PowerPoint creation'
    };
  }
};

export interface ExcelFormatting {
  header_color?: string;
  alternating_rows?: boolean;
  auto_width?: boolean;
}

export const createExcel = async (
  filePath: string,
  sheetName: string,
  headers: string[],
  data: string[][],
  formatting?: ExcelFormatting
): Promise<{ success: boolean; message: string; file_path?: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/create_excel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        file_path: filePath,
        sheet_name: sheetName,
        headers,
        data,
        formatting: formatting || { header_color: '#4472C4', alternating_rows: true, auto_width: true }
      })
    });
    const data_response = await response.json();

    if (data_response.error) {
      return { success: false, message: data_response.error };
    }

    return {
      success: true,
      message: data_response.message || 'Excel file created',
      file_path: data_response.file_path
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge for Excel creation'
    };
  }
};

export interface ColumnDef {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'DATE' | 'BOOLEAN';
  primary_key?: boolean;
}

export interface TableDef {
  name: string;
  columns: ColumnDef[];
  sample_data?: any[][];
}

export const createDatabase = async (
  filePath: string,
  dbType: 'sqlite' | 'access',
  tables: TableDef[]
): Promise<{ success: boolean; message: string; file_path?: string; tables?: string[] }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/create_database`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        file_path: filePath,
        db_type: dbType,
        tables
      })
    });
    const data = await response.json();

    if (data.error) {
      return { success: false, message: data.error };
    }

    return {
      success: true,
      message: data.message || 'Database created',
      file_path: data.file_path,
      tables: data.tables
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge for database creation'
    };
  }
};

// Song/Music functions
export interface SongInfo {
  name: string;
  path: string;
  artist?: string;
  album?: string;
}

export const getSongList = async (): Promise<{ success: boolean; songs: SongInfo[]; message?: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/get_songs`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await response.json();

    if (data.error) {
      return { success: false, songs: [], message: data.error };
    }

    return {
      success: true,
      songs: data.songs || [],
      message: data.message
    };
  } catch (error: any) {
    return {
      success: false,
      songs: [],
      message: error.message || 'Cannot connect to PC Bridge for song list'
    };
  }
};

export const playSong = async (songPath: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/play_song`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ song_path: songPath })
    });
    const data = await response.json();

    if (data.error) {
      return { success: false, message: data.error };
    }

    return {
      success: true,
      message: data.message || 'Playing song'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge for playing song'
    };
  }
};

export const stopSong = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BRIDGE_URL}/stop_song`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await response.json();

    return {
      success: true,
      message: data.message || 'Music stopped'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge'
    };
  }
};

// File upload to bridge
export const uploadFileToBridge = async (file: File): Promise<{ success: boolean; message: string; path?: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BRIDGE_URL}/upload_file`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return {
      success: data.success ?? true,
      message: data.message || 'File uploaded',
      path: data.path
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge for file upload'
    };
  }
};

// Run a project on localhost
export const runProject = async (
  projectPath: string,
  projectType: 'react' | 'node' | 'python' | 'html'
): Promise<{ success: boolean; message: string; output?: string }> => {
  try {
    // Commands for different project types
    const commands: Record<string, string[]> = {
      react: [
        `cd /d "${projectPath}"`,
        'npm install',
        'npm run dev'
      ],
      node: [
        `cd /d "${projectPath}"`,
        'npm install',
        'node index.js'
      ],
      python: [
        `cd /d "${projectPath}"`,
        'pip install -r requirements.txt',
        'python main.py'
      ],
      html: [
        `cd /d "${projectPath}"`,
        'start index.html'
      ]
    };

    const projectCommands = commands[projectType] || commands.html;

    // Execute via PC Bridge - open cmd and run commands
    const response = await fetch(`${BRIDGE_URL}/run_project`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        project_path: projectPath,
        project_type: projectType,
        commands: projectCommands
      })
    });

    const data = await response.json();
    return {
      success: data.success ?? true,
      message: data.message || `Running ${projectType} project at ${projectPath}`,
      output: data.output
    };
  } catch (error: any) {
    // Fallback: try to open the folder or run basic command
    try {
      await sendCommand(`start cmd /k "cd /d ${projectPath}"`);
      return {
        success: true,
        message: `Opened command prompt at ${projectPath}. Please run the project manually.`
      };
    } catch {
      return {
        success: false,
        message: error.message || 'Cannot connect to PC Bridge for running project'
      };
    }
  }
};

// ============================================================
// YT-DLP: YouTube / Playlist Downloader (Pro + Elite bridges)
// ============================================================
export interface YtDlpDownloadOptions {
  url: string;
  mode?: 'video' | 'audio' | 'best';
  quality?: '144' | '240' | '360' | '480' | '720' | '1080' | '1440' | '2160' | 'best';
  audio_format?: 'mp3' | 'm4a' | 'opus' | 'wav' | 'flac';
  audio_quality?: string;
  output_dir?: string;
  filename_template?: string;
  subtitles?: boolean;
  sub_langs?: string[];
  auto_subs?: boolean;
  embed_subs?: boolean;
  embed_thumbnail?: boolean;
  write_thumbnail?: boolean;
  embed_metadata?: boolean;
  write_description?: boolean;
  write_info_json?: boolean;
  playlist?: boolean;
  playlist_items?: string;
  start?: string;
  end?: string;
  cookies_from_browser?: 'chrome' | 'firefox' | 'edge' | 'brave' | 'opera';
  proxy?: string;
  rate_limit?: string;
  retries?: number;
  restrict_filenames?: boolean;
  live_from_start?: boolean;
  format?: string;
  sponsorblock_remove?: boolean;
  sponsorblock_cats?: string[];
  concurrent?: number;
}

export const ytdlpStatus = async () => {
  try {
    const r = await fetch(`${BRIDGE_URL}/ytdlp/status`);
    return await r.json();
  } catch (e: any) {
    return { installed: false, error: e.message };
  }
};

export const ytdlpInfo = async (url: string) => {
  const r = await fetch(`${BRIDGE_URL}/ytdlp/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return await r.json();
};

export const ytdlpDownload = async (opts: YtDlpDownloadOptions) => {
  const r = await fetch(`${BRIDGE_URL}/ytdlp/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  return await r.json();
};

export const ytdlpFormats = async (url: string) => {
  const r = await fetch(`${BRIDGE_URL}/ytdlp/formats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return await r.json();
};

export const ytdlpOpenFolder = async () => {
  const r = await fetch(`${BRIDGE_URL}/ytdlp/open_folder`);
  return await r.json();
};

/** Detect a YouTube/playlist URL in free-form text */
export const extractYouTubeUrl = (text: string): string | null => {
  const m = text.match(/https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i);
  return m ? m[0] : null;
};

// ═══════════════════════════════════════════════════════════════
// 📱 PHONE BRIDGE (Elite Only) — Termux on Android, port 5002
// ═══════════════════════════════════════════════════════════════
export const PHONE_BRIDGE_URL = 'http://127.0.0.1:5002';

const phoneHeaders = () => ({ 'Content-Type': 'application/json' });

const phonePost = async (path: string, body: any = {}) => {
  try {
    const r = await fetch(`${PHONE_BRIDGE_URL}${path}`, {
      method: 'POST',
      headers: phoneHeaders(),
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      return { ok: false, success: false, error: t || `HTTP ${r.status}` };
    }
    return await r.json();
  } catch (e: any) {
    return { ok: false, success: false, error: e?.message || 'Phone Bridge not reachable' };
  }
};

export const checkPhoneBridgeConnection = async (): Promise<BridgeStatus> => {
  try {
    const r = await fetch(`${PHONE_BRIDGE_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      return { connected: true, message: j?.bridge || 'Phone Bridge connected' };
    }
    return { connected: false, message: 'Phone Bridge not responding' };
  } catch {
    return { connected: false, message: 'Phone Bridge not running (Termux)' };
  }
};

// Basic
export const phoneNotify   = (title: string, content: string) => phonePost('/notify', { title, content });
export const phoneToast    = (text: string) => phonePost('/toast', { text });
export const phoneVibrate  = (duration = 1000) => phonePost('/vibrate', { duration });

// Hardware
export const phoneTorch      = (on: boolean) => phonePost('/torch', { on });
export const phoneBrightness = (level: number) => phonePost('/brightness', { level });
export const phoneVolume     = (stream: 'music'|'call'|'ring'|'notification', level: number) =>
  phonePost('/volume', { stream, level });
export const phoneBattery    = () => phonePost('/battery');
export const phoneLocation   = (provider: 'gps'|'network' = 'gps') => phonePost('/location', { provider });

// Clipboard
export const phoneClipboardGet = () => phonePost('/clipboard/get');
export const phoneClipboardSet = (text: string) => phonePost('/clipboard/set', { text });

// SMS / Call
export const phoneSmsSend  = (number: string, text: string) => phonePost('/sms/send', { number, text });
export const phoneSmsList  = (limit = 10) => phonePost('/sms/list', { limit });
export const phoneCallMake = (number: string) => phonePost('/call/make', { number });
export const phoneCallByName = (name: string) => phonePost('/call/by-name', { name, first: true });
export const phoneCallEnd  = () => phonePost('/call/end');
export const phoneContacts = () => phonePost('/contacts');

// Voice
export const phoneTts = (text: string) => phonePost('/tts', { text });
export const phoneStt = () => phonePost('/stt');

// Camera
export const phoneCameraPhoto = (path?: string, camera: 0|1 = 0) => phonePost('/camera/photo', { path, camera });
export const phoneCameraInfo  = () => phonePost('/camera/info');

// Apps / Intents
export const phoneAppOpen = (pkg: string) => phonePost('/app/open', { package: pkg });
export const phoneAppList = () => phonePost('/app/list');
export const phoneUrlOpen = (url: string) => phonePost('/url/open', { url });
export const phoneShare   = (text: string, title = 'Share') => phonePost('/share', { text, title });

// Wi-Fi
export const phoneWifiToggle = (on: boolean) => phonePost('/wifi/toggle', { on });
export const phoneWifiInfo   = () => phonePost('/wifi/info');

// Media
export const phoneMediaControl = (action: 'play'|'pause'|'next'|'previous'|'stop') =>
  phonePost('/media/control', { action });

// Sensors
export const phoneSensors = (name?: string) => phonePost('/sensors', name ? { name } : {});

// Storage
export const phoneStorageList  = (path = '/sdcard') => phonePost('/storage/list', { path });
export const phoneStorageRead  = (path: string) => phonePost('/storage/read', { path });
export const phoneStorageWrite = (path: string, content: string) => phonePost('/storage/write', { path, content });

// Shell (power user)
export const phoneShell = (command: string) => phonePost('/shell', { command });

// WhatsApp automation (via ADB — works when phone-bridge can reach adb)
export const phoneWhatsappSend       = (number: string, text: string) => phonePost('/whatsapp/send', { number, text });
export const phoneWhatsappSendByName = (name: string, text: string, first = true) =>
  phonePost('/whatsapp/send-by-name', { name, text, first });

// Contacts
export const phoneContactsRefresh = () => phonePost('/contacts/refresh');
export const phoneContactsSearch  = (query: string) => phonePost('/contacts/search', { query });

// yt-dlp on phone
export const phoneYtdlpStatus   = () => phonePost('/ytdlp/status');
export const phoneYtdlpDownload = (opts: {
  url: string;
  mode?: 'video' | 'audio';
  quality?: string;
  audio_format?: 'mp3' | 'm4a' | 'opus' | 'wav' | 'flac';
  subtitles?: boolean;
  embed_thumbnail?: boolean;
  embed_metadata?: boolean;
  playlist?: boolean;
  output_dir?: string;
}) => phonePost('/ytdlp/download', opts);

// ============================
// 📱 Smart App Aliases
// ============================

const APP_ALIASES: Record<string, string> = {
  fb: "facebook",
  facebookapp: "facebook",

  yt: "youtube",
  youtubeapp: "youtube",

  insta: "instagram",
  ig: "instagram",

  wa: "whatsapp",
  whatsappapp: "whatsapp",

  chromebrowser: "chrome",

  playstore: "play store",
  play: "play store",

  mapsapp: "maps",
  gps: "maps",

  galleryapp: "gallery",
  photos: "gallery",

  cam: "camera",

  settingsapp: "settings",

  calc: "calculator",

  contactsapp: "contacts",

  filesapp: "files",

  filemanager: "files",

  musicplayer: "music",

  videoplayer: "video",

  gmailapp: "gmail",

  googlemail: "gmail",

  driveapp: "drive",

  googlephotos: "photos",

  playmusic: "youtube music"
};

function normalizeAppName(name: string): string {
  const key = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");

  return APP_ALIASES[key] || name.toLowerCase().trim();
}

// ── Phone natural-language parser + executor ────────────────────────────────
export interface PhoneCommand {
  action: string;
  params?: Record<string, any>;
  label: string;
}

export const parsePhoneCommand = (input: string): PhoneCommand | null => {
  const t = input.toLowerCase().trim();

  // Torch
  if (/\b(torch|flashlight|flash|light)\b.*\b(on|chalu|jala|jalao|start|open)\b/.test(t)
      || /\b(on|chalu|jalao|start)\b.*\b(torch|flashlight|flash)\b/.test(t)) {
    return { action: 'torch', params: { on: true }, label: 'turn torch ON' };
  }
  if (/\b(torch|flashlight|flash|light)\b.*\b(off|band|bandh|close|stop)\b/.test(t)
      || /\b(off|band|bandh|stop)\b.*\b(torch|flashlight|flash)\b/.test(t)) {
    return { action: 'torch', params: { on: false }, label: 'turn torch OFF' };
  }

  // Vibrate
  if (/\b(vibrate|vibration|kampan|thartharao|thartharaho)\b/.test(t)) {
    const m = t.match(/(\d{2,5})\s*(ms|milli|second|sec)?/);
    const dur = m ? Math.min(5000, parseInt(m[1])) : 1000;
    return { action: 'vibrate', params: { duration: dur }, label: `vibrate phone (${dur}ms)` };
  }

  // Battery
  if (/\bbattery\b|\bbatri\b|\bbattry\b|battery\s*(status|level|percent)|kitni.*battery|battery.*kitni/.test(t)) {
    return { action: 'battery', label: 'get battery status' };
  }

  // Brightness
  const brightM = t.match(/brightness\s*(?:ko|to|=)?\s*(\d{1,3})/) || t.match(/(\d{1,3})\s*%?\s*brightness/);
  if (brightM) {
    const lvl = Math.max(0, Math.min(255, parseInt(brightM[1]) > 100 ? parseInt(brightM[1]) : Math.round(parseInt(brightM[1]) * 2.55)));
    return { action: 'brightness', params: { level: lvl }, label: `set brightness ${brightM[1]}` };
  }

  // Volume
  const volM = t.match(/volume\s*(?:ko|to|=)?\s*(\d{1,3})/);
  if (volM) return { action: 'volume', params: { stream: 'music', level: parseInt(volM[1]) }, label: `set volume ${volM[1]}` };

  // Location
  if (/\b(location|gps|kaha hu|kahan hoon|where am i|meri location)\b/.test(t)) {
    return { action: 'location', label: 'get GPS location' };
  }

  // Wi-Fi
  if (/\bwifi\b.*\b(on|chalu|start)\b/.test(t)) return { action: 'wifi', params: { on: true }, label: 'wifi ON' };
  if (/\bwifi\b.*\b(off|band|stop)\b/.test(t))  return { action: 'wifi', params: { on: false }, label: 'wifi OFF' };
  if (/\bwifi\b.*(info|details|status)/.test(t)) return { action: 'wifi-info', label: 'wifi info' };

  // Clipboard
  if (/clipboard.*(read|get|dikhao|show)/.test(t)) return { action: 'clip-get', label: 'read clipboard' };
  const clipSet = t.match(/clipboard.*(?:set|copy|par likh|mein daal)[^"']*["'](.+?)["']/);
  if (clipSet) return { action: 'clip-set', params: { text: clipSet[1] }, label: 'set clipboard' };

  // SMS
  const smsM = input.match(/sms\s+(?:send\s+)?(?:to\s+)?(\+?\d[\d\s\-]{6,15})\s*[:,\-]?\s*["']?(.+?)["']?$/i)
             || input.match(/(\+?\d[\d\s\-]{6,15})\s*(?:ko|par)?\s*sms\s*(?:bhejo|send|kar)[^"']*["'](.+?)["']/i);
  if (smsM) return { action: 'sms', params: { number: smsM[1].replace(/[\s\-]/g, ''), text: smsM[2] }, label: `SMS to ${smsM[1]}` };

  // Call by number
  const callM = input.match(/(?:call|phone|dial|call\s+karo)\s+(?:to\s+)?(\+?\d[\d\s\-]{6,15})/i)
              || input.match(/(\+?\d[\d\s\-]{6,15})\s*(?:ko|par)?\s*(?:call|phone)\s*(?:karo|kar|do)/i);
  if (callM) return { action: 'call', params: { number: callM[1].replace(/[\s\-]/g, '') }, label: `call ${callM[1]}` };

  // Call by contact name — works in any language: "call ravi", "ravi ko call karo", "phone karo aman"
  const callNameM = input.match(/(?:call|phone|dial|ring|video\s*call)\s+(?:to\s+|karo\s+)?([a-zA-Z][a-zA-Z\s\.'-]{1,30}?)(?:\s*$|[.,!?])/i)
                 || input.match(/([a-zA-Z][a-zA-Z\s\.'-]{1,30}?)\s*(?:ko|par|ke|se)\s*(?:call|phone|dial)\s*(?:karo|kar|do|lagao|milao)?/i);
  if (callNameM && !/\d/.test(callNameM[1])) {
    const name = callNameM[1].trim().replace(/\s+/g, ' ');
    // ignore generic non-name words
    if (!/^(me|him|her|them|someone|anyone|nobody|end|back|now|please)$/i.test(name) && name.length >= 2) {
      return { action: 'call-name', params: { name }, label: `call ${name}` };
    }
  }

  if (/\b(end call|call end|call kaat|hang up|cut call)\b/i.test(input)) return { action: 'call-end', label: 'end call' };

  // Camera
  if (/\b(front cam|selfie|front camera).*photo|photo.*front|selfie\s*(khinch|le|lo|lelo)/i.test(input))
    return { action: 'photo', params: { camera: 1 }, label: 'front camera photo' };
  if (/\b(back cam|rear cam|back camera).*photo|photo.*back|photo\s*(khinch|le|lo|lelo|click)/i.test(input))
    return { action: 'photo', params: { camera: 0 }, label: 'back camera photo' };

  // Toast / Notify
  const toastM = input.match(/toast[^"']*["'](.+?)["']/i);
  if (toastM) return { action: 'toast', params: { text: toastM[1] }, label: 'toast' };
  const notifM = input.match(/(?:notify|notification)[^"']*["'](.+?)["']/i);
  if (notifM) return { action: 'notify', params: { title: 'Alsa AI', content: notifM[1] }, label: 'notification' };

  // TTS
  const ttsM = input.match(/(?:speak|bolo|tts)[^"']*["'](.+?)["']/i);
  if (ttsM) return { action: 'tts', params: { text: ttsM[1] }, label: 'speak' };

  // WhatsApp via phone bridge (ADB) — number OR contact name
  const waNumM = input.match(/whatsapp\s+(?:msg|message|send|bhejo|karo)?\s*(?:to\s+)?(\+?\d[\d\s\-]{6,15})\s*[:,\-]?\s*["']?(.+?)["']?$/i);
  if (waNumM) {
    return { action: 'whatsapp-num', params: { number: waNumM[1].replace(/[\s\-]/g, ''), text: waNumM[2].trim() }, label: `WhatsApp to ${waNumM[1]}` };
  }
  const waNameM = input.match(/whatsapp\s+(?:msg|message|send|bhejo|karo)?\s*(?:to\s+)?([a-zA-Z][a-zA-Z\s]{1,30}?)\s*[:,\-]\s*["']?(.+?)["']?$/i);
  if (waNameM && !/\d/.test(waNameM[1])) {
    return { action: 'whatsapp-name', params: { name: waNameM[1].trim(), text: waNameM[2].trim() }, label: `WhatsApp to ${waNameM[1].trim()}` };
  }

  // YT-DLP on phone
  const ytM = input.match(/(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/\S+)/i);
  if (ytM && /\b(download|save|mp3|mp4|audio|video|yt-?dlp|playlist)\b/i.test(input)) {
    const audio = /\b(mp3|audio|song|music)\b/i.test(input);
    const q = input.match(/\b(144|240|360|480|720|1080|1440|2160|4k)\b/i);
    return {
      action: 'ytdlp',
      params: {
        url: ytM[1],
        mode: audio ? 'audio' : 'video',
        quality: q ? (q[1].toLowerCase() === '4k' ? '2160' : q[1]) : 'best',
        playlist: /\bplaylist\b/i.test(input) || /list=/.test(ytM[1]),
      },
      label: `yt-dlp ${audio ? 'audio' : 'video'} on phone`,
    };
  }

  // Contacts search
  const cSearch = input.match(/(?:contact|contacts)\s+(?:search|find|dhundo|dhoondo|khojo)\s+(.+)/i);
  if (cSearch) return { action: 'contact-search', params: { query: cSearch[1].trim() }, label: `search contact "${cSearch[1].trim()}"` };
  if (/\bcontacts?\s+(refresh|reload|update)\b/i.test(input)) return { action: 'contacts-refresh', label: 'refresh contacts.json' };

  // Sensors / Contacts / Apps / Storage
  if (/\bsensors?\b/.test(t)) return { action: 'sensors', label: 'read sensors' };
  if (/\bcontacts?\b.*(list|dikhao|show|get)/.test(t)) return { action: 'contacts', label: 'contacts' };
  if (/\bapps?\b.*(list|installed)/.test(t)) return { action: 'app-list', label: 'app list' };
  const openApp = input.match(/open\s+app\s+([\w\.]+)/i);
  if (openApp) return { action: 'app-open', params: { package: openApp[1] }, label: `open app ${openApp[1]}` };

    // Media Commands (Yeh pehle se tha)
  if (/\b(pause|ruk|band karo)\s*(music|song|media|gana)/i.test(input)) return { action: 'media', params: { action: 'pause' }, label: 'pause media' };
  if (/\b(play)\s*(music|song|media|gana)/i.test(input)) return { action: 'media', params: { action: 'play' }, label: 'play media' };
  if (/\b(next)\s*(song|track|gana)/i.test(input)) return { action: 'media', params: { action: 'next' }, label: 'next track' };
  if (/\b(previous|prev|pichla)\s*(song|track|gana)/i.test(input)) return { action: 'media', params: { action: 'previous' }, label: 'previous track' };

  // ── Smart App Open Selector ───────────────────────────────

const openAppPattern =
  input.match(/(?:open|launch|start|run|chalu\s*karo|khol|kholo|open\s+app)\s+(.+)/i) ||
  input.match(/(.+?)\s+(?:open\s*karo|chalu\s*karo|start\s*karo|khol|kholo)/i);

if (openAppPattern) {

  let appName = openAppPattern[1]
    .trim()
    .replace(/[.!?]$/, "");

  appName = normalizeAppName(appName);

  return {
    action: "app-open",
    params: {
      name: appName
    },
    label: `open ${appName}`
  };

 async function smartOpenApp(appName: string) {
  // Pehle direct try
  let res = await phoneAppOpen(appName);

  if (res?.ok || res?.success) {
    return res;
  }

  // Agar bridge app list support karta hai to installed apps se search karo
  const list = await phoneAppList();

  const apps = list?.data || list?.apps || [];

  if (!Array.isArray(apps)) {
    return res;
  }

  const target = appName.toLowerCase();

  const match = apps.find((app: any) => {
    const label = (app.label || app.name || "").toLowerCase();
    const pkg = (app.package || "").toLowerCase();

    return (
      label.includes(target) ||
      pkg.includes(target)
    );
  });

  if (!match) {
    return {
      ok: false,
      success: false,
      message: `App "${appName}" not found`
    };
  }

  return phoneAppOpen(match.package);
}                                                                                                                 }

export const executePhoneCommand = async (cmd: PhoneCommand): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    let res: any;
    switch (cmd.action) {
      case 'torch':      res = await phoneTorch(cmd.params!.on); break;
      case 'vibrate':    res = await phoneVibrate(cmd.params!.duration); break;
      case 'battery':    res = await phoneBattery(); break;
      case 'brightness': res = await phoneBrightness(cmd.params!.level); break;
      case 'volume':     res = await phoneVolume(cmd.params!.stream, cmd.params!.level); break;
      case 'location':   res = await phoneLocation(); break;
      case 'wifi':       res = await phoneWifiToggle(cmd.params!.on); break;
      case 'wifi-info':  res = await phoneWifiInfo(); break;
      case 'clip-get':   res = await phoneClipboardGet(); break;
      case 'clip-set':   res = await phoneClipboardSet(cmd.params!.text); break;
      case 'sms':        res = await phoneSmsSend(cmd.params!.number, cmd.params!.text); break;
      case 'call':       res = await phoneCallMake(cmd.params!.number); break;
      case 'call-name':  res = await phoneCallByName(cmd.params!.name); break;
      case 'call-end':   res = await phoneCallEnd(); break;
      case 'photo':      res = await phoneCameraPhoto(undefined, cmd.params!.camera); break;
      case 'toast':      res = await phoneToast(cmd.params!.text); break;
      case 'notify':     res = await phoneNotify(cmd.params!.title, cmd.params!.content); break;
      case 'tts':        res = await phoneTts(cmd.params!.text); break;
      case 'sensors':    res = await phoneSensors(); break;
      case 'contacts':   res = await phoneContacts(); break;
      case 'contacts-refresh': res = await phoneContactsRefresh(); break;
      case 'contact-search':   res = await phoneContactsSearch(cmd.params!.query); break;
      case 'whatsapp-num':  res = await phoneWhatsappSend(cmd.params!.number, cmd.params!.text); break;
      case 'whatsapp-name': res = await phoneWhatsappSendByName(cmd.params!.name, cmd.params!.text); break;
      case 'ytdlp':         res = await phoneYtdlpDownload(cmd.params as any); break;
      case 'app-list':   res = await phoneAppList(); break;
      case 'app-open':   res = await smartOpenApp(cmd.params!.name); break;
      case 'media':      res = await phoneMediaControl(cmd.params!.action); break;
      case 'share':      res = await phoneShare(cmd.params!.text, cmd.params?.title || "Share"); break;
      case 'url-open':   res = await phoneUrlOpen(cmd.params!.url); break;
      case 'camera-info':   res = await phoneCameraInfo(); break;
      case 'stt':   res = await phoneStt(); break;
      case 'storage-list':   res = await phoneStorageList(cmd.params?.path); break;
      case 'storage-read':   res = await phoneStorageRead(cmd.params!.path); break;
      case 'storage-write':   res = await phoneStorageWrite(cmd.params!.path, cmd.params!.content); break;
      case 'shell':   res = await phoneShell(cmd.params!.command); break;
      case 'sms-list':   res = await phoneSmsList(cmd.params?.limit || 10); break;
      default: return { success: false, message: `Unknown phone action: ${cmd.action}` };
    }
    const ok = res?.success !== false && res?.ok !== false;
    return {
      success: ok,
      message: ok ? `Phone Bridge: ${cmd.label} ✓` : (res?.error || res?.message || `${cmd.label} failed`),
      data: res,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Phone Bridge error' };
  }
};
