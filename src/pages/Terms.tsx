import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertTriangle, CreditCard, Ban, Scale, Globe } from 'lucide-react';
import alsaLogo from '@/assets/alsa-logo.png';

const Terms = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: FileText,
      title: 'Acceptance of Terms',
      content: `By accessing or using ALSA AI services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.

These terms apply to all users, visitors, and others who access or use the Service.`
    },
    {
      icon: Globe,
      title: 'Service Description',
      content: `ALSA AI provides:

- AI-powered chat and assistance
- PC control and automation via PC Bridge
- Project and document generation
- Android device control via ADB
- Voice command processing

**Service Availability:**
- We strive for 99.9% uptime but do not guarantee uninterrupted service
- Scheduled maintenance will be communicated in advance
- Features may be modified or discontinued with notice`
    },
    {
      icon: CreditCard,
      title: 'Payments & Subscriptions',
      content: `**Subscription Plans:**
- Free Trial: 3 days of limited features
- Alsa Pro: ₹699/month - Full-stack coding and OS control
- Alsa Elite: ₹1,200/month - All features including ADB control

**Payment Terms:**
- Payments are processed securely via Razorpay
- Subscriptions auto-renew unless cancelled
- Refunds are provided within 7 days for valid reasons
- Prices may change with 30 days notice

**Trial Period:**
- Free trial is limited to new users
- No credit card required for trial
- Features are limited during trial period`
    },
    {
      icon: Ban,
      title: 'Prohibited Uses',
      content: `You agree NOT to use ALSA AI to:

❌ Violate any applicable laws or regulations
❌ Execute malicious code or malware
❌ Attempt unauthorized access to systems
❌ Harass, abuse, or harm others
❌ Distribute spam or harmful content
❌ Reverse engineer our services
❌ Use for illegal activities
❌ Impersonate others or ALSA AI staff

**PC Bridge Restrictions:**
- Only execute commands on your own systems
- Do not use for unauthorized system access
- You are responsible for all actions performed`
    },
    {
      icon: AlertTriangle,
      title: 'Disclaimers & Limitations',
      content: `**Service Provided "As Is":**
ALSA AI is provided without warranties of any kind, express or implied.

**Limitation of Liability:**
- We are not liable for any indirect, incidental, or consequential damages
- Our total liability is limited to the amount paid for the service
- We are not responsible for data loss from PC Bridge commands

**AI Limitations:**
- AI responses may contain errors
- Always verify critical information
- AI does not replace professional advice

**PC Bridge:**
- Execute commands at your own risk
- Back up important data regularly
- We are not responsible for system damage`
    },
    {
      icon: Scale,
      title: 'Governing Law & Disputes',
      content: `**Governing Law:**
These Terms shall be governed by the laws of India.

**Dispute Resolution:**
- Disputes will be resolved through arbitration
- Arbitration will be conducted in Lucknow, India
- Each party bears their own costs

**Termination:**
- We may terminate access for Terms violations
- You may cancel your subscription anytime
- Upon termination, your data will be deleted within 30 days

**Changes to Terms:**
- We may modify these Terms at any time
- Continued use constitutes acceptance of changes
- Material changes will be notified via email`
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/70">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <img src={alsaLogo} alt="ALSA AI" className="w-8 h-8 rounded-full" />
            <span className="font-bold">ALSA AI</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Scale className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-white/60">
            Last Updated: January 2025
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <p className="text-white/80 leading-relaxed">
              Welcome to ALSA AI. These Terms of Service govern your use of our AI assistant platform 
              and related services. By using ALSA AI, you agree to these terms in their entirety.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                </div>
                <div className="text-white/70 whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-3">Questions?</h3>
            <p className="text-white/70 mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="space-y-2 text-white/80">
              <li>📧 Email: alsa.ai.assistant@gmail.com</li>
              <li>📞 Phone: +91 6396684144</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
