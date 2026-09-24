import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, sigRes, intRes] = await Promise.all([
          api.get('/mentor/dashboard'),
          api.get('/mentor/interventions'),
          api.get('/mentor/interviews')
        ]);
        setMetrics(dashRes.data.data);
        setInterventions(sigRes.data.data || []);
        setInterviews(intRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading Mentor Dashboard...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      </div>
    );
  }

  const placed = metrics.offers; // Using offers as placed for MVP
  const upcomingInterviews = interviews.filter(i => new Date(i.scheduledAt) >= new Date()).slice(0, 5);
  const topSignals = interventions.slice(0, 5);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Good morning, {user?.name}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', margin: 0 }}>
          Here's how your students are progressing.
        </p>
      </div>

      {/* Primary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'My Students', value: metrics.totalStudents, color: 'var(--color-text-primary)', action: () => navigate('/mentor/students') },
          { label: 'Active Pipeline', value: metrics.activeStudents, color: '#3b82f6' },
          { label: 'Upcoming Interviews', value: upcomingInterviews.length, color: '#f59e0b', action: () => navigate('/mentor/interviews') },
          { label: 'Offers', value: metrics.offers, color: '#10b981' },
          { label: 'Requires Attention', value: metrics.studentsRequiringAttention || 0, color: '#ef4444' },
          { label: 'Overdue Tasks', value: metrics.studentsWithOverdueTasks || 0, color: '#f43f5e' },
          { label: 'Open Interventions', value: metrics.openInterventions || 0, color: '#8b5cf6', action: () => navigate('/mentor/interventions') },
        ].map((m, i) => (
          <div key={i} onClick={m.action} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', cursor: m.action ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>
        Student Progress
      </h2>
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', marginBottom: '2.5rem', display: 'flex', gap: '2rem', overflowX: 'auto' }}>
        <FunnelStep label="Students" value={metrics.totalStudents} />
        <FunnelArrow />
        <FunnelStep label="Applications" value={metrics.applications} />
        <FunnelArrow />
        <FunnelStep label="Interviews" value={metrics.interviews} highlight />
        <FunnelArrow />
        <FunnelStep label="Offers" value={metrics.offers} success />
        <FunnelArrow />
        <FunnelStep label="Placed" value={placed} success />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Intervention Radar */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ ATTENTION REQUIRED</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Students who may need your support.</div>
            </div>
            <button onClick={() => navigate('/mentor/interventions')} style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-primary)', fontWeight: 600, cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ padding: '1rem' }}>
            {topSignals.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>All students are on track!</div>
            ) : (
              topSignals.map((sig, idx) => (
                <div key={idx} style={{ padding: '1rem', borderBottom: idx < topSignals.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{sig.student.name}</strong>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: sig.priority === 'HIGH' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: sig.priority === 'HIGH' ? '#ef4444' : '#f59e0b' }}>
                      {sig.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{sig.reason}</div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <button onClick={() => navigate(`/mentor/students/${sig.student._id}`)} style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                      View Student
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews / Agenda */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📅 TODAY'S AGENDA</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Upcoming interviews & actions.</div>
            </div>
            <button onClick={() => navigate('/mentor/interviews')} style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-primary)', fontWeight: 600, cursor: 'pointer' }}>View All</button>
          </div>
          <div style={{ padding: '1rem' }}>
            {upcomingInterviews.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No upcoming interviews.</div>
            ) : (
              upcomingInterviews.map((int, idx) => (
                <div key={idx} style={{ padding: '1rem', borderBottom: idx < upcomingInterviews.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', gap: '1rem' }}>
                  <div style={{ textAlign: 'center', minWidth: '60px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      {new Date(int.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-brand-primary)', lineHeight: 1 }}>
                      {new Date(int.scheduledAt).getDate()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{int.user?.name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{int.application?.company} • {int.application?.role}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      {new Date(int.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Round: {int.round || 1}
                      {int.meetingUrl && (
                        <span> • <a href={int.meetingUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-primary)' }}>Join Meeting</a></span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FunnelStep = ({ label, value, highlight, success }) => (
  <div style={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>{label}</div>
    <div style={{ 
      fontSize: '2.5rem', 
      fontWeight: 900, 
      color: success ? '#10b981' : highlight ? '#f59e0b' : 'var(--color-text-primary)' 
    }}>
      {value}
    </div>
  </div>
);

const FunnelArrow = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-border)', fontSize: '1.5rem' }}>
    →
  </div>
);

export default MentorDashboard;
