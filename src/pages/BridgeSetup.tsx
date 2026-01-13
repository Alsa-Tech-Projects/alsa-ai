import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Download, Terminal, Check, Copy, ExternalLink, 
  Wifi, Shield, Zap, Sparkles, Crown, Monitor, Smartphone,
  Code, FileText, Camera, Video, Database, FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import alsaLogo from '@/assets/alsa-logo.png';

const BridgeSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<string>('pro');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
    });

    // Get tier from location state or default to pro
    if (location.state?.tier) {
      setTier(location.state.tier);
    }
  }, [navigate, location.state]);

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const tierFeatures = {
    trial: {
      name: 'Trial Bridge',
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-amber-500 to-orange-500',
      features: [
        { icon: <Camera className="w-5 h-5" />, name: 'Screenshots', description: 'Capture your screen on command' },
        { icon: <Video className="w-5 h-5" />, name: 'Screen Recording', description: 'Record up to 60 seconds' },
        { icon: <Code className="w-5 h-5" />, name: 'Basic Coding', description: 'HTML, CSS, JavaScript only' },
      ],
      limitations: [
        'Full-stack coding disabled',
        'Shell commands disabled', 
        'ADB/Android disabled',
        'Valid for 3 days only',
      ],
    },
    pro: {
      name: 'Pro Bridge',
      icon: <Sparkles className="w-6 h-6" />,
      gradient: 'from-blue-500 to-cyan-500',
      features: [
        { icon: <Code className="w-5 h-5" />, name: 'Full-Stack Coding', description: 'Python, Node.js, React, and more' },
        { icon: <Terminal className="w-5 h-5" />, name: 'OS Shell Commands', description: 'Execute system commands' },
        { icon: <FolderOpen className="w-5 h-5" />, name: 'Project Generation', description: 'Create complete projects' },
        { icon: <FileText className="w-5 h-5" />, name: 'Document Creation', description: 'PPT, Excel, PDFs' },
        { icon: <Camera className="w-5 h-5" />, name: 'Screenshots & Recording', description: 'Full media capabilities' },
      ],
      limitations: [
        'ADB/Android control disabled',
        'Database management disabled',
      ],
    },
    elite: {
      name: 'Elite Bridge',
      icon: <Crown className="w-6 h-6" />,
      gradient: 'from-purple-500 to-pink-500',
      features: [
        { icon: <Code className="w-5 h-5" />, name: 'Full-Stack Coding', description: 'All languages & frameworks' },
        { icon: <Terminal className="w-5 h-5" />, name: 'OS Shell Commands', description: 'Full system access' },
        { icon: <Smartphone className="w-5 h-5" />, name: 'ADB Android Control', description: 'Control your phone via USB/WiFi' },
        { icon: <Database className="w-5 h-5" />, name: 'Database Management', description: 'SQLite, MongoDB, PostgreSQL' },
        { icon: <FolderOpen className="w-5 h-5" />, name: 'Advanced Project Gen', description: 'E-commerce, APIs, full apps' },
        { icon: <Shield className="w-5 h-5" />, name: 'Priority Secure Tunnel', description: 'Encrypted connection' },
      ],
      limitations: [],
    },
  };

  const currentTier = tierFeatures[tier as keyof typeof tierFeatures] || tierFeatures.pro;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={alsaLogo} alt="ALSA AI" className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-bold text-white">PC Bridge Setup</span>
          </div>
          <Badge className={`bg-gradient-to-r ${currentTier.gradient} text-white border-0 px-4 py-1`}>
            {currentTier.icon}
            <span className="ml-2">{currentTier.name}</span>
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Success Banner */}
        <div className={`bg-gradient-to-r ${currentTier.gradient} rounded-2xl p-8 mb-10 text-white`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              {currentTier.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold">🎉 Payment Successful!</h1>
              <p className="text-white/80">Your {currentTier.name} is ready to use</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <h2 className="text-2xl font-bold text-white mb-6">Your Features</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {currentTier.features.map((feature, idx) => (
            <Card key={idx} className="bg-[#1a1a1a] border-white/10">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${currentTier.gradient} flex items-center justify-center text-white`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.name}</h3>
                  <p className="text-sm text-white/60">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {currentTier.limitations.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-10">
            <h3 className="font-semibold text-yellow-400 mb-2">Limitations</h3>
            <ul className="text-sm text-yellow-300/80 space-y-1">
              {currentTier.limitations.map((limit, idx) => (
                <li key={idx}>• {limit}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Setup Instructions */}
        <h2 className="text-2xl font-bold text-white mb-6">Setup Instructions</h2>
        
        <Tabs defaultValue="windows" className="w-full">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="windows">Windows</TabsTrigger>
            <TabsTrigger value="mac">macOS</TabsTrigger>
            <TabsTrigger value="linux">Linux</TabsTrigger>
          </TabsList>

          <TabsContent value="windows" className="mt-6">
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5" /> Windows Setup
                </CardTitle>
                <CardDescription>Follow these steps to set up PC Bridge on Windows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">Install Python 3.8+</h4>
                      <p className="text-sm text-white/60 mb-2">Download from python.org and check "Add to PATH"</p>
                      <Button variant="outline" size="sm" onClick={() => window.open('https://www.python.org/downloads/', '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" /> Download Python
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">Download PC Bridge</h4>
                      <p className="text-sm text-white/60 mb-2">Download the bridge script to your PC</p>
                      <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90">
                        <Download className="w-4 h-4 mr-2" /> Download pc-control-bridge.py
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">Install Dependencies</h4>
                      <p className="text-sm text-white/60 mb-2">Open Command Prompt and run:</p>
                      <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-green-400 flex items-center justify-between">
                        <code>pip install flask flask-cors pyautogui pillow python-pptx openpyxl</code>
                        <Button variant="ghost" size="sm" onClick={() => copyCommand('pip install flask flask-cors pyautogui pillow python-pptx openpyxl')}>
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">4</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">Run the Bridge</h4>
                      <p className="text-sm text-white/60 mb-2">Navigate to the folder and run:</p>
                      <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-green-400 flex items-center justify-between">
                        <code>python pc-control-bridge.py</code>
                        <Button variant="ghost" size="sm" onClick={() => copyCommand('python pc-control-bridge.py')}>
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">5</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">Connect in ALSA</h4>
                      <p className="text-sm text-white/60">
                        Go back to ALSA AI and click the PC Bridge button in the sidebar. It should show "Connected" in green.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mac" className="mt-6">
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">macOS Setup</CardTitle>
                <CardDescription>Coming Soon - macOS bridge is in development</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white/60">macOS support will be available soon. For now, you can use the Windows bridge in a Windows VM or Boot Camp.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linux" className="mt-6">
            <Card className="bg-[#1a1a1a] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Linux Setup</CardTitle>
                <CardDescription>Follow these steps for Linux</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-white/60">The setup is similar to Windows. Make sure you have Python 3.8+ and pip installed.</p>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-green-400">
                  <code>sudo pip3 install flask flask-cors pyautogui pillow python-pptx openpyxl</code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Voice Commands */}
        <h2 className="text-2xl font-bold text-white mt-12 mb-6">Voice Commands</h2>
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-3">Screenshots</h4>
                <ul className="text-white/60 space-y-1">
                  <li>"Take a screenshot"</li>
                  <li>"Capture my screen"</li>
                  <li>"SS le lo"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Recording</h4>
                <ul className="text-white/60 space-y-1">
                  <li>"Start recording"</li>
                  <li>"Stop recording"</li>
                  <li>"Record my screen"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Projects</h4>
                <ul className="text-white/60 space-y-1">
                  <li>"Create a React project"</li>
                  <li>"Make a portfolio website"</li>
                  <li>"Build a todo app"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">System</h4>
                <ul className="text-white/60 space-y-1">
                  <li>"Shutdown my PC"</li>
                  <li>"Open Chrome"</li>
                  <li>"Run this Python file"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button 
            onClick={() => navigate('/')} 
            className={`bg-gradient-to-r ${currentTier.gradient} hover:opacity-90 text-white px-8 py-6 text-lg`}
          >
            <Wifi className="w-5 h-5 mr-2" /> Start Using ALSA AI
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BridgeSetup;