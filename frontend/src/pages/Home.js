import React, { useState, useEffect, useRef } from 'react';
import '../styles/Home.css';
import { Link, useNavigate } from 'react-router-dom';
import {getArticles, verifyToken, loginOAuth} from '../services/api'
import io from 'socket.io-client';
import { useGoogleLogin } from '@react-oauth/google';
import Swal from 'sweetalert2';


const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSetings, setPageSettings] = useState({
    currentPage: 1, totalPages: 1
  });

  const socketRef = useRef(null);
  let navigate = useNavigate();
  
  // Create Google login with dynamic redirect
  const googleLogin = useGoogleLogin({
    onSuccess: async (tok) => {
      try {
        let url = 'https://www.googleapis.com/oauth2/v3/userinfo';
        let user = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + tok.access_token
          }
        });
        let data = await user.json();
        data['access_token'] = tok.access_token;
        const response = await loginOAuth(data);
        
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Login Success!",
          showConfirmButton: false,
          timer: 4000,
        });
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user_role', response.user.role);
        localStorage.setItem('user_name', response.user.name);
        
        // Get the pending source ID and redirect
        const pendingSourceId = localStorage.getItem('pendingSourceRedirect');
        if (pendingSourceId) {
          localStorage.removeItem('pendingSourceRedirect');
          navigate(`/source/${pendingSourceId}`);
        }
      } catch (error) {
        console.log('Error', error);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Login Failed!",
          showConfirmButton: false,
          timer: 4000,
        });
      }
    },
    onError: async (error) => {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Login Failed!",
        showConfirmButton: false,
        timer: 4000,
      });
    }
  });


  useEffect(() => {

    fetchArticles(1);

    if (!socketRef.current) { // Only create if it doesn't exist
        //socketRef.current = io('http://localhost:5002');
        socketRef.current = io('https://nobiasmedia.onrender.com');
        console.log('Socket connection established');
    }

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to Socket');
    });

    socket.on('newArticle', (newArticle) => {
      console.log('Received article via Socket');
      fetchArticles(1);
      /*setArticles(newArticle.articles);
      setPageSettings({ 
        currentPage: newArticle.currentPage,
        totalPages: newArticle.totalPages
      });*/
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    goToTop();

    return () => {
      
      socket.off('connect');
      socket.off('newArticle');
      socket.off('disconnect');
      socket.off('connect_error');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null; // Clear the ref
        console.log('Socket connection disconnected for ArticlesPage.');
      }
    };

  }, []);

  function goToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Adds a nice scroll animation
    });
  }

  function showFullArticle(id) {
    navigate('/article/'+id);
  }

  function showSources(id, e) {
    e.stopPropagation(); // Prevent card click
    checkLogin(id);
  }

  function checkLogin(id) {
    if(localStorage.getItem('token')) {
      verifyAccessToken(id);
    }
    else {
      // Store the article ID for redirect after login
      localStorage.setItem('pendingSourceRedirect', id);
      googleLogin();
    }
  }

  async function verifyAccessToken(id) {
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
        googleLogin();
      }
    }
  }

  const fetchArticles = async (page=1) => {
    try {
      
      const response = await getArticles(page);
      if(response.articles.length) {
        setArticles(prev => page==1 ? response.articles : [...prev, ...response.articles]);
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
      <section className="hero" style={{ height: '20vh' }}	>
        <h1>Welcome to Our News Portal</h1>
        <p>Stay updated with the latest news and stories</p>
      </section>

      <section className="latest-news">
        <h2>Latest News</h2>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading article...</p>
          </div>

          // <div class="loader">
          //   <span class="loader-text">loading</span>
          //     <span class="load"></span>
          // </div>

        ) : articles.length === 0 ? (
          <div className="no-articles">No articles found.</div>
        ) : (
          <div className="articles-grid">
            {articles.map((article) => (
              <div key={article._id} className="article-card"
              onClick={(e) => showFullArticle(article._id)}>
                <div className="article-image" style={{position: 'relative',
                  marginBottom: '20px'
                }}>
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
                  <p className="article-summary" style={{overflowWrap: 'break-word'}} >{
                  (article.summary.length>=80) ? article.summary.substr(0,500)+'...' : 
                  article.summary}</p>
                  <div className="article-buttons">
                    <Link to={`/article/${article._id}`} className="read-more-button">
                      Read More
                    </Link>
                    <button 
                      className="news-sources-button"
                      onClick={(e) => showSources(article._id, e)}
                    >
                      News Sources
                    </button>
                  </div>
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

export default Home; 
