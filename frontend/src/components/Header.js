import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import Swal from 'sweetalert2'
import { useGoogleHook } from '../hooks/gHook';
// Import your logo here (uncomment after adding the logo file)
// import logo from '../assets/logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('token') ? true : false; 
  const isAdmin = localStorage.getItem('user_role')=='admin' ? true : false;
  const userName = localStorage.getItem('user_name');


  const categories = [
    { name: 'Politics', path: '/category/politics' },
    { name: 'Business', path: '/category/business' },
    { name: 'World News', path: '/category/world news' },
    { name: 'Legal', path: '/category/legal' },
    { name: 'Miscellaneous', path: '/category/miscellaneous' },
    { name: 'Bookmarks', path: '/bookmarks' },
    { name: 'Profile', path: '/admin' }
  ];

  let gHook = useGoogleHook(window.location.pathname,true);

  function filterCategories(arr) {
    if (isLoggedIn && isAdmin) {
      return arr; // Show all including Profile and Bookmarks
    } else if (isLoggedIn) {
      return arr.filter(elem => elem.name !== 'Profile'); // Show Bookmarks but not Profile
    } else {
      return arr.filter(elem => elem.name !== 'Profile' && elem.name !== 'Bookmarks'); // Hide both
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCategoryClick = (path) => {

    if(window.location.pathname==path) { 
      setIsMenuOpen(false);
      return;
    }
    
    //console.log(path)
    //const page = document.body;
    //page.classList.add("fade-out");
    navigate(path);
    setIsMenuOpen(false);

    /*setTimeout(() => {
      page.classList.remove("fade-out");
    }, 800);*/
    
  };


  const handleLogout = () => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Logout Success!",
      showConfirmButton: false,
      timer: 4000,
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  let handleLogin = () => gHook();

  return (
    <header className="header">
      <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{width: '15%', textAlign: 'left'}}>
          <button onClick={toggleMenu} style={{width: '30%', backgroundColor: '#1e3c72', minWidth: '60px',
            textAlign: 'center', fontSize: '0.9em'
          }}
          >
            <span style={{color: 'white'}}>☰</span>
          </button>
        </span>

        <span style={{width: '60%', textAlign: 'center', display: 'flex', justifyContent: 'center', 
          position: 'absolute', left: '50%', transform: 'translateX(-50%)'}} >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img 
              src="/NBM Transparent logo.png" 
              alt="The NoBias Media" 
              style={{ 
                height: '90px', 
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
          </Link>
        </span>
        
        {
         !isLoggedIn && 
         (
            <div className="header-buttons" style={{width: '25%', textAlign: 'right', fontSize: '0.9em'}}>
            
            <a href="javascipt:void(0)" className="login-btn" onClick={handleLogin}
            style={{backgroundColor: 'green', color: 'white',
              border: 'none', marginLeft: '5%'
            }}>Login</a>
           </div>


          )
        }
       {
         isLoggedIn && (
            <div className="header-buttons" style={{width: '25%', textAlign: 'right', fontSize: '0.9em'}}>
            <a href="javascipt:void(0)" className="login-btn" onClick={handleLogout}
            style={{backgroundColor: 'red', color: 'white',
              border: 'none', marginLeft: '5%'
            }}>Sign Out</a>
          </div>
          )
        }
      </div>

      {isMenuOpen && (
        <>
          <div className="menu-overlay" onClick={toggleMenu}></div>
          <div className="dropdown-menu active">
            <div className="menu-header">
              <h3 style={{width: '60%', textAlign: 'left',
                fontWeight: 'bold'
              }}>Categories</h3>
              <span style={{width: '40%', textAlign: 'right',}}>
                <button className="close-btn" style={{width: '30%', minWidth: '70px', 
                  fontWeight: 'bold'}} onClick={toggleMenu}>×</button>
              </span>
            </div>
            {filterCategories(categories).map((category) => (
              <div
                key={category.name}
                className="menu-item"
                onClick={() => handleCategoryClick(category.path)}
              >
                {category.name}
              </div>
            ))}
            
            {/* Social Media Icons */}
            <div style={{ padding: '1rem', borderTop: '1px solid #eee', marginTop: '1rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1rem' }}>Follow Us</h4>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://www.linkedin.com/company/110920348/admin/dashboard/" target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#0077b5', fontSize: '1.5rem' }}>
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="https://x.com/TheNoBiasMedia" target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#000', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
                  𝕏
                </a>
                <a href="https://www.facebook.com/people/The-NoBias-Media/61585968146610/" target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#1877f2', fontSize: '1.5rem' }}>
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="https://www.instagram.com/nobias_media/" target="_blank" rel="noopener noreferrer" 
                   style={{ color: '#e4405f', fontSize: '1.5rem' }}>
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>

            {/* App Store Icons */}
            <div style={{ padding: '1rem', borderTop: '1px solid #eee' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1rem' }}>Download App</h4>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: '#34a853', fontSize: '1.5rem', cursor: 'not-allowed' }} title="Coming Soon">
                  <i className="fab fa-google-play"></i>
                </span>
                <span style={{ color: '#007aff', fontSize: '1.5rem', cursor: 'not-allowed' }} title="Coming Soon">
                  <i className="fab fa-apple"></i>
                </span>
              </div>
            </div>
          </div>
        </>
      )}


    </header>
  );
};

export default Header; 