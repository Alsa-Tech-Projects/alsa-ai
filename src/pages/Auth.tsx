// import { useState, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { supabase } from '@/integrations/supabase/client';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useToast } from '@/hooks/use-toast';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Helmet } from 'react-helmet';
// import { Eye, EyeOff, Sparkles, Shield, Zap, User } from 'lucide-react';
// import SignupWizard from '@/components/SignupWizard';

// const Auth = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [loading, setLoading] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);

//   // Wizard state for collecting more profile info
//   const [showWizard, setShowWizard] = useState(false);
//   const [wizardUserId, setWizardUserId] = useState<string | null>(null);
//   const [wizardInitialName, setWizardInitialName] = useState('');
//   const [wizardInitialStep, setWizardInitialStep] = useState<number>(1);
//   const [wizardOAuthProvider, setWizardOAuthProvider] = useState<string | null>(null);
//   const location = useLocation();



//   useEffect(() => {
//     const checkProfileAndMaybeOpen = async (user: any, initialStep = 2) => {
//       if (!user) return;

//       // If the user came from our pre-oauth flow, apply stored profile data first
//       try {
//         const pre = localStorage.getItem('pre_oauth_profile');
//         if (pre) {
//           const parsed = JSON.parse(pre);

//           const payload: any = {
//             user_id: user.id,
//             display_name: parsed.display_name || user.user_metadata?.full_name || user.email,
//             bio: parsed.bio || null,
//             found_from: parsed.found_from || null,
//             purpose: parsed.purpose || null,
//           };

//           // If avatar data URL present, upload it
//           if (parsed.avatarDataUrl) {
//             try {
//               const dataUrl: string = parsed.avatarDataUrl;
//               // convert to blob
//               const arr = dataUrl.split(',');
//               const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
//               const bstr = atob(arr[1]);
//               let n = bstr.length;
//               const u8arr = new Uint8Array(n);
//               while (n--) u8arr[n] = bstr.charCodeAt(n);
//               const blob = new Blob([u8arr], { type: mime });

//               const filePath = `${user.id}-${Date.now()}.png`;
//               const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob);
//               if (!uploadError) {
//                 const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
//                 payload.avatar_url = publicUrl;
//               }
//             } catch (upErr) {
//               console.error('Avatar upload after oauth failed', upErr);
//             }
//           }

//           const { error } = await supabase.from('profiles').upsert(payload);
//           if (error) throw error;

//           localStorage.removeItem('pre_oauth_profile');
//           navigate('/Chat');
//           return;
//         }
//       } catch (e) {
//         console.error('Applying pre-oauth profile failed', e);
//       }

//       // Fallback: open wizard if profile missing
//       try {
//         const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
//         const p: any = profile;
//         if (!p || !p.bio || !p.found_from || !p.purpose) {
//           setWizardUserId(user.id);
//           setWizardInitialName(user.user_metadata?.full_name || user.user_metadata?.name || user.email || '');
//           setWizardInitialStep(initialStep);
//           setShowWizard(true);
//         } else {
//           navigate('/Chat');
//         }
//       } catch (err) {
//         console.error('Profile check failed', err);
//         navigate('/Chat');
//       }
//     };

//     // Check if user is already logged in; if redirected from google sign-up, open wizard
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       if (session?.user) {
//         const params = new URLSearchParams(location.search);
//         if (params.get('source') === 'google') {
//           checkProfileAndMaybeOpen(session.user as any, 2);
//         } else {
//           navigate('/Chat');
//         }
//       }
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
//       if (session?.user) {
//         const params = new URLSearchParams(location.search);
//         if (params.get('source') === 'google') {
//           checkProfileAndMaybeOpen(session.user as any, 2);
//         } else {
//           // normal sign in
//           navigate('/Chat');
//         }
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, [navigate, location.search]);

//   // clear wizard oauth provider when the modal closes
//   useEffect(() => {
//     if (!showWizard) setWizardOAuthProvider(null);
//   }, [showWizard]);



//   const handleSignIn = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const { error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (error) throw error;

//       toast({
//         title: "Welcome back!",
//         description: "Successfully signed in.",
//       });
//     } catch (error: any) {
//       toast({
//         title: "Sign in failed",
//         description: error.message,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogleLogin = async () => {
//     try {

//       setLoading(true);
//       const { error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           // Redirect back to auth so we can prompt for missing profile fields
//           redirectTo: `${window.location.origin}/auth?source=google`,
//         },
//       });

//       if (error) throw error;
//     } catch (error: any) {
//       toast({
//         title: "Google Sign in failed",
//         description: error.message,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
//       <Helmet>
//         <title>Login & Sign Up - ALSA AI | Create Your AI Assistant Account</title>
//         <meta name="description" content="Sign up or login to ALSA AI - India's best AI assistant for PC automation, voice control, and coding. Create your free account and start automating with AI today!" />
//         <meta name="keywords" content="ALSA AI login, AI assistant signup, create AI account, PC automation login, voice control AI, AI chatbot registration, free AI assistant, ALSA account, machine learning assistant, smart AI login, artificial intelligence signup, productivity AI account" />
//         <meta property="og:title" content="Login to ALSA AI - Your AI Assistant Awaits" />
//         <meta property="og:description" content="Create your free ALSA AI account and unlock PC automation, voice commands, and intelligent coding assistance." />
//         <meta property="og:type" content="website" />
//         <link rel="canonical" href="https://www.alsa-ai.in/auth" />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "WebPage",
//             "name": "ALSA AI Login & Signup",
//             "description": "Create your account or login to ALSA AI for PC automation and AI assistance",
//             "url": "https://alsa-ai.lovable.app/auth"
//           })}
//         </script>
//       </Helmet>

//       {/* Animated background effects */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
//         <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-3xl" />
//       </div>

//       <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
//         {/* Hero Section */}
//         <div className="space-y-8 text-center lg:text-left">
//           <div className="space-y-4">
//             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 backdrop-blur-sm">
//               <Sparkles className="w-4 h-4 text-blue-400" />
//               <span className="text-sm text-white/80">AI-Powered Assistant</span>
//             </div>
//             <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
              
//                to<br />ALSA AI
//             </h1>
//             <p className="text-xl text-white/60 max-w-md">
//               Your intelligent assistant powered by advanced AI. Control your PC, automate tasks, and create with voice.
//             </p>
//           </div>

//           <div className="space-y-4">
//             <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
//                 <Shield className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-white mb-1">Save Your Conversations</h3>
//                 <p className="text-sm text-white/50">Access your chat history anytime, anywhere with cloud sync</p>
//               </div>
//             </div>

//             <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
//                 <Zap className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-white mb-1">Personalized Experience</h3>
//                 <p className="text-sm text-white/50">Customize AI responses, voice settings, and themes</p>
//               </div>
//             </div>

//             <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
//                 <User className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-white mb-1">Organize with Tags</h3>
//                 <p className="text-sm text-white/50">Categorize conversations and star important messages</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Auth Card */}
//         <Card className="w-full border-white/10 backdrop-blur-xl bg-slate-900/80 shadow-2xl">
//           <CardHeader className="space-y-1 text-center pb-2">
//             <CardTitle className="text-3xl font-bold text-white">
//               Get Started
//             </CardTitle>
//             <CardDescription className="text-white/50">Sign in to unlock all features</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <Tabs defaultValue="signin" className="w-full">
//               <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
//                 <TabsTrigger value="signin" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
//                   Sign In
//                 </TabsTrigger>
//                 <div className="flex items-center justify-center">
//                 <button
//                   type="button"
//                   onClick={() => { setWizardInitialStep(1); setWizardUserId(null); setWizardInitialName(''); setShowWizard(true); }}
//                   className="w-full text-white/60 hover:bg-white/5 py-2 rounded"
//                 >
//                   Sign Up
//                 </button>
//               </div>
//               </TabsList>

//               <TabsContent value="signin" className="mt-6">
//                 <form onSubmit={handleSignIn} className="space-y-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="signin-email" className="text-white/80">Email</Label>
//                     <Input
//                       id="signin-email"
//                       type="email"
//                       placeholder="you@example.com"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       required
//                       disabled={loading}
//                       className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="signin-password" className="text-white/80">Password</Label>
//                     <div className="relative">
//                       <Input
//                         id="signin-password"
//                         type={showPassword ? "text" : "password"}
//                         placeholder="••••••••"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         required
//                         disabled={loading}
//                         className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10 focus:border-blue-500"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
//                       >
//                         {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                       </button>
//                     </div>
//                   </div>
//                   <Button
//                     type="submit"
//                     className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold"
//                     disabled={loading}
//                   >
//                     {loading ? 'Signing in...' : 'Sign In'}
//                   </Button>
//                 </form>
//               </TabsContent>


//             </Tabs>

//             <div className="mt-6 text-center space-y-3">
//               <div className="relative">
//               </div>
//               <div className="mt-6 text-center space-y-3">
//                 <div className="relative">
//                   <div className="absolute inset-0 flex items-center">
//                     <span className="w-full border-t border-white/10" />
//                   </div>
//                   <div className="relative flex justify-center text-xs uppercase">
//                     <span className="bg-slate-900 px-2 text-white/40">Or continue with</span>
//                   </div>
//                 </div>

//                 {/* GOOGLE BUTTON ADDED HERE */}
//                 <Button
//                   variant="outline"
//                   type="button"
//                   onClick={() => { setWizardInitialStep(2); setWizardUserId(null); setWizardInitialName(''); setWizardOAuthProvider('google'); setShowWizard(true); }}
//                   disabled={loading}
//                   /* Yahan text-slate-900 add kiya hai taaki text hamesha dikhe */
//                   className="w-full bg-white border-white/20 text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-3 group transition-all py-6 shadow-lg"
//                 >
//                   <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
//                     <path
//                       fill="#4285F4"
//                       d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                     />
//                     <path
//                       fill="#34A853"
//                       d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                     />
//                     <path
//                       fill="#FBBC05"
//                       d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                     />
//                     <path
//                       fill="#EA4335"
//                       d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                     />
//                   </svg>
//                   <span className="font-bold text-base">Sign in with Google</span>
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//       <SignupWizard
//         open={showWizard}
//         setOpen={setShowWizard}
//         userId={wizardUserId}
//         initialName={wizardInitialName}
//         initialStep={wizardInitialStep}
//         initialOAuthProvider={wizardOAuthProvider}
//         onFinish={() => navigate('/Chat')}
//       />
//     </div>
//   );
// };

// export default Auth;

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet';
import { Eye, EyeOff, Sparkles, Shield, Zap, User } from 'lucide-react';
import SignupWizard from '@/components/SignupWizard';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Wizard states
  const [showWizard, setShowWizard] = useState(false);
  const [wizardUserId, setWizardUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check current session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        handlePostLoginLogic(session.user);
      }
    };

    // 2. Listen for auth changes (specifically for OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handlePostLoginLogic(session.user);
      }
    });

    checkUser();
    return () => subscription.unsubscribe();
  }, []);

  const handlePostLoginLogic = async (user: any) => {
    try {
      // Check if profile exists
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Agar profile missing hai ya incomplete hai, wizard dikhao
      if (!profile || !profile.bio || !profile.purpose) {
        setWizardUserId(user.id);
        setShowWizard(true);
      } else {
        navigate('/Chat');
      }
    } catch (err) {
      console.error("Profile check error:", err);
      navigate('/Chat');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth`, // Redirect back here to trigger useEffect
      },
    });

    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <Helmet>
        <title>Login & Sign Up - ALSA AI</title>
      </Helmet>

      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-0 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Info (Hidden on very small screens or re-stacked) */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white leading-tight">ALSA AI</h1>
            <p className="text-xl text-white/60">Your intelligent PC automation partner.</p>
          </div>
          <div className="space-y-4">
            <Feature icon={<Shield />} title="Secure Sync" desc="Your data is encrypted and synced." />
            <Feature icon={<Zap />} title="Fast Automation" desc="Control your system with voice." />
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <Card className="w-full border-white/10 backdrop-blur-xl bg-slate-900/80 shadow-2xl overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white">Welcome</CardTitle>
            <CardDescription className="text-white/50">Start your AI journey today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup" onClick={() => setShowWizard(true)}>Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Email</Label>
                    <Input 
                      type="email" 
                      placeholder="name@company.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Password</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 text-white" 
                        required 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-white/40">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-500" disabled={loading}>
                    {loading ? "Processing..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-white/40">Or</span></div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full bg-white text-black hover:bg-slate-200 flex items-center justify-center gap-2 font-bold h-12"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>

      <SignupWizard
        open={showWizard}
        setOpen={setShowWizard}
        userId={wizardUserId}
        onFinish={() => navigate('/Chat')}
      />
    </div>
  );
};

// Sub-component for clean UI
const Feature = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-white/50">{desc}</p>
    </div>
  </div>
);

export default Auth;
