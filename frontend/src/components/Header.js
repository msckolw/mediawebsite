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
    { name: 'Sports', path: '/category/sports' },
    { name: 'Technology', path: '/category/technology' },
    { name: 'Business', path: '/category/business' },
    { name: 'Entertainment', path: '/category/entertainment' },
    { name: 'Health', path: '/category/health' },
    { name: 'Science', path: '/category/science' },
    { name: 'World', path: '/category/world' },
    { name: 'Profile', path: '/admin' }
  ];

  let gHook = useGoogleHook(window.location.pathname,true);

  function filterCategories(arr) {
    return isLoggedIn && isAdmin ? arr : arr.filter(elem => elem.name!='Profile');
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
          <Link to="/" >
            <span className="logo-text">The NoBias Media</span>
          </Link>
        </span>
        
        {
         !isLoggedIn && (
            <div className="header-buttons" style={{width: '25%', textAlign: 'right', fontSize: '0.9em'}}>
            {/*<Link to="/login" className="login-btn" style={{backgroundColor: 'green', color: 'white',
              border: 'none'
            }}>Login</Link>*/}
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
          </div>
        </>
      )}


    </header>
  );
};

export default Header; 