import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBookmarks, removeBookmark } from '../utils/bookmarkUtils';
import '../styles/Bookmarks.css';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    // Load bookmarks
    const savedBookmarks = getBookmarks();
    setBookmarks(savedBookmarks);
    setLoading(false);
  }, [navigate]);

  const handleRemoveBookmark = (articleId) => {
    if (removeBookmark(articleId)) {
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== articleId));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all bookmarks?')) {
      localStorage.removeItem('bookmarkedArticles');
      setBookmarks([]);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading bookmarks...</p>
      </div>
    );
  }

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <h1>My Bookmarks</h1>
        <p>Your saved articles ({bookmarks.length})</p>
        {bookmarks.length > 0 && (
          <button className="clear-all-btn" onClick={handleClearAll}>
            Clear All Bookmarks
          </button>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <div className="no-bookmarks">
          <h2>No bookmarks yet</h2>
          <p>Start saving articles to see them here!</p>
          <Link to="/" className="browse-articles-btn">
            Browse Articles
          </Link>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bookmark-card">
              <Link to={`/article/${bookmark.id}`} className="bookmark-link">
                <div className="bookmark-image">
                  <img 
                    src={bookmark.imageUrl} 
                    alt={bookmark.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x200';
                    }}
                  />
                  <span className="bookmark-category">{bookmark.category}</span>
                </div>
                <div className="bookmark-content">
                  <h3>{bookmark.title}</h3>
                  <p>{bookmark.summary.length > 150 ? bookmark.summary.substring(0, 150) + '...' : bookmark.summary}</p>
                  <div className="bookmark-meta">
                    <span>Saved: {new Date(bookmark.bookmarkedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
              <button 
                className="remove-bookmark-btn"
                onClick={() => handleRemoveBookmark(bookmark.id)}
                title="Remove bookmark"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;