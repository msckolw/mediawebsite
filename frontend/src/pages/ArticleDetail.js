import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/ArticleDetail.css';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const url = process.env.REACT_APP_API_URL;
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${url}/news/${id}`);
        if (response.data) {
          setArticle(response.data);
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
  }, [id]);
  
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
      
      <div className="article-header">
        <h1>{article.title}</h1>
        <div className="article-meta">
          <span className="category">{article.category}</span>
          <span className="date">
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="article-image">
        <img 
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
          <p>{article.summary}</p>
        </div>
        
        <div className="article-body">
          <h2>Full Article</h2>
          <p>{article.content}</p>
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