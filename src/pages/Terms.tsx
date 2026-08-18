import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertTriangle, CreditCard, Ban, Scale, Globe, Database } from 'lucide-react';
import { Helmet } from 'react-helmet';

const Terms = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: FileText,
      title: 'Acceptance of Terms',
      content: [
        { heading: 'Agreement', items: [
          'By accessing or using ALSA AI services, you agree to be bound by these Terms of Service and all applicable laws and regulations',
          'If you do not agree with any of these terms, you are prohibited from using or accessing this service',
          'These terms apply to all users, visitors, and others who access or use the Service'
        ]}
      ]
    },
    {
      icon: Database,
      title: 'Data Collection & Usage Consent',
      content: [
        { heading: 'Data We Access and Store', items: [
          'By using ALSA AI, you explicitly consent to the collection and storage of specific data required to provide our services.',
          'Local Storage Data: Sensitive credentials like your App Passwords and Emails are saved securely in your device\'s local storage (for both the App and Website) and are never transmitted to our servers.',
          'Encrypted Cloud Data: Information such as Contacts, Phone Numbers, Telegram Usernames, and Emails are stored in our secure database in a fully encrypted format.',
          'PC Bridge Data: Commands are executed locally on your machine. We do not store, access, or transmit your personal file contents or sensitive system data to our servers.'
        ]},
        { heading: 'Data Retention & Deletion', items: [
          'To ensure your privacy, all chat histories on ALSA AI are automatically cleared every 30 days.',
          'If you wish to keep important chats, it is your responsibility to export them as a .json file or contact our support team to request an exemption before the 30-day period.',
          'Upon termination of your account, any remaining personal data associated with you will be permanently deleted.'
        ]}
      ]
    },
    {
      icon: Globe,
      title: 'Service Description',
      content: [
        { heading: 'ALSA AI Provides', items: [
          'AI-powered chat and assistance',
          'PC control and automation via PC Bridge',
          'Project and document generation',
          'Android device control via ADB',
          'Voice command processing'
        ]},
        { heading: 'Service Availability', items: [
          'We strive for 99.9% uptime but do not guarantee uninterrupted service',
          'Scheduled maintenance will be communicated in advance',
          'Features may be modified or discontinued with notice'
        ]}
      ]
    },
    {
      icon: CreditCard,
      title: 'Payments & Subscriptions',
      content: [
        { heading: 'Subscription Plans', items: [
          'Free Trial: 3 days of limited features',
          'Alsa Pro: ₹299/month - Full-stack coding and OS control',
          'Alsa Elite: ₹499/month - All features including ADB & Phone Bridge control'
        ]},
        { heading: 'Payment Terms', items: [
          'Payments are processed securely via Razorpay',
          'Subscriptions auto-renew unless cancelled',
          '7-Day Cancellation: If you are unsatisfied, you can cancel within the first 7 days of purchasing a plan.',
          'Prices may change with 30 days notice'
        ]},
        { heading: 'Trial Period', items: [
          'Free trial is limited to new users',
          'No credit card required for trial',
          'Features are limited during trial period'
        ]}
      ]
    },
    {
      icon: Ban,
      title: 'Prohibited Uses',
      content: [
        { heading: 'You Agree NOT To Use ALSA AI To', items: [
          'Violate any applicable laws or regulations',
          'Execute malicious code or malware',
          'Attempt unauthorized access to systems',
          'Harass, abuse, or harm others',
          'Distribute spam or harmful content',
          'Reverse engineer our services',
          'Use for illegal activities',
          'Impersonate others or ALSA AI staff'
        ]},
        { heading: 'PC Bridge Restrictions', items: [
          'Only execute commands on your own systems',
          'Do not use for unauthorized system access',
          'You are entirely responsible for all actions performed on your system via PC Bridge'
        ]}
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Disclaimers & Limitations',
      content: [
        { heading: 'Service Provided "As Is"', items: [
          'ALSA AI is provided without warranties of any kind, express or implied'
        ]},
        { heading: 'Limitation of Liability', items: [
          'We are not liable for any indirect, incidental, or consequential damages',
          'Our total liability is limited to the amount paid for the service',
          'We are strictly not responsible for any data loss, system errors, or damages resulting from PC Bridge commands'
        ]},
        { heading: 'AI Limitations', items: [
          'AI responses may contain errors or inaccuracies',
          'Always verify critical code, commands, or information',
          'AI does not replace professional advice'
        ]},
        { heading: 'PC Bridge Risks', items: [
          'Execute system commands at your own risk',
          'Back up important data regularly before executing complex automation tasks',
          'We are not responsible for OS or system damage'
        ]}
      ]
    },
    {
      icon: Scale,
      title: 'Governing Law & Disputes',
      content: [
        { heading: 'Governing Law', items: [
          'These Terms shall be governed by the laws of India'
        ]},
        { heading: 'Dispute Resolution', items: [
          'Disputes will be resolved through arbitration',
          'Arbitration will be conducted in Lucknow, India',
          'Each party bears their own costs'
        ]},
        { heading: 'Termination', items: [
          'We may terminate access for Terms violations',
          'You may cancel your subscription anytime'
        ]},
        { heading: 'Changes to Terms', items: [
          'We may modify these Terms at any time',
          'Continued use constitutes acceptance of changes',
          'Material changes will be notified via email'
        ]}
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Helmet>
        <title>Terms of Service - ALSA AI | Usage Agreement & Policies</title>
        <meta name="description" content="ALSA AI Terms of Service. Understand your rights and responsibilities when using our AI assistant, PC automation, and voice control services. Fair usage policies and subscription terms." />
        <meta name="keywords" content="ALSA AI terms of service, usage agreement, AI assistant terms, PC automation policy, subscription terms, refund policy, user agreement" />
        <meta property="og:title" content="Terms of Service - ALSA AI" />
        <meta property="og:description" content="Review ALSA AI's terms of service, usage policies, and subscription agreements." />
        <link rel="canonical" href="https://www.alsa-ai.in/terms" />
      </Helmet>

      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/70">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <img src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/alsa-logo.png" alt="ALSA AI" className="w-8 h-8 rounded-full" />
            <span className="font-bold">ALSA AI</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Scale className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-white/60">
            Last Updated: August 18, 2026
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                </div>
                <div className="space-y-6">
                  {section.content.map((block, j) => (
                    <div key={j}>
                      <h3 className="text-lg font-semibold text-blue-300 mb-3">{block.heading}</h3>
                      <ul className="space-y-2">
                        {block.items.map((item, k) => (
                          <li key={k} className="flex items-start gap-3 text-white/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
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
              <li className="flex items-center gap-2">
                <span>📧</span>
                <span>Email: support@alsa-ai.in</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                <span>Phone: +91 6396684144</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
