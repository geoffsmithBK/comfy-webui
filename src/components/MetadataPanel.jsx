import React, { useState } from 'react';
import './MetadataPanel.css';

/**
 * Sidebar metadata display for a selected gallery image.
 * Shows preview, prompt with copy, parameter grid, and send-to-generate button.
 */
export default function MetadataPanel({ imageUrl, filename, metadata, onSendToGenerate }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!imageUrl) {
    return (
      <div className="metadata-panel-empty">
        Select an image to view its generation parameters
      </div>
    );
  }

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const dims = metadata?.width && metadata?.height
    ? `${metadata.width} x ${metadata.height}`
    : null;

  const CopyIcon = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  return (
    <div className="metadata-panel">
      <div className="metadata-preview">
        <img src={imageUrl} alt={filename || 'Selected image'} />
      </div>

      {metadata?.prompt && (
        <div className="metadata-prompt-section">
          <div className="metadata-prompt-header">
            <span className="metadata-label">Prompt</span>
            <button
              type="button"
              className="metadata-copy-btn"
              onClick={() => copyToClipboard(metadata.prompt, 'prompt')}
            >
              {copiedField === 'prompt' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="metadata-prompt-text">{metadata.prompt}</div>
        </div>
      )}

      <div className="metadata-params">
        {metadata?.seed != null && (
          <div className="metadata-param">
            <span className="metadata-label">Seed</span>
            <span className="metadata-param-value metadata-param-value-copyable">
              <span className="metadata-value-text">{metadata.seed}</span>
              <button
                type="button"
                className="metadata-inline-copy"
                onClick={() => copyToClipboard(metadata.seed, 'seed')}
                title={copiedField === 'seed' ? 'Copied!' : 'Copy seed'}
              >
                {copiedField === 'seed'
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  : <CopyIcon />
                }
              </button>
            </span>
          </div>
        )}
        {metadata?.model && (
          <div className="metadata-param">
            <span className="metadata-label">Model</span>
            <span className="metadata-param-value">{metadata.model}</span>
          </div>
        )}
        {dims && (
          <div className="metadata-param">
            <span className="metadata-label">Dimensions</span>
            <span className="metadata-param-value">{dims}</span>
          </div>
        )}
        {metadata?.steps != null && (
          <div className="metadata-param">
            <span className="metadata-label">Steps</span>
            <span className="metadata-param-value">{metadata.steps}</span>
          </div>
        )}
        {metadata?.cfg != null && (
          <div className="metadata-param">
            <span className="metadata-label">CFG</span>
            <span className="metadata-param-value">{metadata.cfg}</span>
          </div>
        )}
      </div>

      {filename && (
        <div className="metadata-filename">{filename}</div>
      )}

      {onSendToGenerate && (
        <button
          type="button"
          className="mfs-action-btn mfs-action-primary"
          onClick={onSendToGenerate}
        >
          Send to Contact Print
        </button>
      )}
    </div>
  );
}
