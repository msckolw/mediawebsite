import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ArticleCard.css';

const ArticleCard = ({ article }) => {
  return (
    <div className="article-card">
      <div className="article-image">
        <img src={article.imageUrl} alt={article.title} />
       
      </div>
      <div className="article-content">
        <div className="article-meta">
          <span className="category">{article.category}</span>
          <span className="date">{new Date(article.createdAt).toLocaleDateString()}</span>
        </div>
        <h3 className="article-title">{article.title}</h3>
        <p className="article-summary">{article.summary}</p>
      </div>
    </div>
  );
};

export default ArticleCard; 