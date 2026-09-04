import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, intRes] = await Promise.all([
          api.get('/officer/dashboard'),
          api.get('/officer/interviews')
        ]);
        setMetrics(dashRes.data.data.kpis);
        setPipeline(dashRes.data.data.pipeline || []);
        // Prioritize dashboard signals, fallback to full interventions if needed
        setInterventions(dashRes.data.data.attentionSignals || []);
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
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading Placement Command Center...</div>;
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

  const upcomingInterviews = interviews.filter(i => new Date(i.date) >= new Date()).slice(0, 5);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Command Center
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', margin: 0 }}>
          Placement intelligence and operational overview for {user?.institution?.name || 'your institution'}.
        </p>
      </div>

      {/* Primary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Students', value: metrics.totalStudents, color: 'var(--color-brand-primary)' },
          { label: 'Active Job Seekers', value: metrics.activeStudents, color: '#3b82f6' },
          { label: 'Applications', value: metrics.applications, color: 'var(--color-text-primary)' },
          { label: 'Interviews', value: metrics.interviews, color: '#f59e0b' },
          { label: 'Offers', value: metrics.offers, color: '#10b981' },
          { label: 'Placement Rate', value: `${metrics.placementRate}%`, color: '#10b981' },
          { label: 'Needs Attention', value: metrics.needsAttention, color: metrics.needsAttention > 0 ? '#ef4444' : 'var(--color-text-primary)', action: () => navigate('/officer/interventions') }
        ].map((m, i) => (
          <div key={i} onClick={m.action} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', cursor: m.action ? 'pointer' : 'default', transition: 'transform 0.2s' }} onMouseEnter={e => m.action && (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => m.action && (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>
        Placement Pipeline
      </h2>
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2.5rem', marginBottom: '2.5rem', display: 'flex', gap: '2rem', overflowX: 'auto', alignItems: 'center' }}>
        {pipeline.map((step, idx) => (
          <React.Fragment key={idx}>
            <FunnelStep label={step.name} value={step.value} highlight={step.name.includes('Interview')} success={step.name.includes('Offer')} />
            {idx < pipeline.length - 1 && <FunnelArrow />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Intervention Radar */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', background: 'var(--color-surface-raised)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>⚠️ Today's Attention</h2>
            <button onClick={() => navigate('/officer/interventions')} style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>View All</button>
          </div>
          <div style={{ padding: '1rem' }}>
            {interventions.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>All clear! No students need urgent attention today.</div>
            ) : (
              interventions.map((sig, idx) => (
                <div key={idx} style={{ padding: '1.25rem', borderBottom: idx < interventions.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{sig.student.name}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: sig.priority === 'HIGH' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: sig.priority === 'HIGH' ? '#ef4444' : '#f59e0b', whiteSpace: 'nowrap' }}>
                      {sig.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>{sig.reason}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Action: <span style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>{sig.action}</span>
                    </div>
                    <button onClick={() => navigate(`/officer/students/${sig.student._id}`)} style={{ padding: '0.4rem 1rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>View Student</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', background: 'var(--color-surface-raised)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>🎤 Upcoming Interviews</h2>
            <button onClick={() => navigate('/officer/interviews')} style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>View All</button>
          </div>
          <div style={{ padding: '1rem' }}>
            {upcomingInterviews.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No upcoming interviews scheduled.</div>
            ) : (
              upcomingInterviews.map((int, idx) => (
                <div key={idx} style={{ padding: '1.25rem', borderBottom: idx < upcomingInterviews.length - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', minWidth: '60px', padding: '0.75rem', background: 'rgba(37,99,235,0.05)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-brand-primary)', textTransform: 'uppercase' }}>
                      {new Date(int.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: 1, marginTop: '0.2rem' }}>
                      {new Date(int.date).getDate()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{int.student.name}</div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>{int.application?.company} • {int.application?.role}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>🕒 {new Date(int.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>Round {int.round || 1}</span>
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

export default OfficerDashboard;
