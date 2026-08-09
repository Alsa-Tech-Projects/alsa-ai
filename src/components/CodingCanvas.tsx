import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, X, Play, Code2, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export interface CanvasFile {
  name?: string;
  language: string;
  code: string;
}

const extFor = (lang: string) => {
  const l = (lang || '').toLowerCase();
  const map: Record<string, string> = {
    javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', tsx: 'tsx', jsx: 'jsx',
    python: 'py', py: 'py', html: 'html', css: 'css', json: 'json', bash: 'sh',
    shell: 'sh', sh: 'sh', sql: 'sql', java: 'java', c: 'c', cpp: 'cpp',
    csharp: 'cs', go: 'go', rust: 'rs', php: 'php', ruby: 'rb', kotlin: 'kt',
    swift: 'swift', yaml: 'yml', markdown: 'md', dart: 'dart',
  };
  return map[l] || 'txt';
};

interface Props {
  open: boolean;
  file: CanvasFile | null;
  onClose: () => void;
}

const CodingCanvas = ({ open, file, onClose }: Props) => {
  const { toast } = useToast();
  const [tab, setTab] = useState<'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);

  const isHtml = useMemo(() => {
    if (!file) return false;
    const l = (file.language || '').toLowerCase();
    return l === 'html' || l === 'htm' || /<html[\s>]|<!doctype html/i.test(file.code);
  }, [file]);

  useEffect(() => { if (open) setTab('code'); }, [open, file]);

  if (!open || !file) return null;

  const fileName = file.name || `alsa-code.${extFor(file.language)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(file.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    toast({ title: 'Copied', description: 'Code copied to clipboard.' });
  };

  const download = () => {
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: fileName });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex" onClick={onClose}>
      <div
        className="ml-auto w-full md:w-[70%] lg:w-[58%] h-full bg-[#0d0d0d] border-l border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-2 min-w-0">
            <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-sm text-white truncate">{fileName}</span>
            <span className="text-[10px] uppercase tracking-widest text-white/30 hidden sm:inline">
              {file.language || 'code'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white h-8 px-2" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ml-1 hidden sm:inline text-xs">Copy</span>
            </Button>
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white h-8 px-2" onClick={download}>
              <Download className="w-3.5 h-3.5" />
              <span className="ml-1 hidden sm:inline text-xs">Download</span>
            </Button>
            <Button size="icon" variant="ghost" className="text-white/60 h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <button
            onClick={() => setTab('code')}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              tab === 'code'
                ? 'bg-blue-500/20 border-blue-400/40 text-blue-200'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            Code
          </button>
          {isHtml && (
            <button
              onClick={() => setTab('preview')}
              className={`text-xs px-3 py-1.5 rounded-full border transition inline-flex items-center gap-1 ${
                tab === 'preview'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              <Play className="w-3 h-3" /> Preview Output
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {tab === 'code' ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={file.language || 'text'}
              showLineNumbers
              customStyle={{
                background: 'transparent',
                margin: 0,
                padding: '16px',
                fontSize: '12.5px',
                lineHeight: 1.6,
              }}
              codeTagProps={{ style: { whiteSpace: 'pre', fontFamily: 'ui-monospace, Menlo, Consolas, monospace' } }}
            >
              {file.code}
            </SyntaxHighlighter>
          ) : (
            <iframe
              title="Preview Output"
              sandbox="allow-scripts allow-modals allow-forms"
              srcDoc={file.code}
              className="w-full h-full bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodingCanvas;
