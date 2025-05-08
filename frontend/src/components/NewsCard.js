import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NewsCard.css';

const NewsCard = ({ article }) => {
  return (
    <div className="news-card">
      <div className="news-image-container">
        <img 
          src={article.imageUrl || 'https://via.placeholder.com/300x200'} 
          alt={article.title}
          className="news-image"
        />
      </div>
      <div className="news-content">
        <h3 className="news-title">{article.title}</h3>
        <p className="news-summary">{article.summary}</p>
        <p className="news-category">{article.category}</p>
        <Link to={`/article/${article._id}`} className="read-more">
          Read More
        </Link>
      </div>
    </div>
  );
};

export default NewsCard; 