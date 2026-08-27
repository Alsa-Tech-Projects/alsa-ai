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
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex" onClick={onClose}>
      <div
        className="ml-auto w-full md:w-[70%] lg:w-[58%] h-full bg-[#0d0d0d] border-l border-white/15 flex flex-col shadow-[-25px_0_60px_rgba(0,0,0,0.9)] transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with 3D Bevel & Top Light Edge */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-gradient-to-b from-white/10 via-black/40 to-black/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 shadow-[0_2px_8px_rgba(59,130,246,0.2)]">
              <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
            </div>
            <span className="text-sm font-medium text-white tracking-wide truncate drop-shadow">{fileName}</span>
            <span className="text-[10px] uppercase font-semibold tracking-widest text-white/40 hidden sm:inline px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shadow-inner">
              {file.language || 'code'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:text-white h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)] active:translate-y-[1px] transition-all"
              onClick={copy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ml-1.5 hidden sm:inline text-xs font-medium">Copy</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:text-white h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)] active:translate-y-[1px] transition-all"
              onClick={download}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="ml-1.5 hidden sm:inline text-xs font-medium">Download</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white/60 hover:text-white h-8 w-8 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 shadow-[0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)] active:translate-y-[1px] transition-all"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs with Tactile Pill Design */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-black/40 shadow-inner">
          <button
            onClick={() => setTab('code')}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-lg border transition-all active:translate-y-[1px] ${
              tab === 'code'
                ? 'bg-gradient-to-b from-blue-500/30 to-blue-600/20 border-blue-400/50 text-blue-200 shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
            }`}
          >
            Code
          </button>
          {isHtml && (
            <button
              onClick={() => setTab('preview')}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-lg border transition-all inline-flex items-center gap-1.5 active:translate-y-[1px] ${
                tab === 'preview'
                  ? 'bg-gradient-to-b from-emerald-500/30 to-emerald-600/20 border-emerald-400/50 text-emerald-200 shadow-[0_2px_8px_rgba(16,185,129,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
              }`}
            >
              <Play className="w-3 h-3 fill-current" /> Preview Output
            </button>
          )}
        </div>

        {/* Body Container with Recessed Inset Shadow */}
        <div className="flex-1 overflow-auto bg-[#0a0a0a] shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)]">
          {tab === 'code' ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={file.language || 'text'}
              showLineNumbers
              customStyle={{
                background: 'transparent',
                margin: 0,
                padding: '20px',
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
              className="w-full h-full bg-white shadow-inner"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodingCanvas;
