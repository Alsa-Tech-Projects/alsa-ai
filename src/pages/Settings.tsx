import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Moon, Sun, FolderOpen, Key, Plus, Trash2, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OutputPaths {
  screenshot: string;
  recording: string;
  ppt: string;
  excel: string;
  application: string;
  assignment: string;
  database: string;
}

interface BackupApiKey {
  id: string;
  name: string;
  key: string;
}

interface VoicePreferences {
  gender: 'male' | 'female' | 'auto';
  language: 'hinglish' | 'english' | 'hindi';
  emotionEnabled: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState({
    ai_response_style: 'balanced',
    voice_enabled: true,
    voice_name: 'default',
    theme: 'dark'
  });

  // Voice preferences state (properly managed)
  const [voicePreferences, setVoicePreferences] = useState<VoicePreferences>({
    gender: 'male',
    language: 'hinglish',
    emotionEnabled: true
  });

  // Output paths state
  const [outputPaths, setOutputPaths] = useState<OutputPaths>({
    screenshot: 'C:\\Users\\Mohd Eisa\\Pictures\\Screenshots',
    recording: 'C:\\Users\\Mohd Eisa\\Videos\\Recordings',
    ppt: 'C:\\Users\\Mohd Eisa\\Documents\\Presentations',
    excel: 'C:\\Users\\Mohd Eisa\\Documents\\Spreadsheets',
    application: 'C:\\Users\\Mohd Eisa\\Documents\\Applications',
    assignment: 'C:\\Users\\Mohd Eisa\\Documents\\Assignments',
    database: 'C:\\Users\\Mohd Eisa\\Documents\\Databases'
  });

  // Backup API keys state
  const [backupApiKeys, setBackupApiKeys] = useState<BackupApiKey[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyValue, setNewApiKeyValue] = useState('');

  useEffect(() => {
    loadPreferences();
    loadLocalSettings();
  }, []);

  const loadLocalSettings = () => {
    // Load output paths from localStorage
    const savedPaths = localStorage.getItem('alsa_output_paths');
    if (savedPaths) {
      try {
        setOutputPaths(JSON.parse(savedPaths));
      } catch (e) {
        console.error('Error loading output paths:', e);
      }
    }

    // Load backup API keys from localStorage
    const savedKeys = localStorage.getItem('alsa_backup_api_keys');
    if (savedKeys) {
      try {
        setBackupApiKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error('Error loading backup API keys:', e);
      }
    }

    // Load voice preferences
    const savedVoicePrefs = localStorage.getItem('alsa_voice_preferences');
    if (savedVoicePrefs) {
      try {
        const parsed = JSON.parse(savedVoicePrefs);
        setVoicePreferences({
          gender: parsed.gender || 'male',
          language: parsed.language || 'hinglish',
          emotionEnabled: parsed.emotionEnabled !== false
        });
      } catch (e) {
        console.error('Error loading voice preferences:', e);
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
        setPreferences({
          ai_response_style: data.ai_response_style || 'balanced',
          voice_enabled: data.voice_enabled ?? true,
          voice_name: data.voice_name || 'default',
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
              ...preferences,
            },
            { onConflict: 'user_id' }
          );

        if (error) throw error;
      }

      // Save ALL local settings
      localStorage.setItem('alsa_output_paths', JSON.stringify(outputPaths));
      localStorage.setItem('alsa_backup_api_keys', JSON.stringify(backupApiKeys));
      localStorage.setItem('alsa_ai_response_style', preferences.ai_response_style);
      localStorage.setItem('alsa_voice_preferences', JSON.stringify(voicePreferences));

      // Apply theme immediately
      applyTheme(preferences.theme);

      toast({
        title: "Settings Saved",
        description: "All your preferences have been saved successfully!",
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

  const addBackupApiKey = () => {
    if (!newApiKeyName.trim() || !newApiKeyValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter both name and API key",
        variant: "destructive"
      });
      return;
    }

    const newKey: BackupApiKey = {
      id: crypto.randomUUID(),
      name: newApiKeyName.trim(),
      key: newApiKeyValue.trim()
    };

    setBackupApiKeys(prev => [...prev, newKey]);
    setNewApiKeyName('');
    setNewApiKeyValue('');

    toast({
      title: "API Key Added",
      description: `${newKey.name} has been added as a backup`
    });
  };

  const removeBackupApiKey = (id: string) => {
    setBackupApiKeys(prev => prev.filter(k => k.id !== id));
    toast({
      title: "API Key Removed",
      description: "Backup API key has been removed"
    });
  };

  // Test voice with current settings
  const testVoice = () => {
    const testText = voicePreferences.language === 'hindi' 
      ? 'नमस्ते, मैं ALSA हूं। आपकी सेटिंग्स सेव हो गई हैं।'
      : voicePreferences.language === 'hinglish'
      ? 'Hello, main ALSA hoon. Aapki settings save ho gayi hain.'
      : 'Hello, I am ALSA. Your settings have been saved.';
    
    const utterance = new SpeechSynthesisUtterance(testText);
    const voices = window.speechSynthesis.getVoices();
    
    // Find appropriate voice
    let selectedVoice = null;
    if (voicePreferences.language === 'hinglish' || voicePreferences.language === 'hindi') {
      const hindiVoices = voices.filter(v => 
        v.lang.startsWith('hi') || v.lang === 'en-IN'
      );
      if (voicePreferences.gender === 'male') {
        selectedVoice = hindiVoices.find(v => 
          !v.name.toLowerCase().includes('female')
        ) || hindiVoices[0];
      } else {
        selectedVoice = hindiVoices.find(v => 
          v.name.toLowerCase().includes('female')
        ) || hindiVoices[0];
      }
    } else {
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      if (voicePreferences.gender === 'male') {
        selectedVoice = englishVoices.find(v => 
          !v.name.toLowerCase().includes('female')
        ) || englishVoices[0];
      } else {
        selectedVoice = englishVoices.find(v => 
          v.name.toLowerCase().includes('female')
        ) || englishVoices[0];
      }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Apply emotion if enabled
    if (voicePreferences.emotionEnabled) {
      utterance.pitch = 1.1;
      utterance.rate = 0.95;
    }
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    
    toast({
      title: "Testing Voice",
      description: `${voicePreferences.gender} ${voicePreferences.language} voice`
    });
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
      <div className="container max-w-4xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-6 pr-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">Customize your ALSA AI assistant experience</p>
              </div>
              <Button onClick={savePreferences} disabled={saving} size="lg">
                {saving ? 'Saving...' : 'Save All Settings'}
              </Button>
            </div>

            {/* AI Response Style */}
            <Card className="bg-card border-border">
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

            {/* Voice Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Voice Settings
                </CardTitle>
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

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emotion-enabled">Emotion in Voice</Label>
                      <p className="text-sm text-muted-foreground">AI speaks with emotions (happy, sad, etc.)</p>
                    </div>
                    <Switch
                      id="emotion-enabled"
                      checked={voicePreferences.emotionEnabled}
                      onCheckedChange={(checked) => setVoicePreferences({ ...voicePreferences, emotionEnabled: checked })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="voice-gender">Voice Gender</Label>
                    <Select
                      value={voicePreferences.gender}
                      onValueChange={(value: 'male' | 'female' | 'auto') => 
                        setVoicePreferences({ ...voicePreferences, gender: value })
                      }
                    >
                      <SelectTrigger id="voice-gender" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male (Recommended for Hinglish)</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="auto">Auto (System Default)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="voice-language">Voice Language</Label>
                    <Select
                      value={voicePreferences.language}
                      onValueChange={(value: 'hinglish' | 'english' | 'hindi') => 
                        setVoicePreferences({ ...voicePreferences, language: value })
                      }
                    >
                      <SelectTrigger id="voice-language" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hinglish">Hinglish (Hindi + English mix)</SelectItem>
                        <SelectItem value="english">English Only</SelectItem>
                        <SelectItem value="hindi">Hindi Only</SelectItem>
                      </SelectContent>
                    </Select>
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

                  <Button 
                    variant="outline" 
                    onClick={testVoice}
                    className="w-full mt-4"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Test Voice Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the visual theme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
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

            {/* Output Paths */}
            <Card className="bg-card border-border">
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
                    <Label htmlFor="ss-path">Screenshot Path</Label>
                    <Input
                      id="ss-path"
                      value={outputPaths.screenshot}
                      onChange={(e) => setOutputPaths({ ...outputPaths, screenshot: e.target.value })}
                      placeholder="C:\Users\...\Screenshots"
                      className="mt-1"
                    />
                  </div>
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
                  <div>
                    <Label htmlFor="app-path">Application/Letter Path</Label>
                    <Input
                      id="app-path"
                      value={outputPaths.application}
                      onChange={(e) => setOutputPaths({ ...outputPaths, application: e.target.value })}
                      placeholder="C:\Users\...\Applications"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignment-path">Assignment Path</Label>
                    <Input
                      id="assignment-path"
                      value={outputPaths.assignment}
                      onChange={(e) => setOutputPaths({ ...outputPaths, assignment: e.target.value })}
                      placeholder="C:\Users\...\Assignments"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="db-path">Database Path</Label>
                    <Input
                      id="db-path"
                      value={outputPaths.database}
                      onChange={(e) => setOutputPaths({ ...outputPaths, database: e.target.value })}
                      placeholder="C:\Users\...\Databases"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Backup API Keys */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Backup API Keys
                </CardTitle>
                <CardDescription>
                  Add backup API keys for when the main server is unavailable. 
                  These will be used automatically as fallback.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backupApiKeys.length > 0 && (
                    <div className="space-y-2">
                      {backupApiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{apiKey.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {apiKey.key.slice(0, 8)}...{apiKey.key.slice(-4)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBackupApiKey(apiKey.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 pt-2 border-t border-border">
                    <div>
                      <Label htmlFor="api-name">API Name</Label>
                      <Input
                        id="api-name"
                        value={newApiKeyName}
                        onChange={(e) => setNewApiKeyName(e.target.value)}
                        placeholder="e.g., Gemini API, OpenAI"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="api-key">API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={newApiKeyValue}
                        onChange={(e) => setNewApiKeyValue(e.target.value)}
                        placeholder="Enter your API key"
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={addBackupApiKey} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Backup API Key
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button at Bottom */}
            <div className="sticky bottom-0 bg-background py-4 border-t border-border">
              <Button onClick={savePreferences} disabled={saving} className="w-full" size="lg">
                {saving ? 'Saving All Settings...' : 'Save All Settings'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Settings;
