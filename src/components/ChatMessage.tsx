// import { Bot, User, Download, Copy, Check, FileDown, Loader2, ExternalLink } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { jsPDF } from 'jspdf';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
// import { useState, memo, useEffect } from 'react';
// import { useToast } from '@/hooks/use-toast';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// import mermaid from 'mermaid';

// // Mermaid Initialization for Diagrams
// mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });

// const ChatMessage = memo(({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
//   const [copiedCode, setCopiedCode] = useState<string | null>(null);
//   const { toast } = useToast();
//   const isEmpty = !content || content.trim().length === 0;

//   // Mermaid Diagram Renderer
//   useEffect(() => {
//     if (!isEmpty) mermaid.contentLoaded();
//   }, [content, isEmpty]);

//   const copyToClipboard = (code: string) => {
//     navigator.clipboard.writeText(code);
//     toast({ title: "Copied!", description: "Snippet copied to clipboard." });
//   };

//   return (
//     <div className={`flex gap-4 p-6 w-full ${role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
//       {/* <div className={`flex gap-4 max-w-[85%] ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}> */}
//         {/* <div className={`flex flex-col sm:flex-row gap-3 max-w-[85%] ${
//   role === 'user' ? 'sm:flex-row-reverse items-end' : 'items-start'
// }`}> */}
// <div className={`flex flex-col gap-2 max-w-[85%] ${role === 'user' ? 'items-end' : 'items-start'}`}>

// {/* <div className="flex flex-col gap-2 max-w-[85%]"> */}

//         {/* Avatar Section */}
//         {/* <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border */}
//         <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ${role === 'user' ? 'self-end order-last' : 'self-start order-first'}

//          ${
//           role === 'assistant' ? 'bg-blue-600/10 border-blue-500/30' : 'bg-blue-600 border-transparent'
//         }`}>
//           {role === 'assistant' ? <Bot className="w-6 h-6 text-blue-400" /> : <User className="w-6 h-6 text-white" />}
//         </div>

//         {/* Message Bubble */}
//         {/* <div className={`flex flex-col gap-2 ${role === 'user' ? 'items-end' : 'items-start'}`}> */}
//         {/* <div className={`flex flex-col gap-2 w-full ${role === 'user' ? 'items-end' : 'items-start'}`}> */}
//         {/* <div className="flex flex-col gap-2 w-full items-start lg:items-start"> */}
//         <div className="flex flex-col gap-2 w-full">

//           {/* <div className={`
//           <div className="flex flex-col gap-2 w-full">

//             p-5 rounded-[2rem] shadow-xl backdrop-blur-md border
//             ${role === 'assistant' 
//               ? 'bg-[#1a1a1a]/90 border-white/10 rounded-tl-none' 
//               : 'bg-blue-600/20 border-blue-500/30 rounded-tr-none'}
//           `}>
//              */}
//           {/* <div className={`
//   p-2 rounded-[2rem] shadow-xl backdrop-blur-md
//   bg-transparent border-none
// `}> */}
// <div className={`
//   p-4 rounded-2xl shadow-xl backdrop-blur-md border
//   ${role === 'user'
//     ? 'bg-blue-600/20 border-blue-500/30 rounded-tr-sm'
//     : 'bg-[#1a1a1a]/90 border-white/10 rounded-tl-sm'}
// `}>
//             {isEmpty && role === 'assistant' ? (
//               <div className="flex items-center gap-3 py-1">
//                 <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
//                 <span className="text-xs font-bold text-blue-400/60 uppercase tracking-widest">Neural Processing...</span>
//               </div>
//             ) : (
//               <div className="prose prose-invert max-w-none break-words">
//                 <ReactMarkdown
//                   remarkPlugins={[remarkGfm]}
//                   components={{
//                     // 1. Better Links
//                     a: ({ node, ...props }) => (
//                       <a {...props} target="_blank" className="text-blue-400 hover:text-blue-300 underline flex-inline items-center gap-1">
//                         {props.children} <ExternalLink className="w-3 h-3 inline" />
//                       </a>
//                     ),
//                     // 2. Excel-style Tables
//                     table: ({ node, ...props }) => (
//                       <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
//                         <table {...props} className="min-w-full divide-y divide-white/10 bg-white/5" />
//                       </div>
//                     ),
//                     th: ({ node, ...props }) => <th {...props} className="px-4 py-2 bg-white/10 text-left text-sm font-bold text-blue-300" />,
//                     td: ({ node, ...props }) => <td {...props} className="px-4 py-2 text-sm border-t border-white/5" />,
                    
//                     // 3. Advanced Code Blocks & Diagrams
//                     code({ node, inline, className, children, ...props }: any) {
//                       const match = /language-(\w+)/.exec(className || '');
//                       const language = match ? match[1] : '';

//                       // Diagram Logic (Mermaid)
//                       if (language === 'mermaid') {
//                         return <div className="mermaid bg-white p-4 rounded-lg my-4 text-center">{children}</div>;
//                       }

//                       return !inline ? (
//                         <div className="my-5 rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
//                           <div className="flex items-center justify-between bg-white/5 px-4 py-2">
//                             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{language}</span>
//                             <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => copyToClipboard(String(children))}>
//                               <Copy className="w-3.5 h-3.5" />
//                             </Button>
//                           </div>
//                           <SyntaxHighlighter
//                             style={vscDarkPlus}
//                             language={language}
//                             PreTag="div"
//                             customStyle={{ background: 'transparent', padding: '1.25rem', fontSize: '13px' }}
//                           >
//                             {String(children).replace(/\n$/, '')}
//                           </SyntaxHighlighter>
//                         </div>
//                       ) : (
//                         <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-blue-300">{children}</code>
//                       );
//                     }
//                   }}
//                 >
//                   {content}
//                 </ReactMarkdown>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// });

// export default ChatMessage;




import { Bot, User, Copy, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { memo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });

const ChatMessage = memo(({ role, content }: { role: 'user' | 'assistant'; content: string }) => {
  const { toast } = useToast();
  const isEmpty = !content || content.trim().length === 0;
  const isUser = role === 'user';

  useEffect(() => {
    if (!isEmpty) mermaid.contentLoaded();
  }, [content, isEmpty]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Snippet copied to clipboard.' });
  };

  return (
    // Outer row: user = right, assistant = left
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        flexWrap: 'nowrap',
        alignItems: 'flex-start',
         maxWidth: '100%',        // ← ADD
    overflow: 'hidden',      // ← ADD
        gap: '10px',
        width: '100%',
        padding: '6px 12px',
        boxSizing: 'border-box',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          flexShrink: 0,
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '2px',
          background: isUser ? '#2563eb' : 'rgba(59,130,246,0.1)',
          border: isUser ? 'none' : '1px solid rgba(59,130,246,0.3)',
        }}
      >
        {isUser
          ? <User style={{ width: 16, height: 16, color: 'white' }} />
          : <Bot style={{ width: 16, height: 16, color: '#60a5fa' }} />
        }
      </div>

      {/* Message bubble */}
      <div
        style={{
          maxWidth: '85%',
          flex: '1 1 auto', 
           minWidth: 0,               // ← ADD — flex child overflow rokta hai
  overflow: 'hidden',        // ← ADD
          padding: '10px 14px',
          borderRadius: '16px',
          borderTopRightRadius: isUser ? '4px' : '16px',
          borderTopLeftRadius: isUser ? '16px' : '4px',
          background: isUser ? 'rgba(37,99,235,0.25)' : '#1a1a1a',
          border: isUser ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.08)',
          color: 'white',
          fontSize: '14px',
          lineHeight: '1.7',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        {isEmpty && !isUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 style={{ width: 14, height: 14, color: '#60a5fa', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '11px', color: 'rgba(96,165,250,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Neural Processing...
            </span>
          </div>
        ) : (
          // <div className="prose prose-invert max-w-none">
            <div style={{ maxWidth: '100%', overflowWrap: 'anywhere' }}>

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    style={{ color: '#60a5fa', textDecoration: 'underline' }}
                  >
                    {props.children}
                    <ExternalLink style={{ width: 10, height: 10, display: 'inline', marginLeft: 3 }} />
                  </a>
                ),
                table: ({ node, ...props }) => (
                  <div style={{
  margin: '12px 0',

  borderRadius: '10px',
  // overflow: 'hidden',        // outer hidden
  overflowX: 'auto',   
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(0,0,0,0.5)'
}}>

                    <table {...props} style={{ minWidth: '100%', borderCollapse: 'collapse' }} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th
                    {...props}
                    style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    {...props}
                    style={{ padding: '10px 14px', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p {...props} style={{ margin: '6px 0', lineHeight: 1.7, fontSize: '14px' }} />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} style={{ paddingLeft: '18px', margin: '6px 0' }} />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} style={{ paddingLeft: '18px', margin: '6px 0' }} />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} style={{ margin: '4px 0', fontSize: '14px' }} />
                ),
                h1: ({ node, ...props }) => <h1 {...props} style={{ fontSize: '20px', fontWeight: 700, margin: '12px 0 8px' }} />,
                h2: ({ node, ...props }) => <h2 {...props} style={{ fontSize: '18px', fontWeight: 600, margin: '10px 0 6px' }} />,
                h3: ({ node, ...props }) => <h3 {...props} style={{ fontSize: '16px', fontWeight: 600, margin: '8px 0 4px' }} />,
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';

                  if (language === 'mermaid') {
                    return (
                      <div className="mermaid" style={{ background: 'white', padding: '16px', borderRadius: '8px', margin: '12px 0', textAlign: 'center' }}>
                        {children}
                      </div>
                    );
                  }

                  return !inline ? (
                    <div style={{ margin: '12px 0', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {language}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          style={{ height: '24px', width: '24px', padding: 0 }}
                          onClick={() => copyToClipboard(String(children))}
                        >
                          <Copy style={{ width: 12, height: 12 }} />
                        </Button>
                      </div>
                    <SyntaxHighlighter
  style={vscDarkPlus}
  language={language}
  PreTag="div"
  wrapLines={true}
  wrapLongLines={true}
  customStyle={{ background: 'transparent', padding: '12px 16px', fontSize: '12px', margin: 0, overflowX: 'auto', maxWidth: '100%' }}
>
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      {...props}
                      style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px', color: '#93c5fd', fontSize: '12px' }}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessage;