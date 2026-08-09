// /create command — generates a downloadable PDF (article) or code-bundle for the user
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CreateResult {
  ok: boolean;
  message: string;
  filename?: string;
}

const isCodingTopic = (topic: string) => {
  const t = topic.toLowerCase();
  if (/\b(pdf|article|essay|report|document|notes|blog|story|letter|guide|ebook|book|paper|summary|biography|poem|speech|proposal|plan|workflow|breakdown)\b/i.test(t)) {
    return false;
  }
  return /(code|coding|program|programming|script|app|website|web app|api|function|class|algorithm|component|react|python|javascript|typescript|node|html|css|sql|build (a|an) |create (a|an) (app|website|api|game|tool|script))/i.test(t);
};

const sanitize = (s: string) =>
  s.replace(/[\\/:*?"<>|]/g, '-').slice(0, 60).trim() || 'document';

const downloadBlob = (data: Blob, filename: string) => {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ============== Markdown → PDF rendering ==============

interface RenderCtx {
  pdf: jsPDF;
  margin: number;
  maxWidth: number;
  pageHeight: number;
  pageWidth: number;
  y: number;
}

const ensureSpace = (ctx: RenderCtx, needed: number) => {
  if (ctx.y + needed > ctx.pageHeight - ctx.margin) {
    ctx.pdf.addPage();
    ctx.y = ctx.margin;
  }
};

// Render a line that may contain **bold** segments
const renderInline = (ctx: RenderCtx, text: string, fontSize: number, lineHeight: number, color: [number, number, number] = [25, 25, 25]) => {
  const { pdf, margin, maxWidth } = ctx;
  pdf.setFontSize(fontSize);
  pdf.setTextColor(color[0], color[1], color[2]);

  // Tokenize **bold** segments
  const tokens: { text: string; bold: boolean }[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push({ text: text.slice(last, m.index), bold: false });
    tokens.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), bold: false });
  if (tokens.length === 0) tokens.push({ text, bold: false });

  // Word-wrap manually so bold segments stay bold
  let lineWords: { text: string; bold: boolean; w: number }[] = [];
  let lineW = 0;
  const spaceW = (bold: boolean) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    return pdf.getTextWidth(' ');
  };

  const flushLine = () => {
    ensureSpace(ctx, lineHeight);
    let x = margin;
    lineWords.forEach((w, i) => {
      pdf.setFont('helvetica', w.bold ? 'bold' : 'normal');
      pdf.text(w.text, x, ctx.y);
      x += w.w;
      if (i < lineWords.length - 1) x += spaceW(w.bold);
    });
    ctx.y += lineHeight;
    lineWords = [];
    lineW = 0;
  };

  tokens.forEach(tok => {
    pdf.setFont('helvetica', tok.bold ? 'bold' : 'normal');
    const words = tok.text.split(/\s+/).filter(Boolean);
    words.forEach(word => {
      const wWidth = pdf.getTextWidth(word);
      const sp = lineWords.length > 0 ? spaceW(tok.bold) : 0;
      if (lineW + sp + wWidth > maxWidth && lineWords.length > 0) {
        flushLine();
      }
      lineWords.push({ text: word, bold: tok.bold, w: wWidth });
      lineW += (lineWords.length > 1 ? spaceW(tok.bold) : 0) + wWidth;
    });
  });
  if (lineWords.length > 0) flushLine();
};

// Parse markdown table block → return rows or null
const parseTable = (lines: string[], startIdx: number): { head: string[]; body: string[][]; endIdx: number } | null => {
  const headerLine = lines[startIdx];
  const sepLine = lines[startIdx + 1];
  if (!headerLine || !sepLine) return null;
  if (!/^\s*\|.+\|\s*$/.test(headerLine)) return null;
  if (!/^\s*\|?\s*[:\- |]+\s*\|?\s*$/.test(sepLine) || !/-/.test(sepLine)) return null;

  const splitRow = (l: string) =>
    l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim().replace(/\*\*/g, ''));

  const head = splitRow(headerLine);
  const body: string[][] = [];
  let i = startIdx + 2;
  while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
    body.push(splitRow(lines[i]));
    i++;
  }
  return { head, body, endIdx: i - 1 };
};

const renderTable = (ctx: RenderCtx, head: string[], body: string[][]) => {
  ctx.y += 4;
  autoTable(ctx.pdf, {
    head: [head],
    body,
    startY: ctx.y,
    margin: { left: ctx.margin, right: ctx.margin },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: [33, 37, 41], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    pageBreak: 'avoid',     // keep whole table together if it fits a page
    rowPageBreak: 'avoid',  // don't split a single row
    tableWidth: 'auto',
  });
  // @ts-ignore
  ctx.y = (ctx.pdf as any).lastAutoTable.finalY + 10;
};

/** Build a clean, professionally-formatted PDF from AI markdown content */
export const generateArticlePdf = (topic: string, content: string): string => {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 50;
  const ctx: RenderCtx = {
    pdf, margin, pageWidth, pageHeight,
    maxWidth: pageWidth - margin * 2,
    y: margin,
  };

  // ---- Derive a clean title (first H1 if present, else topic shortened) ----
  const lines = content.replace(/\r/g, '').split('\n');
  let title = '';
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const ln = lines[i].trim();
    if (!ln) continue;
    const h1 = ln.match(/^#\s+(.+)$/);
    if (h1) { title = h1[1].replace(/\*\*/g, '').trim(); startIdx = i + 1; break; }
    // first non-empty short line treated as title
    if (ln.length < 90 && !/[.!?]$/.test(ln)) { title = ln.replace(/\*\*/g, '').replace(/^#+\s*/, ''); startIdx = i + 1; }
    break;
  }
  if (!title) title = topic.split(/[.\n:]/)[0].trim().slice(0, 80) || 'Document';

  // ---- Title block ----
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(15, 23, 42);
  const tLines = pdf.splitTextToSize(title, ctx.maxWidth);
  tLines.forEach((l: string) => { ensureSpace(ctx, 26); pdf.text(l, margin, ctx.y + 18); ctx.y += 26; });

  // Meta line
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  ensureSpace(ctx, 14);
  pdf.text(`Generated by ALSA AI · ${new Date().toLocaleDateString()}`, margin, ctx.y);
  ctx.y += 10;
  // Divider
  pdf.setDrawColor(220);
  pdf.line(margin, ctx.y, pageWidth - margin, ctx.y);
  ctx.y += 16;

  // ---- Body parsing ----
  let i = startIdx;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Blank line → small gap
    if (!line.trim()) { ctx.y += 6; i++; continue; }

    // Skip horizontal rules
    if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) { ctx.y += 4; i++; continue; }

    // Tables
    const tbl = parseTable(lines, i);
    if (tbl) {
      renderTable(ctx, tbl.head, tbl.body);
      i = tbl.endIdx + 1;
      continue;
    }

    // Headings
    const h1 = line.match(/^#\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h3 = line.match(/^###\s+(.+)$/);
    if (h1) {
      ctx.y += 8;
      renderInline(ctx, h1[1], 18, 24, [15, 23, 42]);
      ctx.y += 4;
      i++; continue;
    }
    if (h2) {
      ctx.y += 6;
      renderInline(ctx, h2[1], 15, 20, [30, 41, 59]);
      ctx.y += 2;
      i++; continue;
    }
    if (h3) {
      ctx.y += 4;
      renderInline(ctx, h3[1], 12.5, 18, [51, 65, 85]);
      i++; continue;
    }

    // Bullet / numbered list
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (bullet || numbered) {
      const text = (bullet ? bullet[1] : numbered![1]);
      const marker = bullet ? '•  ' : `${(numbered![0].match(/\d+/) || ['1'])[0]}.  `;
      // Render marker + indent
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(25, 25, 25);
      ensureSpace(ctx, 16);
      pdf.text(marker, margin, ctx.y);
      const savedMargin = ctx.margin;
      const savedMaxWidth = ctx.maxWidth;
      ctx.margin = margin + 16;
      ctx.maxWidth = pageWidth - ctx.margin - margin;
      renderInline(ctx, text, 11, 16);
      ctx.margin = savedMargin;
      ctx.maxWidth = savedMaxWidth;
      i++; continue;
    }

    // Plain paragraph
    renderInline(ctx, line.replace(/^#+\s*/, ''), 11, 16);
    i++;
  }

  // ---- Footer on every page ----
  const total = (pdf as any).internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text('Confidential', margin, pageHeight - 20);
    pdf.text(`Page ${p} of ${total}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  const filename = `${sanitize(title)}.pdf`;
  pdf.save(filename);
  return filename;
};

// ============== Code mode (unchanged) ==============

const extractCodeBlocks = (md: string): { lang: string; code: string }[] => {
  const blocks: { lang: string; code: string }[] = [];
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) blocks.push({ lang: (m[1] || 'txt').toLowerCase(), code: m[2].trim() });
  return blocks;
};

const extFor = (lang: string) => {
  const map: Record<string, string> = {
    js: 'js', javascript: 'js', ts: 'ts', typescript: 'ts',
    py: 'py', python: 'py', html: 'html', css: 'css',
    json: 'json', sql: 'sql', sh: 'sh', bash: 'sh',
    java: 'java', c: 'c', cpp: 'cpp', cs: 'cs', go: 'go',
    rs: 'rs', rust: 'rs', php: 'php', rb: 'rb', kt: 'kt',
    swift: 'swift', tsx: 'tsx', jsx: 'jsx', xml: 'xml', yaml: 'yml', yml: 'yml',
  };
  return map[lang] || 'txt';
};

/**
 * Derive a proper project/document name.
 * 1. Explicit user mention: "named X" / "called X" / "file name: X"
 * 2. Otherwise the topic keywords (never the whole prompt sentence)
 */
export const deriveName = (topic: string, content?: string): string => {
  const explicit = topic.match(/(?:named|called|file ?name(?: ?is)?|naam)\s*[:\-"']?\s*([\w .\-]{2,40})/i);
  if (explicit) return sanitize(explicit[1]).trim();

  // First H1 of the generated content is usually the real topic title
  const h1 = content?.match(/^#\s+(.+)$/m);
  if (h1) return sanitize(h1[1].replace(/\*\*/g, '')).trim();

  const stop = /\b(create|make|build|generate|write|a|an|the|me|please|for|with|using|that|which|and|to|of|in|on|program|script|code|file|app|project|pdf|document)\b/gi;
  const cleaned = topic.replace(stop, ' ').replace(/[^\w\s.-]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter(Boolean).slice(0, 4).join(' ');
  return sanitize(words || topic).trim();
};

/** Filename hint from the first comment line of a code block, e.g. `# main.py` or `// src/App.tsx` */
const filenameFromBlock = (code: string): string | null => {
  const first = code.split('\n')[0].trim();
  const m = first.match(/^(?:\/\/|#|<!--|\/\*)\s*([\w./\-]+\.[A-Za-z0-9]{1,6})\s*(?:-->|\*\/)?$/);
  return m ? m[1] : null;
};

export const downloadCodeFiles = async (topic: string, content: string): Promise<string[]> => {
  const blocks = extractCodeBlocks(content);
  const base = deriveName(topic, content);
  const slug = base.toLowerCase().replace(/\s+/g, '-') || 'project';

  if (blocks.length === 0) {
    const fname = `${slug}.txt`;
    downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), fname);
    return [fname];
  }

  const named = blocks.map((b, i) => {
    const hinted = filenameFromBlock(b.code);
    const ext = extFor(b.lang);
    const name = hinted || (blocks.length === 1 ? `${slug}.${ext}` : `${slug}-${i + 1}.${ext}`);
    return { name, code: b.code };
  });

  // Single file -> plain download. Multiple files -> one ZIP.
  if (named.length === 1) {
    downloadBlob(new Blob([named[0].code], { type: 'text/plain;charset=utf-8' }), named[0].name);
    return [named[0].name];
  }

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  named.forEach((f) => zip.file(f.name, f.code));
  const blob = await zip.generateAsync({ type: 'blob' });
  const zipName = `${slug}.zip`;
  downloadBlob(blob, zipName);
  return [zipName, ...named.map((f) => f.name)];
};

export const getCreateMode = (topic: string): 'pdf' | 'code' => {
  return isCodingTopic(topic) ? 'code' : 'pdf';
};

