import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../services/api';
import './NewsTile.css';

const NewsTile = ({ article }) => {
  const [isSaved, setIsSaved] = useState(false);

  // Check if article is bookmarked when component mounts
  useEffect(() => {
    const existingBookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
    const isBookmarked = existingBookmarks.some(bookmark => bookmark.id === article._id);
    setIsSaved(isBookmarked);
  }, [article._id]);

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      alert('Please login to save articles');
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
      alert('Article saved to bookmarks!');
    } else {
      // Remove from bookmarks
      const updatedBookmarks = existingBookmarks.filter(bookmark => bookmark.id !== article._id);
      localStorage.setItem('bookmarkedArticles', JSON.stringify(updatedBookmarks));
      setIsSaved(false);
      alert('Article removed from bookmarks');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: article.title,
          text: article.summary,
          url: `${window.location.origin}/article/${article._id}`
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
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/article/${article._id}`);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        // Final fallback
        const textArea = document.createElement('textarea');
        textArea.value = `${window.location.origin}/article/${article._id}`;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      }
    }
  };

  return (
    <div className="news-tile">
      <Link to={`/article/${article._id}`} className="news-tile-link">
        <div className="news-tile-content">
          <div className="news-image-container">
            <img 
              src={getImageUrl(article.imageUrl)} 
              alt={article.title} 
              className="news-image"
            />
          </div>
          <div className="news-details">
            <h3 className="news-title">{article.title}</h3>
            <p className="news-summary">{article.summary}</p>
            <div className="news-meta">
              <span className="news-category">{article.category}</span>
              <span className="news-author">By {article.author}</span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Save and Share Icons */}
      <div className="news-actions">
        <button 
          className={`action-btn save-btn ${isSaved ? 'saved' : ''}`}
          onClick={handleSave}
          title={isSaved ? 'Remove from saved' : 'Save article'}
        >
          <i className="fas fa-bookmark" style={{color: isSaved ? '#1a73e8' : '#666'}}></i>
        </button>
        <button 
          className="action-btn share-btn"
          onClick={handleShare}
          title="Share article"
        >
          <i className="fas fa-share-alt"></i>
        </button>
      </div>
    </div>
  );
};

export default NewsTile; 