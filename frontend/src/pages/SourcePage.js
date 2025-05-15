import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/SourcePage.css';
import { getArticle } from '../services/api';

const SourcePage = () => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    /*right: false,
    centerRight: false,
    swingState: false,
    centerLeft: false,
    left: false*/
  });

  const toggleSection = (section) => {
    //console.log(expandedSections[section])
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  /*const sourceCategories = {
    right: [
     
    ],
    centerRight: [
     
    ],
    swingState: [
     
    ],
    centerLeft: [
     
    ],
    left: [
   
    ]
  };*/

  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceCategories,setSourceCategories] = useState([]);
  

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await getArticle(id,true);
        if (response && response.source.length) {
          //setArticle(response.data);
          let tempSrc={};
          for(let s of response.source) {
            if(!tempSrc[s.source_type])
              tempSrc[s.source_type]=[];
            tempSrc[s.source_type].push(s.url);
          }
          //if(tempSrc.length) {
            let tempArr=[], tempSections={};
            for(let key in tempSrc) {
              tempArr.push({source: key, data: tempSrc[key]});
              tempSections[key]=false;
            }
            setSourceCategories(tempArr);
            setExpandedSections(tempSections);
            
            //console.log(tempArr,tempSections);
          //}
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
      behavior: "smooth", // Adds a nice scroll animation
    });

  }, [id]);

  

  const openExternalLink = (url) => {
    window.open(url, '_blank');
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
    <div className="source-page" >
      <div className="source-header"id="mainDiv">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back to Article
        </button>
        <h1>News Sources</h1>
        <p>Explore different perspectives from various news sources across the political spectrum</p>
      </div>

      <div className="source-categories">
        {sourceCategories.map((s,i) =>
        <div className="source-category" key={i}>
          <div 
            className="category-header"
            onClick={() => toggleSection(s.source)}
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
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div> )}

        
        {/* <div className="source-category"> 
          <div 
            className="category-header"
            onClick={() => toggleSection('centerRight')}
          >
            <h2>Center Right</h2>
            <span className={`arrow ${expandedSections.centerRight ? 'up' : 'down'}`}>
              {expandedSections.centerRight ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.centerRight && (
            <div className="category-content">
              <ul>
                {sourceCategories.centerRight.map((source, index) => (
                  <li key={index} onClick={() => openExternalLink(source.url)}>
                    {source.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        
        <div className="source-category">
          <div 
            className="category-header"
            onClick={() => toggleSection('swingState')}
          >
            <h2>Swing State</h2>
            <span className={`arrow ${expandedSections.swingState ? 'up' : 'down'}`}>
              {expandedSections.swingState ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.swingState && (
            <div className="category-content">
              <ul>
                {sourceCategories.swingState.map((source, index) => (
                  <li key={index} onClick={() => openExternalLink(source.url)}>
                    {source.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        
        <div className="source-category">
          <div 
            className="category-header"
            onClick={() => toggleSection('centerLeft')}
          >
            <h2>Center Left</h2>
            <span className={`arrow ${expandedSections.centerLeft ? 'up' : 'down'}`}>
              {expandedSections.centerLeft ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.centerLeft && (
            <div className="category-content">
              <ul>
                {sourceCategories.centerLeft.map((source, index) => (
                  <li key={index} onClick={() => openExternalLink(source.url)}>
                    {source.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        
        <div className="source-category">
          <div 
            className="category-header"
            onClick={() => toggleSection('left')}
          >
            <h2>Left</h2>
            <span className={`arrow ${expandedSections.left ? 'up' : 'down'}`}>
              {expandedSections.left ? '▲' : '▼'}
            </span>
          </div>
          {expandedSections.left && (
            <div className="category-content">
              <ul>
                {sourceCategories.left.map((source, index) => (
                  <li key={index} onClick={() => openExternalLink(source.url)}>
                    {source.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>*/}
      </div>
    </div>
  );
};

export default SourcePage;