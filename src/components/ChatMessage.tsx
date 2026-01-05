import { Bot, User, Download, Copy, Check, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  messageId?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (messageId: string) => void;
}

const ChatMessage = ({ role, content, messageId, isFavorite, onToggleFavorite }: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  // ORIGINAL LOGIC: Agar content bilkul nahi hai, tabhi empty maano
  const isEmpty = !content || content.trim().length === 0;

  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(content, maxWidth);
    doc.text(lines, margin, 20);
    doc.save(`alsa-message-${Date.now()}.pdf`);
  };

  const copyToClipboard = (code: string, lang: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(`${lang}-${code.substring(0, 20)}`);
    toast({ title: "Copied!", description: "Code snippet copied to clipboard." });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exportCodeToFile = (code: string, language: string) => {
    const extensions: Record<string, string> = {
      javascript: 'js', typescript: 'ts', python: 'py',
      java: 'java', html: 'html', css: 'css', json: 'json'
    };
    const extension = extensions[language.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alsa-code-${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseContent = () => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'code', language: match[1] || 'text', content: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.substring(lastIndex) });
    }
    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-1">{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-blue-400 mt-4 mb-2">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-medium text-cyan-300 mt-3 mb-1">{line.replace('### ', '')}</h3>;

      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="text-white/80 leading-relaxed mb-3 text-[15px] tracking-wide">
          {parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={index} className="text-blue-200 font-bold">{part.replace(/\*\*/g, '')}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const renderContent = () => {
    // AGAR CONTENT EMPTY HAI TOH LOADING DIKHAO (FOR SYSTEM ACTIONS)
    if (isEmpty && role === 'assistant') {
      return (
        <div className="flex items-center gap-3 py-1">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-xs font-bold text-blue-400/60 uppercase tracking-widest animate-pulse">
            Neural Core Processing...
          </span>
        </div>
      );
    }

    const parts = parseContent();
    return parts.map((part, index) => {
      if (part.type === 'text' && !part.content.trim()) return null;

      if (part.type === 'code') {
        const codeId = `${part.language}-${part.content.substring(0, 20)}`;
        return (
          <div key={index} className="my-5 rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl group">
            <div className="flex items-center justify-between bg-white/[0.03] px-4 py-2.5 border-b border-white/5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{part.language}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-7 text-[10px] text-white/40 hover:text-white" onClick={() => exportCodeToFile(part.content, part.language)}>
                  <FileDown className="w-3.5 h-3.5 mr-1" /> EXPORT
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-[10px] text-white/40 hover:text-white" onClick={() => copyToClipboard(part.content, part.language)}>
                  {copiedCode === codeId ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                language={part.language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  background: 'transparent',
                  fontSize: '13px',
                  overflowX: 'auto',
                }}
              >
                {part.content}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      }
      return <div key={index}>{renderFormattedText(part.content)}</div>;
    });
  };

  return (
    <div className={`flex gap-4 p-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {role === 'assistant' && (
        <div className="flex gap-4 max-w-[90%] md:max-w-[80%] group">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 shadow-inner">
            <Bot className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-[#1a1a1a]/80 border border-white/10 rounded-[2rem] rounded-tl-none p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-transparent opacity-30" />
              {renderContent()}
            </div>
            {!isEmpty && (
              <div className="flex gap-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handleDownload} className="text-[10px] font-bold text-white/20 hover:text-white/60 flex items-center gap-1 uppercase tracking-tighter">
                  <Download className="w-3 h-3" /> Save PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {role === 'user' && (
        <div className="flex gap-4 max-w-[90%] md:max-w-[80%] justify-end">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-[2rem] rounded-tr-none p-5 text-white/90 shadow-xl backdrop-blur-md border-r-2 border-r-blue-500/50">
            {renderContent()}
          </div>
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
