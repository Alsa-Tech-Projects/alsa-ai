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
      const j = await response.json().catch(()=>({}));
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
  'youtube': { name: 'YouTube', url: 'https://www.youtube.com', category: 'Social Media' },
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
  'spotify': { name: 'Spotify', url: 'https://open.spotify.com', category: 'Entertainment' },
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
  'google': { name: 'Google', url: 'https://www.google.com', category: 'Productivity' },
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
  'gemini': { name: 'Google Gemini', url: 'https://gemini.google.com', category: 'AI Tools' },
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
  // Screenshot patterns
  screenshot: [
    /(?:screenshot|screen\s*shot|capture|snap|ss|photo\s*le|screen\s*pakad|bildschirmfoto|capture\s*d'écran|captura|截图|スクリーンショット)/i,
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
  
  // Check for screenshot
  if (MULTILANG_PATTERNS.screenshot.some(p => p.test(lowerInput))) {
    const delayMatch = lowerInput.match(/(\d+)\s*(?:sec|second|seconds|सेकंड)/i);
    return { 
      action: 'screenshot', 
      target: '', 
      params: { delay: delayMatch ? parseInt(delayMatch[1]) : 0 } 
    };
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

      case 'screenshot':
        return await captureScreenshot(undefined, parsed.params.delay);

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

export const captureScreenshot = async (
  savePath?: string,
  delaySeconds?: number
): Promise<{ success: boolean; message: string; filename?: string; path?: string }> => {
  try {
    // Wait for delay if specified
    if (delaySeconds && delaySeconds > 0) {
      console.log(`Waiting ${delaySeconds} seconds before screenshot...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }

    // Create screen blink effect
    const blinkOverlay = document.createElement('div');
    blinkOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 999999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s ease-in-out;
    `;
    document.body.appendChild(blinkOverlay);
    
    // Trigger blink
    requestAnimationFrame(() => {
      blinkOverlay.style.opacity = '1';
      setTimeout(() => {
        blinkOverlay.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(blinkOverlay);
        }, 100);
      }, 100);
    });

    const response = await fetch(`${BRIDGE_URL}/capture_screenshot`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        save_path: savePath || localStorage.getItem('alsa_output_paths') 
          ? JSON.parse(localStorage.getItem('alsa_output_paths') || '{}').screenshot 
          : 'C:\\Users\\Mohd Eisa\\Pictures\\Screenshots'
      })
    });
    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        message: `Screenshot failed: ${data.error}`
      };
    }
    
    return { 
      success: data.success ?? true, 
      message: data.message || 'Screenshot captured',
      filename: data.filename,
      path: data.path || savePath
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Cannot connect to PC Bridge for screenshot'
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
