import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters';

export default function StatusBadge({ status }) {
  if (!status) return null;
  const badgeClass = getStatusBadgeClass(status);
  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
}
