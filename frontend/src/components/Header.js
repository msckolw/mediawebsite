import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
// Import your logo here (uncomment after adding the logo file)
// import logo from '../assets/logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('token') ? true : false; 
 

  const categories = [
    { name: 'Politics', path: '/category/politics' },
    { name: 'Sports', path: '/category/sports' },
    { name: 'Technology', path: '/category/technology' },
    { name: 'Business', path: '/category/business' },
    { name: 'Entertainment', path: '/category/entertainment' },
    { name: 'Health', path: '/category/health' },
    { name: 'Science', path: '/category/science' },
    { name: 'World', path: '/category/world' },
    { name: 'Profile', path: '/admin' }
  ];

  function filterCategories(arr) {
    return isLoggedIn ? arr : arr.filter(elem => elem.name!='Profile');
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCategoryClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{width: '15%', textAlign: 'left'}}>
          <button onClick={toggleMenu} style={{width: '30%', backgroundColor: '#1e3c72', minWidth: '80px',
            textAlign: 'center'
          }}
          >
            <span style={{color: 'white'}}>☰</span>
          </button>
        </span>

        <span style={{width: '75%', textAlign: 'center', display: 'flex', justifyContent: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)'}} >
          <Link to="/" >
            <span className="logo-text">The NoBias Media</span>
          </Link>
        </span>
        
        {
         !isLoggedIn && (
            <div className="header-buttons" style={{width: '20%', textAlign: 'right'}}>
            <Link to="/login" className="login-btn" style={{backgroundColor: 'green', color: 'white',
              border: 'none'
            }}>Login</Link>
            {/* <Link to="/signup" className="signup-btn">Sign Up</Link> */}
          </div>
          )
        }
       {
         isLoggedIn && (
            <div className="header-buttons" style={{width: '20%', textAlign: 'right'}}>
            <a href="javascipt:void(0)" className="login-btn" onClick={handleLogout}
            style={{backgroundColor: 'red', color: 'white',
              border: 'none'
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
              <h3 style={{width: '60%', textAlign: 'left'}}>Categories</h3>
              <span style={{width: '40%', textAlign: 'right',}}>
                <button className="close-btn" style={{width: '30%', minWidth: '70px', 
                  fontWeight: 'bold', backgroundColor: 'red'}} onClick={toggleMenu}>×</button>
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
          </div>
        </>
      )}
    </header>
  );
};

export default Header; 