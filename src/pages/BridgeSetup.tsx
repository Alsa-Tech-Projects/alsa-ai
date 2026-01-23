import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Download, Terminal, Check, Copy, ExternalLink, 
  Wifi, Shield, Zap, Sparkles, Crown, Monitor, Smartphone,
  Code, FileText, Camera, Video, Database, FolderOpen, Play,
  AlertTriangle, CheckCircle, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isAdminEmail } from '@/utils/adminConfig';
import { isTeamEmail } from '@/utils/teamAccounts';
import alsaLogo from '@/assets/alsa-logo.png';
import aiPcControlImage from '@/assets/ai-pc-control.jpg';
import voiceControlImage from '@/assets/voice-ai-control.jpg';
import { Helmet } from 'react-helmet';

const BridgeSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<string>('pro');
  const [copied, setCopied] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/');
        return;
      }
      
      setUser(session.user);
      
      // Check subscription - only allow paid users or team members
      if (isAdminEmail(session.user.email) || isTeamEmail(session.user.email)) {
        setTier('elite');
        setLoading(false);
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at, trial_started_at')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile) {
        // Check if subscription is valid
        if (profile.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date()) {
          setTier(profile.subscription_tier || 'trial');
        } else if (profile.trial_started_at) {
          const trialEnd = new Date(new Date(profile.trial_started_at).getTime() + 3 * 24 * 60 * 60 * 1000);
          if (trialEnd > new Date()) {
            setTier('trial');
          } else {
            // No valid subscription, redirect to pricing
            navigate('/pricing');
            return;
          }
        } else {
          navigate('/pricing');
          return;
        }
      } else {
        navigate('/pricing');
        return;
      }
      
      setLoading(false);
    };
    
    checkAuth();
    
    // Get tier from location state if available
    if (location.state?.tier) {
      setTier(location.state.tier);
    }
  }, [navigate, location.state]);

  const copyCommand = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopied(''), 2000);
  };

  const getBridgeFileName = () => {
    switch (tier) {
      case 'elite': return 'elite-pc-bridge.py';
      case 'pro': return 'pro-pc-bridge.py';
      default: return 'freetier-pc-bridge.py';
    }
  };

  const getBridgeDownloadUrl = () => `/bridges/${getBridgeFileName()}`;

  const tierFeatures = {
    trial: {
      name: 'Trial Bridge',
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-amber-500 to-orange-500',
      features: [
        { icon: <Camera className="w-5 h-5" />, name: 'Screenshots', description: 'Capture your screen (with confirmation)' },
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

  const requirements = [
    { name: 'Python 3.8+', command: 'python --version', description: 'Required runtime' },
    { name: 'pip (Package Manager)', command: 'pip --version', description: 'For installing dependencies' },
  ];

  const dependencies = 'flask flask-cors winapps speech_recognition PyAudio openpyxl python-pptx Pillow pyodbc';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse">
          <img src={alsaLogo} alt="ALSA AI" className="w-20 h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Helmet>
        <title>PC Bridge Setup - ALSA AI | Install AI PC Control Software</title>
        <meta name="description" content="Download and setup ALSA AI PC Bridge for Windows, macOS, and Linux. Enable AI-powered PC automation, voice control, screenshot capture, screen recording, and full-stack coding on your computer." />
        <meta name="keywords" content="PC Bridge setup, ALSA AI installation, AI PC control, voice command software, PC automation tool, screenshot AI, screen recording AI, coding automation, Python bridge, Windows AI control, macOS AI, Linux automation, install AI assistant, PC remote control, voice assistant setup" />
        <meta property="og:title" content="ALSA AI PC Bridge Setup - Control Your PC with AI" />
        <meta property="og:description" content="Setup the ALSA PC Bridge to enable AI-powered automation, voice commands, and coding on your computer." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.alsa-ai.in/bridge-setup" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Setup ALSA AI PC Bridge",
            "description": "Step-by-step guide to install and configure ALSA AI PC Bridge",
            "step": [
              {"@type": "HowToStep", "text": "Install Python 3.8+"},
              {"@type": "HowToStep", "text": "Download the PC Bridge file"},
              {"@type": "HowToStep", "text": "Install Python packages"},
              {"@type": "HowToStep", "text": "Run the bridge script"}
            ]
          })}
        </script>
      </Helmet>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={alsaLogo} alt="ALSA AI" className="h-10 w-10 rounded-xl ring-1 ring-white/10" />
            <div>
              <span className="text-xl font-bold">PC Bridge Setup</span>
              <p className="text-xs text-white/40">Configure your local bridge</p>
            </div>
          </div>
          <Badge className={`bg-gradient-to-r ${currentTier.gradient} text-white border-0 px-4 py-2 shadow-lg flex items-center gap-2`}>
            {currentTier.icon}
            <span className="font-bold">{currentTier.name}</span>
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-5xl relative z-10">
        {/* Success Banner */}
        <div className={`bg-gradient-to-r ${currentTier.gradient} rounded-3xl p-8 mb-12 shadow-2xl`}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">🎉 Welcome to {currentTier.name}!</h1>
              <p className="text-white/80 text-lg">Your bridge is ready to download. Follow the steps below to get started.</p>
            </div>
          </div>
        </div>

        {/* Introduction Video */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Play className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Introduction Video</h2>
          </div>
          <div className="rounded-2xl overflow-hidden bg-slate-900/50 border border-white/10 shadow-xl">
            <video 
              className="w-full aspect-video"
              controls
              preload="metadata"
            >
              <source src="/videos/introduction-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* AI Control Showcase */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Monitor className="w-6 h-6 text-cyan-400" />
            AI-Powered PC Control
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all hover:border-white/20">
              <img 
                src={aiPcControlImage} 
                alt="AI PC Control Interface" 
                className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 to-transparent">
                <h3 className="font-bold text-white">Full System Control</h3>
                <p className="text-sm text-white/60">Execute commands, manage files, and automate tasks</p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all hover:border-white/20">
              <img 
                src={voiceControlImage} 
                alt="Voice AI Control" 
                className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 to-transparent">
                <h3 className="font-bold text-white">Voice Command System</h3>
                <p className="text-sm text-white/60">Control your PC with natural voice commands</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Your Features
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {currentTier.features.map((feature, idx) => (
            <Card key={idx} className="bg-slate-900/50 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentTier.gradient} flex items-center justify-center text-white shadow-lg`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{feature.name}</h3>
                  <p className="text-sm text-white/50">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {currentTier.limitations.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 mb-10 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-amber-400">Tier Limitations</h3>
            </div>
            <ul className="text-sm text-amber-300/80 space-y-2">
              {currentTier.limitations.map((limit, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {limit}
                </li>
              ))}
            </ul>
            <Button 
              onClick={() => navigate('/pricing')} 
              className="mt-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
            >
              Upgrade for Full Access
            </Button>
          </div>
        )}

        {/* Requirements Section */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Package className="w-6 h-6 text-blue-400" />
          System Requirements
        </h2>
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl mb-10">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-black/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{req.name}</p>
                    <p className="text-xs text-white/50">{req.description}</p>
                  </div>
                  <code className="text-xs bg-black/50 px-2 py-1 rounded text-green-400 font-mono">{req.command}</code>
                </div>
              ))}
            </div>
            <div className="p-4 bg-black/30 rounded-xl">
              <p className="text-sm text-white/60 mb-2">Install all required Python packages:</p>
              <div className="flex items-center justify-between bg-black/50 rounded-lg p-4">
                <code className="text-sm text-green-400 font-mono flex-1 overflow-x-auto">pip install {dependencies}</code>
                <Button variant="ghost" size="sm" onClick={() => copyCommand(`pip install ${dependencies}`, 'deps')}>
                  {copied === 'deps' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Monitor className="w-6 h-6 text-emerald-400" />
          Setup Instructions
        </h2>
        
        <Tabs defaultValue="windows" className="w-full">
          <TabsList className="bg-slate-900/50 border border-white/10 p-1">
            <TabsTrigger value="windows" className="data-[state=active]:bg-white/10">Windows</TabsTrigger>
            <TabsTrigger value="mac" className="data-[state=active]:bg-white/10">macOS</TabsTrigger>
            <TabsTrigger value="linux" className="data-[state=active]:bg-white/10">Linux</TabsTrigger>
          </TabsList>

          <TabsContent value="windows" className="mt-6">
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-400" /> Windows Setup Guide
                </CardTitle>
                <CardDescription>Complete step-by-step installation for Windows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Python */}
                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">1</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">Install Python 3.8+</h4>
                    <p className="text-sm text-white/60 mb-3">Download from python.org. <span className="text-amber-400 font-semibold">Important: Check "Add Python to PATH" during installation!</span></p>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://www.python.org/downloads/', '_blank')} className="border-white/20 hover:bg-white/5">
                      <ExternalLink className="w-4 h-4 mr-2" /> Download Python
                    </Button>
                  </div>
                </div>

                {/* Step 2: Download Bridge */}
                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">2</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">Download Your PC Bridge</h4>
                    <p className="text-sm text-white/60 mb-3">Download <code className="bg-black/50 px-2 py-0.5 rounded text-purple-400">{getBridgeFileName()}</code> to a permanent location (e.g., <code className="bg-black/50 px-2 py-0.5 rounded">C:\ALSA\</code>)</p>
                    <a href={getBridgeDownloadUrl()} download>
                      <Button className={`bg-gradient-to-r ${currentTier.gradient} hover:opacity-90`}>
                        <Download className="w-4 h-4 mr-2" /> Download {getBridgeFileName()}
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Step 3: Install Dependencies */}
                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">3</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">Install Python Packages</h4>
                    <p className="text-sm text-white/60 mb-3">Open Command Prompt (Win+R → cmd) and run:</p>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm flex items-center justify-between">
                      <code className="text-green-400">pip install {dependencies}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyCommand(`pip install ${dependencies}`, 'win-deps')}>
                        {copied === 'win-deps' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 4: Run Bridge */}
                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">4</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">Run the Bridge</h4>
                    <p className="text-sm text-white/60 mb-3">Navigate to the folder and run:</p>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm flex items-center justify-between">
                      <code className="text-green-400">python {getBridgeFileName()}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyCommand(`python ${getBridgeFileName()}`, 'run-win')}>
                        {copied === 'run-win' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Step 5: Auto-start */}
                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">5</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">Add to Windows Startup (Optional)</h4>
                    <p className="text-sm text-white/60 mb-3">To auto-start on login:</p>
                    <ol className="text-sm text-white/70 space-y-2 list-decimal list-inside">
                      <li>Press <code className="bg-black/50 px-2 py-0.5 rounded">Win+R</code> and type <code className="bg-black/50 px-2 py-0.5 rounded">shell:startup</code></li>
                      <li>Create a shortcut to your <code className="text-purple-400">{getBridgeFileName()}</code> file</li>
                      <li>Right-click shortcut → Properties → change "Start in" to the script folder</li>
                    </ol>
                    <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-xs text-blue-300">💡 Alternatively, create a .bat file with: <code>pythonw {getBridgeFileName()}</code> to run silently</p>
                    </div>
                  </div>
                </div>

                {/* Step 6: Connect */}
                <div className="flex items-start gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">✓</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-emerald-400 mb-2">Connect in ALSA AI</h4>
                    <p className="text-sm text-white/60">
                      Go back to ALSA AI and click the <span className="text-blue-400 font-semibold">PC Bridge</span> button in the sidebar. 
                      It should show <span className="text-emerald-400 font-semibold">"Connected"</span> with a green indicator.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mac" className="mt-6">
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">macOS Setup</CardTitle>
                <CardDescription>Coming Soon - macOS bridge is in development</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white/60">macOS support will be available soon. For now, you can use the Windows bridge in a Windows VM or Parallels Desktop.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linux" className="mt-6">
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5" /> Linux Setup Guide
                </CardTitle>
                <CardDescription>Complete installation for Ubuntu/Debian-based systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm space-y-2">
                  <p className="text-white/40"># Install Python and pip</p>
                  <p className="text-green-400">sudo apt update && sudo apt install python3 python3-pip -y</p>
                  <p className="text-white/40 mt-4"># Install dependencies</p>
                  <p className="text-green-400">pip3 install {dependencies}</p>
                  <p className="text-white/40 mt-4"># Run the bridge</p>
                  <p className="text-green-400">python3 {getBridgeFileName()}</p>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-blue-300">💡 Add to ~/.bashrc or create a systemd service for auto-start</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Voice Commands */}
        <h2 className="text-2xl font-bold mt-12 mb-6 flex items-center gap-3">
          <Wifi className="w-6 h-6 text-cyan-400" />
          Voice Commands Reference
        </h2>
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-400" /> Screenshots
                </h4>
                <ul className="text-white/60 space-y-1.5">
                  <li>"Take a screenshot"</li>
                  <li>"Capture my screen"</li>
                  <li>"Screenshot le lo"</li>
                  <li>"SS le lo"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" /> Recording
                </h4>
                <ul className="text-white/60 space-y-1.5">
                  <li>"Start recording"</li>
                  <li>"Stop recording"</li>
                  <li>"Record my screen"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" /> Projects
                </h4>
                <ul className="text-white/60 space-y-1.5">
                  <li>"Create a React project"</li>
                  <li>"Make a portfolio website"</li>
                  <li>"Build a todo app"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-400" /> System
                </h4>
                <ul className="text-white/60 space-y-1.5">
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
            size="lg"
            className={`bg-gradient-to-r ${currentTier.gradient} hover:opacity-90 text-white px-10 py-7 text-lg font-bold rounded-2xl shadow-2xl`}
          >
            <Wifi className="w-5 h-5 mr-2" /> Start Using ALSA AI
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BridgeSetup;
