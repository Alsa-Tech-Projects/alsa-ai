import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, ChevronDown, ChevronUp, Search, MessageCircle, Zap, Shield, CreditCard, Monitor, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import alsaLogo from '@/assets/alsa-logo.png';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // General
  {
    category: "General",
    question: "What is ALSA AI?",
    answer: "ALSA AI (AI Lifestyle & Smart Assistant) is a powerful AI assistant created by Mohd Eisa. It combines conversational AI with PC automation capabilities, allowing you to control your computer, create projects, documents, and much more using natural language commands."
  },
  {
    category: "General",
    question: "How is ALSA AI different from ChatGPT or other AI assistants?",
    answer: "Unlike traditional chatbots, ALSA AI can actually control your PC! It can open applications, create files, take screenshots, record your screen, create complete coding projects, PowerPoint presentations, Excel spreadsheets, and even control your Android phone via ADB. It's not just conversation - it's execution."
  },
  {
    category: "General",
    question: "Is ALSA AI free to use?",
    answer: "Yes! ALSA AI offers a free tier with 50 messages per day. For unlimited access and advanced features like PC control, voice commands, and full-stack coding, you can upgrade to Pro (₹449/month) or Elite (₹999/month) plans."
  },
  
  // PC Bridge
  {
    category: "PC Bridge",
    question: "What is the PC Bridge and how does it work?",
    answer: "The PC Bridge is a Python script that runs locally on your computer. It creates a secure connection between ALSA AI and your PC, enabling AI-powered automation like opening apps, creating files, taking screenshots, and executing commands. You download the bridge file based on your subscription tier."
  },
  {
    category: "PC Bridge",
    question: "Is the PC Bridge secure?",
    answer: "Yes! The PC Bridge uses encrypted communication and token-based authentication. It only accepts commands from your authenticated ALSA AI session. The bridge runs locally on your machine and never shares your data with third parties."
  },
  {
    category: "PC Bridge",
    question: "What are the system requirements for PC Bridge?",
    answer: "You need Python 3.8 or higher installed on your computer. The bridge works on Windows, macOS, and Linux. Required packages include Flask, PyAutoGUI, Pillow, and python-pptx, which can be installed via pip."
  },
  {
    category: "PC Bridge",
    question: "Why can't free tier users use PC Bridge?",
    answer: "PC control capabilities require significant resources and carry potential security implications. To ensure quality service and responsible usage, PC Bridge is exclusively available for Pro and Elite subscribers."
  },
  
  // Features
  {
    category: "Features",
    question: "What can ALSA AI do with voice commands?",
    answer: "With voice commands (Pro/Elite), you can speak naturally to control your PC: 'Open Chrome', 'Take a screenshot', 'Create a new folder on Desktop', 'Search YouTube for music videos', and much more. Press Alt+V to activate voice mode."
  },
  {
    category: "Features",
    question: "Can ALSA AI create complete coding projects?",
    answer: "Absolutely! ALSA AI can generate full-stack projects including React apps, Node.js backends, Python applications, and HTML/CSS websites. It creates proper folder structures, dependencies, configuration files, and production-ready code."
  },
  {
    category: "Features",
    question: "What document types can ALSA AI create?",
    answer: "ALSA AI can create PowerPoint presentations with themes and animations, Excel spreadsheets with formatting and formulas, Word documents, text files, and even SQLite databases with proper table structures."
  },
  {
    category: "Features",
    question: "Can I control my Android phone with ALSA AI?",
    answer: "Yes! Elite subscribers can use ADB (Android Debug Bridge) control. Connect your phone via USB or WiFi, enable USB debugging, and ALSA AI can send commands, install apps, capture screenshots, and automate your Android device."
  },
  
  // Subscription & Billing
  {
    category: "Billing",
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods through Razorpay including credit/debit cards, UPI, net banking, and wallets like Paytm, PhonePe, and Google Pay. All transactions are secure and encrypted."
  },
  {
    category: "Billing",
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period. There are no hidden fees or cancellation charges."
  },
  {
    category: "Billing",
    question: "Do you offer refunds?",
    answer: "We offer a 7-day money-back guarantee for first-time subscribers. If you're not satisfied within the first 7 days, contact our support team at support@alsa-ai.in for a full refund."
  },
  {
    category: "Billing",
    question: "What's the difference between Pro and Elite plans?",
    answer: "Pro (₹449/month) includes full-stack coding, OS commands, project generation, and document creation. Elite (₹999/month) adds ADB Android control, database management, Excel automation, and priority support. Elite also includes all future premium features."
  },
  
  // Troubleshooting
  {
    category: "Troubleshooting",
    question: "The PC Bridge won't connect. What should I do?",
    answer: "First, ensure Python 3.8+ is installed and added to PATH. Install required packages with 'pip install flask flask-cors pyautogui pillow python-pptx openpyxl'. Run the bridge script and check if it shows 'Running on http://127.0.0.1:5001'. Make sure your firewall allows the connection."
  },
  {
    category: "Troubleshooting",
    question: "Voice commands are not working. How do I fix this?",
    answer: "Ensure you have a Pro or Elite subscription. Check that your browser has microphone permissions enabled. Press Alt+V to activate voice mode. If issues persist, try using Chrome browser as it has the best speech recognition support."
  },
  {
    category: "Troubleshooting",
    question: "My screenshots aren't being saved. What's wrong?",
    answer: "Check that the PC Bridge is running and connected (green indicator). Ensure the save path exists and is writable. You can configure custom screenshot paths in Settings > Output Paths. Default path is your Pictures/Screenshots folder."
  },
  {
    category: "Troubleshooting",
    question: "ALSA AI is not responding to my messages.",
    answer: "If the AI is not responding, it could be due to high server load. Wait a few seconds and try again. If issues persist, contact our support team at support@alsa-ai.in. You can also add a backup Gemini API key in Settings for uninterrupted service."
  },
  
  // Privacy & Security
  {
    category: "Security",
    question: "Is my data safe with ALSA AI?",
    answer: "We take privacy seriously. Your conversations are encrypted and stored securely. The PC Bridge runs locally - we never have access to your files. We don't sell or share your personal data with third parties. See our Privacy Policy for full details."
  },
  {
    category: "Security",
    question: "Can ALSA AI access my personal files?",
    answer: "ALSA AI can only access files you explicitly ask it to work with. The PC Bridge executes commands locally on your machine under your user permissions. It cannot access files without your direct instruction."
  },
  {
    category: "Security",
    question: "How do I secure my ALSA AI account?",
    answer: "Use a strong, unique password. Enable two-factor authentication if available. Don't share your login credentials or bridge tokens. Log out from shared computers. Report any suspicious activity to support@alsa-ai.in immediately."
  }
];

const categoryIcons: Record<string, React.ReactNode> = {
  "General": <MessageCircle className="w-5 h-5" />,
  "PC Bridge": <Monitor className="w-5 h-5" />,
  "Features": <Zap className="w-5 h-5" />,
  "Billing": <CreditCard className="w-5 h-5" />,
  "Troubleshooting": <HelpCircle className="w-5 h-5" />,
  "Security": <Shield className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  "General": "from-blue-500 to-cyan-500",
  "PC Bridge": "from-purple-500 to-pink-500",
  "Features": "from-amber-500 to-orange-500",
  "Billing": "from-green-500 to-emerald-500",
  "Troubleshooting": "from-red-500 to-rose-500",
  "Security": "from-indigo-500 to-violet-500",
};

const FAQ = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqData.map(f => f.category)))];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Helmet>
        <title>FAQ - ALSA AI | Frequently Asked Questions About AI Assistant</title>
        <meta name="description" content="Find answers to common questions about ALSA AI, PC Bridge setup, subscription plans, features, troubleshooting, and security. Get help with your AI-powered PC automation assistant." />
        <meta name="keywords" content="ALSA AI FAQ, AI assistant help, PC Bridge troubleshooting, voice command help, ALSA subscription, AI automation questions, PC control FAQ, ALSA features, AI assistant support, Mohd Eisa AI, India AI assistant, how to use ALSA AI" />
        <meta property="og:title" content="ALSA AI FAQ - Frequently Asked Questions" />
        <meta property="og:description" content="Get answers to all your questions about ALSA AI, the intelligent PC control assistant." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.alsa-ai.in/faq" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-white/5 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={alsaLogo} alt="ALSA AI" className="h-10 w-10 rounded-xl ring-1 ring-white/10" />
            <div>
              <span className="text-xl font-bold text-white">FAQ</span>
              <p className="text-xs text-white/40">Frequently Asked Questions</p>
            </div>
          </div>
          <Button onClick={() => navigate('/contact')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
            Contact Support
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            How can we help you?
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Find answers to common questions about ALSA AI, features, billing, and troubleshooting.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            type="text"
            placeholder="Search for answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 py-6 bg-white/5 border-white/10 text-white text-lg rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-white/30"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full transition-all duration-300 ${
                activeCategory === category 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white shadow-lg shadow-blue-500/25' 
                  : 'border-white/20 hover:bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              {category !== 'All' && <span className="mr-1.5">{categoryIcons[category]}</span>}
              <span>{category}</span>
            </Button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 text-center">
                <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No matching questions found. Try a different search term.</p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/contact')}
                  className="text-blue-400 mt-2 hover:text-blue-300"
                >
                  Contact support for help →
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredFAQs.map((faq, index) => (
              <Card 
                key={index} 
                className={`bg-white/5 border-white/10 transition-all duration-300 cursor-pointer overflow-hidden ${
                  expandedIndex === index 
                    ? 'ring-2 ring-blue-500/50 bg-white/10' 
                    : 'hover:bg-white/10 hover:border-white/20'
                }`}
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[faq.category]} flex items-center justify-center shrink-0 shadow-lg`}>
                        {categoryIcons[faq.category]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r ${categoryColors[faq.category]} bg-opacity-20`}>
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white text-lg leading-snug">{faq.question}</h3>
                      </div>
                    </div>
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      expandedIndex === index ? 'bg-blue-500 rotate-180' : 'bg-white/10'
                    }`}>
                      <ChevronDown className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${
                    expandedIndex === index ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="pl-16 pt-4 border-t border-white/10">
                      <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Still Need Help */}
        <div className="mt-16 text-center p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl border border-white/10 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-3 text-white">Still have questions?</h2>
          <p className="text-white/60 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/contact')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('mailto:support@alsa-ai.in', '_blank')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Email: support@alsa-ai.in
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="container mx-auto px-6 text-center text-white/40 text-sm">
          <p>© {new Date().getFullYear()} ALSA AI. Created by Mohd Eisa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default FAQ;
