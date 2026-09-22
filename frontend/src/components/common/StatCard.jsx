import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: { bg: '#eff6ff', color: '#2563eb' },
    green: { bg: '#ecfdf5', color: '#10b981' },
    amber: { bg: '#fffbeb', color: '#f59e0b' },
    red: { bg: '#fef2f2', color: '#ef4444' },
    purple: { bg: '#f5f3ff', color: '#8b5cf6' },
    cyan: { bg: '#ecfeff', color: '#06b6d4' }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="stat-card">
      <div>
        <span className="stat-label">{title}</span>
        <div className="stat-value">{value}</div>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper" style={{ backgroundColor: scheme.bg, color: scheme.color }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
