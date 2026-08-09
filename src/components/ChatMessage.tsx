import { Copy, Check, Loader2, ExternalLink, FileText, Music, Maximize2, Code2, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { memo, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import CodingCanvas, { CanvasFile } from '@/components/CodingCanvas';
import { Dialog, DialogContent } from '@/components/ui/dialog';

mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });

interface FileAttachment {
  name: string;
  type: string;
  size?: number;
  preview?: string;
  data?: string;
}

const guessName = (lang: string, code: string) => {
  const first = code.split('\n')[0].trim();
  const m = first.match(/^(?:\/\/|#|<!--)\s*([\w./-]+\.[a-z0-9]{1,5})/i);
  if (m) return m[1];
  const ext: Record<string, string> = {
    html: 'html', css: 'css', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts',
    tsx: 'tsx', jsx: 'jsx', python: 'py', py: 'py', json: 'json', sql: 'sql',
    java: 'java', cpp: 'cpp', c: 'c', go: 'go', rust: 'rs', php: 'php', bash: 'sh',
  };
  return `alsa-code.${ext[(lang || '').toLowerCase()] || 'txt'}`;
};

const ChatMessage = memo(({ role, content, files, keySource }: {
  role: 'user' | 'assistant';
  content: string;
  files?: FileAttachment[];
  keySource?: 'user' | 'server';
}) => {
  const { toast } = useToast();
  const isEmpty = !content || content.trim().length === 0;
  const isUser = role === 'user';
  const hasFiles = Array.isArray(files) && files.length > 0;
  const showKeyBadge = !isUser && !!keySource && !isEmpty;

  const [canvasFile, setCanvasFile] = useState<CanvasFile | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isEmpty) mermaid.contentLoaded();
  }, [content, isEmpty]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(code.slice(0, 24));
    setTimeout(() => setCopiedKey(null), 1500);
    toast({ title: 'Copied!', description: 'Snippet copied to clipboard.' });
  };

  const downloadImage = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `alsa-image-${Date.now()}.png`;
    a.click();
  };

  const attachments = hasFiles && (
    <div className="flex flex-wrap gap-2 mb-2">
      {files!.map((f, i) => {
        const src = f.preview || f.data;
        const isImg = (f.type || '').startsWith('image/') && src;
        const isAudio = (f.type || '').startsWith('audio/');
        if (isImg) {
          return (
            <div key={i} className="relative group rounded-2xl overflow-hidden border border-white/10 max-w-full">
              <button
                type="button"
                onClick={() => setPreviewImg(src!)}
                className="block w-full"
              >
                <img src={src} alt={f.name} className="max-h-72 max-w-full object-cover" />
                <span className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition">
                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                </span>
              </button>
              <div className="flex items-center gap-2 p-2 bg-black/40 border-t border-white/10">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => downloadImage(src!)}
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
                  onClick={() => window.dispatchEvent(new CustomEvent('alsa-edit-image', { detail: { src } }))}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </div>
            </div>
          );

        }
        return (
          <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 max-w-[220px]">
            {isAudio ? <Music className="w-3.5 h-3.5 text-purple-300" /> : <FileText className="w-3.5 h-3.5 text-blue-300" />}
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-white truncate">{f.name}</span>
              <span className="text-[9px] text-white/40">{f.type || 'file'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const markdown = (
    <div className="alsa-md w-full min-w-0 max-w-full text-[15px] leading-[1.75] text-white/90 break-words [overflow-wrap:anywhere]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ node, ...props }: any) => (
            <a {...props} target="_blank" rel="noreferrer"
              className="text-blue-400 underline underline-offset-2 hover:text-blue-300 break-all">
              {props.children}
              <ExternalLink className="w-3 h-3 inline ml-0.5 align-baseline" />
            </a>
          ),
          table: ({ node, ...props }: any) => (
            <div className="my-4 w-full overflow-x-auto rounded-xl border border-white/10 bg-black/40">
              <table {...props} className="min-w-full border-collapse text-[13.5px]" />
            </div>
          ),
          th: ({ node, ...props }: any) => (
            <th {...props} className="px-3.5 py-2.5 bg-white/[0.07] text-left font-semibold text-blue-200 whitespace-nowrap" />
          ),
          td: ({ node, ...props }: any) => (
            <td {...props} className="px-3.5 py-2.5 border-t border-white/5 align-top" />
          ),
          p: ({ node, ...props }: any) => <p {...props} className="my-2.5" />,
          ul: ({ node, ...props }: any) => <ul {...props} className="my-2.5 pl-5 list-disc space-y-1.5 marker:text-blue-400/70" />,
          ol: ({ node, ...props }: any) => <ol {...props} className="my-2.5 pl-5 list-decimal space-y-1.5 marker:text-blue-400/70" />,
          li: ({ node, ...props }: any) => <li {...props} className="pl-0.5" />,
          h1: ({ node, ...props }: any) => <h1 {...props} className="text-[21px] font-semibold mt-5 mb-2.5 text-white" />,
          h2: ({ node, ...props }: any) => <h2 {...props} className="text-[18.5px] font-semibold mt-5 mb-2 text-white" />,
          h3: ({ node, ...props }: any) => <h3 {...props} className="text-[16px] font-semibold mt-4 mb-1.5 text-white/95" />,
          hr: () => <hr className="my-5 border-white/10" />,
          blockquote: ({ node, ...props }: any) => (
            <blockquote {...props} className="my-3 border-l-2 border-blue-500/50 pl-3 text-white/70 italic" />
          ),
          img: ({ node, ...props }: any) => (
            <img
              {...props}
              onClick={() => props.src && setPreviewImg(String(props.src))}
              className="my-3 max-w-full rounded-2xl border border-white/10 cursor-zoom-in"
            />
          ),
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const raw = String(children).replace(/\n$/, '');

            if (inline) {
              return (
                <code {...props} className="bg-white/10 text-blue-200 px-1.5 py-0.5 rounded-md text-[13px] font-mono">
                  {children}
                </code>
              );
            }

            if (language === 'mermaid') {
              return <div className="mermaid my-3 rounded-xl bg-white p-4 text-center">{children}</div>;
            }

            const lines = raw.split('\n');
            const isLong = lines.length > 14 || raw.length > 900;
            const isHtml = language === 'html' || /<html[\s>]|<!doctype html/i.test(raw);
            const fileName = guessName(language, raw);
            const preview = isLong ? lines.slice(0, 8).join('\n') : raw;

            return (
              <div className="my-4 w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/50">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white/[0.05]">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40 truncate">
                    <Code2 className="w-3 h-3" /> {language || 'code'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-white/60 hover:text-white"
                      onClick={() => copyToClipboard(raw)}>
                      {copiedKey === raw.slice(0, 24) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="ghost"
                      className="h-6 px-2 text-[10px] text-blue-300 hover:text-blue-200"
                      onClick={() => setCanvasFile({ name: fileName, language, code: raw })}>
                      {isHtml ? 'Open & Preview' : 'Open in Canvas'}
                    </Button>
                  </div>
                </div>
                <div className="w-full min-w-0 overflow-x-auto">
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language || 'text'}
                    PreTag="div"
                    wrapLongLines
                    customStyle={{
                      background: 'transparent',
                      padding: '12px 14px',
                      fontSize: '12.5px',
                      lineHeight: 1.6,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                    }}
                    codeTagProps={{ style: { fontFamily: 'ui-monospace, Menlo, Consolas, monospace' } }}
                  >
                    {preview}
                  </SyntaxHighlighter>
                </div>
                {isLong && (
                  <button
                    type="button"
                    onClick={() => setCanvasFile({ name: fileName, language, code: raw })}
                    className="w-full text-left px-3 py-2.5 text-[12px] text-blue-300 bg-blue-500/10 border-t border-white/10 hover:bg-blue-500/15 transition"
                  >
                    Open File In Canvas — {fileName} · {lines.length} lines
                  </button>
                )}
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <>
      <div className={`w-full max-w-full min-w-0 overflow-hidden ${isUser ? 'flex justify-end' : 'block'}`}>
        {isUser ? (
          <div className="max-w-[85%] min-w-0 rounded-3xl rounded-br-lg bg-[#2b2c2e] border border-white/10 px-4 py-2.5 text-[15px] leading-relaxed text-white break-words [overflow-wrap:anywhere]">
            {attachments}
            {!isEmpty && <span className="whitespace-pre-wrap">{content}</span>}
          </div>
        ) : (
          <div className="w-full min-w-0">
            {attachments}
            {isEmpty ? (
              <div className="flex items-center gap-2 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span className="text-[11px] uppercase tracking-widest text-blue-400/60">Thinking…</span>
              </div>
            ) : markdown}
            {showKeyBadge && (
              <p className="mt-2 text-[10px] text-white/30">
                {keySource === 'user' ? 'Your Own Api Key Response' : 'Alsa AI Server Response'}
              </p>
            )}
          </div>
        )}
      </div>

      <CodingCanvas open={!!canvasFile} file={canvasFile} onClose={() => setCanvasFile(null)} />

      {/* Image preview wizard (same as Image Chat) */}
      <Dialog open={!!previewImg} onOpenChange={(o) => !o && setPreviewImg(null)}>
        <DialogContent className="max-w-4xl bg-[#0a0a0f] border-white/10 p-0 overflow-hidden">
          {previewImg && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <span className="text-sm font-medium text-white">Image Preview</span>
                <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20"
                  onClick={() => downloadImage(previewImg)}>
                  <Download className="w-3 h-3 mr-1" /> Download
                </Button>
              </div>
              <div className="flex items-center justify-center bg-black/40 p-4 max-h-[80vh] overflow-auto">
                <img src={previewImg} alt="Preview" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
