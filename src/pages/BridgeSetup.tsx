import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Download, Terminal, Check, Copy, ExternalLink,
  Wifi, Shield, Zap, Sparkles, Crown, Monitor, Smartphone,
  Code, FileText, Camera, Video, Database, FolderOpen, Play,
  AlertTriangle, CheckCircle, Package, Settings, Lock
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
        navigate('/Chat');
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
    toast({ title: 'Copied to clipboard successfully!' });
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
        { icon: <Smartphone className="w-5 h-5" />, name: 'Mobile Bridge App', description: 'Native ALSA Android Control' },
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

  const dependencies = 'flask flask-cors winapps python-pptx openpyxl pyautogui pyodbc webbrowser';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse">
          <img src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/alsa-logo.png" alt="ALSA AI" className="w-20 h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Helmet>
        <title>Bridge Setup - ALSA AI | Install AI PC & Mobile Software</title>
        <meta name="description" content="Download and setup ALSA AI Bridge for Windows, macOS, Linux, and Android. Enable native AI-powered automation, voice control, screenshot capture, and full-stack coding." />
        <meta name="keywords" content="PC Bridge setup, ALSA AI installation, Phone Bridge App, AI mobile control, voice command software, PC automation tool, Android AI automation" />
        <meta property="og:title" content="ALSA AI Bridge Setup - Control Your Devices with AI" />
        <meta property="og:description" content="Setup the ALSA Bridge to enable AI-powered automation across your PC and Mobile devices." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.alsa-ai.in/bridge-setup" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Setup ALSA AI Phone & PC Bridge",
            "description": "Step-by-step guide to install the native ALSA AI Android App and configure the PC Bridge",
            "step": [
              { "@type": "HowToStep", "text": "Download the official ALSA AI Bridge APK for Android." },
              { "@type": "HowToStep", "text": "Install the app and login with your ALSA AI account." },
              { "@type": "HowToStep", "text": "Grant necessary permissions based on your privacy preferences." },
              { "@type": "HowToStep", "text": "Turn on the ALSA AI Bridge to start the secure local server on port 5002." },
              { "@type": "HowToStep", "text": "Ensure X-alsa-header token is enabled for authenticated requests." }
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
            <img src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/alsa-logo.png" alt="ALSA AI" className="h-10 w-10 rounded-xl ring-1 ring-white/10" />
            <div>
              <span className="text-xl font-bold">Bridge Setup</span>
              <p className="text-xs text-white/40">Configure your local device bridges</p>
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
              <p className="text-white/80 text-lg">Your bridge software is ready. Follow the steps below to connect your devices.</p>
            </div>
          </div>
        </div>

        {/* AI Control Showcase */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Monitor className="w-6 h-6 text-cyan-400" />
            AI-Powered Device Control
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all hover:border-white/20">
              <img
                src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/ai-pc-control.jpg"
                alt="AI PC Control Interface"
                className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 to-transparent">
                <h3 className="font-bold text-white">Full System Control</h3>
                <p className="text-sm text-white/60">Execute commands, manage files, and automate tasks natively</p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all hover:border-white/20">
              <img
                src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/voice-ai-control.jpg"
                alt="Voice AI Control"
                className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 to-transparent">
                <h3 className="font-bold text-white">Voice Command System</h3>
                <p className="text-sm text-white/60">Control your devices with seamless natural voice commands</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phone Bridge Section */}
        <h2 className="text-2xl font-bold mt-12 mb-6 flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-emerald-400" />
          📱 Mobile Bridge (Elite Only) — The Official ALSA App
        </h2>

        {tier !== 'elite' ? (
          /* Locked State for Non-Elite Users */
          <Card className="bg-slate-900/60 border border-purple-500/30 backdrop-blur-xl p-8 text-center relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <Crown className="w-64 h-64 text-purple-400" />
            </div>
            <div className="max-w-xl mx-auto space-y-4 relative z-10">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto text-purple-400 border border-purple-500/30">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Exclusive to Elite Plan Members</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                The ALSA Android Mobile Bridge APK offers direct device control, native WhatsApp messaging, contacts integration, and local media processing. Upgrade to the Elite Plan to download and unlock mobile capabilities.
              </p>
              <Button
                onClick={() => navigate('/pricing')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold px-8 py-6 rounded-xl shadow-lg mt-2"
              >
                <Crown className="w-5 h-5 mr-2" /> Upgrade to Elite Tier
              </Button>
            </div>
          </Card>
        ) : (
          /* Unlocked State for Elite Users */
          <Card className="bg-gradient-to-br from-emerald-950/40 to-slate-900/50 border-emerald-500/20 backdrop-blur-xl">
            <CardContent className="p-6 space-y-6 text-sm text-white/70">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-amber-200 font-semibold mb-2">⚡ Bridge Priority Rule</p>
                <p className="text-amber-100/80 text-xs leading-relaxed">
                  When requesting ALSA to execute mobile actions (WhatsApp, SMS, launching applications, or downloading media directly to your phone), requests will <b>ALWAYS route through the Mobile Bridge (port 5002)</b> first for optimal performance and security.
                </p>
              </div>

              {/* Security Disclaimer */}
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <Shield className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-bold mb-1">STRICT SECURITY DISCLAIMER</p>
                  <p className="text-red-200/80 text-xs leading-relaxed">
                    Do not share access or grant permissions to the local Bridge server (localhost:5002) to untrusted third parties. Doing so could expose your stored contacts, messages, and device settings. <b>ALSA AI and its developers assume no liability for unauthorized access resulting from user configuration errors.</b>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-emerald-400"/> ALSA Bridge App Installation</h4>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">1</div>
                        <p className="text-white font-semibold text-sm">Download the Official APK</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 mb-4">
                      Download and install the native ALSA AI Bridge application on your Android device.
                    </p>
                    <a href="/bridges/alsa-ai-bridge.apk" download>
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg">
                        <Download className="w-4 h-4 mr-2" /> Download ALSA Mobile Bridge APK
                      </Button>
                    </a>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">2</div>
                      <p className="text-white font-semibold text-sm">Login & Link Account</p>
                    </div>
                    <p className="text-xs text-white/60">
                      Launch the mobile application and authenticate with your registered ALSA AI account credentials to sync with the workspace.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">3</div>
                      <p className="text-white font-semibold text-sm">Configure Privacy & Permissions</p>
                    </div>
                    <p className="text-xs text-white/60">
                      Adjust operational permissions (Contacts, Storage, SMS) inside the application settings based on your automated workflow preferences.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">4</div>
                      <p className="text-white font-semibold text-sm">Activate Service & Authentication Header</p>
                    </div>
                    <p className="text-xs text-white/60 mb-2">
                      Toggle the <b>"ALSA AI Bridge"</b> service switch to active status. This initializes a localized server running on <code>localhost:5002</code>.
                    </p>
                    <div className="flex items-start gap-2 mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-200">
                        <b>Notice:</b> Ensure that the <b>X-alsa-header token</b> option remains enabled to restrict unauthorized request attempts.
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">✓</div>
                      <p className="text-emerald-300 font-semibold text-sm">Sync Contacts & Integrations</p>
                    </div>
                    <p className="text-xs text-white/70">
                      To configure calling and direct email workflows, access <b>More <ArrowLeft className="w-3 h-3 inline rotate-180"/> Contacts Info</b> inside the mobile interface to define recipient lists and credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                  <h4 className="text-white font-bold mb-2">📞 Native WhatsApp</h4>
                  <p className="text-xs mb-2">Send messages seamlessly via native system integrations.</p>
                  <p className="text-xs text-emerald-300">Command: <i>"Send a WhatsApp message to Alex saying let us meet at 6 PM"</i></p>
                </div>
                <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                  <h4 className="text-white font-bold mb-2">👥 Integrated Contacts</h4>
                  <p className="text-xs mb-2">Contacts synced within the application allow natural voice-based search and interaction.</p>
                  <p className="text-xs text-emerald-300">Command: <i>"Search contact information for John"</i></p>
                </div>
                <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                  <h4 className="text-white font-bold mb-2">🎬 Media Downloader</h4>
                  <p className="text-xs mb-2">Download videos and audio streams directly into specified local directories.</p>
                  <p className="text-xs text-emerald-300">Command: <i>"Download https://youtu.be/xyz as MP3 audio"</i></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Desktop PC Bridge Section */}
        <h2 className="text-2xl font-bold mt-12 mb-6 flex items-center gap-3">
          <Monitor className="w-6 h-6 text-blue-400" />
          💻 PC Bridge Setup (Windows / Linux)
        </h2>

        <Tabs defaultValue="windows" className="w-full">
          <TabsList className="bg-slate-900/50 border border-white/10 p-1">
            <TabsTrigger value="windows" className="data-[state=active]:bg-white/10">Windows</TabsTrigger>
            <TabsTrigger value="linux" className="data-[state=active]:bg-white/10">Linux</TabsTrigger>
          </TabsList>

          <TabsContent value="windows" className="mt-6">
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-blue-400" /> Windows Setup Guide
                </CardTitle>
                <CardDescription>Complete step-by-step installation for Windows PC</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">1</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">Install Python 3.8+</h4>
                    <p className="text-sm text-white/60 mb-3">Download the installer from python.org. <span className="text-amber-400 font-semibold">Important: Enable "Add Python to PATH" during setup.</span></p>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://www.python.org/downloads/', '_blank')} className="border-white/20 hover:bg-white/5">
                      <ExternalLink className="w-4 h-4 mr-2" /> Download Python
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">2</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">Download Your PC Bridge</h4>
                    <p className="text-sm text-white/60 mb-3">Save <code className="bg-black/50 px-2 py-0.5 rounded text-purple-400">{getBridgeFileName()}</code> to a secure location (e.g., <code className="bg-black/50 px-2 py-0.5 rounded">C:\ALSA\</code>)</p>
                    <a href={getBridgeDownloadUrl()} download>
                      <Button className={`bg-gradient-to-r ${currentTier.gradient} hover:opacity-90`}>
                        <Download className="w-4 h-4 mr-2" /> Download {getBridgeFileName()}
                      </Button>
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">3</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">Install Dependencies</h4>
                    <p className="text-sm text-white/60 mb-3">Launch Command Prompt (Win + R → cmd) and execute:</p>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm flex items-center justify-between">
                      <code className="text-green-400">pip install {dependencies}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyCommand(`pip install ${dependencies}`, 'win-deps')}>
                        {copied === 'win-deps' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-black/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">4</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-2">Execute Bridge Server</h4>
                    <p className="text-sm text-white/60 mb-3">Navigate to your destination directory and execute:</p>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm flex items-center justify-between">
                      <code className="text-green-400">python {getBridgeFileName()}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyCommand(`python ${getBridgeFileName()}`, 'run-win')}>
                        {copied === 'run-win' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linux" className="mt-6">
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5" /> Linux Setup Guide
                </CardTitle>
                <CardDescription>Complete installation steps for Debian/Ubuntu environments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm space-y-2">
                  <p className="text-white/40"># Update system packages and install Python environment</p>
                  <p className="text-green-400">sudo apt update && sudo apt install python3 python3-pip -y</p>
                  <p className="text-white/40 mt-4"># Install required Python packages</p>
                  <p className="text-green-400">pip3 install {dependencies}</p>
                  <p className="text-white/40 mt-4"># Start the Bridge service</p>
                  <p className="text-green-400">python3 {getBridgeFileName()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className={`bg-gradient-to-r ${currentTier.gradient} hover:opacity-90 text-white px-10 py-7 text-lg font-bold rounded-2xl shadow-2xl`}
          >
            <Wifi className="w-5 h-5 mr-2" /> Launch ALSA AI Workspace
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BridgeSetup;
