import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../../components/ui/Skeleton';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, alertsRes] = await Promise.all([
          api.get('/officer/dashboard'),
          api.get('/officer/placement-verification')
        ]);
        setMetrics(dashRes.data.data.kpis);
        setPipeline(dashRes.data.data.pipeline || []);
        setAlerts(alertsRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Skeleton height="80px" borderRadius="16px" style={{ marginBottom: '2rem' }} />
        <Skeleton height="120px" borderRadius="16px" style={{ marginBottom: '2rem' }} />
        <Skeleton height="300px" borderRadius="16px" />
      </div>
    );
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

  const highPriorityAlerts = alerts.filter(a => a.severity === 'High');

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header section with gradient background */}
      <div style={{ 
        marginBottom: '2.5rem', 
        padding: '2.5rem', 
        borderRadius: '24px', 
        background: 'linear-gradient(135deg, var(--color-bg), var(--color-surface))',
        border: '1px solid var(--color-border)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em', margin: 0 }}>
            Command Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', margin: '0.5rem 0 0 0' }}>
            Placement intelligence and operational overview for <span style={{ color: 'var(--color-brand-primary)', fontWeight: 700 }}>{user?.institution?.name || 'your institution'}</span>.
          </p>
        </div>
        {metrics?.lastUpdated && (
          <div style={{ 
            background: 'var(--color-surface-overlay)', 
            padding: '0.5rem 1rem', 
            borderRadius: '99px',
            color: 'var(--color-text-muted)', 
            fontSize: '0.85rem',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            Live synced at {new Date(metrics.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Students', value: metrics.totalStudents, color: 'var(--color-text-primary)', icon: '🎓' },
          { label: 'Active Job Seekers', value: metrics.activeStudents, color: '#3b82f6', icon: '🔍' },
          { label: 'Total Applications', value: metrics.applications, color: 'var(--color-text-primary)', icon: '📁' },
          { label: 'Offers Secured', value: metrics.offers, color: '#10b981', icon: '🏆' },
          { label: 'Placement Rate', value: `${metrics.placementRate}%`, color: '#10b981', icon: '📈' },
          { 
            label: 'Action Items', 
            value: alerts.length, 
            color: alerts.length > 0 ? '#ef4444' : 'var(--color-text-primary)', 
            icon: '⚠️',
            action: () => navigate('/officer/offers'),
            highlight: alerts.length > 0
          }
        ].map((m, i) => (
          <div 
            key={i} 
            onClick={m.action} 
            style={{ 
              background: m.highlight ? 'linear-gradient(to bottom right, var(--color-surface), rgba(239, 68, 68, 0.05))' : 'var(--color-surface)', 
              padding: '1.75rem', 
              borderRadius: '20px', 
              border: m.highlight ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--color-border)', 
              boxShadow: m.highlight ? '0 10px 25px -5px rgba(239,68,68,0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)', 
              cursor: m.action ? 'pointer' : 'default', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden'
            }} 
            onMouseEnter={e => m.action && (e.currentTarget.style.transform = 'translateY(-4px)')} 
            onMouseLeave={e => m.action && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '1.5rem', opacity: 0.8 }}>
                {m.icon}
              </div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
            {m.highlight && (
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: '#ef4444' }}></div>
            )}
          </div>
        ))}
      </div>

      {/* Funnel Pipeline */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>📊</span> Institutional Pipeline
      </h2>
      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '24px', 
        border: '1px solid var(--color-border)', 
        padding: '3rem 2rem', 
        marginBottom: '2.5rem', 
        display: 'flex', 
        gap: '2rem', 
        overflowX: 'auto', 
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {pipeline.map((step, idx) => (
          <React.Fragment key={idx}>
            <FunnelStep 
              label={step.name} 
              value={step.value} 
              highlight={step.name.includes('Interview')} 
              success={step.name.includes('Offer')} 
            />
            {idx < pipeline.length - 1 && <FunnelArrow />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Verification Alerts Replacement Widget */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '24px', border: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem 2rem', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️</span> Verification Radar
            </h2>
            <button onClick={() => navigate('/officer/offers')} style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(37,99,235,0.1)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>View All</button>
          </div>
          <div style={{ padding: '1.5rem 2rem', flex: 1 }}>
            {alerts.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2.5rem' }}>✨</span>
                <span style={{ fontWeight: 600 }}>All Clear! No verification issues found.</span>
              </div>
            ) : (
              (highPriorityAlerts.length > 0 ? highPriorityAlerts : alerts).slice(0, 4).map((alert, idx) => (
                <div key={idx} style={{ padding: '1rem 0', borderBottom: idx < 3 && idx < alerts.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{alert.category}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', background: alert.severity === 'High' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: alert.severity === 'High' ? '#ef4444' : '#f59e0b' }}>
                      {alert.severity} Priority
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>{alert.affectedRecord}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Widget */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '24px', border: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem 2rem', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚡</span> Quick Actions
            </h2>
          </div>
          <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/officer/placement-drives')} style={quickActionBtnStyle}>
              <span style={{ fontSize: '1.5rem' }}>📅</span> Manage Placement Drives
            </button>
            <button onClick={() => navigate('/officer/placed-students')} style={quickActionBtnStyle}>
              <span style={{ fontSize: '1.5rem' }}>🎓</span> View Placed Students
            </button>
            <button onClick={() => navigate('/officer/mentors')} style={quickActionBtnStyle}>
              <span style={{ fontSize: '1.5rem' }}>👨‍🏫</span> Oversee Mentor Workload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const quickActionBtnStyle = {
  width: '100%',
  padding: '1.25rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: '16px',
  color: 'var(--color-text-primary)',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  transition: 'all 0.2s',
  textAlign: 'left'
};

const FunnelStep = ({ label, value, highlight, success }) => (
  <div style={{ flex: 1, minWidth: '140px', textAlign: 'center' }}>
    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ 
      fontSize: '3.5rem', 
      fontWeight: 900, 
      color: success ? '#10b981' : highlight ? '#3b82f6' : 'var(--color-text-primary)',
      lineHeight: 1
    }}>
      {value}
    </div>
  </div>
);

const FunnelArrow = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-border)', fontSize: '2rem', fontWeight: 300, opacity: 0.5 }}>
    →
  </div>
);

export default OfficerDashboard;
