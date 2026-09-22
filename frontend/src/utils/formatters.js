export function formatDate(dateString) {
  if (!dateString) return '--';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(timeString) {
  if (!timeString) return '--';
  // Handle HH:mm:ss or ISO string
  if (timeString.includes('T')) {
    const d = new Date(timeString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return timeString.substring(0, 5);
}

export function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '--';
  const d = new Date(dateTimeString);
  if (isNaN(d.getTime())) return dateTimeString;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatPercentage(num) {
  if (num == null || isNaN(num)) return '0.0%';
  return `${Number(num).toFixed(1)}%`;
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'PRESENT':
      return 'badge-present';
    case 'ABSENT':
      return 'badge-absent';
    case 'LATE':
      return 'badge-late';
    case 'EXCUSED':
      return 'badge-excused';
    case 'REJECTED':
      return 'badge-rejected';
    case 'ACTIVE':
      return 'badge-active';
    case 'CLOSED':
      return 'badge-closed';
    default:
      return 'badge-closed';
  }
}
