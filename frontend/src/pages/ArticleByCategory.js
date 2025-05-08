
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Home.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
const ABC = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const { cat } = useParams();

  let navigate = useNavigate();

  let API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if(!cat) {
        navigate('/');
    }
    else {
        fetchArticles();
    }
  }, [cat]);

  function showFullArticle(id) {
    navigate('/article/'+id);
  }

  const fetchArticles = async () => {
    try {
      //console.log('Called Articles');
      const response = await axios.get(`${API_URL}/category/${cat}`);
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      {/* <section className="hero" style={{ height: '35vh' }}	>
        <h1>{cat.toLocaleUpperCase()}</h1>
        <p>Stay updated with the latest news and stories</p>
      </section> */}

      <section className="latest-news">
        {/* <h2>Latest News</h2> */}
        {loading ? (
          <div className="loading">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="no-articles">No articles found.</div>
        ) : (
          <div className="articles-grid">
            {articles.map((article) => (
              <div key={article._id} className="article-card"
              onClick={(e) => showFullArticle(article._id)}>
                <div className="article-image" style={{position: 'relative'}}>
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x200';
                    }}
                  />
                  <span style={{textAlign: 'right', position: 'absolute', padding: '1% 1.5% 0.5% 1.5%',
                    zIndex: '5', top: '0', right: '0', color: '#1e3c72', fontWeight: 'bold',
                    backgroundColor: 'white'
                  }}>
                    {article.category.toUpperCase()}
                  </span>
                </div>
               
                <div className="article-content">
                  <span style={{display: 'flex', justifyContent: 'center',
                    alignItems: 'center'
                  }} className="article-category">
                    <span style={{textAlign: 'left', width: '100%', padding: '0% 1% 0% 1%'}}>{article.title}</span>
                    {/* <span style={{textAlign: 'right', width: '49%', paddingRight: '1%'}}>{article.category.toUpperCase()}</span> */}
                  </span>
                  <p className="article-summary">{article.summary}</p>
                  <Link className="read-more-button">
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ABC; 