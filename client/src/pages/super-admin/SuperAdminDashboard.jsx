import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/super-admin/dashboard/metrics');
        setData(res.data.data);
      } catch (err) {
        setError('Failed to load platform metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading platform metrics...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>{error}</div>;

  const { metrics, platformActivity } = data;

  const PIE_COLORS = ['#3B82F6', '#1E293B'];
  const pieData = [
    { name: 'Active', value: metrics.activeInstitutions || 0 },
    { name: 'Inactive', value: (metrics.totalInstitutions || 0) - (metrics.activeInstitutions || 0) }
  ];

  return (
    <div style={{ width: '100%' }}>
      {/* Simple Clean Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Command Center</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem', fontWeight: 500 }}>Real-time overview of the JobPulse platform operations.</p>
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Essential Core Metrics */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Platform Population</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <MetricCard title="Total Institutions" value={metrics.totalInstitutions} highlight={true} />
        <MetricCard title="Total Students" value={metrics.totalStudents} />
        <MetricCard title="Placement Officers" value={metrics.totalOfficers || 0} />
        <MetricCard title="Mentors" value={metrics.totalMentors} />
      </div>

      {/* Engagement Metrics */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Recruitment Engagement</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <MetricCard title="Active Drives" value={metrics.totalActiveDrives || 0} />
        <MetricCard title="Total Applications" value={metrics.totalApplications} />
        <MetricCard title="Total Interviews" value={metrics.totalInterviews} />
        <MetricCard title="Placed Students" value={metrics.totalPlacedStudents || 0} highlight={true} highlightColor="#10B981" />
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Institution Status Chart */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 1.5rem 0' }}>Institution Status</h3>
          <div style={{ position: 'relative', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{metrics.activeInstitutions}</div>
              <div style={{ fontSize: '0.85rem', color: '#3B82F6', fontWeight: 600 }}>Active</div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Application Volume (Last 7 Days)</h3>
          </div>
          <div style={{ height: '220px' }}>
            {platformActivity && platformActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={platformActivity}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="applications" name="Applications" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                Not enough activity data to show.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, highlight = false, highlightColor = '#3B82F6' }) => (
  <div style={{ 
    background: 'var(--color-surface)', 
    border: highlight ? `1px solid ${highlightColor}` : '1px solid var(--color-border)', 
    borderRadius: '16px', 
    padding: '2rem 1.5rem', 
    position: 'relative',
    overflow: 'hidden',
    boxShadow: highlight ? `0 4px 20px ${highlightColor}15` : '0 4px 20px rgba(0,0,0,0.02)'
  }}>
    {highlight && (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: highlightColor }}></div>
    )}
    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: highlight ? highlightColor : 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {title}
    </div>
    <div style={{ fontSize: '2.5rem', fontWeight: 300, color: 'var(--color-text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>
      {value.toLocaleString()}
    </div>
  </div>
);

export default SuperAdminDashboard;
