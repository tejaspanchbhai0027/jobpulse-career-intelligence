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

      {/* Primary Metrics: Students */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
        Student Overview
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Assigned Students', value: metrics.totalStudents, color: 'var(--color-text-primary)', action: () => navigate('/mentor/students') },
          { label: 'Active Pipeline', value: metrics.activeStudents, color: '#3b82f6' },
          { label: 'Inactive / Cold', value: Math.max(0, metrics.totalStudents - metrics.activeStudents), color: '#f59e0b' },
          { label: 'Requires Attention', value: topSignals.length > 0 ? topSignals.length : 0, color: '#ef4444', action: () => navigate('/mentor/interventions') },
        ].map((m, i) => (
          <div key={i} onClick={m.action} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: m.color === '#ef4444' && m.value > 0 ? '2px solid #ef4444' : '1px solid var(--color-border)', boxShadow: m.color === '#ef4444' && m.value > 0 ? '0 4px 12px rgba(239,68,68,0.2)' : 'var(--shadow-sm)', cursor: m.action ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: m.color === '#ef4444' && m.value > 0 ? '#ef4444' : 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Metrics: Pipeline */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
        Placement Pipeline
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Applications', value: metrics.applications, color: 'var(--color-text-primary)' },
          { label: 'Upcoming Interviews', value: upcomingInterviews.length, color: '#3b82f6', action: () => navigate('/mentor/interviews') },
          { label: 'Offers Received', value: metrics.offers, color: '#10b981' },
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Intervention Radar - Prioritized */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid #ef4444', boxShadow: '0 4px 20px rgba(239,68,68,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,68,68,0.05)' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444' }}>⚠️ STUDENTS NEEDING ATTENTION</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Intervene immediately to help these students get back on track.</div>
            </div>
            <button onClick={() => navigate('/mentor/interventions')} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>View Action Queue</button>
          </div>
          <div style={{ padding: '0' }}>
            {topSignals.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <div style={{ fontSize: '3rem', margin: '0 auto 1rem auto', width: '60px', height: '60px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
                <h3 style={{ margin: '0', color: 'var(--color-text-primary)' }}>All students are on track!</h3>
              </div>
            ) : (
              topSignals.map((sig, idx) => (
                <div key={idx} style={{ padding: '1.5rem', borderBottom: idx < topSignals.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', gap: '1.5rem', alignItems: 'center', hover: { background: 'var(--color-bg)' } }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, flexShrink: 0 }}>
                    {sig.student.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '1.1rem' }}>{sig.student.name}</strong>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: sig.priority === 'HIGH' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: sig.priority === 'HIGH' ? '#ef4444' : '#f59e0b' }}>
                        {sig.priority} PRIORITY
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>{sig.reason}</div>
                  </div>
                  <div>
                    <button onClick={() => navigate(`/mentor/students/${sig.student._id}`)} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      Review Profile →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews / Agenda */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📅 TODAY'S AGENDA</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>Upcoming interviews & actions.</div>
          </div>
          <div style={{ padding: '1rem' }}>
            {upcomingInterviews.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No upcoming interviews.</div>
            ) : (
              upcomingInterviews.map((int, idx) => (
                <div key={idx} style={{ padding: '1rem', borderBottom: idx < upcomingInterviews.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', minWidth: '50px', background: 'var(--color-bg)', padding: '0.5rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      {new Date(int.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-brand-primary)', lineHeight: 1 }}>
                      {new Date(int.scheduledAt).getDate()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{int.user?.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{int.application?.company}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                      {new Date(int.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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



export default MentorDashboard;
