import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Account created successfully. You can now sign in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <Helmet>
        <title>Login & Sign Up - ALSA AI | Create Your AI Assistant Account</title>
        <meta name="description" content="Sign up or login to ALSA AI - India's best AI assistant for PC automation, voice control, and coding. Create your free account and start automating with AI today!" />
        <meta name="keywords" content="ALSA AI login, AI assistant signup, create AI account, PC automation login, voice control AI, AI chatbot registration, free AI assistant, ALSA account, machine learning assistant, smart AI login, artificial intelligence signup, productivity AI account" />
        <meta property="og:title" content="Login to ALSA AI - Your AI Assistant Awaits" />
        <meta property="og:description" content="Create your free ALSA AI account and unlock PC automation, voice commands, and intelligent coding assistance." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://alsa-ai.lovable.app/auth" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "ALSA AI Login & Signup",
            "description": "Create your account or login to ALSA AI for PC automation and AI assistance",
            "url": "https://alsa-ai.lovable.app/auth"
          })}
        </script>
      </Helmet>
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-radial opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: '1s' }} />
      
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Hero Section */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent animate-pulse-glow">
              Welcome to ALSA AI
            </h1>
            <p className="text-xl text-muted-foreground">
              Your intelligent assistant powered by advanced AI
            </p>
          </div>
          
          <div className="space-y-4 text-foreground/80">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Save Your Conversations</h3>
                <p className="text-sm">Access your chat history anytime, anywhere</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-accent text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Personalized Experience</h3>
                <p className="text-sm">Customize AI responses, voice settings, and themes</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-glow/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary-glow text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Organize with Tags</h3>
                <p className="text-sm">Categorize conversations and star important messages</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Powered by cutting-edge AI technology
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="w-full border-primary/20 backdrop-blur-sm bg-card/90 glow-effect">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Get Started
            </CardTitle>
            <CardDescription>Sign in to unlock all features</CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full border-primary/30"
            >
              Continue as guest
            </Button>
            <p className="text-xs text-muted-foreground">
              Guest mode: Limited features, conversations won't be saved
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;
