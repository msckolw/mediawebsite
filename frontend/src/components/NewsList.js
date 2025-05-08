import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../services/api';

const NewsList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get(API_URL+'/news');
        setArticles(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load articles');
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <div className="loading">Loading articles...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="news-grid">
      {articles.map((article) => (
        <article key={article._id} className="news-tile">
          <div className="news-image-container">
            {article.imageUrl && (
              <img
                src={getImageUrl(article.imageUrl)}
                alt={article.title}
                className="news-image"
              />
            )}
          </div>
          <div className="news-content">
            <h2 className="news-title">{article.title}</h2>
            <p className="news-summary">{article.content.substring(0, 150)}...</p>
            <div className="news-meta">
              <div className="news-info">
                <span className="news-category">{article.category}</span>
                <span className="news-author">
                  <i className="fas fa-user"></i>
                  {article.author}
                </span>
                <span className="news-date">
                  <i className="fas fa-calendar"></i>
                  {new Date(article.publishedAt).toLocaleDateString()}
                </span>
              </div>
              <Link to={`/article/${article._id}`} className="view-more">
                View More
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default NewsList; 