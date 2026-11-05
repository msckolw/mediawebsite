const {SITE} = require('../frontend/src/seo/articleMetadata');

// Wildcards alone never opt a browser into Markdown. Prefer HTML on ties.
function prefersMarkdown(accept) {
  if (typeof accept !== 'string') return false;
  const ranges = accept.toLowerCase().split(',').map(part => {
    const [type, ...parameters] = part.trim().split(';');
    const quality = parameters.find(value => /^\s*q\s*=/.test(value));
    const raw = quality ? quality.split('=')[1].trim() : '1';
    const q = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(raw) ? Number(raw) : 0;
    return {type: type.trim(), q};
  });
  const quality = type => {
    const matches = ranges.filter(range => range.type === type);
    return matches.length ? Math.max(...matches.map(range => range.q)) : null;
  };
  const markdown = quality('text/markdown') ?? 0;
  const html = quality('text/html') ?? quality('text/*') ?? quality('*/*') ?? 0;
  return markdown > 0 && markdown > html;
}

function decodeEntities(text) {
  const named = {amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ', ndash:'–', mdash:'—', copy:'©'};
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
    if (name[0] !== '#') return named[name.toLowerCase()] ?? entity;
    const point = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2),16) : Number(name.slice(1));
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : '�';
  });
}
function escapeText(text) {
  return decodeEntities(text).replace(/\s+/g,' ').replace(/[\\`*_{}\[\]!#|~]/g,'\\$&')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^([-+])(?=\s)/,'\\$1').replace(/^(\d+)\.(?=\s)/,'$1\\.');
}
function destination(value) {
  try {
    const url = new URL(decodeEntities(value), SITE);
    if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href.replace(/[<>\s()]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase());
  } catch { return null; }
}

// Converts only the application's own escaped public HTML fragments. This is
// deliberately not an arbitrary-HTML endpoint or a remote-page fetcher.
function publicMarkdown(document, canonical) {
  const main = document.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? document;
  const source = main.replace(/<!--[^]*?-->/g,'')
    .replace(/<(script|style|form|button)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
  const tokens = source.match(/<[^>"']*(?:"[^"]*"[^>"']*|'[^']*'[^>"']*)*>|[^<]+/g) || [];
  let output = '';
  const lists = [];
  const links = [];
  const paragraph = () => { output = output.trimEnd() + '\n\n'; };
  for (const token of tokens) {
    if (token[0] !== '<') { output += escapeText(token); continue; }
    const match = /^<(\/)?([a-z][\w-]*)\b/i.exec(token);
    if (!match) continue;
    const closing = Boolean(match[1]);
    const tag = match[2].toLowerCase();
    const attribute = name => token.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] || '';
    if (/^h[1-6]$/.test(tag) || tag === 'summary') {
      paragraph();
      if (!closing) output += '#'.repeat(tag === 'summary' ? 2 : Number(tag[1])) + ' ';
    } else if (['p','div','section','article','header','footer','aside','address','details','figure','figcaption','nav'].includes(tag)) {
      paragraph();
    } else if (tag === 'br') {
      output = output.trimEnd() + '\n';
    } else if (tag === 'hr') {
      paragraph(); output += '---\n\n';
    } else if (tag === 'ul' || tag === 'ol') {
      if (closing) { lists.pop(); paragraph(); }
      else { paragraph(); lists.push({ordered:tag === 'ol', next:1}); }
    } else if (tag === 'li') {
      if (closing) output = output.trimEnd() + '\n';
      else {
        const list = lists[lists.length - 1];
        output = output.trimEnd() + '\n' + '    '.repeat(Math.max(0,lists.length - 1)) + (list?.ordered ? `${list.next++}. ` : '- ');
      }
    } else if (tag === 'strong' || tag === 'b') {
      output += '**';
    } else if (tag === 'em' || tag === 'i') {
      output += '*';
    } else if (tag === 'a') {
      if (!closing) {
        const url = destination(attribute('href'));
        links.push(url); if (url) output += '[';
      } else {
        const url = links.pop(); if (url) output += `](<${url}>)`;
      }
    } else if (tag === 'img' && !closing) {
      const url = destination(attribute('src'));
      if (url && /^https?:/.test(url)) { paragraph(); output += `![${escapeText(attribute('alt'))}](<${url}>)`; paragraph(); }
    }
  }
  return `${output.trim().replace(/\n{3,}/g,'\n\n')}\n\nCanonical URL: ${new URL(SITE + '/' + String(canonical).replace(/^\/+/, '')).href}\n`;
}

module.exports = {prefersMarkdown, publicMarkdown};
