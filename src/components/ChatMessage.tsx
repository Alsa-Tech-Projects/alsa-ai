import { Bot, User, Download, Copy, Check, FileDown, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, memo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

// Mermaid Initialization for Diagrams
mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });

const ChatMessage = memo(({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const isEmpty = !content || content.trim().length === 0;

  // Mermaid Diagram Renderer
  useEffect(() => {
    if (!isEmpty) mermaid.contentLoaded();
  }, [content, isEmpty]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Snippet copied to clipboard." });
  };

  return (
    <div className={`flex gap-4 p-6 w-full ${role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
      {/* <div className={`flex gap-4 max-w-[85%] ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}> */}
        {/* <div className={`flex flex-col sm:flex-row gap-3 max-w-[85%] ${
  role === 'user' ? 'sm:flex-row-reverse items-end' : 'items-start'
}`}> */}
<div className="flex flex-col gap-2 max-w-[85%]">

        {/* Avatar Section */}
        {/* <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border self-start
         ${
          role === 'assistant' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-600 border-transparent'
        }`}>
          {role === 'assistant' ? <Bot className="w-6 h-6 text-blue-400" /> : <User className="w-6 h-6 text-white" />}
        </div>

        {/* Message Bubble */}
        {/* <div className={`flex flex-col gap-2 ${role === 'user' ? 'items-end' : 'items-start'}`}> */}
        {/* <div className={`flex flex-col gap-2 w-full ${role === 'user' ? 'items-end' : 'items-start'}`}> */}
        <div className="flex flex-col gap-2 w-full items-start lg:items-start">
          {/* <div className={`
            p-5 rounded-[2rem] shadow-xl backdrop-blur-md border
            ${role === 'assistant' 
              ? 'bg-[#1a1a1a]/90 border-white/10 rounded-tl-none' 
              : 'bg-blue-600/20 border-blue-500/30 rounded-tr-none'}
          `}>
             */}
          <div className={`
  p-2 rounded-[2rem] shadow-xl backdrop-blur-md
  bg-transparent border-none
`}>
            {isEmpty && role === 'assistant' ? (
              <div className="flex items-center gap-3 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-xs font-bold text-blue-400/60 uppercase tracking-widest">Neural Processing...</span>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // 1. Better Links
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" className="text-blue-400 hover:text-blue-300 underline flex-inline items-center gap-1">
                        {props.children} <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    ),
                    // 2. Excel-style Tables
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                        <table {...props} className="min-w-full divide-y divide-white/10 bg-white/5" />
                      </div>
                    ),
                    th: ({ node, ...props }) => <th {...props} className="px-4 py-2 bg-white/10 text-left text-sm font-bold text-blue-300" />,
                    td: ({ node, ...props }) => <td {...props} className="px-4 py-2 text-sm border-t border-white/5" />,
                    
                    // 3. Advanced Code Blocks & Diagrams
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';

                      // Diagram Logic (Mermaid)
                      if (language === 'mermaid') {
                        return <div className="mermaid bg-white p-4 rounded-lg my-4 text-center">{children}</div>;
                      }

                      return !inline ? (
                        <div className="my-5 rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
                          <div className="flex items-center justify-between bg-white/5 px-4 py-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{language}</span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copyToClipboard(String(children))}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={language}
                            PreTag="div"
                            customStyle={{ background: 'transparent', padding: '1.25rem', fontSize: '13px' }}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-blue-300">{children}</code>
                      );
                    }
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatMessage;
