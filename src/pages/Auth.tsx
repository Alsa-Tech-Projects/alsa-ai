import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet';
import { Eye, EyeOff, Sparkles, Shield, Zap, User } from 'lucide-react';
import SignupWizard from '@/components/SignupWizard';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  
  // Sign In fields
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Wizard state for collecting 4 mandatory profile fields
  const [showWizard, setShowWizard] = useState(false);
  const [wizardUserId, setWizardUserId] = useState<string | null>(null);
  const [wizardInitialName, setWizardInitialName] = useState('');
  const [wizardInitialAvatarUrl, setWizardInitialAvatarUrl] = useState<string | null>(null);
  const [wizardInitialStep, setWizardInitialStep] = useState<number>(1);
  const [wizardOAuthProvider, setWizardOAuthProvider] = useState<string | null>(null);
  
  // Sign up form fields
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupShowPassword, setSignupShowPassword] = useState(false);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');

  useEffect(() => {
    const checkProfileAndMaybeOpen = async (user: any, initialStep = 2) => {
      if (!user) return;

      // If the user came from our pre-oauth flow, apply stored profile data first
      try {
        const params = new URLSearchParams(location.search);
        const preId = params.get('pre_id');

        if (preId) {
          try {
            const { data: pre, error: preErr } = await (supabase as any)
              .from('pre_oauth_profiles')
              .select('*')
              .eq('id', preId)
              .maybeSingle();

            if (preErr) throw preErr;

            if (pre) {
              const p: any = pre;

              const payload: any = {
                user_id: user.id,
                display_name: p.display_name || user.user_metadata?.full_name || user.email,
                bio: p.bio || null,
                found_from: p.found_from || null,
                user_category: p.user_category || null,
              };

              if (p.avatar_url) {
                payload.avatar_url = p.avatar_url;
              }

              const { error } = await supabase.from('profiles').upsert(payload);
              if (error) throw error;

              // Clean up pre record
              try {
                await (supabase as any).from('pre_oauth_profiles').delete().eq('id', preId);
              } catch (cleanupErr) {
                console.warn('Could not clean up pre_oauth_profiles record', cleanupErr);
              }

              navigate('/Chat');
              return;
            } else {
              toast({ title: 'Pre-signup data not found', description: 'Please complete your profile', variant: 'destructive' });
            }
          } catch (err) {
            console.error('Applying pre-oauth profile from DB failed', err);
          }
        }
      } catch (e) {
        console.error('Applying pre-oauth profile failed', e);
      }

      // Check for any pre-email profile saved during sign up
      try {
        if (user.email) {
          try {
            const { data: preEmail, error: preEmailErr } = await (supabase as any)
              .from('pre_email_profiles')
              .select('*')
              .eq('email', user.email)
              .maybeSingle();

            if (preEmailErr) throw preEmailErr;

            if (preEmail) {
              const p: any = preEmail;
              const payload: any = {
                user_id: user.id,
                display_name: p.display_name || user.user_metadata?.full_name || user.email,
                bio: p.bio || null,
                found_from: p.found_from || null,
                user_category: p.user_category || null,
              };

              if (p.avatar_url) {
                payload.avatar_url = p.avatar_url;
              }

              const { error } = await supabase.from('profiles').upsert(payload);
              if (error) throw error;

              // Clean up pre-email record
              try {
                await (supabase as any).from('pre_email_profiles').delete().eq('id', p.id);
              } catch (cleanupErr) {
                console.warn('Could not clean up pre_email_profiles record', cleanupErr);
              }

              navigate('/Chat');
              return;
            }
          } catch (err) {
            console.error('Applying pre-email profile from DB failed', err);
          }
        }
      } catch (seedErr) {
        console.warn('Applying pre-email profile failed', seedErr);
      }

      // Seed minimal profile from provider metadata before checking mandatory fields
      try {
        try {
          const seed: any = {};
          if (user.user_metadata?.full_name) seed.display_name = user.user_metadata.full_name;
          if (user.user_metadata?.avatar_url) seed.avatar_url = user.user_metadata.avatar_url;
          else if (user.user_metadata?.picture) seed.avatar_url = user.user_metadata.picture;
          if (Object.keys(seed).length) {
            seed.user_id = user.id;
            await supabase.from('profiles').upsert(seed);
          }
        } catch (seedErr) {
          console.warn('Seeding profile from user metadata failed', seedErr);
        }

        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
        const p: any = profile;
        
        // Check if all 4 mandatory fields are completed
        if (!p || !p.display_name || !p.bio || !p.found_from || !p.user_category) {
            // If this user has already completed the wizard previously, don't reopen it
            try {
              const completed = typeof window !== 'undefined' && localStorage.getItem(`wizard_completed_${user.id}`);
              if (completed) {
                navigate('/Chat');
                return;
              }
            } catch (e) {
              // ignore storage errors and continue
            }

            // If this was a manual sign-in, do NOT force the signup wizard — allow sign-ins
            // to proceed. The wizard is intended only for signup flows.
            try {
              const manual = typeof window !== 'undefined' && sessionStorage.getItem('manual_signin');
              if (manual) {
                try { sessionStorage.removeItem('manual_signin'); } catch (e) { /* ignore */ }
                navigate('/Chat');
                return;
              }
            } catch (e) {
              // ignore storage errors and continue to wizard logic
            }

          const suppress = typeof window !== 'undefined' && sessionStorage.getItem('suppress_wizard_open');
          if (suppress) {
            console.info('Signup wizard open suppressed due to recent save error.');
          } else {
            // Force wizard to open - these 4 fields are mandatory for signup flows
            setWizardUserId(user.id);
            setWizardInitialName(p?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || '');
            setWizardInitialAvatarUrl(p?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
            setWizardInitialStep(initialStep);
            setShowWizard(true);
          }
        } else {
          // All 4 mandatory fields completed - allow access to chat
          navigate('/Chat');
        }
      } catch (err) {
        console.error('Profile check failed', err);
        navigate('/Chat');
      }
    };

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkProfileAndMaybeOpen(session.user as any, 2);
      }
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        checkProfileAndMaybeOpen(session.user as any, 2);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.search]);

  // Clear wizard provider when modal closes
  useEffect(() => {
    if (!showWizard) setWizardOAuthProvider(null);
  }, [showWizard]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!gender) {
      toast({
        title: "Gender Required",
        description: "Please select your gender",
        variant: "destructive",
      });
      return;
    }

    if (!age || parseInt(age) < 13) {
      toast({
        title: "Valid Age Required",
        description: "Please enter a valid age (13+)",
        variant: "destructive",
      });
      return;
    }

    if (!signupEmail || !signupPassword) {
      toast({
        title: "Fill All Fields",
        description: "Please fill in email and password",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    // Store credentials in sessionStorage for wizard to use
    sessionStorage.setItem('signup_email', signupEmail);
    sessionStorage.setItem('signup_password', signupPassword);
    sessionStorage.setItem('signup_gender', gender);
    sessionStorage.setItem('signup_age', age);
    
    // Open wizard at step 2 with the signup data
    setWizardUserId(null); 
    setWizardInitialName(fullName);
    setWizardInitialAvatarUrl(null);
    setWizardInitialStep(2); // Start at Step 2: Bio
    setWizardOAuthProvider(null); // Mark as email signup
    setShowWizard(true);
    
    // Clear the form
    setFullName('');
    setSignupEmail('');
    setSignupPassword('');
    setGender('');
    setAge('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mark this as a manual sign-in so we don't force the signup wizard
    // (the wizard is only required for signup flows)
    try {
      if (typeof window !== 'undefined') sessionStorage.setItem('manual_signin', '1');
    } catch (e) {
      /* ignore */
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      // onAuthStateChange will handle navigation and wizard
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      // Open wizard at step 2 for Google signup
      setWizardUserId(null);
      setWizardInitialName('');
      setWizardInitialAvatarUrl(null);
      setWizardInitialStep(2); // Start at Step 2: Bio
      setWizardOAuthProvider('google'); // Mark as Google OAuth - will trigger popup on Finish Setup
      setShowWizard(true);
    } catch (error: any) {
      toast({
        title: "Google sign up failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <Helmet>
        <title>Login & Sign Up - ALSA AI | Create Your AI Assistant Account</title>
        <meta name="description" content="Sign up or login to ALSA AI - India's best AI assistant for PC automation, voice control, and coding. Create your free account and start automating with AI today!" />
        <meta name="keywords" content="ALSA AI login, AI assistant signup, create AI account, PC automation login, voice control AI, AI chatbot registration, free AI assistant, ALSA account, machine learning assistant, smart AI login, artificial intelligence signup, productivity AI account" />
        <meta property="og:title" content="Login to ALSA AI - Your AI Assistant Awaits" />
        <meta property="og:description" content="Create your free ALSA AI account and unlock PC automation, voice commands, and intelligent coding assistance." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.alsa-ai.in/auth" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "ALSA AI Login & Signup",
            "description": "Create your account or login to ALSA AI for PC automation and AI assistance",
            "url": "https://www.alsa-ai.in/auth"
          })}
        </script>
      </Helmet>

      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Hero Section */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white/80">AI-Powered Assistant</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight">
              Welcome to<br />ALSA AI
            </h1>
            <p className="text-xl text-white/60 max-w-md">
              Your intelligent assistant powered by advanced AI. Control your PC, automate tasks, and create with voice.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Save Your Conversations</h3>
                <p className="text-sm text-white/50">Access your chat history anytime, anywhere with cloud sync</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Personalized Experience</h3>
                <p className="text-sm text-white/50">Customize AI responses, voice settings, and themes</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Setup Your Profile</h3>
                <p className="text-sm text-white/50">Complete quick setup steps after signup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="w-full border-white/10 backdrop-blur-xl bg-slate-900/80 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-3xl font-bold text-white">
              Get Started
            </CardTitle>
            <CardDescription className="text-white/50">Sign in or create account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-white/80">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-white/80">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-white/40">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white border-white/20 text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-3 group transition-all py-6 shadow-lg"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="font-bold text-base">Sign in with Google</span>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white/80">Full Name *</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your Name Here"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-gender" className="text-white/80">Gender *</Label>
                      <Select value={gender} onValueChange={setGender} disabled={loading}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="male" className="text-white hover:bg-white/10">Male</SelectItem>
                          <SelectItem value="female" className="text-white hover:bg-white/10">Female</SelectItem>
                          <SelectItem value="other" className="text-white hover:bg-white/10">Other</SelectItem>
                          <SelectItem value="prefer-not" className="text-white hover:bg-white/10">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-age" className="text-white/80">Age *</Label>
                      <Input
                        id="signup-age"
                        type="number"
                        placeholder="18"
                        min="13"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                        disabled={loading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white/80">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white/80">Password *</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={signupShowPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setSignupShowPassword(!signupShowPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {signupShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/40">Minimum 6 characters</p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>

                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-white/40">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                    className="w-full bg-white border-white/20 text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-3 group transition-all py-6 shadow-lg"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="font-bold text-base">Sign up with Google</span>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* SignupWizard Modal with 4 Mandatory Steps */}
      <SignupWizard
        open={showWizard}
        setOpen={setShowWizard}
        userId={wizardUserId}
        initialName={wizardInitialName}
        initialAvatarUrl={wizardInitialAvatarUrl}
        initialStep={wizardInitialStep}
        initialOAuthProvider={wizardOAuthProvider}
        onFinish={() => navigate('/Chat')}
      />
    </div>
  );
};

export default Auth;
