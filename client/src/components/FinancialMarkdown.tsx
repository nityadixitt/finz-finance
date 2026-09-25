import React from 'react';
import { FileText, ExternalLink, Calculator } from 'lucide-react';

interface FinancialMarkdownProps {
  content: string;
  onSelectCitation: (transactionId: string) => void;
}

/**
 * Pre-processes text to sanitize common LLM artifacts:
 * - Collapses broken multi-line citations like:
 *   (\n[TXN_1179]\n) -> ([TXN_1179])
 *   [TXN_1123]\n,\n[TXN_1129] -> [TXN_1123], [TXN_1129]
 * - Merges broken table lines separated by accidental empty lines
 * - Cleans up noisy delimiter artifacts (e.g. •\n--)
 */
function sanitizeFinancialMarkdown(raw: string): string {
  let text = raw.replace(/\r\n/g, '\n');

  // Replace accidental divider sequences like •\n-- or •\n--- with a clean markdown hr
  text = text.replace(/(?:^|\n)\s*[•\-\*]\s*\n+--+\s*(?:\n|$)/g, '\n\n---\n\n');

  // Normalize LaTeX inline escaped dollar math like: $\$6,200 + ...\$ -> $6,200 + ...$
  text = text.replace(/\\\$([^\$]+)\\\$/g, '$$$1$$');

  // Collapse broken parenthesis citations:
  // e.g., "increase (\n[TXN_1179]\n)" -> "increase ([TXN_1179])"
  text = text.replace(/\(\s*\n+\s*(\[?TXN[_-][A-Za-z0-9_-]+\]?)/gi, '($1');
  text = text.replace(/(\[?TXN[_-][A-Za-z0-9_-]+\]?)\s*\n+\s*\)/gi, '$1)');

  // Collapse citations separated by comma or hyphen across lines:
  // e.g. [TXN_1123]\n,\n[TXN_1129]
  text = text.replace(/(\[?TXN[_-][A-Za-z0-9_-]+\]?)\s*\n+\s*([,–\-])\s*\n+\s*(\[?TXN[_-][A-Za-z0-9_-]+\]?)/gi, '$1$2 $3');
  text = text.replace(/(\[?TXN[_-][A-Za-z0-9_-]+\]?)\s*\n+\s*,/gi, '$1,');
  text = text.replace(/,\s*\n+\s*(\[?TXN[_-][A-Za-z0-9_-]+\]?)/gi, ', $1');

  // Collapse broken bold bullets: e.g. "* **\n[TXN_1180]\n ("
  text = text.replace(/\*\s*\*\*\s*\n+\s*(\[?TXN[_-][A-Za-z0-9_-]+\]?)\s*\n+\s*/gi, '* **$1** ');

  // Collapse broken lines within table rows:
  // If an empty line is surrounded by lines starting with '|', remove the empty line
  const lines = text.split('\n');
  const compactedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i].trim();
    if (current === '') {
      // Check if previous and next non-empty lines start with '|'
      const prevLine = compactedLines[compactedLines.length - 1]?.trim() || '';
      let nextLine = '';
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() !== '') {
          nextLine = lines[j].trim();
          break;
        }
      }
      if (prevLine.startsWith('|') && nextLine.startsWith('|')) {
        continue; // skip the accidental blank line inside the table
      }
    }
    compactedLines.push(lines[i]);
  }

  return compactedLines.join('\n');
}

/**
 * Cleans LaTeX formulas for friendly UI display
 */
function cleanLatexFormula(latex: string): string {
  return latex
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/\\\$/g, '$')
    .replace(/\\quad/g, ' ')
    .replace(/\\,/g, ' ')
    .trim();
}

type BlockType =
  | { type: 'heading'; level: number; text: string }
  | { type: 'table'; headers: string[]; rows: string[][]; alignments: ('left' | 'center' | 'right')[] }
  | { type: 'math'; formula: string }
  | { type: 'divider' }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'paragraph'; text: string };

export const FinancialMarkdown: React.FC<FinancialMarkdownProps> = ({
  content,
  onSelectCitation,
}) => {
  const sanitized = sanitizeFinancialMarkdown(content);
  const rawLines = sanitized.split('\n');

  const blocks: BlockType[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Dividers (--- or ***)
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: 'divider' });
      i++;
      continue;
    }

    // 2. Display Math ($$ ... $$)
    if (trimmed.startsWith('$$')) {
      if (trimmed.endsWith('$$') && trimmed.length > 4) {
        blocks.push({ type: 'math', formula: trimmed.slice(2, -2).trim() });
        i++;
        continue;
      } else {
        // Multi-line math
        const mathLines: string[] = [trimmed.slice(2)];
        i++;
        while (i < rawLines.length && !rawLines[i].trim().endsWith('$$')) {
          mathLines.push(rawLines[i]);
          i++;
        }
        if (i < rawLines.length) {
          const lastLine = rawLines[i].trim();
          mathLines.push(lastLine.slice(0, -2));
          i++;
        }
        blocks.push({ type: 'math', formula: mathLines.join(' ').trim() });
        continue;
      }
    }

    // 3. Headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // 4. Tables (| ... |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) => {
          return rowStr
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
        };

        const headers = parseRow(tableLines[0]);
        let separatorIdx = 1;
        const separatorRow = parseRow(tableLines[1]);

        // Determine alignments from separator row (e.g. :---, :---:, ---:)
        const alignments: ('left' | 'center' | 'right')[] = separatorRow.map((col) => {
          const starts = col.startsWith(':');
          const ends = col.endsWith(':');
          if (starts && ends) return 'center';
          if (ends) return 'right';
          return 'left';
        });

        const rows: string[][] = [];
        for (let r = separatorIdx + 1; r < tableLines.length; r++) {
          const cells = parseRow(tableLines[r]);
          if (cells.length > 0 && cells.some((c) => c.length > 0)) {
            rows.push(cells);
          }
        }

        blocks.push({
          type: 'table',
          headers,
          rows,
          alignments,
        });
        continue;
      }
    }

    // 5. Ordered Lists (1. 2. 3. ...)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length) {
        const cur = rawLines[i].trim();
        const m = cur.match(/^\d+\.\s+(.+)$/);
        if (m) {
          items.push(m[1].trim());
          i++;
        } else if (items.length > 0 && cur && !cur.startsWith('#') && !cur.startsWith('|') && !cur.startsWith('$$')) {
          // Continuation line of previous list item
          items[items.length - 1] += ' ' + cur;
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    // 6. Bullet Lists (*, -, •)
    if (/^[•\-\*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < rawLines.length) {
        const cur = rawLines[i].trim();
        const m = cur.match(/^[•\-\*]\s+(.+)$/);
        if (m) {
          items.push(m[1].trim());
          i++;
        } else if (items.length > 0 && cur && !cur.startsWith('#') && !cur.startsWith('|') && !cur.startsWith('$$')) {
          // Continuation line
          items[items.length - 1] += ' ' + cur;
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    // 7. General Paragraph
    const paraLines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() &&
      !rawLines[i].trim().startsWith('#') &&
      !rawLines[i].trim().startsWith('|') &&
      !rawLines[i].trim().startsWith('$$') &&
      !rawLines[i].trim().startsWith('---') &&
      !/^\d+\.\s+/.test(rawLines[i].trim()) &&
      !/^[•\-\*]\s+/.test(rawLines[i].trim())
    ) {
      paraLines.push(rawLines[i].trim());
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  /**
   * Helper to format inline text:
   * - Interactive [TXN_...] citation badges
   * - Bold **text**
   * - Inline math $...$
   * - Code `...`
   */
  const renderInline = (rawText: string) => {
    // Regex matches citations, bold segments, math segments, code segments
    // Tokens: [TXN_...], **bold**, *italic*, $math$, `code`
    const tokenRegex = /(\[?TXN[_-][A-Za-z0-9_-]+\]?|\*\*[^*]+\*\*|\*(?!\*)[^*]+\*|\$[^\$]+\$|`[^`]+`)/g;
    const parts = rawText.split(tokenRegex);

    return parts.map((part, pIdx) => {
      if (!part) return null;

      // 1. Transaction Citation Match
      const citationMatch = part.match(/\[?(TXN[_-][A-Za-z0-9_-]+)\]?/i);
      if (citationMatch) {
        const txnId = citationMatch[1];
        return (
          <button
            key={pIdx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCitation(txnId);
            }}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 font-mono text-[11px] font-semibold transition-all group cursor-pointer shadow-sm align-middle hover:scale-105 active:scale-95"
            title={`Inspect transaction [${txnId}] in ledger modal`}
          >
            <FileText className="w-2.5 h-2.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>[{txnId}]</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
          </button>
        );
      }

      // 2. Bold text **...**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const inner = part.slice(2, -2);
        return (
          <strong key={pIdx} className="font-bold text-white tracking-tight">
            {renderInline(inner)}
          </strong>
        );
      }

      // 2b. Italic text *...*
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 3 && !part.startsWith('**')) {
        const inner = part.slice(1, -1);
        return (
          <em key={pIdx} className="italic text-slate-300">
            {renderInline(inner)}
          </em>
        );
      }

      // 3. Inline Math $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2 && !part.includes(' ')) {
        // Plain currency dollar sign like $5,000, don't treat as LaTeX if single number
        if (/^\$[\d,\.]+(\s*(?:M|K|k|m))?$/.test(part)) {
          return <span key={pIdx} className="font-mono font-semibold text-emerald-300">{part}</span>;
        }
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const cleanedFormula = cleanLatexFormula(part.slice(1, -1));
        return (
          <span
            key={pIdx}
            className="inline-block px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-medium mx-0.5"
          >
            {cleanedFormula}
          </span>
        );
      }

      // 4. Inline Code `...`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 rounded bg-slate-950 text-emerald-300 font-mono text-[11px] border border-slate-800"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return <span key={pIdx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-3.5 text-xs text-slate-200 leading-relaxed font-sans">
      {blocks.map((block, bIdx) => {
        // Headings
        if (block.type === 'heading') {
          if (block.level === 1 || block.level === 2) {
            return (
              <div key={bIdx} className="pt-2 pb-1 border-b border-slate-800/80 mb-2">
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  <span className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500"></span>
                  <span>{block.text}</span>
                </h3>
              </div>
            );
          }
          return (
            <h4
              key={bIdx}
              className="text-xs font-bold text-emerald-300 tracking-wide pt-1.5 flex items-center gap-1.5"
            >
              <span>{block.text}</span>
            </h4>
          );
        }

        // Horizontal Rule
        if (block.type === 'divider') {
          return (
            <div key={bIdx} className="py-1">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700/80 to-transparent" />
            </div>
          );
        }

        // Display Math Block
        if (block.type === 'math') {
          const formulaClean = cleanLatexFormula(block.formula);
          return (
            <div
              key={bIdx}
              className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 shadow-inner flex items-center gap-2.5 overflow-x-auto text-[11px]"
            >
              <div className="p-1 rounded bg-cyan-500/20 text-cyan-400 shrink-0">
                <Calculator className="w-3.5 h-3.5" />
              </div>
              <div className="font-mono text-cyan-200 tracking-wide font-medium whitespace-nowrap">
                {formulaClean}
              </div>
            </div>
          );
        }

        // Tables
        if (block.type === 'table') {
          return (
            <div
              key={bIdx}
              className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-[#090e1a] shadow-lg"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
                    {block.headers.map((h, hIdx) => {
                      const align = block.alignments[hIdx] || 'left';
                      return (
                        <th
                          key={hIdx}
                          className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 ${
                            align === 'center'
                              ? 'text-center'
                              : align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {block.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-800/30 transition-colors odd:bg-slate-950/40"
                    >
                      {row.map((cell, cIdx) => {
                        const align = block.alignments[cIdx] || 'left';
                        const isFavorable = cell.includes('(Favorable)') || cell.startsWith('+$');
                        const isUnfavorable = cell.includes('(Unfavorable)') || cell.startsWith('-$');
                        return (
                          <td
                            key={cIdx}
                            className={`px-3 py-2 text-xs ${
                              align === 'center'
                                ? 'text-center'
                                : align === 'right'
                                ? 'text-right'
                                : 'text-left'
                            } ${
                              isFavorable
                                ? 'text-emerald-300 font-semibold'
                                : isUnfavorable
                                ? 'text-rose-300 font-semibold'
                                : 'text-slate-300'
                            }`}
                          >
                            {renderInline(cell)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Lists
        if (block.type === 'list') {
          return (
            <div key={bIdx} className="space-y-2 pl-0.5">
              {block.items.map((item, itemIdx) => {
                return (
                  <div key={itemIdx} className="flex items-start gap-2.5">
                    {block.ordered ? (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800/90 border border-slate-700 text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {itemIdx + 1}
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-xs mt-0.5 font-bold shrink-0">
                        •
                      </span>
                    )}
                    <div className="flex-1 leading-relaxed text-slate-200">
                      {renderInline(item)}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Paragraphs
        return (
          <p key={bIdx} className="leading-relaxed">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
};
