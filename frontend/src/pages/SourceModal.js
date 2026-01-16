// Improved Source Modal Component
import React, { useState, useEffect, useRef } from 'react';
import '../styles/AdminPanel.css';

const SourceModal = ({ isOpen, onClose, initialSources, onSave, maxSources = 20, typeList }) => {
  const [sources, setSources] = useState([{ source_type: '', url: '', _id: '' }]);
  const modalRef = useRef(null);
  const [sourceOptions, setSourceOptions] = useState([{ source_type: '', url: '', _id: '' }]);
  
  // Source options from your original code
  /*const sourceOptions = [
    { _id: '1', source: 'S-1'},
    { _id: '2', source: 'S-2'},
    { _id: '3', source: 'S-3'},
    { _id: '4', source: 'S-4'},
    { _id: '5', source: 'S-5'}
  ];*/

  // Initialize with provided sources or default empty one
  useEffect(() => {
    if (initialSources && initialSources.length > 0 && initialSources[0].url) {
      setSources(initialSources);
    } else {
      setSources([{ source_type: '', url: '', _id: '' }]);
    }
    setSourceOptions(typeList);
  }, [initialSources, isOpen, typeList]);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle source change
  const handleSourceChange = (index, e) => {
    const { name, value } = e.target;
    //console.log(sourceOptions)
    const newSources = [...sources];
    newSources[index] = { ...newSources[index], [name]: value };
    
    if (name === 'source_type') {
      let id = '';
      const foundSource = sourceOptions.find(s => s.source_type === value);
      if (foundSource) {
        id = foundSource._id;
      }
      newSources[index] = { ...newSources[index], _id: id };
    }
    
    setSources(newSources);
  };

  // Add new source
  const handleAddSource = () => {
    if (sources.length >= maxSources) return;
    setSources([...sources, { source_type: '', url: '', _id: '' }]);
  };

  // Remove source
  const handleRemoveSource = (index) => {
    const newSources = sources.filter((_, i) => i !== index);
    setSources(newSources);
  };

  // Save sources
  const saveSourcesHandler = () => {
    let validSources = sources.filter(source => source._id && source.url);
    validSources = validSources.length ? validSources : [{ source_type: '', url: '', _id: '' }];
    onSave(validSources);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" aria-modal="true" role="dialog">
      <div className="modal" ref={modalRef}>
        <div className="modal-header">
          <span className="modal-title">
            <h3>{sources.length > 0 && sources[0].source_type && sources[0].url ? 
              'Edit Sources' : 'Add Sources'}</h3>
          </span>
          <span className="modal-close">
            <button 
              className="close-btn" 
              onClick={onClose} 
              aria-label="Close"
            >
              ×
            </button>
          </span>
        </div>
        
        <div className="modal-body">
          {sources.map((source, index) => (
            <div key={index} className="source-item">
              <div className="source-row">
                <div className="source-number">{index + 1}</div>
                
                <div className="source-select">
                  <select
                    name="source_type"
                    value={source.source_type}
                    onChange={(e) => handleSourceChange(index, e)}
                    aria-label={`Source type ${index + 1}`}
                  >
                    <option value=''>Select a Type</option>
                    {sourceOptions.map(opt => (
                      <option key={opt._id} value={opt.source_type}>{opt.source_type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="source-input">
                  <input
                    type="text"
                    name="url"
                    value={source.url}
                    placeholder="Enter Source Information"
                    onChange={(e) => handleSourceChange(index, e)}
                    aria-label={`Source information ${index + 1}`}
                  />
                </div>
                
                <div className="source-remove">
                  {index !== 0 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveSource(index)}
                      aria-label={`Remove source ${index + 1}`}
                    >
                      -
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {sources.length < maxSources && (
            <div className="add-source-hint">
              <p>Add up to {maxSources} sources</p>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="add-more-btn" 
            onClick={handleAddSource}
            disabled={sources.length >= maxSources}
            aria-label="Add another source"
          >
            Add More
          </button>
          <button 
            className="save-btn" 
            onClick={saveSourcesHandler}
            aria-label="Save sources"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceModal;
