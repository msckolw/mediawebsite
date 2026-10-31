const https = require('node:https');
const dns = require('node:dns').promises;
const { isPublicAddress } = require('../imagePolicy');
const { sourceUrl, outletFor } = require('./policy');

function decode(value) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => {
    const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1),16) : Number(code);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
  }).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, x => ({ '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' ' }[x]));
}
function strip(value) {
  return decode(value.replace(/<(script|style|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
    .replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
}
function extractArticle(html) {
  if (/"isAccessibleForFree"\s*:\s*(?:false|"false")/i.test(html)) throw new Error('Subscription content; no paywall bypass attempted.');
  const title = strip((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [,''])[1]).slice(0,300);
  const date = html.match(/(?:"datePublished"\s*:\s*"|(?:property|name)=["']article:published_time["'][^>]*content=["'])(\d{4}-\d{2}-\d{2}[^"']*)/i)?.[1]
    || html.match(/content=["'](\d{4}-\d{2}-\d{2}[^"']*)["'][^>]*(?:property|name)=["']article:published_time["']/i)?.[1];
  if (!date || !Number.isFinite(Date.parse(date))) throw new Error('Could not verify the publication date on this page.');
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]
    || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!article) throw new Error('No readable article body found. JavaScript-only pages are not supported yet.');
  const content = strip(article);
  if (content.length < 600) throw new Error('Insufficient readable text; page may be blocked or paywalled.');
  return { title, publicationDate: date.slice(0,10), text: content.slice(0,10000), truncated: content.length > 10000 };
}
async function downloadPage(value, outlets, redirects = 0, lookup = dns.lookup) {
  const url = new URL(sourceUrl(value, outlets));
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new Error('Source must resolve only to public IP addresses.');
  const address = addresses[0];
  return new Promise((resolve,reject) => {
    const request = https.get(url, { lookup: (_host, options, cb) => options?.all ? cb(null,[address]) : cb(null,address.address,address.family),
      headers: { Accept: 'text/html', 'Accept-Encoding':'identity', 'User-Agent':'NoBiasMedia-Research/1.0' } }, response => {
      if ([301,302,303,307,308].includes(response.statusCode)) {
        response.resume();
        if (redirects >= 3 || !response.headers.location) return reject(new Error('Too many redirects.'));
        try { resolve(downloadPage(new URL(response.headers.location,url).href, outlets, redirects + 1, lookup)); } catch (error) { reject(error); }
        return;
      }
      if (response.statusCode !== 200 || !/text\/html/i.test(response.headers['content-type'] || '')) {
        response.resume(); return reject(new Error(`Source is not readable HTML (HTTP ${response.statusCode}).`));
      }
      let size = 0; const chunks = [];
      response.on('data', chunk => { size += chunk.length; if (size > 2000000) request.destroy(new Error('Source page exceeds the download limit.')); else chunks.push(chunk); });
      response.on('error',reject);
      response.on('end', () => resolve({ url: url.href, html: Buffer.concat(chunks).toString('utf8') }));
    });
    const timer = setTimeout(() => request.destroy(new Error('Source read timed out.')),12000);
    request.on('close', () => clearTimeout(timer)); request.on('error',reject);
  });
}
async function readSources(candidates, assignment, download = downloadPage) {
  const seen = new Set(); const sources = [];
  for (const candidate of candidates) {
    let url;
    try { url = sourceUrl(candidate.url, assignment.outlets); } catch { continue; }
    if (seen.has(url)) continue;
    if (seen.size >= 8) break;
    seen.add(url);
    const outlet = outletFor(url, assignment.outlets);
    const source = { id: `S${sources.length + 1}`, url, outlet: outlet.name, category: outlet.category, status: 'unavailable' };
    try {
      const page = await download(url, assignment.outlets);
      const extracted = extractArticle(page.html);
      if (extracted.publicationDate < assignment.fromDate || extracted.publicationDate > assignment.toDate) throw new Error('Publication date is outside the assignment range.');
      Object.assign(source, extracted, { status:'read', resolvedUrl:page.url, retrievedAt: new Date() });
    } catch (error) { source.reason = error.message; }
    sources.push(source);
  }
  return sources;
}
module.exports = { extractArticle, downloadPage, readSources };
