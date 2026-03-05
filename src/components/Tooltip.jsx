import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Tooltip.css';

// Module-level cache for tooltip data
let tooltipCache = null;
let tooltipFetchPromise = null;

function loadTooltips() {
  if (tooltipCache) return Promise.resolve(tooltipCache);
  if (tooltipFetchPromise) return tooltipFetchPromise;
  tooltipFetchPromise = fetch(`${import.meta.env.BASE_URL}tooltips.json`)
    .then((res) => res.json())
    .then((data) => {
      tooltipCache = data;
      return data;
    })
    .catch((err) => {
      console.warn('Failed to load tooltips:', err);
      tooltipCache = {};
      return {};
    });
  return tooltipFetchPromise;
}

/**
 * General-purpose tooltip with a circle-I info icon, or wrapping custom children.
 *
 * Usage:
 *   <Tooltip tooltipId="stage-1-film-filters" />           — icon trigger, text from tooltips.json
 *   <Tooltip text="Inline description" />                   — icon trigger, inline text
 *   <Tooltip tooltipId="key"><strong>B&W</strong></Tooltip> — children as trigger (no icon)
 */
export default function Tooltip({ tooltipId, text, size = 16, children }) {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState(text || '');
  const [popoverStyle, setPopoverStyle] = useState(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (text) {
      setContent(text);
      return;
    }
    if (tooltipId) {
      loadTooltips().then((data) => {
        setContent(data[tooltipId] || '');
      });
    }
  }, [tooltipId, text]);

  const show = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPopoverStyle({
        position: 'fixed',
        left: rect.right + 10,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      });
    }
    setVisible(true);
  }, []);

  if (!content) return null;

  return (
    <span
      ref={triggerRef}
      className="tooltip-trigger"
      onMouseEnter={show}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => e.stopPropagation()}
    >
      {children || (
        <svg
          className="tooltip-icon"
          width={size}
          height={size}
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
      )}
      {visible && <span className="tooltip-popover" style={popoverStyle}>{content}</span>}
    </span>
  );
}
