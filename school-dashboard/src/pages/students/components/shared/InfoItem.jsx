import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * InfoItem - Minimal label-value display component
 *
 * @param {string} label - The label text
 * @param {string} value - The value to display
 * @param {React.Component} icon - Optional icon component
 * @param {string} className - Optional additional classes
 */
function InfoItem({ label, value, icon: Icon, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs text-fg-muted mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={14} className="text-fg-faint" strokeWidth={2} />}
        <p className="text-sm font-medium text-fg">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

export default React.memo(InfoItem);
