import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useArticleFeed } from '../hooks/useArticleFeed';
import '../styles/Home.css';

export const storyDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function StoryImage({ article, priority = false }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [article.imageUrl]);
  return <div className="nb-story-image">
    {article.imageUrl && !failed ? <img src={article.imageUrl} alt="" loading={priority ? 'eager' : 'lazy'} onError={() => setFailed(true)} /> : <div className="nb-image-fallback"><img src="/NBM Transparent logo.png" alt="" /></div>}
  </div>;
}

function Story({ article, returnTo }) {
  return <article className="nb-story">
    <Link className="nb-story-visual" to={`/article/${article._id}`} state={{ returnTo }} aria-label={`Read: ${article.title}`} tabIndex={-1}><StoryImage article={article} /></Link>
    <div className="nb-story-copy">
      <div className="nb-story-meta"><span>{article.category || 'News'}</span><time dateTime={article.createdAt}>{storyDate(article.createdAt)}</time></div>
      <h2><Link to={`/article/${article._id}`} state={{ returnTo }}>{article.title}</Link></h2>
      <p className="nb-story-summary">{article.summary}</p>
      <div className="nb-story-paths"><Link to={`/article/${article._id}`} state={{ returnTo }}>Read More <span aria-hidden="true">→</span></Link><Link to={`/source/${article._id}`} state={{ returnTo }}>News Sources <span aria-hidden="true">↗</span></Link></div>
    </div>
  </article>;
}

export default function ArticleFeed({ category }) {
  const { articles, loading, busy, error, pageSettings, fetchArticles } = useArticleFeed(category);
  const { pathname } = useLocation();
  const title = category ? category.replace(/\b\w/g, c => c.toUpperCase()) : 'Latest News';
  return <div className="nb-feed" id="mainDiv">
    <header className="nb-simple-heading"><h1>{title}</h1></header>
    {error && <div className="nb-feedback" role="alert"><p>{error}</p><button onClick={() => fetchArticles(1)}>Try again</button></div>}
    {loading ? <div className="nb-skeleton-grid" role="status" aria-label="Loading stories">{[0, 1, 2, 3].map(n => <div className="nb-skeleton" key={n}><div /><span /><span /><span /></div>)}</div> : articles.length ? <>
      <div className="nb-simple-grid">{articles.map(article => <Story key={article._id} article={article} returnTo={pathname} />)}</div>
      <div className="nb-pagination" aria-live="polite">{pageSettings.currentPage < pageSettings.totalPages ? <button disabled={busy} onClick={() => fetchArticles(pageSettings.currentPage + 1)}>{busy ? 'Loading…' : 'Load more'}</button> : null}</div>
    </> : !error && <div className="nb-feedback"><h2>No articles found.</h2><p>Check back soon or explore another category.</p>{category && <Link to="/">Back to all news →</Link>}</div>}
  </div>;
}
