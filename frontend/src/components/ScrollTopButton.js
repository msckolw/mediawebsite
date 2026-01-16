
import React, { useEffect, useRef } from 'react';
import './ScrollTopButton.css'; // We'll create this CSS file next

const ScrollToTopButton = () => {
    
    const mybutton = useRef(null);
    const scrollThreshold = 1;
    
    // useEffect hook to add and remove the scroll event listener
    useEffect(() => {
        // Add event listener when the component mounts
        mybutton.current = document.getElementById("scrollToTopBtn");

        const handleScroll = () => {
            if (!mybutton.current) return;
            
            if (document.body.scrollTop > scrollThreshold || document.documentElement.scrollTop > scrollThreshold) {
                // If scrolled past the threshold, show the button
                if(window.location.pathname!=='/login' && window.location.pathname!=='/admin') {
                    mybutton.current.style.display = "block";
                    mybutton.current.style.opacity = "1"; // Ensure full visibility 
                }
            } else {
                // If at or above the threshold (near the top of the page), hide the button
                mybutton.current.style.opacity = "0"; // Start fade out
                // After the fade out transition completes, set display to none to remove it from flow
                setTimeout(() => {
                    if (mybutton.current) {
                        mybutton.current.style.display = "none";
                    }
                }, 300); // This delay should match the CSS transition duration
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount

    // Function to scroll to the top when the button is clicked
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Smooth scrolling animation
        });
    };

    return (
        <button id="scrollToTopBtn"
            onClick={scrollToTop}
            title="Go to top"
        >
            &#8593; {/* Up arrow HTML entity */}
        </button>
    );
};

export default ScrollToTopButton;