import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

// Subconjunto seguro de Markdown para os guias: títulos, listas, blocos de código, `código`, **negrito** e links HTTPS.
// Gera elementos React (nunca HTML cru), então nada do conteúdo vira script na página.
export function Inline({ text }) {
  const parts = [];
  // Links: só https, e http apenas para o localhost (ex.: n8n rodando no computador da pessoa).
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|\[([^\]]+)\]\((https:\/\/[^\s)]+|http:\/\/localhost(?::\d+)?[^\s)]*)\)/g;
  let last = 0, match;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) parts.push(<code key={match.index}>{match[1].slice(1, -1)}</code>);
    else if (match[2]) parts.push(<strong key={match.index}>{match[2].slice(2, -2)}</strong>);
    else parts.push(<a key={match.index} href={match[4]} target="_blank" rel="noopener noreferrer">{match[3]}</a>);
    last = pattern.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* seleção manual continua possível */ }
  };
  return <div className="c-code"><div className="c-code-bar"><span>{lang || "código"}</span><button type="button" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copiado" : "Copiar"}</button></div><pre><code>{code}</code></pre></div>;
}

export default function Markdown({ source }) {
  const lines = (source || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^```\s*([\w-]*)/);
    if (fence) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(<CodeBlock key={blocks.length} lang={fence[1]} code={code.join("\n")} />);
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)/);
    if (heading) {
      const Tag = "h" + Math.min(heading[1].length + 1, 4);
      blocks.push(<Tag key={blocks.length}><Inline text={heading[2]} /></Tag>);
      i++;
      continue;
    }
    const listItem = /^\s*(?:[-*]|\d+\.)\s+/;
    if (listItem.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && listItem.test(lines[i])) items.push(lines[i++].replace(listItem, ""));
      const List = ordered ? "ol" : "ul";
      blocks.push(<List key={blocks.length}>{items.map((t, n) => <li key={n}><Inline text={t} /></li>)}</List>);
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s)/.test(lines[i]) && !listItem.test(lines[i])) paragraph.push(lines[i++]);
    blocks.push(<p key={blocks.length}><Inline text={paragraph.join(" ")} /></p>);
  }
  return <div className="c-markdown">{blocks}</div>;
}
