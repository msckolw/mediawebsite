import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ArticleDetail.css';
import {getArticle, loginOAuth, verifyToken} from '../services/api'
import Swal from 'sweetalert2'
import { useGoogleHook } from '../hooks/gHook';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  let gHook = useGoogleHook('/source/'+id,false);
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        //const response = await axios.get(`${url}/news/${id}`);
        const response = await getArticle(id);
        if (response) {
          setArticle(response);
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
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back to Articles
      </button>
      
      <div className="article-header" id="mainDiv">
        <h1 style={{overflowWrap: 'break-word'}}>{article.title}</h1>
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
            onClick={() => checkLogin(id)}
          >
            News Sources
          </button>

        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;