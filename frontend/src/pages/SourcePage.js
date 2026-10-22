import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import '../styles/SourcePage.css';
import { getArticle } from '../services/api';
const color = label => /left|liberal/i.test(label) ? '#a33b38' : /right|traditionalist/i.test(label) ? '#285e92' : '#746087';
const safeSource = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url : null; } catch { return null; } };
export default function SourcePage() {
  const { id } = useParams();
  const { state } = useLocation();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setArticle(null);
    getArticle(id, true).then(result => { if (active) setArticle(result); }).catch(() => { if (active) setError('We couldn’t load the sources. Please return to the story and try again.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const groups = (article?.source || []).reduce((result, source) => {
    const url = safeSource(source.url);
    if (url) { const label = source.source_type || 'Unclassified'; (result[label] ||= []).push(url); }
    return result;
  }, {});
  return <section className="nb-sources" id="mainDiv"><Link className="nb-back-link" to={`/article/${id}`} state={state}>← Back to the story</Link><header><h1>News Sources</h1><p>Explore this story through different sources.</p></header>
    {loading ? <p className="nb-source-status" role="status">Loading sources…</p> : error ? <p className="nb-source-status" role="alert">{error}</p> : <>
      {article?.title && <div className="nb-source-story"><h2>{article.title}</h2></div>}
      <div className="nb-source-guide"><p><Link to="/media-bias-details">About our source labels ↗</Link></p></div>
      {Object.keys(groups).length ? <div className="nb-source-groups">{Object.entries(groups).map(([label, urls]) => <details key={label} open><summary style={{ '--source-color': color(label) }}><span className="nb-source-dot" /><h2>{label}</h2><span className="nb-source-count">{urls.length} {urls.length === 1 ? 'source' : 'sources'}</span><span className="nb-source-toggle" aria-hidden="true">+</span></summary><ul>{urls.map((url, i) => <li key={`${url.href}-${i}`}><a href={url.href} target="_blank" rel="noopener noreferrer"><span className="nb-source-index">{String(i + 1).padStart(2, '0')}</span><span><strong>{url.hostname.replace(/^www\./, '')}</strong><small>{url.href}</small></span><span aria-hidden="true">↗</span><span className="nb-visually-hidden"> (opens in a new tab)</span></a></li>)}</ul></details>)}</div> : <p className="nb-source-status">No sources have been added to this story yet.</p>}
    </>}
  </section>;
}
