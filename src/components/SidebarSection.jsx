import React from 'react';
import Tooltip from './Tooltip';
import './SidebarSection.css';

/**
 * Sidebar section with stage number badge. Always open (no collapse).
 */
export default function SidebarSection({
  stageNumber,
  title,
  tooltipId,
  disabled = false,
  children,
}) {
  return (
    <div className={`sidebar-section${disabled ? ' sidebar-section-disabled' : ''}`}>
      <div className="sidebar-section-header">
        <span className="sidebar-section-badge">{stageNumber}</span>
        <span className="sidebar-section-title">{title}</span>
        {tooltipId && <Tooltip tooltipId={tooltipId} size={14} />}
      </div>
      <div className="sidebar-section-body">{children}</div>
    </div>
  );
}
