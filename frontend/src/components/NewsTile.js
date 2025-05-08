import React from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../services/api';
import './NewsTile.css';

const NewsTile = ({ article }) => {
  return (
    <Link to={`/article/${article._id}`} className="news-tile">
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
  );
};

export default NewsTile; 