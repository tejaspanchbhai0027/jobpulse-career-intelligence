import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const MentorProgress = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/mentor/analytics');
        setMetrics(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading progress analytics...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  const chartData = [
    { name: 'Searching', students: Math.max(0, metrics.totalStudents - metrics.activeStudents) },
    { name: 'Applied', students: Math.max(0, metrics.activeStudents - metrics.interviews) },
    { name: 'Interviewing', students: Math.max(0, metrics.interviews - metrics.offers) },
    { name: 'Offer', students: metrics.offers }, // Using offers as placed for MVP
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>CAREER INSIGHTS</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Analytics for your assigned students.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Conversion Rates */}
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>Conversion Rates</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Application → Interview</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{metrics.interviewConversion}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--color-surface-overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.interviewConversion}%`, background: '#3b82f6', borderRadius: '4px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Interview → Offer</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{metrics.offerConversion}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--color-surface-overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.offerConversion}%`, background: '#f59e0b', borderRadius: '4px' }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Placement Rate</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{metrics.placementRate}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--color-surface-overlay)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.placementRate}%`, background: '#10b981', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Metrics */}
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>Volume Overview</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'var(--color-surface-overlay)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-brand-primary)' }}>{metrics.applications}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Applications</div>
            </div>
            <div style={{ background: 'var(--color-surface-overlay)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{metrics.interviews}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Interviews</div>
            </div>
            <div style={{ background: 'var(--color-surface-overlay)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>{metrics.offers}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Offers</div>
            </div>
            <div style={{ background: 'var(--color-surface-overlay)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
                {metrics.activeStudents > 0 ? (metrics.applications / metrics.activeStudents).toFixed(1) : 0}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Avg Apps / Active Student</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Distribution Chart */}
      <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>Student Progress Distribution</h2>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)' }} />
              <Tooltip 
                cursor={{ fill: 'var(--color-surface-overlay)' }}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              />
              <Bar dataKey="students" fill="var(--color-brand-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default MentorProgress;
