import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const PlacementUpdates = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUpcomingDrives();
  }, []);

  const fetchUpcomingDrives = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/placement-drives/available');
      if (res.data.success) {
        setDrives(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load upcoming drives', err);
      setError('Unable to load upcoming placement drives.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: '4px solid var(--color-border)',
          borderTopColor: 'var(--color-brand-primary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', maxWidth: '600px', margin: '48px auto' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Failed to Load Updates</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>{error}</p>
        <button 
          onClick={fetchUpcomingDrives}
          style={{ padding: '10px 24px', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px', paddingBottom: '100px' }}>
      {/* Header Section */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: '24px',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
        marginBottom: '40px'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute', top: '-50%', right: '10%', width: '300px', height: '300px',
          background: 'var(--color-brand-primary)', borderRadius: '50%',
          filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none'
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px',
            background: 'rgba(32, 178, 170, 0.1)', border: '1px solid rgba(32, 178, 170, 0.2)',
            borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#20b2aa',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px'
          }}>
            Live Feed
          </div>
          <h1 style={{
            fontSize: '2.5rem', fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', letterSpacing: '-0.02em', marginBottom: '12px'
          }}>
            Upcoming Drives
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', maxWidth: '700px', lineHeight: 1.6 }}>
            Explore open placement opportunities, check your eligibility, and stay ahead of critical registration deadlines.
          </p>
        </div>
      </div>

      {/* Drives List */}
      {drives.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '24px', padding: '64px', textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', margin: '0 auto 24px auto', opacity: 0.8
          }}>📅</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
            No Upcoming Drives
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '450px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.5 }}>
            There are currently no placement drives scheduled. Keep an eye out—new opportunities will appear here soon.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {drives.map(drive => {
            const isRegistrationOpen = drive.status === 'REGISTRATION_OPEN';
            
            return (
              <div 
                key={drive._id}
                style={{
                  position: 'relative', background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                  borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                  transition: 'border-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                {/* Background ambient gradient */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, var(--color-surface) 0%, transparent 100%)', opacity: 0.5, pointerEvents: 'none' }}></div>

                <div style={{ position: 'relative', zIndex: 10, padding: '20px' }}>
                  
                  {/* Top Row: Company, Role, Tags & Action */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1 }}>{drive.company}</h2>
                        <span style={{ fontSize: '1rem', color: 'var(--color-brand-primary)', fontWeight: 700 }}>{drive.jobRole || drive.title}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '4px 10px', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                          {drive.employmentType}
                        </span>
                        <span style={{ padding: '4px 10px', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                          {drive.workMode}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {drive.isRegistered ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                          <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Registered</span>
                        </div>
                      ) : isRegistrationOpen ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></div>
                          <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Accepting Apps</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></div>
                          <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Closed</span>
                        </div>
                      )}
                      
                      {drive.applicationUrl && (
                        <a 
                          href={drive.applicationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 16px', background: 'var(--gradient-brand)', color: 'white',
                            borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(32, 178, 170, 0.2)', transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          Apply 🚀
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', marginBottom: '16px' }}></div>

                  {/* Middle Row: Quick Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Package (CTC)</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{drive.ctc ? `₹${drive.ctc}` : 'Not Disclosed'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Location</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{drive.location || 'TBD'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Drive Date</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        {drive.driveDate ? new Date(drive.driveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Deadline</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isRegistrationOpen ? 'var(--color-text-secondary)' : '#ef4444' }}>
                        {drive.registrationEndDate ? new Date(drive.registrationEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Details & Skills */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', background: 'var(--color-surface)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Description</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {drive.jobDescription || 'No description provided.'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Eligibility & Process</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        <span style={{ fontWeight: 600 }}>Eligibility:</span> {drive.eligibilityCriteria || 'N/A'} • <span style={{ fontWeight: 600 }}>Process:</span> {drive.selectionProcess || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {drive.skillsRequired && drive.skillsRequired.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {drive.skillsRequired.map((skill, idx) => (
                        <span key={idx} style={{ padding: '2px 8px', background: 'var(--color-surface-raised)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlacementUpdates;
