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

  if (loading) return <div className="p-8">Loading platform metrics...</div>;
  if (error) return <div className="p-8 text-[var(--color-danger)]">{error}</div>;

  const { metrics, platformActivity } = data;

  const PIE_COLORS = ['#3B82F6', '#1E293B'];
  const pieData = [
    { name: 'Active', value: metrics.activeInstitutions || 0 },
    { name: 'Inactive', value: (metrics.totalInstitutions || 0) - (metrics.activeInstitutions || 0) }
  ];

  return (
    <div className="w-full">
      {/* Simple Clean Header */}
      <div className="superadmin-page-header">
        <div>
          <h1 className="superadmin-page-title">Command Center</h1>
          <p className="superadmin-page-subtitle">Real-time overview of the JobPulse platform operations.</p>
        </div>
        <div className="text-[var(--color-text-muted)] text-sm font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Essential Core Metrics */}
      <h2 className="superadmin-section-title">Platform Population</h2>
      <div className="superadmin-metrics-grid">
        <MetricCard title="Total Institutions" value={metrics.totalInstitutions} highlight={true} />
        <MetricCard title="Total Students" value={metrics.totalStudents} />
        <MetricCard title="Placement Officers" value={metrics.totalOfficers || 0} />
        <MetricCard title="Mentors" value={metrics.totalMentors} />
      </div>

      {/* Engagement Metrics */}
      <h2 className="superadmin-section-title">Recruitment Engagement</h2>
      <div className="superadmin-metrics-grid">
        <MetricCard title="Active Drives" value={metrics.totalActiveDrives || 0} />
        <MetricCard title="Total Applications" value={metrics.totalApplications} />
        <MetricCard title="Total Interviews" value={metrics.totalInterviews} />
        <MetricCard title="Placed Students" value={metrics.totalPlacedStudents || 0} highlight={true} highlightColor="#10B981" />
      </div>

      {/* Charts Section */}
      <div className="superadmin-charts-grid">
        {/* Institution Status Chart */}
        <div className="superadmin-chart-card">
          <h3 className="superadmin-chart-title">Institution Status</h3>
          <div className="relative h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-3xl font-bold text-[var(--color-text-primary)] leading-none">{metrics.activeInstitutions}</div>
              <div className="text-sm text-blue-500 font-semibold mt-1">Active</div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="superadmin-chart-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="superadmin-chart-title !mb-0">Application Volume (Last 7 Days)</h3>
          </div>
          <div className="h-[220px]">
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
              <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
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
  <div className="superadmin-metric-card" style={highlight ? { border: `1px solid ${highlightColor}`, boxShadow: `0 4px 20px ${highlightColor}15` } : {}}>
    {highlight && (
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: highlightColor }}></div>
    )}
    <div className="superadmin-metric-title" style={highlight ? { color: highlightColor } : {}}>
      {title}
    </div>
    <div className="superadmin-metric-value">
      {value.toLocaleString()}
    </div>
  </div>
);

export default SuperAdminDashboard;
