const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml: html, scriptJson, publicUrl, metadataTags } = require('../frontend/src/seo/articleMetadata');

// Keep only real client routes here. Unknown discovery documents must return 404.
const clientRoutes = new Set(['/', '/login', '/admin', '/admin/assistant', '/privacy-policy', '/privacy',
  '/privacypolicy', '/terms-conditions', '/terms-and-conditions', '/terms', '/termsandconditions',
  '/terms-of-use', '/refund-policy', '/refund', '/refundpolicy', '/cancellation-policy',
  '/delete-account', '/copyright-claims', '/about', '/media-bias-details', '/contact',
  '/bookmarks', '/donate', '/donate/status']);

function articleHtml(article) {
  const image = publicUrl(article.imageUrl);
  const sources = (article.source || []).filter(s => publicUrl(s.url)).map(s =>
    `<li><a href="${html(publicUrl(s.url))}" rel="noopener noreferrer">${html(s.source_type || s.url)}</a></li>`).join('');
  return `<header><a href="/">The NoBias Media</a></header><main id="main-content"><article class="nb-reader">
    <a href="/">Back to stories</a><header><p><a href="/category/${encodeURIComponent(article.category || '')}">${html(article.category)}</a></p>
    <h1>${html(article.title)}</h1>${article.createdAt ? `<time datetime="${html(article.createdAt)}">${html(article.createdAt)}</time>` : ''}
    <p>${html(article.summary)}</p></header>
    ${image ? `<figure><img src="${html(image)}" alt="" style="max-width:100%;height:auto">${article.imageCaption || article.imageCredit ? `<figcaption>${html(article.imageCaption || '')} ${html(article.imageCredit || '')}</figcaption>` : ''}</figure>` : ''}
    <div>${String(article.content || '').split(/\r?\n/).filter(p => p.trim()).map(p => `<p>${html(p)}</p>`).join('')}</div>
    ${sources ? `<section><h2>News sources</h2><ul>${sources}</ul></section>` : ''}
    <a href="/source/${html(article._id)}">View news sources</a></article></main>`;
}
function createHandler({ fetchImpl = fetch, readTemplate = () => fs.readFileSync(path.join(process.cwd(), 'frontend/build/index.html'), 'utf8') } = {}) {
  return async function handler(req, res) {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end();
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');
    const route = typeof req.query?.route === 'string' ? req.query.route : '';
    const send = (code, body, type = 'text/html; charset=utf-8') => {
      res.setHeader('Content-Type', type);
      return res.status(code).send(req.method === 'HEAD' ? '' : body);
    };
    const errorPage = (code, title) => send(code, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>${title} | The NoBias Media</title></head><body><main><h1>${title}</h1><a href="/">Back to news</a></main></body></html>`);
    try {
      const apiBase = (process.env.SITE_API_URL || process.env.REACT_APP_API_URL || 'https://thenbm-329287861933.asia-south1.run.app/api').replace(/\/+$/, '');
      if (route === '/sitemap.xml' || /^\/sitemaps\/[1-9]\d*\.xml$/.test(route)) {
        const upstream = await fetchImpl(`${apiBase}${route}`, { signal:AbortSignal.timeout(15000), headers:{Accept:'application/xml'} });
        if (upstream.status === 404) return errorPage(404, 'Page not found');
        if (!upstream.ok || !/xml/i.test(upstream.headers.get('content-type') || '')) throw Error('Sitemap unavailable');
        return send(200, await upstream.text(), 'application/xml; charset=utf-8');
      }
      if (route.startsWith('/article/')) {
        const match = /^\/article\/([a-f\d]{24})\/?$/i.exec(route);
        if (!match) return errorPage(404, 'Article not found');
        const response = await fetchImpl(`${apiBase}/news/${match[1]}?source=true&media=url`, {
          headers:{Accept:'application/json'}, signal:AbortSignal.timeout(15000)
        });
        if (response.status === 404 || response.status === 400) return errorPage(404, 'Article not found');
        if (!response.ok) throw Error('Article unavailable');
        const article = await response.json();
        if (String(article._id).toLowerCase() !== match[1].toLowerCase() || !article.title || !article.content) throw Error('Invalid article response');
        let template = readTemplate();
        template = template.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta\s+name="description"[\s\S]*?>/i, '');
        template = template.replace('</head>', () => `${metadataTags(article)}</head>`);
        template = template.replace('<noscript>You need to enable JavaScript to run this app.</noscript>', '<noscript>Enable JavaScript to save and share stories.</noscript>');
        template = template.replace('<div id="root"></div>', () => `<div id="root">${articleHtml(article)}</div><script id="nbm-article-data" type="application/json">${scriptJson(article)}</script>`);
        return send(200, template);
      }
      if (clientRoutes.has(route) || /^\/category\/[^/]+\/?$/.test(route) || /^\/source\/[a-f\d]{24}\/?$/i.test(route)) {
        return send(200, readTemplate());
      }
      return errorPage(404, 'Page not found');
    } catch {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Retry-After', '30');
      return errorPage(503, 'Temporarily unavailable');
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports.articleHtml = articleHtml;
