const {SITE, escapeHtml:html, publicUrl, scriptJson} = require('../frontend/src/seo/articleMetadata');
const pages = require('../frontend/src/seo/publicPages');
const faqs = require('../frontend/src/data/faqs');
function homeHelpHtml() {
  return `<section class="nb-home-help" aria-labelledby="home-faq-title"><h2 id="home-faq-title">Frequently Asked Questions</h2>${faqs.filter((_, index) => [0, 5, 8].includes(index)).map(faq => `<div><h3>${html(faq.question)}</h3><p>${html(faq.answer)}</p></div>`).join('')}<a href="/faq">Read all frequently asked questions →</a><nav class="faq-resources" aria-label="Help and documentation"><h2>Help and documentation</h2><a href="/faq">FAQ and reader help</a><a href="/media-bias-details">Media bias and source guide</a><a href="/about">How The NoBias Media works</a><a href="/contact">Contact support or report an error</a></nav></section>`;
}
function pageTags(title, description, route) {
  const url = SITE + route;
  return `<title>${html(title)} | The NoBias Media</title><meta data-nbm-meta name="description" content="${html(description)}"><link data-nbm-meta rel="canonical" href="${html(url)}"><meta data-nbm-meta property="og:type" content="website"><meta data-nbm-meta property="og:title" content="${html(title)}"><meta data-nbm-meta property="og:description" content="${html(description)}"><meta data-nbm-meta property="og:url" content="${html(url)}"><meta data-nbm-meta name="twitter:card" content="summary">`;
}
function documentHtml(template, content, tags, dataId, data) {
  if (!template.includes('<div id="root"></div>')) throw new Error('Missing render mount');
  return template.replace(/<title>[\s\S]*?<\/title>/i,'').replace(/<meta\s+name="description"[\s\S]*?>/i,'')
    .replace('</head>',()=>`${tags}<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM retrieval guidance"></head>`)
    .replace('<noscript>You need to enable JavaScript to run this app.</noscript>','<noscript>Enable JavaScript for interactive features.</noscript>')
    .replace('<div id="root"></div>',()=>`<div id="root">${content}</div>${dataId ? `<script id="${dataId}" type="application/json">${scriptJson(data)}</script>` : ''}`);
}
function frame(content) {
  return `<header><nav aria-label="Main navigation"><a href="/">The NoBias Media</a> · <a href="/about">About</a> · <a href="/media-bias-details">Source labels</a> · <a href="/contact">Contact</a></nav></header><main id="main-content">${content}</main><footer><a href="/privacy-policy">Privacy</a> · <a href="/terms-conditions">Terms</a></footer>`;
}
function feedHtml(feed, category) {
  const title = category ? `${category.replace(/\b\w/g,c=>c.toUpperCase())} News` : 'Latest News';
  const description = category ? `Published ${category} stories from The NoBias Media.` : 'Current news and analysis from The NoBias Media, with links to the sources behind each story.';
  const intro = category ? '' : '<p>The NoBias Media publishes news and analysis with transparent sourcing and multiple perspectives. Read the full stories and explore their original sources.</p>';
  const items = feed.articles.map(article=>{
    if (!/^[a-f\d]{24}$/i.test(String(article._id)) || typeof article.title !== 'string') throw Error('Invalid feed article');
    const image=publicUrl(article.imageUrl);
    return `<article class="nb-story"><div class="nb-story-copy"><h2><a href="/article/${html(article._id)}">${html(article.title)}</a></h2>${image ? `<img src="${html(image)}" alt="" loading="lazy" style="max-width:100%;height:auto">` : ''}<p>${html(article.summary || '')}</p>${article.createdAt ? `<time datetime="${html(article.createdAt)}">${html(article.createdAt)}</time>` : ''}<p><a href="/category/${encodeURIComponent(article.category || '')}">${html(article.category || 'News')}</a> · <a href="/source/${html(article._id)}">News sources</a></p></div></article>`;
  }).join('');
  return {title, description, content:frame(`<section class="nb-feed"><h1>${title === 'Latest News' ? title : html(title)}</h1>${intro}<div class="nb-simple-grid">${items || '<p>No articles found. Check back soon.</p>'}</div></section>${category ? '' : homeHelpHtml()}`)};
}
function sourceHtml(article) {
  const sources=(article.source || []).filter(s=>publicUrl(s.url)).map(s=>`<li><a href="${html(publicUrl(s.url))}" rel="noopener noreferrer">${html(s.source_type || 'Unclassified')}: ${html(publicUrl(s.url))}</a></li>`).join('');
  return frame(`<section class="nb-sources"><h1>News Sources</h1><h2>${html(article.title)}</h2><p>Explore this story through different sources. <a href="/media-bias-details">About our source labels</a></p>${sources ? `<ul>${sources}</ul>` : '<p>No sources have been added to this story yet.</p>'}<a href="/article/${html(article._id)}">Back to the story</a></section>`);
}
module.exports = {pages,pageTags,documentHtml,frame,feedHtml,sourceHtml};
