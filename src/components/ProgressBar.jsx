import React from 'react';
import './ProgressBar.css';

/**
 * Progress indicator for image generation
 */
export default function ProgressBar({ progress, max, status, isGenerating }) {
  const percentage = max > 0 ? Math.round((progress / max) * 100) : 0;

  if (!isGenerating && !status) {
    return null;
  }

  return (
    <div className="progress-container">
      {status && <div className="progress-status">{status}</div>}

      {isGenerating && (
        <div className="progress-bar-wrapper">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="progress-text">
            {progress} / {max} ({percentage}%)
          </div>
        </div>
      )}
    </div>
  );
}
