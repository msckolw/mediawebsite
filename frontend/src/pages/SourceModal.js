// Improved Source Modal Component
import React, { useState, useEffect, useRef } from 'react';
import '../styles/AdminPanel.css';

const SourceModal = ({ isOpen, onClose, initialSources, onSave, maxSources = 20, typeList = [] }) => {
  const [sources, setSources] = useState([{ source_type: '', url: '', _id: '' }]);
  const modalRef = useRef(null);
  const sourceOptions = typeList;
  const [error, setError] = useState('');
  const wasOpen = useRef(false);

  // Start a fresh draft only when opening. Options can refresh while editing.
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setSources(initialSources?.length
        ? initialSources.map(source => ({ ...source }))
        : [{ source_type: '', url: '', _id: '' }]);
      setError('');
    }
    wasOpen.current = isOpen;
  }, [initialSources, isOpen]);

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
    setError('');
    setSources(previous => previous.map((source, row) => {
      if (row !== index) return source;
      const updated = { ...source, [name]: value };
      if (name === 'source_type') {
        updated._id = sourceOptions.find(option => option.source_type === value)?._id || '';
      }
      return updated;
    }));
  };

  // Add new source
  const handleAddSource = () => {
    setSources(previous => previous.length >= maxSources ? previous : [...previous, { source_type: '', url: '', _id: '' }]);
  };

  // Remove source
  const handleRemoveSource = (index) => {
    setSources(previous => previous.filter((_, i) => i !== index));
    setError('');
  };

  // Save sources
  const saveSourcesHandler = () => {
    const incomplete = sources.findIndex(source =>
      (source.source_type || source._id || source.url.trim()) &&
      (!source.source_type || !source._id || !source.url.trim()));
    if (incomplete !== -1) {
      setError(`Complete the source type and URL for source ${incomplete + 1}, or clear the row.`);
      return;
    }
    const validSources = sources.filter(source => source._id && source.url.trim())
      .map(source => ({ ...source, url: source.url.trim() }));
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
              type="button"
              className="close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </span>
        </div>

        <div className="modal-body">
          {error && <p className="error-message" role="alert">{error}</p>}
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
            type="button"
            className="add-more-btn"
            onClick={handleAddSource}
            disabled={sources.length >= maxSources}
            aria-label="Add another source"
          >
            Add More
          </button>
          <button
            type="button"
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
