// Keep embedded image bytes out of reader JSON while retaining existing records.
function imageVersion(article) {
  return String(new Date(article.updatedAt || article.createdAt || 0).getTime());
}

function decodeInlineImage(value) {
  if (typeof value !== 'string') return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return null;
  return { type: match[1], bytes: Buffer.from(match[2], 'base64') };
}

function presentArticle(value, req) {
  const article = value.toObject ? value.toObject() : { ...value };
  if ((req.query?.view === 'feed' || req.query?.media === 'url') && article.imageUrl?.startsWith('data:image/')) {
    const origin = (process.env.PUBLIC_API_URL || `${process.env.NODE_ENV === 'production' ? 'https' : req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
    article.imageUrl = `${origin}/api/news/${article._id}/image?v=${imageVersion(article)}`;
  }
  return article;
}

module.exports = { imageVersion, decodeInlineImage, presentArticle };
