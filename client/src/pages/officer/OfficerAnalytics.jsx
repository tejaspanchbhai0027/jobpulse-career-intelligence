import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

const OfficerAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/officer/analytics');
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
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading analytics...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>📈 Analytics Dashboard</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Data-driven insights for your institution's placement performance.</p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Students</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{metrics.totalStudents}</div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Applications</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{metrics.applications}</div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Interviews Secured</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{metrics.interviews}</div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Offers</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{metrics.offers}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
        
        {/* Department Breakdown (Bar Chart) */}
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>Activity by Department</h2>
          {metrics.departmentStats && metrics.departmentStats.length > 0 ? (
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.departmentStats} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="department" stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)' }} />
                  <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface-overlay)', borderRadius: '8px', border: 'none', color: 'var(--color-text-primary)' }}
                    itemStyle={{ color: 'var(--color-text-primary)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="students" name="Students" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="applications" name="Applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="offers" name="Offers" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>Not enough data</div>
          )}
        </div>

        {/* 30-Day Trend (Area Chart) */}
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>30-Day Pipeline Trend</h2>
          {metrics.timeSeriesData && metrics.timeSeriesData.length > 0 ? (
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)' }} />
                  <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'var(--color-text-secondary)' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface-overlay)', borderRadius: '8px', border: 'none', color: 'var(--color-text-primary)' }}
                    itemStyle={{ color: 'var(--color-text-primary)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="applications" name="Applications" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                  <Area type="monotone" dataKey="interviews" name="Interviews" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorInts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>Not enough data</div>
          )}
        </div>

        {/* Conversion Funnel */}
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>Conversion Funnel</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>App to Interview Rate</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{metrics.interviewConversion}%</span>
              </div>
              <div style={{ height: '12px', background: 'var(--color-surface-overlay)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.interviewConversion}%`, background: '#3b82f6', borderRadius: '6px', transition: 'width 1s ease-in-out' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Interview to Offer Rate</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{metrics.offerConversion}%</span>
              </div>
              <div style={{ height: '12px', background: 'var(--color-surface-overlay)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.offerConversion}%`, background: '#f59e0b', borderRadius: '6px', transition: 'width 1s ease-in-out' }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Overall Placement Rate</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{metrics.placementRate}%</span>
              </div>
              <div style={{ height: '12px', background: 'var(--color-surface-overlay)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${metrics.placementRate}%`, background: '#10b981', borderRadius: '6px', transition: 'width 1s ease-in-out' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OfficerAnalytics;
