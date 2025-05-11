import React, { useState, useEffect, useRef } from 'react';
import '../styles/AdminPanel.css';
import { useNavigate } from 'react-router-dom';
import SourceModal from './SourceModal'; // Import the new component
import Swal from 'sweetalert2'
import { addArticle, deleteArticle, getArticles, getSourceType } from '../services/api';

const categories = [
  'Politics',
  'Sports',
  'Technology',
  'Business',
  'Entertainment',
  'Health',
  'Science',
  'World'
];

const AdminPanel = () => {
  let nav = useNavigate();
  let articlePosted=useRef(true);
  let imgAsBase = useRef(false);
  const [articles, setArticles] = useState([]);
  const [sourceType, setSourceType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    imageUrl: '',
    sources: []
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState(null);
  const [pageSetings, setPageSettings] = useState({
    currentPage: 1, totalPages: 1
  });
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  function removeImage() {
    setFormData(prevState => ({
      ...prevState,
      imageUrl: ''
    }));
    setPreviewUrl('');
    document.getElementById('imgUrl').value='';
    imgAsBase.current=false;
  }

  useEffect(() => {
    if(!localStorage.getItem('token')) {
      nav('/login');
    }
    else {
      fetchArticles();
      fetchSourceType();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth", // Adds a nice scroll animation
    });

    
  }, []);


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

  const fetchSourceType = async () => {
    try {
      //console.log('Fetching articles from:', `${API_URL}/news`);
      const response = await getSourceType();
      //console.log('Received articles:', response.data);
      setSourceType(response);
      //setLoading(false);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to Fetch. Please try again later.');
      //setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas dimensions to max 800px while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          const maxWidth = 800;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
      };
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        setPreviewUrl(compressedImage);
        setFormData(prevState => ({
          ...prevState,
          imageUrl: compressedImage
        }));
        imgAsBase.current=true;
      } catch (error) {
        console.error('Error compressing image:', error);
        setError('Failed to process image. Please try again.');
      }
    }
  };

  // Modal Functions
  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSaveSources = (savedSources) => {
    setFormData((prevData) => ({
      ...prevData,
      sources: savedSources
    }));
    closeModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    articlePosted.current=false;
    
    try {
      // Validate required fields
      if (!formData.title || !formData.summary || !formData.content || !formData.category) {
        setError('Please fill in all required fields');
        return;
      }

      
      document.getElementById("mainDiv").scrollIntoView({behavior: "smooth"});

      // Format the article data according to the News model
      const articleData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        category: formData.category,
        imageUrl: formData.imageUrl || 'https://via.placeholder.com/300x200',
        source: formData.sources.filter(source => source._id && source.url),
        createdAt: new Date().toISOString()
      };


      // Send the request with proper headers
      const response = await addArticle(articleData);

      
      if (response) {
        // Reset form
        setFormData({
          title: '',
          summary: '',
          content: '',
          category: '',
          imageUrl: '',
          sources: []
        });
        setPreviewUrl('');
        document.getElementById('imgUrl').value='';


        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Article Add Success!",
          showConfirmButton: false,
          timer: 4000,
        });
        
        // Refresh articles list
        await fetchArticles();
        
        // Show success message
        //alert('Article added successfully!');
      }
    } catch (error) {
      if (error.message==401) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "warning",
          title: "Session Expired",
          showConfirmButton: false,
          timer: 3000,
        });
        localStorage.removeItem('token');
        nav('/login');
      }
      else {
        setError('Failed to add article. Please try again.');
      }
    }
    finally {
      articlePosted.current=true;
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log('Deleting article:', id);
      await deleteArticle(id);
      console.log('Article deleted successfully');
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Article Deleted!",
        showConfirmButton: false,
        timer: 4000,
      });
      await fetchArticles();
    } catch (error) {
        if (error.message==401) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "warning",
            title: "Session Expired",
            showConfirmButton: false,
            timer: 3000,
          });
          localStorage.removeItem('token');
          nav('/login');
        }
        else
          setError('Failed to delete article');
    }
  };

  if (loading) {
    return <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading article...</p>
           </div>
  }

  return (
    <div className="admin-panel" id="mainDiv">
      <h1>Admin Panel</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="admin-content">
        <div className="form-section">
          <h2>Add New Article</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Summary</label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Content</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="category-select"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {!imgAsBase.current && (
              <div className="form-group">
              <label>Image URL</label>
              <textarea
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
              ></textarea>
              </div>
            )}
            
            <div className="form-group">
              <label>Image</label>
              <input id="imgUrl"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {previewUrl && (
                <div className="image-preview" style={{display: 'flex', justifyContent: 'center',
                alignItems: 'center', flexDirection: 'row'}}>
                  <span style={{width: '50%'}}>
                    <img src={previewUrl} alt="Preview" />
                  </span>
                  <span style={{width: '50%', textAlign: 'center'}}>
                    <button 
                      type="button" 
                      className="clear-image-btn"
                      onClick={removeImage}
                    >
                      CLEAR
                    </button>
                  </span>
                </div>
              )}
            </div>
            
            <div className="form-group sources-section">
              <label>Sources</label>
              <div className="sources-summary">
                {formData.sources && formData.sources.length > 0 && formData.sources[0].url ? (
                  <div className="sources-count">
                    <span>{formData.sources.length} source(s) added</span>
                  </div>
                ) : (
                  <div className="no-sources">No sources added yet</div>
                )}
                <button 
                  type="button" 
                  className="source-btn" 
                  onClick={openModal}
                >
                  {formData.sources && formData.sources.length > 0 && formData.sources[0].url ? 'Edit Sources' : 'Add Sources'}
                </button>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={articlePosted.current ? false : true}
              >Add Article</button>
            </div>
          </form>
          
          {/* Use the new Source Modal Component */}
          <SourceModal 
            isOpen={modalOpen}
            onClose={closeModal}
            initialSources={formData.sources}
            onSave={handleSaveSources}
            maxSources={5}
            typeList={sourceType}
          />
        </div>
        
        <div className="articles-section">
          <h2>Manage Articles</h2>
          <div className="articles-list">
            {articles.length > 0 ? (
              articles.map(article => (
                <div key={article._id} className="article-card">
                  <div className="article-image">
                    <img src={article.imageUrl} alt={article.title} />
                  </div>
                  <div className="article-details">
                    <h3>{article.title}</h3>
                    <p className="summary">{article.summary}</p>
                    <p className="category">Category: {article.category}</p>
                    {article.sources && article.sources.length > 0 && article.sources[0].url && (
                      <div className="article-sources">
                        <p className="sources-title">Sources:</p>
                        <ul className="sources-list">
                          {article.sources.map((source, index) => (
                            <li key={index}>
                              {source.source}: {source.url}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button 
                      onClick={() => handleDelete(article._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-articles">
                <p>No articles found. Add some articles to get started.</p>
              </div>
            )}
            { pageSetings.currentPage!=pageSetings.totalPages &&
            <button type='button' onClick={() => fetchArticles(pageSetings.currentPage+1)}>
              LOAD MORE
            </button> }
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;