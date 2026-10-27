import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const OpportunityDetailsModal = ({ opp, onClose, onUpdate, addToast }) => {
  const [loading, setLoading] = useState(false);
  const [localOpp, setLocalOpp] = useState(opp);
  const navigate = useNavigate();

  const handleWishlist = async () => {
    setLoading(true);
    try {
      if (localOpp.isWishlisted) {
        // Untrack
        const res = await api.delete(`/opportunities/${opp._id}/untrack`, {
          data: { applicationId: opp.applicationId }
        });
        if (res.data.success) {
          addToast('Success', 'Removed from Wishlist', 'success');
          setLocalOpp({ ...localOpp, isWishlisted: false, applicationId: null });
          if (onUpdate) onUpdate();
        }
      } else {
        // Track
        const res = await api.post(`/opportunities/${opp._id}/track`);
        if (res.data.success) {
          addToast('Success', 'Added to Wishlist', 'success');
          setLocalOpp({ ...localOpp, isWishlisted: true, applicationId: res.data.data._id });
          if (onUpdate) onUpdate();
        }
      }
    } catch (err) {
      addToast('Error', err.response?.data?.error || 'Failed to update wishlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    // Navigate to actual application page or trigger a modal
    // In JobPulse, application logic usually happens in the specific Drive/Application component
    // We will redirect to the drive page or applications page if it exists
    addToast('Info', 'Application initiated', 'info');
    onClose();
  };

  const score = localOpp.match?.score || 0;
  const matchColor = score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-text-muted)';
  const breakdown = localOpp.match?.breakdown || {};

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'var(--color-surface)',
          borderRadius: '24px', width: '100%', maxWidth: '800px',
          maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '32px', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
          
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '8px' }}>
            {localOpp.company || 'Institution'}
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
            {localOpp.title}
          </h2>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'var(--color-text-secondary)' }}>
            <span>📍 {localOpp.location || 'TBD'}</span>
            <span>💼 {localOpp.type}</span>
            <span>🏢 {localOpp.workMode || 'TBD'}</span>
            {localOpp.salary && localOpp.salary !== 'TBD' && <span>💰 {localOpp.salary}</span>}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Eligibility Error */}
          {!localOpp.isEligible && localOpp.eligibilityReasons && localOpp.eligibilityReasons.length > 0 && (
            <div style={{ background: 'var(--color-error)15', color: 'var(--color-error)', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Not Eligible for this opportunity</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {localOpp.eligibilityReasons.map((reason, i) => <li key={i}>{reason}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
            {/* Main Info */}
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                Required Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                {(localOpp.skills || []).map((skill, i) => {
                  const isMatched = localOpp.match?.matchingSkills?.includes(skill.toLowerCase());
                  return (
                    <span key={i} style={{
                      padding: '6px 14px', borderRadius: '8px', fontSize: '0.9rem',
                      background: isMatched ? 'var(--color-brand-primary)15' : 'var(--color-surface-raised)',
                      color: isMatched ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                      border: `1px solid ${isMatched ? 'var(--color-brand-primary)30' : 'var(--color-border)'}`
                    }}>
                      {skill} {isMatched && '✓'}
                    </span>
                  );
                })}
                {(!localOpp.skills || localOpp.skills.length === 0) && (
                  <span style={{ color: 'var(--color-text-muted)' }}>No specific skills listed.</span>
                )}
              </div>

              {/* Match Explanation */}
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                Why this opportunity matches you
              </h3>
              <div style={{ background: 'var(--color-surface-raised)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
                {localOpp.match?.reasons?.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--color-text-primary)' }}>
                    {localOpp.match.reasons.map((r, i) => (
                      <li key={i} style={{ color: r.startsWith('✓') ? 'var(--color-success)' : r.startsWith('⚠') ? 'var(--color-warning)' : 'inherit', listStyleType: 'none', marginLeft: '-20px' }}>
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No specific match reasons generated.</p>
                )}
              </div>
            </div>

            {/* Sidebar / Match Score */}
            <div>
              <div style={{ 
                background: `${matchColor}15`, border: `1px solid ${matchColor}30`, 
                padding: '24px', borderRadius: '16px', textAlign: 'center', marginBottom: '24px' 
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: matchColor, lineHeight: 1 }}>
                  {score}%
                </div>
                <div style={{ color: matchColor, fontWeight: 600, marginTop: '8px', fontSize: '1.1rem' }}>
                  Profile Match
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Skills Match', val: breakdown.skillsMatch },
                  { label: 'Resume Match', val: breakdown.resumeMatch },
                  { label: 'Role Match', val: breakdown.roleMatch },
                  { label: 'Education Match', val: breakdown.educationMatch }
                ].map((b, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                      <span>{b.label}</span>
                      <span>{b.val}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--color-surface-raised)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${b.val}%`, background: 'var(--color-brand-primary)', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ 
          padding: '24px 32px', borderTop: '1px solid var(--color-border)', 
          background: 'var(--color-surface-raised)', display: 'flex', gap: '16px', justifyContent: 'flex-end',
          borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px'
        }}>
          <button 
            onClick={() => {
              const message = `I'm interested in the ${localOpp.title} opportunity at ${localOpp.company}. Can you help me prepare for this role?`;
              navigate('/copilot', { state: { message, specificContext: { opportunity: localOpp } } });
            }}
            style={{ 
              background: 'var(--gradient-brand)', border: 'none', color: '#000',
              padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            🤖 Ask Copilot
          </button>
          
          <button 
            onClick={handleWishlist}
            disabled={loading}
            style={{ 
              background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
              padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {localOpp.isWishlisted ? '♥ Wishlisted' : '♡ Add to Wishlist'}
          </button>
          
          <button 
            onClick={handleApply}
            disabled={!localOpp.isEligible || localOpp.hasApplied || (localOpp.deadline && new Date(localOpp.deadline) < new Date())}
            style={{ 
              background: localOpp.hasApplied ? 'var(--color-surface-raised)' : 'var(--color-brand-primary)', 
              border: localOpp.hasApplied ? '1px solid var(--color-border)' : 'none', 
              color: localOpp.hasApplied ? 'var(--color-text-secondary)' : '#000',
              padding: '12px 32px', borderRadius: '8px', cursor: localOpp.hasApplied ? 'not-allowed' : 'pointer', fontWeight: 700
            }}
          >
            {localOpp.hasApplied ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailsModal;
