import React from 'react';

const EmptyState = ({ icon = '📂', title = 'No data found', description = 'There is nothing to display here yet.', action }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      background: 'var(--color-surface)',
      border: '1px dashed var(--color-border)',
      borderRadius: '12px',
      textAlign: 'center',
      color: 'var(--color-text-secondary)',
      margin: '1rem 0'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.8 }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.95rem', maxWidth: '400px', marginBottom: action ? '1.5rem' : '0' }}>
        {description}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};

export default EmptyState;
