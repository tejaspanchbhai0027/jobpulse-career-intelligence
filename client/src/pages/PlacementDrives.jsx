import React, { useState } from 'react';
import usePlacementDrives from '../hooks/usePlacementDrives';

const DriveCard = ({ drive, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const isRegistrationOpen = drive.status === 'REGISTRATION_OPEN';
  
  const handleRegister = async () => {
    if (!window.confirm(`Are you sure you want to register for ${drive.title} at ${drive.company}?`)) {
      return;
    }
    
    setIsRegistering(true);
    const res = await onRegister(drive._id);
    setIsRegistering(false);
    
    if (res.success) {
      alert('Successfully registered!');
    } else {
      alert(`Registration failed: ${res.message}`);
    }
  };

  return (
    <div 
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        position: 'relative'
      }}
    >
      {drive.isRegistered && (
        <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '0.75rem', background: '#10b98120', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
          Registered
        </div>
      )}
      
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
          {drive.employmentType}
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
          {drive.title}
        </h3>
        <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          {drive.company}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <span>📍</span> {drive.location} ({drive.workMode})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <span>📅</span> Drive Date: {new Date(drive.driveDate).toLocaleDateString()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <span>⏳</span> Reg Deadline: {new Date(drive.registrationEndDate).toLocaleDateString()}
        </div>
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
        <button
          onClick={handleRegister}
          disabled={!isRegistrationOpen || drive.isRegistered || isRegistering}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: drive.isRegistered 
              ? 'var(--color-surface-hover)' 
              : isRegistrationOpen 
                ? 'var(--color-brand-primary)' 
                : 'var(--color-border)',
            color: drive.isRegistered || !isRegistrationOpen ? 'var(--color-text-muted)' : '#fff',
            fontWeight: 600,
            cursor: drive.isRegistered || !isRegistrationOpen || isRegistering ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s'
          }}
        >
          {isRegistering ? 'Registering...' : drive.isRegistered ? 'Already Registered' : !isRegistrationOpen ? 'Registration Closed' : 'Register Now'}
        </button>
      </div>
    </div>
  );
};

const PlacementDrives = () => {
  const { drives, loading, error, registerForDrive } = usePlacementDrives('STUDENT');

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '32px', paddingTop: 'max(96px, env(safe-area-inset-top, 0px))', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>Placement Drives</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
              Campus recruitment events you are eligible for.
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', animation: 'pulse 1.5s infinite' }}>Loading placement drives...</div>
          </div>
        ) : (
          /* Grid */
          drives.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {drives.map(drive => (
                <DriveCard key={drive._id} drive={drive} onRegister={registerForDrive} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div style={{ background: 'var(--color-surface)', padding: '64px', borderRadius: '18px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎓</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>No placement drives found</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                There are currently no active placement drives for your department/batch. Check back later!
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PlacementDrives;
