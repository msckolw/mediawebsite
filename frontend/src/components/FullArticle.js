import React from 'react';
import { useParams } from 'react-router-dom';
import './FullArticle.css';

const FullArticle = () => {
  const { id } = useParams();
  
  // This would typically come from an API call
  const article = {
    id: id,
    title: "Sample Article Title",
    category: "Politics",
    author: "John Doe",
    date: new Date(),
    imageUrl: "https://via.placeholder.com/800x400",
    content: `
      <p>This is the full article content. It can include multiple paragraphs, images, and other rich text elements.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    `
  };

  return (
    <article className="full-article">
      <div className="article-header">
        <span className="category">{article.category}</span>
        <h1 className="title">{article.title}</h1>
        <div className="article-meta">
          <span className="author">By {article.author}</span>
          <span className="date">{new Date(article.date).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="article-image">
        <img src={article.imageUrl} alt={article.title} />
      </div>
      <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
};

export default FullArticle; 