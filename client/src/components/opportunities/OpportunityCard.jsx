import React from 'react';


const OpportunityCard = ({ opp, onClick }) => {
  const { 
    company, title, type, location, workMode, salary, deadline, skills, match 
  } = opp;

  const score = match?.score || 0;
  const matchColor = score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-text-muted)';
  
  // Try using dateUtils if available, else simple fallback
  let deadlineText = 'No deadline';
  let deadlineColor = 'var(--color-text-secondary)';
  if (deadline) {
    const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      deadlineText = 'Closed';
      deadlineColor = 'var(--color-error)';
    } else if (daysLeft === 0) {
      deadlineText = 'Closing today';
      deadlineColor = 'var(--color-error)';
    } else if (daysLeft <= 3) {
      deadlineText = `${daysLeft} days left`;
      deadlineColor = 'var(--color-warning)';
    } else {
      deadlineText = `${daysLeft} days left`;
      deadlineColor = 'var(--color-success)';
    }
  }

  return (
    <div 
      onClick={onClick}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'var(--transition)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '4px' }}>
            {company || 'Institution'}
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            {title}
          </h3>
        </div>
        
        {/* Match Badge */}
        <div style={{ 
          background: `${matchColor}15`, 
          color: matchColor, 
          padding: '6px 12px', 
          borderRadius: '999px',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>{score}%</span> MATCH
        </div>
      </div>

      {/* Meta info */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          📍 {location || 'TBD'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          💼 {type}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          🏢 {workMode || 'TBD'}
        </span>
        {salary && salary !== 'TBD' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            💰 {salary}
          </span>
        )}
      </div>

      {/* Skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
        {(skills || []).slice(0, 4).map((skill, idx) => {
          // Check if skill is matched
          const isMatched = match?.matchingSkills?.includes(skill.toLowerCase());
          return (
            <span key={idx} style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '6px',
              background: isMatched ? 'var(--color-brand-primary)15' : 'var(--color-surface-raised)',
              color: isMatched ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              border: `1px solid ${isMatched ? 'var(--color-brand-primary)30' : 'var(--color-border)'}`
            }}>
              {skill}
            </span>
          );
        })}
        {skills?.length > 4 && (
          <span style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--color-text-muted)' }}>
            +{skills.length - 4} more
          </span>
        )}
      </div>

      {/* Footer / Status */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: '16px',
        borderTop: '1px solid var(--color-border)',
        marginTop: '8px'
      }}>
        <div style={{ fontSize: '0.8rem', color: deadlineColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          🗓 {deadlineText}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {opp.hasApplied && (
            <span style={{ 
              fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-brand-primary)',
              background: 'var(--color-brand-primary)15', padding: '4px 12px', borderRadius: '6px'
            }}>
              Applied
            </span>
          )}
          {!opp.hasApplied && opp.isWishlisted && (
            <span style={{ 
              fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-warning)',
              background: 'var(--color-warning)15', padding: '4px 12px', borderRadius: '6px'
            }}>
              ♥ Wishlisted
            </span>
          )}
          {!opp.hasApplied && !opp.isEligible && (
            <span style={{ 
              fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-error)',
              background: 'var(--color-error)15', padding: '4px 12px', borderRadius: '6px'
            }}>
              Not Eligible
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;
