const express = require('express');
const News = require('../models/News');
const SITE = 'https://thenobiasmedia.com';
const PAGE_SIZE = 5000;
const STATIC_PATHS = ['/', '/faq', '/about', '/contact', '/media-bias-details', '/privacy-policy',
  '/terms-conditions', '/refund-policy', '/delete-account', '/copyright-claims', '/donate'];
const xml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[c]));
function entry(location, modified) {
  const date = modified ? new Date(modified) : null;
  return `<url><loc>${xml(location)}</loc>${date && !Number.isNaN(date.getTime()) ? `<lastmod>${date.toISOString()}</lastmod>` : ''}</url>`;
}
function createRouter(Model = News) {
  const router = express.Router();
  const send = (res, body) => res.set('Cache-Control', 'no-cache').type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>${body}`);
  router.get('/sitemap.xml', async (req, res) => {
    try {
      const pages = Math.max(1, Math.ceil(await Model.countDocuments() / PAGE_SIZE));
      send(res, `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from({length:pages}, (_, index) => `<sitemap><loc>${SITE}/sitemaps/${index + 1}.xml</loc></sitemap>`).join('')}</sitemapindex>`);
    } catch { res.set('Cache-Control','no-store').status(503).json({message:'Sitemap temporarily unavailable'}); }
  });
  router.get('/sitemaps/:page.xml', async (req, res) => {
    if (!/^[1-9]\d*$/.test(req.params.page)) return res.status(404).end();
    const page = Number(req.params.page);
    try {
      const count = await Model.countDocuments();
      if (!Number.isSafeInteger(page) || page > Math.max(1, Math.ceil(count / PAGE_SIZE))) return res.status(404).end();
      const [articles, categories] = await Promise.all([
        Model.find({}, {_id:1, updatedAt:1, createdAt:1}).sort({_id:1}).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
        page === 1 ? Model.distinct('category') : []
      ]);
      const fixed = page === 1 ? STATIC_PATHS.map(p => entry(`${SITE}${p}`)).join('') +
        categories.filter(c => typeof c === 'string' && c.trim()).sort().map(c => entry(`${SITE}/category/${encodeURIComponent(c)}`)).join('') : '';
      send(res, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${fixed}${articles.map(a => entry(`${SITE}/article/${a._id}`, a.updatedAt || a.createdAt)).join('')}</urlset>`);
    } catch { res.set('Cache-Control','no-store').status(503).json({message:'Sitemap temporarily unavailable'}); }
  });
  return router;
}
module.exports = { createRouter, PAGE_SIZE };
