import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../styles/ArticleDetail.css';
import {getArticle, loginOAuth, verifyToken} from '../services/api'
import Swal from 'sweetalert2'
import { useGoogleHook } from '../hooks/gHook';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  
  let gHook = useGoogleHook('/source/'+id,false);

  // Check if user came from sources page
  const cameFromSources = location.state?.from === 'sources';

  const handleBackNavigation = () => {
    if (cameFromSources) {
      // If came from sources, go back to homepage
      navigate('/');
    } else {
      // If came from homepage or direct link, go to homepage
      navigate('/');
    }
  };
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        //const response = await axios.get(`${url}/news/${id}`);
        const response = await getArticle(id);
        if (response) {
          setArticle(response);
          
          // Check if article is already bookmarked
          const existingBookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
          const isBookmarked = existingBookmarks.some(bookmark => bookmark.id === response._id);
          setIsSaved(isBookmarked);
        } else {
          setError('Article not found');
        }
      } catch (error) {
        setError('Failed to load article. Please try again later.');
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticle();

    window.scrollTo({
      top: 0,
      behavior: "smooth", // Adds a nice scroll animation
    });

  }, [id]);

  async function verifyAccessToken() {
    try {
      let status = await verifyToken();
      navigate('/source/'+id);
    }
    catch(e) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "Session Expired!",
        showConfirmButton: false,
        timer: 4000,
      });
      let role = localStorage.getItem('user_role');
      localStorage.removeItem('token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      if(role=='admin') {
        navigate('/login?ru=/source/'+id);
      }
      else {
        navigate(window.location.pathname);
        googleAuth();
      }
    }
  }

  function checkLogin(id) {
    if(localStorage.getItem('token')) {
      verifyAccessToken();
    }
    else {
      googleAuth();
    }
  }

  let googleAuth = () => gHook();

  const handleSave = async () => {
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
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
  
  return (
    <div className="article-detail">
      <button className="back-button" onClick={handleBackNavigation}>
        ← Back to Articles
      </button>
      
      <div className="article-header" id="mainDiv">
        <div className="article-title-section">
          <h1 style={{overflowWrap: 'break-word'}}>{article.title}</h1>
          <div className="article-actions">
            <button 
              className={`action-btn save-btn ${isSaved ? 'saved' : ''}`}
              onClick={handleSave}
              title={isSaved ? 'Remove from saved' : 'Save article'}
            >
              <i className={`fas ${isSaved ? 'fa-bookmark' : 'fa-bookmark'}`} style={{color: isSaved ? '#fff' : '#666'}}></i>
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
        <div className="article-meta">
          <span className="category">{article.category}</span>
          <span className="date">
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="article-image">
        <img style={{objectFit: 'contain'}}
          src={article.imageUrl}
          alt={article.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/800x400';
          }}
        />
      </div>
      
      <div className="article-content">
        <div className="article-summary">
          <h2>Summary</h2>
          <p style={{overflowWrap: 'break-word'}}>{article.summary}</p>
        </div>
        
        <div className="article-body">
          <h2>Full Article</h2>
          <p style={{overflowWrap: 'break-word'}}>{article.content}</p>
        </div>

        
        
        <div className="news-sources-container">
          
          <button 
            className="news-sources-button"
            onClick={() => navigate('/source/'+id)}
          >
            News Sources
          </button>

        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;