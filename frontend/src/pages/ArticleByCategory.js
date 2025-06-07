
import React, { useState, useEffect } from 'react';
import '../styles/Home.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {getArticleByCategory} from '../services/api'


const ABC = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const { cat } = useParams();

  let navigate = useNavigate();
  const [pageSetings, setPageSettings] = useState({
    currentPage: 1, totalPages: 1
  });


  useEffect(() => {
    if(!cat) {
        navigate('/');
    }
    else {
        fetchArticles();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth", // Adds a nice scroll animation
    });

  }, [cat]);

  function showFullArticle(id) {
    navigate('/article/'+id);
  }

  

  const fetchArticles = async (page=1) => {
    try {
      const response = await getArticleByCategory(cat,page);
      setArticles(prev => page==1 ? response.articles : [...prev, ...response.articles]);
      if(response.articles.length) {
        setPageSettings({ 
          currentPage: response.currentPage,
          totalPages: response.totalPages
        });
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home" id="mainDiv">
      

      <section className="latest-news">
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading article...</p>
          </div>
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
                    <span style={{textAlign: 'left', width: '98%', padding: '0% 1% 0% 1%',
                      minHeight: '58px', overflowWrap: 'break-word'
                    }}>{article.title}</span>
                    {/* <span style={{textAlign: 'right', width: '49%', paddingRight: '1%'}}>{article.category.toUpperCase()}</span> */}
                  </span>
                  <p className="article-summary" style={{height: '800px', overflowWrap: 'break-word'}} >{
                  (article.summary.length>=100) ? article.summary.substr(0,550)+'...' : 
                  article.summary}</p>
                  <Link className="read-more-button">
                    Read More
                  </Link>
                </div>
              </div>
            ))}
            { pageSetings.currentPage!=pageSetings.totalPages &&
            <button type='button' onClick={() => fetchArticles(pageSetings.currentPage+1)}>
              LOAD MORE
            </button> }
          </div>
        )}
      </section>
    </div>
  );
};

export default ABC; 
