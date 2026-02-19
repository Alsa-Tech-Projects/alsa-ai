import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Moon, Sun, FolderOpen, Key, Plus, Trash2, MessageSquare, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

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

import { useIsMobile } from '@/hooks/use-mobile';


interface Contact {
  id: string;
  name: string;
  value: string; // WhatsApp ke liye number, TG ke liye link
}

const Settings = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState({
    ai_response_style: 'balanced',
    voice_enabled: true,
    voice_name: 'default',
    voice_gender: 'female' as 'male' | 'female' | 'auto',
    theme: 'dark'
  });

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
    // Load local data first (instant) - show UI immediately
    loadLocalSettings();
    setLoading(false); // UI shows instantly with local data

    // Load Supabase preferences in background (non-blocking)
    loadPreferences();
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
        return; // Don't block UI if not logged in
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
    }
    // No finally block - don't control loading state here
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

      // Apply theme immediately
      applyTheme(preferences.theme);

      toast({
        title: preferences.theme === 'dark' ? "Success (Andhera Ho Gaya!)" : "Success (Ujala Hi Ujala!)",
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
    <div className="min-h-screen bg-background">
      {/* <div className="container max-w-4xl mx-auto p-6"> */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4">

        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 sm:mb-6 px-2 sm:px-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="text-sm">Back to Chat</span>
        </Button>

        {/* <ScrollArea className="h-[calc(100vh-120px)]"> */}
        <ScrollArea className="h-[calc(100vh-80px)] md:h-[calc(100vh-120px)]">

          <div className="space-y-6 pr-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Customize your ALSA AI experience</p>
            </div>

            {/* AI Response Style */}
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="text-lg sm:text-xl">AI Response Style</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Choose how the AI responds</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="response-style">Response Style</Label>
                    <Select
                      value={preferences.ai_response_style}
                      onValueChange={(value) => setPreferences({ ...preferences, ai_response_style: value })}
                    >
                      <SelectTrigger id="response-style" className="mt-2 w-full min-w-0">
                        <SelectValue placeholder="Select style" />
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

            {/* Voice Settings */}
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="text-lg sm:text-xl">Voice Settings</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Configure voice preferences</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
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
                      <SelectTrigger id="voice-gender" className="mt-2 w-full min-w-0">
                        <SelectValue placeholder="Select gender" />
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
                      <SelectTrigger id="voice-name" className="mt-2 w-full min-w-0">
                        <SelectValue placeholder="Select character" />
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
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="text-lg sm:text-xl">Appearance</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Customize visual theme</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-4">
                  {/* <div className="flex items-center gap-4"> */}
                  <div className="flex flex-col sm:flex-row gap-4">

                    <Button
                      variant={preferences.theme === 'light' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                      className="flex-1 transition-all duration-300"
                    >
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={preferences.theme === 'dark' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                      className="flex-1 transition-all duration-300"
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messaging Automation - MOST IMPORTANT */}
            <Card className="bg-card border-border border-2 border-primary/30 overflow-hidden">
              <CardHeader className="p-3 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                  Messaging Automation
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Save contacts for AI automation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* WhatsApp Section */}
                {/* <div className="space-y-4"> */}
                <CardContent className="space-y-4 p-4 sm:p-6">

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
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 bg-secondary/20 p-2 sm:p-3 rounded-lg">
                      <Input
                        placeholder={isMobile ? "Name" : "Name (e.g., Rahul)"}
                        value={newWpName}
                        onChange={e => setNewWpName(e.target.value)}
                        className="w-full sm:flex-1 min-w-0"
                      />
                      <Input
                        placeholder={isMobile ? "Number" : "Phone (e.g., 919876543210)"}
                        value={newWpNum}
                        onChange={e => setNewWpNum(e.target.value)}
                        className="w-full sm:flex-1 min-w-0"
                      />
                      <Button onClick={addWhatsappContact} className="w-full sm:w-auto" size={isMobile ? "default" : "icon"}>
                        {isMobile ? "Add Contact" : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <div className="border-t border-border my-4" />

                  <div className="border-t border-border my-4" />

                  {/* Telegram Section */}
                  <div className="space-y-4">
                    <Label className="text-primary font-bold text-lg">✈️ Telegram Contacts</Label>
                    <p className="text-xs text-muted-foreground">
                      Add contacts with Telegram link
                    </p>

                    {telegramContacts.length > 0 && (
                      <div className="space-y-2">
                        {telegramContacts.map((c) => (
                          <div key={c.id} className="flex gap-2 items-center p-3 bg-secondary/30 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.value}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setTelegramContacts(telegramContacts.filter(i => i.id !== c.id))}
                              className="shrink-0"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 bg-secondary/20 p-2 sm:p-3 rounded-lg">
                      <Input
                        placeholder={isMobile ? "Name" : "Name (e.g., Rahul)"}
                        value={newTgName}
                        onChange={e => setNewTgName(e.target.value)}
                        className="w-full sm:flex-1 min-w-0"
                      />
                      <Input
                        placeholder={isMobile ? "Username/Link" : "https://web.telegram.org/k/#@username"}
                        value={newTgLink}
                        onChange={e => setNewTgLink(e.target.value)}
                        className="w-full sm:flex-1 min-w-0"
                      />
                      <Button onClick={addTelegramContact} className="w-full sm:w-auto" size={isMobile ? "default" : "icon"}>
                        {isMobile ? "Add Contact" : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Usage Tips */}
                  <div className="bg-primary/10 p-3 sm:p-4 rounded-lg space-y-2">
                    <p className="font-medium text-xs sm:text-sm">💡 How to use:</p>
                    <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1 list-disc pl-4 sm:pl-5">
                      <li>"Send message to Rahul on Telegram"</li>
                      <li>"WhatsApp Rahul ko bhejo: Meeting hai"</li>
                      <li>PC Bridge must be running!</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card className="bg-card border-border border-2 border-blue-500/30 overflow-hidden">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                  Email Settings
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Configure AI-sent emails.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 space-y-4">
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
                <div className="bg-blue-500/10 p-3 sm:p-4 rounded-lg space-y-2">
                  <p className="font-medium text-xs sm:text-sm">📧 How to send emails:</p>
                  <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1 list-disc pl-4 sm:pl-5">
                    <li>"Send email to john@example.com: Hello"</li>
                    <li>"Send professional email to client"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Output Paths */}
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <FolderOpen className="w-5 h-5 shrink-0" />
                  Output Paths
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Default save locations</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
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
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Key className="w-5 h-5 shrink-0" />
                  Custom Sites
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Add website shortcuts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
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
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={newSiteName}
                        onChange={(e) => setNewSiteName(e.target.value)}
                        placeholder={isMobile ? "Name" : "Site name (e.g., mywork)"}
                        className="w-full sm:flex-1 min-w-0"
                      />
                      <Input
                        value={newSiteUrl}
                        onChange={(e) => setNewSiteUrl(e.target.value)}
                        placeholder={isMobile ? "URL" : "URL (e.g., mywork.com)"}
                        className="w-full sm:flex-[2] min-w-0"
                      />
                      <Button onClick={addCustomSite} className="w-full sm:w-auto" size={isMobile ? "default" : "icon"}>
                        {isMobile ? "Add Site" : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Apps */}
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <FolderOpen className="w-5 h-5 shrink-0" />
                  Custom Apps
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Add applications with paths.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
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
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={newAppName}
                        onChange={(e) => setNewAppName(e.target.value)}
                        placeholder={isMobile ? "App Name" : "App name (e.g., antigravity)"}
                        className="w-full sm:flex-1 min-w-0"
                      />
                      <Input
                        value={newAppPath}
                        onChange={(e) => setNewAppPath(e.target.value)}
                        placeholder={isMobile ? "Path" : "Full path to .exe file"}
                        className="w-full sm:flex-[2] min-w-0"
                      />
                      <Button onClick={addCustomApp} className="w-full sm:w-auto" size={isMobile ? "default" : "icon"}>
                        {isMobile ? "Add App" : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 w-full flex flex-col sm:flex-row gap-2 sm:justify-end pb-12">
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto border border-white/20 rounded-md px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={savePreferences}
                disabled={saving}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-4 py-2 text-sm text-white transition-colors font-medium"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </ScrollArea>
      </div >
    </div >
  );
};

export default Settings;
