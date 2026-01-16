import React, { useState } from 'react';
import { extractWorkflowFromPNG, extractParametersFromMetadata } from '../utils/png-parser';
import './ImageDropZone.css';

/**
 * Drag-and-drop zone for loading parameters from generated PNG images
 */
export default function ImageDropZone({ onParametersLoaded, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError('');
    setSuccess('');

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const pngFile = files.find(file => file.type === 'image/png');

    if (!pngFile) {
      setError('Please drop a PNG image file');
      setTimeout(() => setError(''), 3000);
      return;
    }

    await processImageFile(pngFile);
  };

  const handleFileInput = async (e) => {
    setError('');
    setSuccess('');

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png') {
      setError('Please select a PNG image file');
      setTimeout(() => setError(''), 3000);
      return;
    }

    await processImageFile(file);
  };

  const processImageFile = async (file) => {
    try {
      // Extract metadata from PNG (ComfyUI or A1111 format)
      const metadata = await extractWorkflowFromPNG(file);

      // Extract parameters from metadata
      const params = extractParametersFromMetadata(metadata);

      // Check if we extracted anything useful
      const hasAnyParams = params._metadata &&
        (params._metadata.extracted.length > 0 || params.width || params.height);

      if (!hasAnyParams) {
        setError('No generation metadata found in this image');
        setTimeout(() => setError(''), 4000);
        return;
      }

      // Create image URL for preview
      const imageUrl = URL.createObjectURL(file);
      params.imageUrl = imageUrl;

      // Remove internal metadata before passing to parent
      const { _metadata, ...cleanParams } = params;

      // Add metadata message for display but keep it separate
      cleanParams.imageUrl = imageUrl;

      // Call callback with extracted parameters
      console.log('Calling onParametersLoaded with:', cleanParams);
      onParametersLoaded(cleanParams);

      // Show success with details
      const message = _metadata?.message || 'Parameters loaded successfully!';
      setSuccess(message);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image file');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="image-drop-zone-container">
      <div
        className={`image-drop-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <svg
            className="drop-zone-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="drop-zone-text">
            {isDragging ? 'Drop image here' : 'Drag & drop a generated PNG to load its parameters'}
          </p>
          <p className="drop-zone-subtext">or</p>
          <label className="drop-zone-button">
            <input
              type="file"
              accept="image/png"
              onChange={handleFileInput}
              disabled={disabled}
              style={{ display: 'none' }}
            />
            Browse Files
          </label>
        </div>
      </div>

      {error && <div className="drop-zone-error">{error}</div>}
      {success && <div className="drop-zone-success">{success}</div>}
    </div>
  );
}
