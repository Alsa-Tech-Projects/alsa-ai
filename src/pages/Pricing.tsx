import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Zap, Sparkles, Crown, ArrowLeft, Loader2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import alsaLogo from '@/assets/alsa-logo.png';
import { Helmet } from 'react-helmet';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  features: { name: string; included: boolean }[];
  tier: string;
  popular?: boolean;
  icon: React.ReactNode;
  gradient: string;
}

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const plans: PricingPlan[] = [
    {
      id: 'trial',
      name: '3-Day Trial',
      price: 1,
      period: '3 days',
      description: 'Try PC Bridge with limited features',
      tier: 'trial',
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-amber-500 to-orange-500',
      features: [
        { name: 'Take Screenshots', included: true },
        { name: 'Screen Recording', included: true },
        { name: 'HTML/CSS/JS Coding Only', included: true },
        { name: 'Basic AI Chat', included: true },
        { name: 'Massage Automation', included: false },
        { name: 'Full-Stack Coding', included: false },
        { name: 'OS Shell Commands', included: false },
        { name: 'ADB Android Control', included: false },
        { name: 'Excel/Database Automation', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Alsa Pro',
      price: 799,
      originalPrice: 1599,
      period: 'month',
      description: 'For developers who want full control',
      tier: 'pro',
      popular: true,
      icon: <Sparkles className="w-6 h-6" />,
      gradient: 'from-blue-500 to-cyan-500',
      features: [
        { name: 'Full-Stack Coding (All Languages)', included: true },
        { name: 'OS Shell Commands', included: true },
        { name: 'Massage Automation', included: false },
        { name: 'Project Generation', included: true },
        { name: 'Document Creation (PPT/Excel)', included: true },
        { name: 'Priority Support', included: true },
        { name: 'Unlimited AI Messages', included: true },
        { name: 'ADB Android Control', included: false },
        { name: 'Database Management', included: false },
      ],
    },
    {
      id: 'elite',
      name: 'Alsa Elite',
      price: 1299,
      originalPrice: 2599,
      period: 'month',
      description: 'Maximum power for power users',
      tier: 'elite',
      icon: <Crown className="w-6 h-6" />,
      gradient: 'from-purple-500 to-pink-500',
      features: [
        { name: 'Everything in Pro', included: true },
        { name: 'ADB Android Control', included: true },
        { name: 'Advanced Excel Engine', included: true },
        { name: 'Massage Automation', included: true },
        { name: 'Production Database Management', included: true },
        { name: 'Priority Secure Tunnel', included: true },
        { name: 'Early Access to Features', included: true },
        { name: '24/7 Premium Support', included: true },
        { name: 'Custom Integrations', included: true },
      ],
    },
  ];

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    setValidatingPromo(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: 'Invalid Promo Code',
          description: 'This promo code is not valid or has expired.',
          variant: 'destructive',
        });
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo({ code: data.code, discount: data.discount_percent });
      toast({
        title: 'Promo Code Applied! 🎉',
        description: `You get ${data.discount_percent}% off!`,
      });
    } catch (err) {
      console.error('Promo validation error:', err);
    } finally {
      setValidatingPromo(false);
    }
  };

  const getDiscountedPrice = (price: number) => {
    if (!appliedPromo) return price;
    return Math.round(price * (1 - appliedPromo.discount / 100) * 100) / 100;
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(plan.id);

    try {
      const finalPrice = getDiscountedPrice(plan.price);

      // 1. Get current session token to avoid 401 Unauthorized
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Your session has expired. Please login again.");
      }

      // 2. Call Razorpay edge function to create order
      // We pass the token in headers to ensure the function recognizes the user
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: Math.round(finalPrice * 100), // Razorpay expects paise
          tier: plan.tier,
          promoCode: appliedPromo?.code,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (error) {
        // Agar edge function ne specifically 401 return kiya hai
        if (error.status === 401) {
          throw new Error("Authentication failed. Please try logging out and in again.");
        }
        throw error;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'ALSA AI',
        description: `${plan.name} Subscription`,
        order_id: data.order_id,
        handler: async (response: any) => {
          setLoading(plan.id); // Verification ke time loading dikhao

          // 4. Verify payment
          const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tier: plan.tier,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });

          if (verifyError) {
            toast({
              title: 'Payment verification failed',
              description: 'Please contact support if amount was deducted.',
              variant: 'destructive'
            });
            setLoading(null);
            return;
          }

          toast({ title: 'Payment Successful! 🎉', description: 'Redirecting to setup...' });
          navigate('/bridge-setup', { state: { tier: plan.tier } });
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#6366f1',
        },
        // User agar window close karde
        modal: {
          ondismiss: function () {
            setLoading(null);
          }
        }
      };

      // Load Razorpay script if not loaded
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: 'Payment Failed',
        description: err.message || 'Something went wrong while connecting to the server',
        variant: 'destructive',
      });
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
      <Helmet>
        <title>ALSA AI Pricing - Affordable AI Assistant Plans | Pro & Elite Features</title>
        <meta name="description" content="Compare ALSA AI pricing plans. Start with ₹1 trial, upgrade to Pro for full-stack coding and OS commands, or Elite for ADB Android control and database management. Best AI assistant pricing in India." />
        <meta name="keywords" content="ALSA AI pricing, AI assistant cost, PC automation pricing, voice control plans, AI subscription India, cheap AI assistant, affordable AI, Pro plan, Elite plan, trial subscription, AI chatbot pricing, machine learning cost, productivity AI pricing, best AI price" />
        <meta property="og:title" content="ALSA AI Pricing - Affordable AI Assistant Plans" />
        <meta property="og:description" content="Start your AI journey with just ₹1. Full-stack coding, PC automation, and Android control at affordable prices." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.alsa-ai.in/pricing" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "ALSA AI Subscription",
            "description": "AI-powered PC automation and coding assistant",
            "offers": [
              {
                "@type": "Offer",
                "name": "3-Day Trial",
                "price": "1",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock"
              },
              {
                "@type": "Offer",
                "name": "Pro Plan",
                "price": "799",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock"
              },
              {
                "@type": "Offer",
                "name": "Elite Plan",
                "price": "1299",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock"
              }
            ]
          })}
        </script>
      </Helmet>
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/alsa-logo.png" alt="ALSA AI" className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-bold text-white">Pricing</span>
          </div>
          {!user && (
            <Button onClick={() => navigate('/auth')} className="bg-white text-black hover:bg-white/90">
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 mb-4">
            🎉 Limited Time Offer - Save ₹800-₹1300 Today!
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Power Level
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Unlock the full potential of AI-powered PC automation. From basic trials to elite features.
          </p>
        </div>

        {/* Promo Code */}
        <div className="max-w-md mx-auto mb-12">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            <Button
              onClick={validatePromoCode}
              disabled={validatingPromo || !promoCode.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
            >
              {validatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
          {appliedPromo && (
            <p className="text-sm text-green-400 mt-2 text-center">
              ✓ Code "{appliedPromo.code}" applied - {appliedPromo.discount}% off!
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative bg-[#1a1a1a] border-white/10 overflow-hidden ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center text-white mb-4`}>
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                <CardDescription className="text-white/60">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  {appliedPromo && plan.id !== 'trial' && (
                    <span className="text-2xl text-white/40 line-through mr-2">
                      ₹{plan.price}
                    </span>
                  )}
                  {plan.originalPrice && !appliedPromo && (
                    <span className="text-lg text-white/40 line-through mr-2">
                      ₹{plan.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-white">
                    ₹{plan.id === 'trial' ? plan.price : getDiscountedPrice(plan.price)}
                  </span>
                  <span className="text-white/60 ml-2">/{plan.period}</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-white/20" />
                      )}
                      <span className={feature.included ? 'text-white' : 'text-white/40'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id}
                  className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white font-semibold py-6`}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `Get ${plan.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Free Tier Info */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">Free Tier Limitations</h3>
          <div className="inline-flex flex-wrap gap-4 justify-center text-sm text-white/60">
            <span className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" /> 50 messages/day
            </span>
            <span className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" /> No Voice Commands
            </span>
            <span className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" /> No Video Recording
            </span>
            <span className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" /> No PC Bridge Access
            </span>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-white text-center mb-10">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto text-white">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6">Feature</th>
                  <th className="text-center py-4 px-6">Free</th>
                  <th className="text-center py-4 px-6">Trial</th>
                  <th className="text-center py-4 px-6">Pro</th>
                  <th className="text-center py-4 px-6">Elite</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'AI Chat Messages', free: '50/day', trial: 'Unlimited', pro: 'Unlimited', elite: 'Unlimited' },
                  { name: 'Voice Commands', free: false, trial: true, pro: true, elite: true },
                  { name: 'Screenshots', free: false, trial: true, pro: true, elite: true },
                  { name: 'Screen Recording', free: false, trial: true, pro: true, elite: true },
                  { name: 'HTML/CSS/JS Coding', free: false, trial: true, pro: true, elite: true },
                  { name: 'Full-Stack Coding', free: false, trial: false, pro: true, elite: true },
                  { name: 'OS Shell Commands', free: false, trial: false, pro: true, elite: true },
                  { name: 'Project Generation', free: false, trial: false, pro: true, elite: true },
                  { name: 'Document Creation', free: false, trial: false, pro: true, elite: true },
                  { name: 'ADB Android Control', free: false, trial: false, pro: false, elite: true },
                  { name: 'Database Management', free: false, trial: false, pro: false, elite: true },
                  { name: 'Priority Support', free: false, trial: false, pro: true, elite: true },
                  { name: '24/7 Premium Support', free: false, trial: false, pro: false, elite: true },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-6 text-white/80">{row.name}</td>
                    <td className="text-center py-4 px-6">
                      {typeof row.free === 'boolean' ? (
                        row.free ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-white/20 mx-auto" />
                      ) : (
                        <span className="text-white/60">{row.free}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-6">
                      {typeof row.trial === 'boolean' ? (
                        row.trial ? <Check className="w-5 h-5 text-amber-500 mx-auto" /> : <X className="w-5 h-5 text-white/20 mx-auto" />
                      ) : (
                        <span className="text-amber-400">{row.trial}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-6">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? <Check className="w-5 h-5 text-blue-500 mx-auto" /> : <X className="w-5 h-5 text-white/20 mx-auto" />
                      ) : (
                        <span className="text-blue-400">{row.pro}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-6">
                      {typeof row.elite === 'boolean' ? (
                        row.elite ? <Check className="w-5 h-5 text-purple-500 mx-auto" /> : <X className="w-5 h-5 text-white/20 mx-auto" />
                      ) : (
                        <span className="text-purple-400">{row.elite}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing
