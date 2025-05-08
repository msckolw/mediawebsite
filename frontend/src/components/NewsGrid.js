import React from 'react';
import NewsTile from './NewsTile';
import './NewsGrid.css';

const NewsGrid = ({ articles }) => {
  if (!articles || articles.length === 0) {
    return <div className="no-articles">No articles found.</div>;
  }

  return (
    <div className="news-grid-container">
      <div className="news-grid">
        {articles.map((article) => (
          <NewsTile key={article.id} article={article} />
         
        ))}
         <div> test </div>
      </div>
    </div>
  );
};

export default NewsGrid; 