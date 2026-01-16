import React from 'react';
import { MODELS, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../utils/constants';
import { generateRandomSeed } from '../services/workflow-loader';
import './ParameterControls.css';

/**
 * Control panel for workflow parameters (dimensions, seed, model)
 */
export default function ParameterControls({
  width,
  height,
  seed,
  model,
  onWidthChange,
  onHeightChange,
  onSeedChange,
  onModelChange,
  disabled,
}) {
  const handleRandomizeSeed = () => {
    onSeedChange(generateRandomSeed());
  };

  return (
    <div className="parameter-controls">
      <div className="parameter-section">
        <h3 className="parameter-section-title">Image Dimensions</h3>

        <div className="parameter-row">
          <div className="parameter-field">
            <label htmlFor="width" className="parameter-label">
              Width
            </label>
            <input
              id="width"
              type="number"
              className="parameter-input"
              value={width}
              onChange={(e) => onWidthChange(parseInt(e.target.value) || DEFAULT_WIDTH)}
              min="256"
              max="2048"
              step="64"
              disabled={disabled}
            />
          </div>

          <div className="parameter-field">
            <label htmlFor="height" className="parameter-label">
              Height
            </label>
            <input
              id="height"
              type="number"
              className="parameter-input"
              value={height}
              onChange={(e) => onHeightChange(parseInt(e.target.value) || DEFAULT_HEIGHT)}
              min="256"
              max="2048"
              step="64"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="parameter-section">
        <h3 className="parameter-section-title">Seed</h3>
        <div className="parameter-row">
          <div className="parameter-field parameter-field-grow">
            <input
              type="number"
              className="parameter-input"
              value={seed}
              onChange={(e) => onSeedChange(parseInt(e.target.value) || 0)}
              min="0"
              disabled={disabled}
            />
          </div>
          <button
            className="parameter-button"
            onClick={handleRandomizeSeed}
            disabled={disabled}
            type="button"
          >
            Randomize
          </button>
        </div>
      </div>

      <div className="parameter-section">
        <h3 className="parameter-section-title">Model</h3>
        <select
          className="parameter-select"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled}
        >
          <option value={MODELS.DISTILLED}>Flux 2 Klein 4B Distilled (Fast)</option>
          <option value={MODELS.BASE}>Flux 2 Klein 4B Base (Quality)</option>
        </select>
      </div>
    </div>
  );
}
