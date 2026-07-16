import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Moon, Sun, FolderOpen, Key, Plus, Trash2, MessageSquare, Mail, Monitor, Type, ShieldCheck, Mic, Globe, Terminal, Sparkles, AppWindow, FileCode, Keyboard, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useTheme, AccentColor, FontSize, ThemeMode } from '@/hooks/useTheme';
import { isFaceAuthEnabled, setFaceAuthEnabled, isEnrolled, clearEnrollment } from '@/utils/faceAuth';
import FaceAuth from '@/components/FaceAuth';
import { CustomCommand, CustomActionType, loadCustomCommands, addCustomCommand, removeCustomCommand } from '@/utils/customCommands';

interface OutputPaths {
  recording: string;
  ppt: string;
  excel: string;
  application: string;
  assignment: string;
  database: string;
}

interface CustomSite {
  id: string;
  name: string;
  url: string;
}

interface CustomApp {
  id: string;
  name: string;
  path: string;
}

interface Contact {
  id: string;
  name: string;
  value: string; // WhatsApp ke liye number, TG ke liye link
}

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings: themeSettings, update: updateTheme } = useTheme();
  const [loading, setLoading] = useState(true);

  // Face auth state
  const [faceEnabled, setFaceEnabledState] = useState<boolean>(isFaceAuthEnabled());
  const [showFaceEnroll, setShowFaceEnroll] = useState(false);

  // Custom commands state
  const [customCmds, setCustomCmds] = useState<CustomCommand[]>(loadCustomCommands());
  const [newCmdPhrase, setNewCmdPhrase] = useState('');
  const [newCmdAction, setNewCmdAction] = useState<CustomActionType>('url');
  const [newCmdPayload, setNewCmdPayload] = useState('');
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState({
    ai_response_style: 'balanced',
    voice_enabled: true,
    voice_name: 'default',
    voice_gender: 'female' as 'male' | 'female' | 'auto',
    theme: 'dark'
  });

  // Custom instructions + BYOK
  const [customInstructions, setCustomInstructions] = useState<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('alsa_custom_instructions') || '') : ''
  );
  const [userApiKey, setUserApiKey] = useState<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('alsa_user_api_key') || '') : ''
  );
  const [userModel, setUserModel] = useState<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('alsa_user_model') || 'gemini-2.5-flash') : 'gemini-2.5-flash'
  );

  // Output paths state
  const [outputPaths, setOutputPaths] = useState<OutputPaths>({
    recording: 'C:\\Users\\Mohd Eisa\\Videos\\Recordings',
    ppt: 'C:\\Users\\Mohd Eisa\\Documents\\Presentations',
    excel: 'C:\\Users\\Mohd Eisa\\Documents\\Spreadsheets',
    application: 'C:\\Users\\Mohd Eisa\\Documents\\Applications',
    assignment: 'C:\\Users\\Mohd Eisa\\Documents\\Assignments',
    database: 'C:\\Users\\Mohd Eisa\\Documents\\Databases'
  });

  // Custom sites state
  const [customSites, setCustomSites] = useState<CustomSite[]>([]);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  // Messaging contacts
  const [whatsappContacts, setWhatsappContacts] = useState<Contact[]>([]);
  const [telegramContacts, setTelegramContacts] = useState<Contact[]>([]);
  const [newWpName, setNewWpName] = useState('');
  const [newWpNum, setNewWpNum] = useState('');
  const [newTgName, setNewTgName] = useState('');
  const [newTgLink, setNewTgLink] = useState('');

    // File input ko reference karne ke liye
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV handle karne ka function
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newContacts: Contact[] = [];

      // CSV ki har line ko parse karenge
      lines.forEach((line, index) => {
        // Maan kar chal rahe hain format "Name,Number" hai
        const [name, number] = line.split(',').map(item => item?.trim());
        
        // Header row ("Contacts_Name") aur empty lines ko ignore karne ke liye
        if (name && number && name.toLowerCase() !== 'contacts_name') {
          newContacts.push({
            id: Date.now().toString() + index, // Unique ID
            name: name,
            value: number
          });
        }
      });

      if (newContacts.length > 0) {
        // State update karte hi UI me live dikhne lagega
        setWhatsappContacts(prev => [...prev, ...newContacts]);
        toast({ 
          title: "CSV Uploaded", 
          description: `${newContacts.length} contacts successfully add ho gaye!` 
        });
      } else {
        toast({ 
          title: "Error", 
          description: "CSV me koi valid contacts nahi mile.", 
          variant: "destructive" 
        });
      }
      
      // Input ko reset kar do taaki same file dobara upload ho sake
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsText(file);
  };
  
  // Custom apps state
  const [customApps, setCustomApps] = useState<CustomApp[]>([]);
  const [newAppName, setNewAppName] = useState('');
  const [newAppPath, setNewAppPath] = useState('');

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    senderName: 'Mohd Eisa',
    senderEmail: '',
    defaultTemplate: 'professional' as 'professional' | 'casual' | 'minimal' | 'newsletter',
    signature: ''
  });

  useEffect(() => {
    loadPreferences();
    loadLocalSettings();
  }, []);

  const loadLocalSettings = () => {
    // 1. Load output paths
    const savedPaths = localStorage.getItem('alsa_output_paths');
    if (savedPaths) {
      try { setOutputPaths(JSON.parse(savedPaths)); } catch (e) { console.error('Error:', e); }
    }

    // 2. Load custom sites
    const savedSites = localStorage.getItem('alsa_user_sites');
    if (savedSites) {
      try { setCustomSites(JSON.parse(savedSites)); } catch (e) { console.error('Error:', e); }
    }

    // 3. Load custom apps
    const savedApps = localStorage.getItem('alsa_custom_apps');
    if (savedApps) {
      try { setCustomApps(JSON.parse(savedApps)); } catch (e) { console.error('Error:', e); }
    }

    // 4. Load WhatsApp Contacts
    const savedWp = localStorage.getItem('alsa_whatsapp_contacts');
    if (savedWp) {
      try {
        setWhatsappContacts(JSON.parse(savedWp));
      } catch (e) {
        console.error('Error loading WhatsApp contacts:', e);
      }
    }

    // 5. Load Telegram Contacts
    const savedTg = localStorage.getItem('alsa_telegram_contacts');
    if (savedTg) {
      try {
        setTelegramContacts(JSON.parse(savedTg));
      } catch (e) {
        console.error('Error loading Telegram contacts:', e);
      }
    }

    // Load voice gender with default to female
    const savedGender = localStorage.getItem('alsa_voice_gender') as 'male' | 'female' | 'auto';
    if (savedGender) {
      setPreferences(prev => ({ ...prev, voice_gender: savedGender }));
    }

    // 6. Load Email Settings
    const savedEmailSettings = localStorage.getItem('alsa_email_settings');
    if (savedEmailSettings) {
      try {
        setEmailSettings(JSON.parse(savedEmailSettings));
      } catch (e) {
        console.error('Error loading email settings:', e);
      }
    }
  };

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const savedGender = localStorage.getItem('alsa_voice_gender') as 'male' | 'female' | 'auto' || 'female';
        setPreferences({
          ai_response_style: data.ai_response_style || 'balanced',
          voice_enabled: data.voice_enabled ?? true,
          voice_name: data.voice_name || 'default',
          voice_gender: savedGender,
          theme: data.theme || 'dark'
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert(
            {
              user_id: user.id,
              ai_response_style: preferences.ai_response_style,
              voice_enabled: preferences.voice_enabled,
              voice_name: preferences.voice_name,
              theme: preferences.theme,
            },
            { onConflict: 'user_id' }
          );

        if (error) throw error;
      }

      // Save local settings
      localStorage.setItem('alsa_output_paths', JSON.stringify(outputPaths));
      localStorage.setItem('alsa_user_sites', JSON.stringify(customSites));
      localStorage.setItem('alsa_custom_apps', JSON.stringify(customApps));
      localStorage.setItem('alsa_ai_response_style', preferences.ai_response_style);
      localStorage.setItem('alsa_voice_gender', preferences.voice_gender);
      localStorage.setItem('alsa_voice_enabled', String(preferences.voice_enabled));
      localStorage.setItem('alsa_whatsapp_contacts', JSON.stringify(whatsappContacts));
      localStorage.setItem('alsa_telegram_contacts', JSON.stringify(telegramContacts));
      localStorage.setItem('alsa_email_settings', JSON.stringify(emailSettings));
      localStorage.setItem('alsa_custom_instructions', customInstructions.slice(0, 2000));
      localStorage.setItem('alsa_user_api_key', userApiKey.trim());
      localStorage.setItem('alsa_user_model', userModel);

      // Apply theme immediately
      applyTheme(preferences.theme);

      toast({
        title: "Success",
        description: "Settings saved successfully!",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);

  const addCustomSite = () => {
    if (!newSiteName.trim() || !newSiteUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter both site name and URL",
        variant: "destructive"
      });
      return;
    }

    let url = newSiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const newSite: CustomSite = {
      id: crypto.randomUUID(),
      name: newSiteName.trim().toLowerCase(),
      url: url
    };

    setCustomSites(prev => [...prev, newSite]);
    setNewSiteName('');
    setNewSiteUrl('');

    toast({
      title: "Site Added",
      description: `${newSite.name} has been added to your shortcuts`
    });
  };

  const removeCustomSite = (id: string) => {
    setCustomSites(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Site Removed",
      description: "Custom site has been removed"
    });
  };

  const addCustomApp = () => {
    if (!newAppName.trim() || !newAppPath.trim()) {
      toast({
        title: "Error",
        description: "Please enter both app name and path",
        variant: "destructive"
      });
      return;
    }

    const newApp: CustomApp = {
      id: crypto.randomUUID(),
      name: newAppName.trim().toLowerCase(),
      path: newAppPath.trim()
    };

    setCustomApps(prev => [...prev, newApp]);
    setNewAppName('');
    setNewAppPath('');

    toast({
      title: "App Added",
      description: `${newApp.name} has been added. Say "open ${newApp.name}" to launch it.`
    });
  };

  const removeCustomApp = (id: string) => {
    setCustomApps(prev => prev.filter(a => a.id !== id));
    toast({
      title: "App Removed",
      description: "Custom app has been removed"
    });
  };

  const addWhatsappContact = () => {
    if (!newWpName.trim() || !newWpNum.trim()) {
      toast({ title: "Error", description: "Enter name and phone number", variant: "destructive" });
      return;
    }
    setWhatsappContacts([...whatsappContacts, { 
      id: Date.now().toString(), 
      name: newWpName.trim(), 
      value: newWpNum.trim() 
    }]);
    setNewWpName('');
    setNewWpNum('');
    toast({ title: "WhatsApp Contact Added", description: `${newWpName} saved!` });
  };

  const addTelegramContact = () => {
    if (!newTgName.trim() || !newTgLink.trim()) {
      toast({ title: "Error", description: "Enter name and Telegram link/username", variant: "destructive" });
      return;
    }
    setTelegramContacts([...telegramContacts, { 
      id: Date.now().toString(), 
      name: newTgName.trim(), 
      value: newTgLink.trim() 
    }]);
    setNewTgName('');
    setNewTgLink('');
    toast({ title: "Telegram Contact Added", description: `${newTgName} saved!` });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 min-w-0">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>

        <ScrollArea className="h-auto sm:h-[calc(100vh-120px)] w-full">
          <div className="space-y-6 sm:pr-4 min-w-0 w-full max-w-full">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-2">Customize your ALSA AI assistant experience</p>
            </div>

            {/* AI Response Style */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle>AI Response Style</CardTitle>
                <CardDescription>Choose how the AI responds to your queries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="response-style">Response Style</Label>
                    <Select
                      value={preferences.ai_response_style}
                      onValueChange={(value) => setPreferences({ ...preferences, ai_response_style: value })}
                    >
                      <SelectTrigger id="response-style" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concise">Concise - Short and direct answers</SelectItem>
                        <SelectItem value="balanced">Balanced - Moderate detail</SelectItem>
                        <SelectItem value="detailed">Detailed - Comprehensive responses</SelectItem>
                        <SelectItem value="creative">Creative - Imaginative and engaging</SelectItem>
                        <SelectItem value="caring">Caring - Supportive and empathetic tone</SelectItem>
                        <SelectItem value="comedian">Comedian - Light jokes and fun vibe</SelectItem>
                        <SelectItem value="roast">Roast - Playful roasting (non-hateful)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Instructions */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Custom Instructions</CardTitle>
                <CardDescription>Tell ALSA how you want it to behave. Jailbreak / identity-change attempts will be safely ignored.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value.slice(0, 2000))}
                  placeholder="Example: Always reply in Hinglish. Give code examples in TypeScript. Keep answers under 200 words."
                  rows={5}
                  className="w-full max-w-full resize-y"
                />
                <p className="text-xs text-muted-foreground mt-2">{customInstructions.length}/2000</p>
              </CardContent>
            </Card>

            {/* Your Own API Key (BYOK) */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Your Google AI API Key (BYOK)</CardTitle>
                <CardDescription>Use your own Google Gemini key — private, unlimited, our quota won't be touched.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="min-w-0">
                  <Label htmlFor="byok-api-key">API Key</Label>
                  <Input
                    id="byok-api-key"
                    type="password"
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="mt-2 w-full max-w-full font-mono"
                    autoComplete="off"
                  />
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    Get a free key from Google AI Studio →
                  </a>
                </div>
                <div className="min-w-0">
                  <Label htmlFor="byok-model">Preferred Gemini Model</Label>
                  <Select value={userModel} onValueChange={setUserModel}>
                    <SelectTrigger id="byok-model" className="mt-2 w-full max-w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.0-pro">Gemini 1.0 Pro</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Most Powerful)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>



            {/* Voice Settings */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>Configure voice input and output preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice-enabled">Voice Enabled</Label>
                      <p className="text-sm text-muted-foreground">Enable voice recognition and text-to-speech</p>
                    </div>
                    <Switch
                      id="voice-enabled"
                      checked={preferences.voice_enabled}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, voice_enabled: checked })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="voice-gender">Voice Gender (Hinglish)</Label>
                    <Select
                      value={preferences.voice_gender}
                      onValueChange={(value: 'male' | 'female' | 'auto') => setPreferences({ ...preferences, voice_gender: value })}
                    >
                      <SelectTrigger id="voice-gender" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto - System Default</SelectItem>
                        <SelectItem value="male">Male - Hinglish Voice</SelectItem>
                        <SelectItem value="female">Female - Hinglish Voice</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Select preferred voice for Hinglish responses</p>
                  </div>

                  <div>
                    <Label htmlFor="voice-name">Voice Character</Label>
                    <Select
                      value={preferences.voice_name}
                      onValueChange={(value) => setPreferences({ ...preferences, voice_name: value })}
                    >
                      <SelectTrigger id="voice-name" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="energetic">Energetic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Theme mode, accent color and font size — applies across the entire app</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Mode */}
                  <div>
                    <Label className="mb-2 block">Theme Mode</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { v: 'light', icon: Sun, label: 'Light' },
                        { v: 'dark', icon: Moon, label: 'Dark' },
                        { v: 'auto', icon: Monitor, label: 'Auto' },
                      ] as { v: ThemeMode; icon: any; label: string }[]).map(({ v, icon: Icon, label }) => (
                        <Button
                          key={v}
                          type="button"
                          variant={themeSettings.mode === v ? 'default' : 'outline'}
                          onClick={() => updateTheme({ mode: v })}
                          className="transition-all"
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Accent */}
                  <div>
                    <Label className="mb-2 block">Accent Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { v: 'blue', hex: '#3b82f6' },
                        { v: 'purple', hex: '#a855f7' },
                        { v: 'green', hex: '#22c55e' },
                        { v: 'red', hex: '#ef4444' },
                        { v: 'orange', hex: '#f97316' },
                      ] as { v: AccentColor; hex: string }[]).map(({ v, hex }) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateTheme({ accent: v })}
                          aria-label={v}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            themeSettings.accent === v
                              ? 'border-foreground scale-110 shadow-lg'
                              : 'border-border hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Font size */}
                  <div>
                    <Label className="mb-2 block flex items-center gap-2">
                      <Type className="w-4 h-4" /> Font Size
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { v: 'small', label: 'Small', cls: 'text-xs' },
                        { v: 'medium', label: 'Medium', cls: 'text-sm' },
                        { v: 'large', label: 'Large', cls: 'text-base' },
                      ] as { v: FontSize; label: string; cls: string }[]).map(({ v, label, cls }) => (
                        <Button
                          key={v}
                          type="button"
                          variant={themeSettings.fontSize === v ? 'default' : 'outline'}
                          onClick={() => updateTheme({ fontSize: v })}
                          className={cls}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ============== FACE AUTHENTICATION ============== */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Face Authentication
                </CardTitle>
                <CardDescription>
                  Unlock the assistant with your face. Runs fully on-device — no images uploaded. Liveness + anti-spoof enabled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label>Enable Face Auth on app open</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: {isEnrolled() ? 'Face enrolled ✓' : 'Not enrolled yet'}
                    </p>
                  </div>
                  <Switch
                    checked={faceEnabled}
                    onCheckedChange={(v) => {
                      setFaceAuthEnabled(v);
                      setFaceEnabledState(v);
                      if (v && !isEnrolled()) setShowFaceEnroll(true);
                      toast({ title: v ? 'Face Auth enabled' : 'Face Auth disabled' });
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFaceEnroll(true)}
                    disabled={!faceEnabled}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {isEnrolled() ? 'Re-enroll Face' : 'Enroll Face'}
                  </Button>
                  {isEnrolled() && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        clearEnrollment();
                        setFaceEnabledState(false);
                        toast({ title: 'Face data deleted', description: 'Enrollment cleared from this device' });
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Face Data
                    </Button>
                  )}
                </div>

                {showFaceEnroll && faceEnabled && (
                  <div className="pt-2">
                    <FaceAuth
                      forceMode="enroll"
                      onSuccess={() => setShowFaceEnroll(false)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ============== CUSTOM VOICE / TEXT COMMANDS ============== */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary" /> Custom Commands
                </CardTitle>
                <CardDescription>
                  Map a phrase (spoken or typed) to a PC action. Triggered when your message starts with or matches the phrase.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing commands list */}
                {customCmds.length > 0 ? (
                  <div className="space-y-2">
                    {customCmds.map((c) => {
                      const Icon =
                        c.actionType === 'url' ? Globe :
                        c.actionType === 'shell' ? Terminal :
                        c.actionType === 'ai' ? Sparkles :
                        c.actionType === 'app' ? AppWindow :
                        c.actionType === 'script' ? FileCode : Keyboard;
                      return (
                        <div key={c.id} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                          <Icon className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">"{c.phrase}"</p>
                            <p className="text-xs text-muted-foreground truncate">
                              <span className="uppercase">{c.actionType}</span> → {c.payload}
                            </p>
                          </div>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => {
                              removeCustomCommand(c.id);
                              setCustomCmds(loadCustomCommands());
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No custom commands yet. Add one below.</p>
                )}

                {/* Add new */}
                <div className="space-y-3 bg-secondary/20 p-4 rounded-lg">
                  <div>
                    <Label>Trigger Phrase</Label>
                    <Input
                      value={newCmdPhrase}
                      onChange={(e) => setNewCmdPhrase(e.target.value)}
                      placeholder='e.g. "open my work" or "lock screen"'
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Action Type</Label>
                    <Select
                      value={newCmdAction}
                      onValueChange={(v) => setNewCmdAction(v as CustomActionType)}
                    >
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="url">🌐 Open URL (browser)</SelectItem>
                        <SelectItem value="shell">⚡ Run Shell Command (PC Bridge)</SelectItem>
                        <SelectItem value="ai">✨ Send Prompt to AI</SelectItem>
                        <SelectItem value="app">🪟 Open Custom App (PC Bridge)</SelectItem>
                        <SelectItem value="script">📜 Run Python Script (PC Bridge)</SelectItem>
                        <SelectItem value="type">⌨️ Copy Text to Clipboard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      {newCmdAction === 'url' && 'URL'}
                      {newCmdAction === 'shell' && 'Shell command'}
                      {newCmdAction === 'ai' && 'AI prompt'}
                      {newCmdAction === 'app' && 'App path or name'}
                      {newCmdAction === 'script' && 'Python script path'}
                      {newCmdAction === 'type' && 'Text to copy'}
                    </Label>
                    <Input
                      value={newCmdPayload}
                      onChange={(e) => setNewCmdPayload(e.target.value)}
                      placeholder={
                        newCmdAction === 'url' ? 'https://example.com' :
                        newCmdAction === 'shell' ? 'shutdown /s /t 60' :
                        newCmdAction === 'ai' ? 'Summarize my last 3 emails' :
                        newCmdAction === 'app' ? 'C:\\Path\\to\\app.exe' :
                        newCmdAction === 'script' ? 'C:\\scripts\\hello.py' :
                        'Hello world'
                      }
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!newCmdPhrase.trim() || !newCmdPayload.trim()) {
                        toast({ title: 'Missing fields', description: 'Phrase aur payload dono required hain', variant: 'destructive' });
                        return;
                      }
                      addCustomCommand({ phrase: newCmdPhrase.trim(), actionType: newCmdAction, payload: newCmdPayload.trim() });
                      setCustomCmds(loadCustomCommands());
                      setNewCmdPhrase('');
                      setNewCmdPayload('');
                      toast({ title: 'Command added', description: `"${newCmdPhrase}" → ${newCmdAction}` });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Command
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Messaging Automation - MOST IMPORTANT */}
            <Card className="bg-card border border-primary/30 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Messaging Automation (WhatsApp & Telegram)
                </CardTitle>
                <CardDescription>
                  Save contacts for AI automation. Say "Send message to [Name] on Telegram: [Your message]"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* WhatsApp Section */}
                <div className="space-y-4">
                  <Label className="text-primary font-bold text-lg">📱 WhatsApp Contacts</Label>
                  <p className="text-xs text-muted-foreground">
                    Add contacts with their phone numbers (with country code like 91xxxxxxxxxx)
                  </p>
                  
                  {whatsappContacts.length > 0 && (
                    <div className="space-y-2">
                      {whatsappContacts.map((c) => (
                        <div key={c.id} className="flex gap-2 items-center p-3 bg-secondary/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.value}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setWhatsappContacts(whatsappContacts.filter(i => i.id !== c.id))}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* <div className="flex gap-2 bg-secondary/20 p-3 rounded-lg"> */}
                  <div className="flex flex-col sm:flex-row gap-2 bg-secondary/20 p-3 rounded-lg min-w-0">
                    <Input 
                      placeholder="Name (e.g., Rahul)" 
                      value={newWpName} 
                      onChange={e => setNewWpName(e.target.value)} 
                      className="flex-1 min-w-0"
                    />
                    <Input 
                      placeholder="Phone (e.g., 919876543210)" 
                      value={newWpNum} 
                      onChange={e => setNewWpNum(e.target.value)}
                      className="flex-1 min-w-0" 
                    />
                    <Button onClick={addWhatsappContact} size="icon" className="self-end sm:self-auto">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border my-4" />

                                {/* WhatsApp Section */}
                <div className="space-y-4">
                  <Label className="text-primary font-bold text-lg">📱 WhatsApp Contacts</Label>
                  <p className="text-xs text-muted-foreground">
                    Add contacts with their phone numbers (with country code like 91xxxxxxxxxx)
                  </p>
                  
                  {whatsappContacts.length > 0 && (
                    <div className="space-y-2">
                      {whatsappContacts.map((c) => (
                        <div key={c.id} className="flex gap-2 items-center p-3 bg-secondary/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.value}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setWhatsappContacts(whatsappContacts.filter(i => i.id !== c.id))}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2 bg-secondary/20 p-3 rounded-lg min-w-0">
                    <Input 
                      placeholder="Name (e.g., Rahul)" 
                      value={newWpName} 
                      onChange={e => setNewWpName(e.target.value)} 
                      className="flex-1 min-w-0"
                    />
                    <Input 
                      placeholder="Phone (e.g., 919876543210)" 
                      value={newWpNum} 
                      onChange={e => setNewWpNum(e.target.value)}
                      className="flex-1 min-w-0" 
                    />
                    <Button onClick={addWhatsappContact} size="icon" className="self-end sm:self-auto">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* CSV Upload Section Yaha Add Hua Hai */}
                  <div className="pt-2">
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleCsvUpload}
                      className="hidden" // UI me hide rakha hai
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload CSV
                    </Button>
                  </div>
                </div>

                {/* Telegram Section */}
                <div className="space-y-4">
                  <Label className="text-primary font-bold text-lg">✈️ Telegram Contacts</Label>
                  <p className="text-xs text-muted-foreground">
                    Add contacts with their Telegram web link (e.g., https://web.telegram.org/k/#@username)
                  </p>
                  
                  {telegramContacts.length > 0 && (
                    <div className="space-y-2">
                      {telegramContacts.map((c) => (
                        <div key={c.id} className="flex gap-2 items-center p-3 bg-secondary/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.value}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setTelegramContacts(telegramContacts.filter(i => i.id !== c.id))}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2 bg-secondary/20 p-3 rounded-lg min-w-0">
                    <Input 
                      placeholder="Name (e.g., Rahul)" 
                      value={newTgName} 
                      onChange={e => setNewTgName(e.target.value)}
                      className="flex-1 min-w-0" 
                    />
                    <Input 
                      placeholder="https://web.telegram.org/k/#@username" 
                      value={newTgLink} 
                      onChange={e => setNewTgLink(e.target.value)}
                      className="flex-[2] min-w-0" 
                    />
                    <Button onClick={addTelegramContact} size="icon" className="self-end sm:self-auto">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Usage Tips */}
                <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                  <p className="font-medium text-sm">💡 How to use:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Say: "Send message to Rahul on Telegram: I'll be late today"</li>
                    <li>Say: "WhatsApp Rahul ko bhejo: Meeting 5 baje hai"</li>
                    <li>Messages can be in any language - Hindi, English, etc.</li>
                    <li>PC Bridge must be running for this to work!</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card className="bg-card border border-blue-500/30 border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  Email Settings
                </CardTitle>
                <CardDescription>
                  Configure how your AI-sent emails appear. Say "send email to someone@example.com: your message"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sender-name">Sender Name</Label>
                    <Input
                      id="sender-name"
                      value={emailSettings.senderName}
                      onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                      placeholder="Your Name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sender-email">Sender Email (Optional)</Label>
                    <Input
                      id="sender-email"
                      type="email"
                      value={emailSettings.senderEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="default-template">Default Email Template</Label>
                  <Select
                    value={emailSettings.defaultTemplate}
                    onValueChange={(value: 'professional' | 'casual' | 'minimal' | 'newsletter') => 
                      setEmailSettings({ ...emailSettings, defaultTemplate: value })
                    }
                  >
                    <SelectTrigger id="default-template" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional - Corporate style with gradient header</SelectItem>
                      <SelectItem value="casual">Casual - Friendly and warm design</SelectItem>
                      <SelectItem value="minimal">Minimal - Clean and simple</SelectItem>
                      <SelectItem value="newsletter">Newsletter - Dark tech-style design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email-signature">Email Signature (Optional)</Label>
                  <Textarea
                    id="email-signature"
                    value={emailSettings.signature}
                    onChange={(e) => setEmailSettings({ ...emailSettings, signature: e.target.value })}
                    placeholder="Add a custom signature to your emails..."
                    className="mt-1 min-h-20"
                  />
                </div>

                {/* Usage Tips */}
                <div className="bg-blue-500/10 p-4 rounded-lg space-y-2">
                  <p className="font-medium text-sm">📧 How to send emails:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Say: "Send email to john@example.com: Hello, this is my message"</li>
                    <li>Say: "Send professional email to client@company.com with subject Meeting Request"</li>
                    <li>Say: "Email boss@work.com a casual message saying I'll be working remotely"</li>
                    <li>Templates: professional, casual, minimal, newsletter</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Output Paths */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Output Paths
                </CardTitle>
                <CardDescription>Configure default save locations for files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rec-path">Screen Recording Path</Label>
                    <Input
                      id="rec-path"
                      value={outputPaths.recording}
                      onChange={(e) => setOutputPaths({ ...outputPaths, recording: e.target.value })}
                      placeholder="C:\Users\...\Videos\Recordings"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ppt-path">PowerPoint Path</Label>
                    <Input
                      id="ppt-path"
                      value={outputPaths.ppt}
                      onChange={(e) => setOutputPaths({ ...outputPaths, ppt: e.target.value })}
                      placeholder="C:\Users\...\Presentations"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="excel-path">Excel Path</Label>
                    <Input
                      id="excel-path"
                      value={outputPaths.excel}
                      onChange={(e) => setOutputPaths({ ...outputPaths, excel: e.target.value })}
                      placeholder="C:\Users\...\Spreadsheets"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Sites */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Custom Sites
                </CardTitle>
                <CardDescription>
                  Add your own website shortcuts. Say "open [site name]" to open them quickly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customSites.length > 0 && (
                    <div className="space-y-2">
                      {customSites.map((site) => (
                        <div key={site.id} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm capitalize">{site.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{site.url}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCustomSite(site.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label>Add New Site</Label>
                    <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                      <Input
                        value={newSiteName}
                        onChange={(e) => setNewSiteName(e.target.value)}
                        placeholder="Site name (e.g., mywork)"
                        className="flex-1 min-w-0"
                      />
                      <Input
                        value={newSiteUrl}
                        onChange={(e) => setNewSiteUrl(e.target.value)}
                        placeholder="URL (e.g., mywork.com)"
                        className="flex-[2] min-w-0"
                      />
                      <Button onClick={addCustomSite} size="icon" className="self-end sm:self-auto">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Apps */}
            <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Custom Apps
                </CardTitle>
                <CardDescription>
                  Add your own applications with their paths. Say "open [app name]" to launch them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customApps.length > 0 && (
                    <div className="space-y-2">
                      {customApps.map((app) => (
                        <div key={app.id} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm capitalize">{app.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{app.path}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCustomApp(app.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label>Add New App</Label>
                    <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                      <Input
                        value={newAppName}
                        onChange={(e) => setNewAppName(e.target.value)}
                        placeholder="App name (e.g., antigravity)"
                        className="flex-1 min-w-0"
                      />
                      <Input
                        value={newAppPath}
                        onChange={(e) => setNewAppPath(e.target.value)}
                        placeholder="Full path to .exe file"
                        className="flex-[2] min-w-0"
                      />
                      <Button onClick={addCustomApp} size="icon" className="self-end sm:self-auto">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            {/* <div className="flex justify-end gap-4 pb-6"> */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
              <Button variant="outline" onClick={() => navigate('/')}>
                Cancel
              </Button>
              <Button onClick={savePreferences} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Settings;
