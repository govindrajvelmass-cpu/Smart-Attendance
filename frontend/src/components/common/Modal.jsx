import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '540px' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <h3 className="card-title">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.25rem', borderRadius: '50%', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
