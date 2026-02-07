import React, { useState, useEffect, useCallback } from 'react';
import AboutContent from './AboutContent';
import './AboutModal.css';

export default function AboutModal() {
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, handleClose]);

  return (
    <>
      <button
        type="button"
        className="about-trigger-btn"
        onClick={() => setOpen(true)}
        title="About"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {open && (
        <div className="about-backdrop" onClick={handleClose}>
          <div className="about-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="about-close-btn"
              onClick={handleClose}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="about-logo">
              <span className="about-logo-line">
                <span className="about-logo-cap">M</span>
                <span className="about-logo-stretch"><span>e</span><span>d</span><span>i</span><span>u</span><span>m</span></span>
              </span>
              <span className="about-logo-line">
                <span className="about-logo-cap">F</span>
                <span className="about-logo-stretch"><span>o</span><span>r</span><span>m</span><span>a</span><span>t</span></span>
              </span>
              <span className="about-logo-line">
                <span className="about-logo-cap">S</span>
                <span className="about-logo-stretch"><span>t</span><span>u</span><span>d</span><span>i</span><span>o</span></span>
              </span>
            </div>
            <AboutContent />
          </div>
        </div>
      )}
    </>
  );
}
