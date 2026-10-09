import React from 'react';

// Dark destructive-action confirmation dialog used across the workspace
// instead of the native browser confirm() popup.
function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 17, 0.62)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '400px',
          maxWidth: '92vw',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(148, 163, 184, 0.28)',
          borderRadius: '18px',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55), 0 0 24px rgba(225, 29, 72, 0.12)'
        }}
      >
        <div style={{ fontSize: '26px', marginBottom: '12px' }}>⚠️</div>
        <h3 style={{ color: '#f8fafc', fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>
          {title}
        </h3>
        <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.55, marginBottom: '22px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, padding: '11px', borderRadius: '12px', cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.07)', color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.35)', fontSize: '13px', fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, padding: '11px', borderRadius: '12px', cursor: 'pointer',
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', color: '#ffffff',
              border: '1px solid #fb7185', fontSize: '13px', fontWeight: 700,
              boxShadow: '0 4px 16px rgba(225, 29, 72, 0.4)'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
