import React from 'react';
import { useAuth } from '../../context/AuthContext';
import MentorRecommendationsWidget from './MentorRecommendationsWidget';

const MentorCard = () => {
  const { user } = useAuth();
  
  if (!user?.mentorId) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎓</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>No Mentor Assigned</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>You haven't been assigned a career mentor yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Your Career Mentor
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>
            {user.mentorId.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{user.mentorId.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Industry Professional</div>
          </div>
        </div>
      </div>
      
      {/* Mentor Recommendations Widget handles its own loading and empty states */}
      <MentorRecommendationsWidget />
    </div>
  );
};

export default MentorCard;
