import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CopilotWidget from './CopilotWidget';
import CareerSnapshotWidget from './CareerSnapshotWidget';
import MentorCard from './MentorCard';

const CommandCenter = ({ applications = [], interviews = [], stats, upcomingInterviews = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRec, setExpandedRec] = useState(null);

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const { data } = await api.get('/intelligence/overview');
        if (data?.data?.recommendations) {
          setRecommendations(data.data.recommendations);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      }
    };
    const fetchFeedback = async () => {
      try {
        const { data } = await api.get('/dashboard/feedback');
        if (data?.data) {
          setFeedback(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch feedback:', err);
      }
    };

    Promise.all([fetchDecisions(), fetchFeedback()]).finally(() => setLoading(false));
  }, []);

  const actions = useMemo(() => {
    const urgent = recommendations.filter(r => r.type === 'INTERVIEW_PREPARATION' || (r.type === 'APPLICATION_PRIORITY' && r.priority === 'High'));
    const followUp = recommendations.filter(r => r.type === 'FOLLOW_UP' || r.type === 'RECRUITER_OUTREACH');
    const opportunity = recommendations.filter(r => r.type === 'APPLICATION_PRIORITY' && r.priority !== 'High');
    const strategy = recommendations.filter(r => r.type === 'EXPERIMENT' || r.type === 'SKILL_DEVELOPMENT' || r.type === 'RESUME_SELECTION');
    return { urgent, followUp, opportunity, strategy };
  }, [recommendations]);

  const handleAction = async (item) => {
    try { await api.post(`/intelligence/recommendations/${item.id}/feedback`, { decision: 'ACCEPTED' }); } catch (e) { }
    if (['INTERVIEW_PREPARATION', 'EXPERIMENT', 'SKILL_DEVELOPMENT'].includes(item.type)) {
      navigate('/intelligence');
    } else {
      alert(`Executing action: ${item.action}`);
    }
  };

  const handleDismiss = async (item, e) => {
    e.stopPropagation();
    try {
      await api.post(`/intelligence/recommendations/${item.id}/feedback`, { decision: 'DISMISSED' });
      setRecommendations(prev => prev.filter(r => r.id !== item.id));
    } catch (e) {
      setRecommendations(prev => prev.filter(r => r.id !== item.id));
    }
  };

  const ActionCard = ({ dotColor, badgeText, items }) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-raised)' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}` }}></div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {badgeText}
          </span>
        </div>
        <div style={{ padding: '0.5rem 1.5rem' }}>
          {items.map((item, idx) => {
            const isExpanded = expandedRec === item.id;
            return (
              <div key={item.id || idx} style={{ padding: '1rem 0', borderBottom: idx !== items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>{item.summary}</div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setExpandedRec(isExpanded ? null : item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                        {isExpanded ? 'Hide Evidence ▲' : 'Why? ▼'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <button onClick={() => handleAction(item)} style={{ background: dotColor, border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', transition: 'var(--transition)' }}>
                      {item.action}
                    </button>
                    <button onClick={(e) => handleDismiss(item, e)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Dismiss
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Decision Engine Evidence</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}><strong>Reason:</strong> {item.reason}</div>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                      {item.evidence?.map((ev, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{ev}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Your Career Command Center
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.1 }}>
            {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>Here's what matters most in your job search today.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* CareerSnapshotWidget handles Profile Strength and Pipeline Snapshot */}
        <CareerSnapshotWidget stats={stats} user={user} />
      </div>

      {applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--color-surface-raised)', borderRadius: '16px', border: '1px dashed var(--color-border)', marginTop: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>Ready to launch your career?</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            The Command Center comes alive once you start tracking applications. JobPulse AI will analyze your pipeline, identify bottlenecks, and recommend actions.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard?view=board')} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '1rem', borderRadius: '8px' }}>
              + Add First Application
            </button>
            <button onClick={() => navigate('/settings')} style={{ padding: '0.75rem 1.5rem', fontWeight: 700, fontSize: '1rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
              Upload Resume
            </button>
          </div>
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', '@media (minWidth: 1024px)': { gridTemplateColumns: '2fr 1fr' } }} className="lg:grid-cols-3">
        
        {/* Left Column: Priorities & Upcoming Activity */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>Today's Priorities</h2>
            {loading ? (
              <div style={{ color: 'var(--color-text-muted)' }}>Analyzing pipeline...</div>
            ) : (
              <>
                <ActionCard dotColor="#ef4444" badgeText="🔴 Urgent" items={actions.urgent} />
                <ActionCard dotColor="#f59e0b" badgeText="🟠 Follow Up" items={actions.followUp} />
                <ActionCard dotColor="#10b981" badgeText="🟢 Opportunity" items={actions.opportunity} />
                <ActionCard dotColor="#3b82f6" badgeText="🔵 Strategy" items={actions.strategy} />

                {recommendations.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                    <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>You're all caught up!</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Nothing needs your attention right now.</p>
                  </div>
                )}
              </>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>Upcoming Activity</h2>
            {upcomingInterviews?.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {upcomingInterviews.map((iv, idx) => (
                  <div key={idx} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700 }}>{new Date(iv.scheduledAt).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>{new Date(iv.scheduledAt).getDate()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(iv.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem', flex: 1 }}>
                      <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: '1.05rem' }}>{iv.application?.company}</div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{iv.application?.role} - {iv.type}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => navigate('/dashboard?view=board')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>View App</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>No upcoming activities.</p>
                <button onClick={() => navigate('/dashboard?view=board')} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer' }}>+ Add Application</button>
              </div>
            )}
          </section>

        </div>
        
        {/* Right Column: Mentor & Advisor Notes */}
        <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <MentorCard />
          
          {/* Advisor Notes */}
          {feedback.length > 0 && (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-brand-primary)' }}>📝 Advisor Notes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {feedback.map(f => (
                  <div key={f._id} style={{ background: 'var(--color-surface-raised)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}>{f.type}</span>
                      <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{f.content}</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>— {f.mentorId?.name || 'Advisor'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default CommandCenter;
