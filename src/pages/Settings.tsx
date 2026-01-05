import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Moon, Sun, FolderOpen, Key, Plus, Trash2 } from 'lucide-react';
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

      // Save local settings
      localStorage.setItem('alsa_output_paths', JSON.stringify(outputPaths));
      localStorage.setItem('alsa_backup_api_keys', JSON.stringify(backupApiKeys));
      localStorage.setItem('alsa_ai_response_style', preferences.ai_response_style);

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
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-2">Customize your ALSA AI assistant experience</p>
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
                  Add backup API keys for when the server key is unavailable. (Optional: add a Weather API key if you want OpenWeatherMap.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Existing Keys */}
                  {backupApiKeys.length > 0 && (
                    <div className="space-y-2">
                      {backupApiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{apiKey.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {apiKey.key.slice(0, 8)}...{apiKey.key.slice(-4)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBackupApiKey(apiKey.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Keys */}
                  <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3 space-y-1">
                    <p className="font-medium">Suggested API Keys:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li><strong>Weather API</strong> - OpenWeatherMap key for weather widget</li>
                      <li><strong>Gemini API</strong> - Google AI backup for chat</li>
                      <li><strong>OpenAI API</strong> - GPT backup for chat</li>
                    </ul>
                  </div>

                  {/* Add New Key */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label>Add New Backup Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newApiKeyName}
                        onChange={(e) => setNewApiKeyName(e.target.value)}
                        placeholder="Key name (e.g., Weather API)"
                        className="flex-1"
                      />
                      <Input
                        value={newApiKeyValue}
                        onChange={(e) => setNewApiKeyValue(e.target.value)}
                        placeholder="API Key"
                        type="password"
                        className="flex-[2]"
                      />
                      <Button onClick={addBackupApiKey} size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4 pb-6">
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
