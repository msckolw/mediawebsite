import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/SourcePage.css';
import { getArticle } from '../services/api';

const SourcePage = () => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  // Political alignment color mapping
  const politicalColors = {
    'Left': '#C62828',                    // Red
    'Liberal': '#C62828',                 // Red  
    'Left / Liberal': '#C62828',          // Red
    'Center Left': '#E53935',             // Medium Red
    'Center Right': '#1E88E5',            // Medium Blue
    'Right': '#0D47A1',                   // Blue
    'Conservative': '#0D47A1',            // Blue
    'Right / Conservative': '#0D47A1',    // Blue
    'Swing Media': '#7E57C2',             // Purple
    'Swing': '#7E57C2',                   // Purple
    'Independent': '#7E57C2',             // Purple
    'Neutral': '#7E57C2'                  // Purple
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceCategories, setSourceCategories] = useState([]);
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await getArticle(id, true);
        if (response && response.source.length) {
          let tempSrc = {};
          for (let s of response.source) {
            if (!tempSrc[s.source_type])
              tempSrc[s.source_type] = [];
            tempSrc[s.source_type].push(s.url);
          }
          
          let tempArr = [], tempSections = {};
          for (let key in tempSrc) {
            tempArr.push({ source: key, data: tempSrc[key] });
            tempSections[key] = false;
            // Debug: Log the source types to console
            console.log('Source type found:', key);
          }
          setSourceCategories(tempArr);
          setExpandedSections(tempSections);
        } else {
          setError('No Source found');
        }
      } catch (error) {
        setError(error.message);
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticle();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [id]);

  const openExternalLink = (url) => {
    window.open(url, '_blank');
  };

  const getPoliticalColor = (sourceType) => {
    // Direct match first
    if (politicalColors[sourceType]) {
      return politicalColors[sourceType];
    }
    
    // Case-insensitive and partial matching
    const normalizedSourceType = sourceType.toLowerCase().trim();
    
    // Check for Left/Liberal variations
    if (normalizedSourceType.includes('left') && normalizedSourceType.includes('liberal')) {
      return '#C62828'; // Red
    }
    if (normalizedSourceType.includes('left') || normalizedSourceType.includes('liberal')) {
      if (normalizedSourceType.includes('center')) {
        return '#E53935'; // Medium Red for Center Left
      }
      return '#C62828'; // Red for Left/Liberal
    }
    
    // Check for Right/Conservative variations
    if (normalizedSourceType.includes('right') && normalizedSourceType.includes('conservative')) {
      return '#0D47A1'; // Blue
    }
    if (normalizedSourceType.includes('right') || normalizedSourceType.includes('conservative')) {
      if (normalizedSourceType.includes('center')) {
        return '#1E88E5'; // Medium Blue for Center Right
      }
      return '#0D47A1'; // Blue for Right/Conservative
    }
    
    // Check for Swing/Independent/Neutral
    if (normalizedSourceType.includes('swing') || 
        normalizedSourceType.includes('independent') || 
        normalizedSourceType.includes('neutral')) {
      return '#7E57C2'; // Purple
    }
    
    return '#666666'; // Default gray if not found
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading ...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="back-button">
          Return to Home
        </button>
      </div>
    );
  }
  
  if (!sourceCategories.length) {
    return (
      <div className="error-container">
        <p>No Source found</p>
        <button onClick={() => navigate('/')} className="back-button">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="source-page">
      <div className="source-header" id="mainDiv">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back to Article
        </button>
        <h1>News Sources</h1>
        <p>Explore different perspectives from various news sources across the political spectrum</p>
        
        {/* Political Alignment Legend */}
        <div className="political-legend">
          <h3>Political Alignment Guide</h3>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#C62828' }}></span>
              <span>Left / Liberal</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#E53935' }}></span>
              <span>Center Left</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#7E57C2' }}></span>
              <span>Swing Media</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#1E88E5' }}></span>
              <span>Center Right</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#0D47A1' }}></span>
              <span>Right / Conservative</span>
            </div>
          </div>
        </div>
      </div>

      <div className="source-categories">
        {sourceCategories.map((s, i) => (
          <div className="source-category" key={i}>
            <div 
              className="category-header"
              onClick={() => toggleSection(s.source)}
              style={{ backgroundColor: getPoliticalColor(s.source) }}
            >
              <h2>{s.source}</h2>
              <span className={`arrow ${expandedSections[s.source] ? 'up' : 'down'}`}>
                {expandedSections[s.source] ? '▲' : '▼'}
              </span>
            </div>
            {expandedSections[s.source] && (
              <div className="category-content">
                <ul>
                  {s.data.map((source, index) => (
                    <li key={index} onClick={() => openExternalLink(source)}>
                      <span className="source-url">{source}</span>
                      <span className="external-link-icon">↗</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourcePage;