// Shared by the Vercel HTML renderer and the React reader.
const SITE = 'https://thenobiasmedia.com';
const DEFAULT_TITLE = 'The NoBias Media';
const DEFAULT_DESCRIPTION = 'The NoBias Media - Delivering unbiased news and analysis from around the world';
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
}
function scriptJson(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
}
function publicUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, SITE);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function isoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
function articleMetadata(article) {
  const url = `${SITE}/article/${article._id}`;
  const image = publicUrl(article.imageUrl);
  const schema = {
    '@context':'https://schema.org', '@type':'NewsArticle',
    '@id':`${url}#article`, mainEntityOfPage:url, url,
    headline:article.title, description:article.summary, articleBody:article.content,
    articleSection:article.category, datePublished:isoDate(article.createdAt),
    dateModified:isoDate(article.updatedAt || article.createdAt),
    publisher:{ '@type':'Organization', name:DEFAULT_TITLE, url:SITE,
      logo:{ '@type':'ImageObject', url:`${SITE}/NBM%20Transparent%20logo.png` } },
    ...(image ? {image:[image]} : {}),
    ...((article.source || []).length ? {citation:article.source.map(s => publicUrl(s.url)).filter(Boolean)} : {})
  };
  return { title:`${article.title} | ${DEFAULT_TITLE}`, description:article.summary || DEFAULT_DESCRIPTION, url, image, schema };
}
function metadataTags(article) {
  const m = articleMetadata(article);
  const meta = (name, value, property = false) => value ? `<meta data-nbm-meta ${property ? 'property' : 'name'}="${name}" content="${escapeHtml(value)}">` : '';
  return `<title>${escapeHtml(m.title)}</title>` +
    meta('description', m.description) + `<link data-nbm-meta rel="canonical" href="${escapeHtml(m.url)}">` +
    meta('og:type','article',true) + meta('og:site_name',DEFAULT_TITLE,true) +
    meta('og:title',article.title,true) + meta('og:description',m.description,true) +
    meta('og:url',m.url,true) + meta('og:image',m.image,true) +
    meta('article:published_time',m.schema.datePublished,true) + meta('article:modified_time',m.schema.dateModified,true) +
    meta('twitter:card',m.image ? 'summary_large_image' : 'summary') +
    meta('twitter:title',article.title) + meta('twitter:description',m.description) + meta('twitter:image',m.image) +
    `<script data-nbm-meta type="application/ld+json">${scriptJson(m.schema)}</script>`;
}
function updateMetadata(document, article) {
  document.head.querySelectorAll('[data-nbm-meta], title, meta[name="description"]').forEach(node => node.remove());
  if (article) document.head.insertAdjacentHTML('beforeend', metadataTags(article));
  else {
    document.title = DEFAULT_TITLE;
    const description = document.createElement('meta');
    description.name = 'description'; description.content = DEFAULT_DESCRIPTION;
    document.head.appendChild(description);
  }
}
module.exports = { SITE, escapeHtml, scriptJson, publicUrl, articleMetadata, metadataTags, updateMetadata };
