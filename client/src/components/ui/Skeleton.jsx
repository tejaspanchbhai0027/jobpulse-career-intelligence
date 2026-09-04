import React from 'react';

const Skeleton = ({ width = '100%', height = '1rem', borderRadius = '4px', style = {} }) => {
  return (
    <div 
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-surface-overlay) 0%, var(--color-surface-raised) 50%, var(--color-surface-overlay) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s infinite linear',
        ...style
      }} 
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)', padding: '1rem' }}>
        {Array(cols).fill(0).map((_, i) => (
          <Skeleton key={i} width={`${100/cols}%`} height="1.2rem" style={{ marginRight: i < cols - 1 ? '1rem' : 0 }} />
        ))}
      </div>
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} style={{ display: 'flex', padding: '1rem', borderBottom: i < rows - 1 ? '1px solid var(--color-border)' : 'none' }}>
          {Array(cols).fill(0).map((_, j) => (
            <Skeleton key={j} width={`${100/cols}%`} height="1rem" style={{ marginRight: j < cols - 1 ? '1rem' : 0, opacity: 0.8 }} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
