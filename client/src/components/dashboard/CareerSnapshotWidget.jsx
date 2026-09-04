import React from 'react';

const CareerSnapshotWidget = ({ stats = { total: 0, applied: 0, interview: 0, offer: 0 }, user }) => {
  // Simple heuristic for profile strength
  const calculateProfileStrength = () => {
    let score = 30; // base score
    if (user?.resumeUrl) score += 20;
    if (user?.jobSearchGoal) score += 10;
    if (user?.preferences?.locations?.length > 0) score += 10;
    if (user?.preferences?.roles?.length > 0) score += 10;
    if (stats.interview > 0) score += 20; // Experience bonus
    return Math.min(score, 100);
  };
  
  const strength = calculateProfileStrength();
  
  const StatCard = ({ label, value, color, icon }) => (
    <div style={{ background: 'var(--color-surface)', border: `1px solid ${color}30`, borderRadius: '12px', padding: '1.25rem', flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4rem', opacity: 0.05, pointerEvents: 'none' }}>{icon}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ color }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-4" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem' }}>
      
      {/* Left: Pipeline Metrics */}
      <div style={{ flex: 2, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <StatCard label="Wishlist" value={stats.total - stats.applied - stats.interview - stats.offer} color="var(--color-wishlist)" icon="📋" />
        <StatCard label="Applied" value={stats.applied} color="var(--color-applied)" icon="📤" />
        <StatCard label="Interviewing" value={stats.interview} color="var(--color-interview)" icon="🎙️" />
        <StatCard label="Offers" value={stats.offer} color="var(--color-offer)" icon="🎉" />
      </div>

      {/* Right: Profile Strength */}
      <div style={{ flex: 1, minWidth: '250px', background: 'var(--gradient-brand)', borderRadius: '12px', padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', opacity: 0.9 }}>Profile Strength</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{strength}%</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
          <div style={{ height: '100%', background: '#fff', width: `${strength}%`, borderRadius: '4px' }}></div>
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
          {strength === 100 ? "You're ready for top-tier applications!" : "Update your career preferences to boost your score."}
        </div>
      </div>
      
    </div>
  );
};

export default CareerSnapshotWidget;
