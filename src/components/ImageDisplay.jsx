import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ImageDisplay.css';

/**
 * Display generated image with download and fullscreen viewer.
 *
 * Click image → fullscreen 100% view on black.
 * In 100% view, click image → 200% zoom with pan.
 * In 200% view, click (without pan) → back to 100%.
 * Escape → exit fullscreen entirely.
 * X button → exit fullscreen.
 */
export default function ImageDisplay({ imageUrl, prompt, aspectRatio }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Track whether user dragged (panned) vs clicked
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, moved: false });
  const zoomToggledRef = useRef(false);
  const containerRef = useRef(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `comfyui-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openFullscreen = () => {
    setFullscreen(true);
    setZoomed(false);
    setPanOffset({ x: 0, y: 0 });
  };

  const closeFullscreen = () => {
    setFullscreen(false);
    setZoomed(false);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleImageClick = () => {
    if (!zoomed) {
      // 100% → 200%
      setZoomed(true);
      setPanOffset({ x: 0, y: 0 });
    }
    // 200% click-without-pan → 100% is handled in onMouseUp
  };

  // Escape key handler
  useEffect(() => {
    if (!fullscreen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fullscreen]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [fullscreen]);

  // Pan handlers for 200% zoomed view
  const onMouseDown = useCallback((e) => {
    if (!zoomed) return;
    e.preventDefault();
    dragRef.current = {
      dragging: true,
      startX: e.clientX - panOffset.x,
      startY: e.clientY - panOffset.y,
      moved: false,
    };
  }, [zoomed, panOffset]);

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const distFromStart = Math.abs(dx - panOffset.x) + Math.abs(dy - panOffset.y);
    if (distFromStart > 4) {
      dragRef.current.moved = true;
    }
    setPanOffset({ x: dx, y: dy });
  }, [panOffset]);

  const onMouseUp = useCallback(() => {
    if (!dragRef.current.dragging) return;
    const wasDrag = dragRef.current.moved;
    dragRef.current.dragging = false;
    // Click without pan in 200% → back to 100%
    if (!wasDrag && zoomed) {
      setZoomed(false);
      setPanOffset({ x: 0, y: 0 });
      zoomToggledRef.current = true;
    }
  }, [zoomed]);

  if (!imageUrl) {
    return (
      <div className="image-display image-display-empty" style={aspectRatio ? { aspectRatio, minHeight: 'auto' } : undefined}>
        <div className="image-placeholder">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p>Generated image will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="image-display">
        <img
          src={imageUrl}
          alt={prompt || 'Generated image'}
          className="generated-image"
          onClick={openFullscreen}
          style={{ cursor: 'pointer' }}
        />
      </div>
      <button className="download-button" onClick={handleDownload} type="button">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download
      </button>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fullscreen-overlay"
          ref={containerRef}
          onClick={(e) => {
            // Click on backdrop (not image) closes fullscreen
            if (e.target === e.currentTarget) closeFullscreen();
          }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <button
            className="fullscreen-close"
            onClick={closeFullscreen}
            type="button"
            aria-label="Close"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={imageUrl}
            alt={prompt || 'Generated image'}
            className={`fullscreen-image ${zoomed ? 'fullscreen-image-zoomed' : ''}`}
            style={zoomed ? {
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(2)`,
              cursor: dragRef.current.dragging ? 'grabbing' : 'grab',
            } : {
              cursor: 'zoom-in',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (zoomToggledRef.current) {
                zoomToggledRef.current = false;
                return;
              }
              if (!zoomed) handleImageClick();
            }}
            onMouseDown={onMouseDown}
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
