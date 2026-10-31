import { useSession } from '../context/SessionContext';
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import '../styles/ArticleDetail.css';
import {getArticle} from '../services/api'
import Swal from 'sweetalert2'
import { StoryImage, storyDate } from '../components/ArticleFeed';

const ArticleDetail = () => {
  const { id } = useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const returnTo = location.state?.returnTo?.startsWith('/category/') ? location.state.returnTo : '/';
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getArticle(id).then(response => {
      if (!active) return;
      if (!response) { setError('Article not found'); return; }
      setArticle(response);
      let bookmarks = [];
      try { bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]'); } catch { /* Ignore damaged local bookmarks. */ }
      setIsSaved(Array.isArray(bookmarks) && bookmarks.some(bookmark => bookmark.id === response._id));
    }).catch(() => { if (active) setError('Failed to load article. Please try again later.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleSave = async () => {
    if (!user) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Please login to save articles",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // Get existing bookmarks from localStorage
    const existingBookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');

    if (!isSaved) {
      // Add to bookmarks
      const bookmarkData = {
        id: article._id,
        title: article.title,
        summary: article.summary,
        imageUrl: article.imageUrl,
        category: article.category,
        createdAt: article.createdAt,
        bookmarkedAt: new Date().toISOString()
      };

      existingBookmarks.push(bookmarkData);
      localStorage.setItem('bookmarkedArticles', JSON.stringify(existingBookmarks));
      setIsSaved(true);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Article saved to bookmarks!",
        showConfirmButton: false,
        timer: 2000,
      });
    } else {
      // Remove from bookmarks
      const updatedBookmarks = existingBookmarks.filter(bookmark => bookmark.id !== article._id);
      localStorage.setItem('bookmarkedArticles', JSON.stringify(updatedBookmarks));
      setIsSaved(false);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: "Article removed from bookmarks",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: article.title,
          text: article.summary,
          url: window.location.href
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          throw new Error('Cannot share this content');
        }
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Link copied to clipboard!",
          showConfirmButton: false,
          timer: 2000,
        });
      } catch (clipboardError) {
        // Final fallback
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Link copied to clipboard!",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    }
  };



  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading article...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="back-button">
          Return to Home
        </button>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="error-container">
        <p>Article not found</p>
        <button onClick={() => navigate('/')} className="back-button">
          Return to Home
        </button>
      </div>
    );
  }

  return <article className="nb-reader" id="mainDiv">
    <Link className="nb-back-link" to={returnTo}>← Back to stories</Link>
    <header className="nb-reader-heading"><div className="nb-reader-kicker"><Link to={`/category/${article.category}`}>{article.category}</Link><time dateTime={article.createdAt}>{storyDate(article.createdAt)}</time></div><h1>{article.title}</h1><div className="nb-reader-toolbar"><span>THE NOBIAS MEDIA</span><div><button aria-pressed={isSaved} onClick={handleSave}>{isSaved ? 'Saved ✓' : 'Save story +'}</button><button onClick={handleShare}>Share ↗</button></div></div></header>
    <StoryImage article={article} priority />
    {(article.imageCaption || article.imageCredit) && <p className="nb-image-caption">{article.imageCaption}{article.imageCredit && ` Credit: ${article.imageCredit}`}</p>}
    <div className="nb-reading-layout"><div className="nb-reader-body"><h2>Full Article</h2>{String(article.content || '').split(/\n\s*\n|\r?\n/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}<div className="nb-reader-end"><Link to={`/source/${id}`} state={{ returnTo }}>News Sources ↗</Link></div></div></div>
  </article>;
};
export default ArticleDetail;
