import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAllInterviews } from '../hooks/useInterviews';
import Toast from '../components/ui/Toast';
import InterviewModal from '../components/modals/InterviewModal';

const Interviews = () => {
  const { user } = useAuth();
  const { interviews: allInterviews, loading, error, updateInterview } = useAllInterviews();
  const [editingInterview, setEditingInterview] = useState(null);

  const upcoming = allInterviews.filter(iv => new Date(iv.scheduledAt) >= new Date()).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const past = allInterviews.filter(iv => new Date(iv.scheduledAt) < new Date()).sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  const handleSaveInterview = async (formData) => {
    try {
      await updateInterview(editingInterview._id, formData);
      setEditingInterview(null);
    } catch (err) {
      console.error('Failed to update interview', err);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', paddingTop: '96px', paddingBottom: '32px' }}>
      <div style={{ padding: '0 32px', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
      
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '32px 32px 24px 32px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
          My Pipeline
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em' }}>
          Interviews
        </h1>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: '1rem 2rem', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.9rem', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Main Content: Interviews ──────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading interviews...</div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
            
            {/* Next Upcoming Interview Hero */}
            {upcoming.length > 0 && (() => {
              const next = upcoming[0];
              const d = new Date(next.scheduledAt);
              return (
                <section>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>Next Interview</h2>
                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-brand-primary-border)', borderRadius: '18px', padding: '32px', boxShadow: 'var(--shadow-glow)', position: 'relative', overflow: 'hidden' }}>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
                      <div style={{ background: 'var(--color-surface-raised)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', minWidth: '100px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '1rem', color: 'var(--color-brand-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.toLocaleString('default', { month: 'short' })}</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, margin: '0.5rem 0' }}>{d.getDate()}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{next.application?.company}</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', fontWeight: 500 }}>{next.application?.role}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ padding: '0.35rem 0.75rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>{next.type}</span>
                          {next.meetingLink && (
                            <a href={next.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}>Join Meeting ↗</a>
                          )}
                          <button 
                            onClick={() => setEditingInterview(next)}
                            style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.4rem 1rem', color: 'var(--color-text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                            Prepare
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* Empty State */}
            {allInterviews.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: 'var(--color-surface)', borderRadius: '18px', border: '1px dashed var(--color-border)' }}>
                <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '1.5rem' }}>📅</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>No Interviews Scheduled</h3>
                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '400px' }}>Your upcoming and past interviews will appear here. Keep applying and tracking your progress on the board!</p>
              </div>
            )}

            {/* Timeline */}
            {allInterviews.length > 0 && (
              <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>Timeline</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                  
                  {/* Vertical Line */}
                  <div style={{ position: 'absolute', left: '44px', top: '0', bottom: '0', width: '2px', background: 'var(--color-border)', zIndex: 0 }} />

                  {allInterviews.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)).map((iv, index) => {
                    const d = new Date(iv.scheduledAt);
                    const isPast = d < new Date();
                    return (
                      <div key={iv._id} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1, opacity: isPast ? 0.7 : 1 }}>
                        <div style={{ width: '90px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{d.toLocaleString('default', { month: 'short' })}</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{d.getDate()}</span>
                        </div>
                        
                        {/* Node */}
                        <div style={{ position: 'absolute', left: '44px', top: '16px', transform: 'translateX(-50%)', width: '12px', height: '12px', borderRadius: '50%', background: isPast ? 'var(--color-surface-raised)' : 'var(--color-brand-primary)', border: '2px solid var(--color-bg)', zIndex: 2 }} />

                        <div style={{ flex: 1, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-card)', transition: 'transform 0.2s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>{iv.application?.company}</div>
                              <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.25rem' }}>{iv.application?.role} • {iv.type}</div>
                            </div>
                            <span style={{
                              padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                              background: iv.result === 'Scheduled' ? 'rgba(13,115,119,0.2)' : iv.result === 'Passed' ? 'rgba(16,185,129,0.1)' : iv.result === 'Failed' ? 'rgba(239,68,68,0.1)' : 'var(--color-surface-overlay)',
                              color: iv.result === 'Scheduled' ? 'var(--color-brand-primary)' : iv.result === 'Passed' ? '#10b981' : iv.result === 'Failed' ? '#ef4444' : 'var(--color-text-muted)',
                              border: `1px solid ${iv.result === 'Scheduled' ? 'rgba(13,115,119,0.3)' : iv.result === 'Passed' ? 'rgba(16,185,129,0.2)' : iv.result === 'Failed' ? 'rgba(239,68,68,0.2)' : 'var(--color-border)'}`
                            }}>
                              {iv.result || 'Pending'}
                            </span>
                          </div>
                          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem', fontWeight: 500, alignItems: 'center' }}>
                            <span>🕒 {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {iv.meetingLink && !isPast && <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-brand-primary)' }}>Meeting Link ↗</a>}
                            <button 
                              onClick={() => setEditingInterview(iv)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'underline', marginLeft: 'auto' }}
                            >
                              Edit / Update Status
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {editingInterview && (
        <InterviewModal 
          isOpen={true} 
          onClose={() => setEditingInterview(null)}
          interview={editingInterview}
          onSave={handleSaveInterview}
        />
      )}

      </div>
    </div>
  );
};

export default Interviews;