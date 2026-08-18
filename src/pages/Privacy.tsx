import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Bell, 
  UserCheck, 
  History, 
  CreditCard 
} from 'lucide-react';
import { Helmet } from 'react-helmet';

const Privacy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Database,
      title: 'Data Collection & Storage',
      content: [
        { 
          heading: 'Information We Collect', 
          items: [
            'Account information (email, name, profile details)',
            'Usage data and interaction logs',
            'Device information and IP addresses',
            'Payment information (processed securely via Razorpay)'
          ]
        },
        { 
          heading: 'Storage Mechanism', 
          items: [
            'App Passwords and Emails are saved securely in your Local Storage (on both the App and Website) and never leave your device.',
            'Data such as Contacts, Phone Numbers, Telegram Usernames, and Emails are stored on our secure Server Database in a fully encrypted format.'
          ]
        },
        { 
          heading: 'ALSA AI PC Bridge', 
          items: [
            'The ALSA AI Bridge App is our proprietary application that connects our website (www.alsa-ai.in) directly to your local system.',
            'When using PC Bridge, commands are processed locally on your machine.',
            'We do not store or transmit your personal file contents to our servers.',
            'System information is only used temporarily for feature functionality.'
          ]
        }
      ]
    },
    {
      icon: History,
      title: 'Data Retention & Chat History',
      content: [
        { 
          heading: '30-Day Auto-Clear Policy', 
          items: [
            'To protect your privacy, all chat histories are automatically cleared every 30 days.',
            'If you have an important chat, you can back it up by exporting it as a .json file directly from the History page.',
            'Alternatively, you can send an email to support@alsa-ai.in referencing the chat, and request that we do not delete it.'
          ],
          action: {
            label: "Go To History Page",
            path: "/history"
          }
        }
      ]
    },
    {
      icon: CreditCard,
      title: 'Subscription & Cancellation',
      content: [
        { 
          heading: '7-Day Cancellation Policy', 
          items: [
            'We want you to be completely satisfied with ALSA AI.',
            'After purchasing a plan, if you do not like the service, you can cancel it at any time within the first 7 days.',
            'Cancellations within this 7-day window are eligible for our money-back guarantee.'
          ]
        }
      ]
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: [
        { 
          heading: 'Security Measures', 
          items: [
            'All data transmission is encrypted using TLS/SSL',
            'Passwords are hashed using secure algorithms',
            'Regular security audits and vulnerability assessments',
            'Access controls and authentication for all services'
          ]
        }
      ]
    },
    {
      icon: Eye,
      title: 'How We Use Your Data',
      content: [
        { 
          heading: 'We Use Your Information To', 
          items: [
            'Provide, maintain, and improve our AI assistant services',
            'Process transactions and send related information',
            'Send technical notices and support messages',
            'Detect and prevent fraudulent or unauthorized activity'
          ]
        },
        { 
          heading: 'We Do NOT', 
          items: [
            'Sell your personal data to third parties',
            'Share your data with advertisers',
            'Use your data for purposes you haven\'t consented to'
          ]
        }
      ]
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      content: [
        { 
          heading: 'You Have The Following Rights', 
          items: [
            'Access: Request a copy of your personal data',
            'Correction: Request correction of inaccurate data',
            'Deletion: Request deletion of your data (subject to legal requirements)',
            'Portability: Request transfer of your data to another service'
          ]
        }
      ]
    },
    {
      icon: Bell,
      title: 'Updates to This Policy',
      content: [
        { 
          heading: 'Policy Changes & Version History', 
          items: [
            'We will notify you of any changes by posting the new Privacy Policy on this page.',
            'We encourage you to review this Privacy Policy periodically.',
            'You can check all the latest updates, features, and changes made to ALSA AI on our Update History page.'
          ],
          action: {
            label: "Click Here For Update Information",
            path: "/update-history"
          }
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Helmet>
        <title>Privacy Policy - ALSA AI | Data Protection & Security</title>
        <meta name="description" content="ALSA AI Privacy Policy. Learn how we collect, use, and protect your data. We prioritize your privacy with encrypted data transmission, secure authentication, and local PC Bridge execution." />
        <meta name="keywords" content="ALSA AI privacy, data protection, AI assistant privacy policy, PC automation security, user data rights, GDPR compliance, data encryption" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Privacy Policy - ALSA AI" />
        <meta property="og:description" content="Learn how ALSA AI protects your privacy and handles your data securely." />
        <link rel="canonical" href="https://www.alsa-ai.in/privacy" />
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
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-white/60">
            Last Updated: August 18, 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <p className="text-white/80 leading-relaxed">
              At ALSA AI, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our AI assistant service. 
              Please read this privacy policy carefully. By using ALSA AI, you consent to the data 
              practices described in this policy.
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
                      <ul className="space-y-2 mb-4">
                        {block.items.map((item, k) => (
                          <li key={k} className="flex items-start gap-3 text-white/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {/* Conditional rendering for action buttons */}
                      {block.action && (
                        <Button 
                          onClick={() => navigate(block.action.path)} 
                          variant="secondary" 
                          className="mt-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-white border border-blue-500/30"
                        >
                          {block.action.label}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-3">Contact Us</h3>
            <p className="text-white/70 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
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
              <li className="flex items-center gap-2">
                <span>🌐</span>
                <span>Website: Contact form available on our Contact page</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
