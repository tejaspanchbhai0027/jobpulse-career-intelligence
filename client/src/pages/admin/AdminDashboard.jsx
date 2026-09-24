import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '../../components/ui/Skeleton';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    dateRange: 'season',
    department: '',
    batch: ''
  });

  // Mock department/batch options based on seed data
  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'];
  const batches = [2024, 2025];

  useEffect(() => {
    fetchMetrics();
  }, [filters]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Basic date range logic
      let startDate = '';
      const now = new Date();
      if (filters.dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString();
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString();
      }
      
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.batch) queryParams.append('batch', filters.batch);

      const response = await api.get(`/admin/dashboard/metrics?${queryParams.toString()}`);
      if (response.data.success) {
        setData(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} height="120px" borderRadius="12px" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
          <Skeleton height="300px" borderRadius="12px" />
          <Skeleton height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>Error: {error}</div>;
  }

  const { metrics, funnel, signals, charts } = data;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ── FILTERS ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--color-surface)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange} style={filterStyle}>
            <option value="season">Placement Season</option>
            <option value="month">Last 30 Days</option>
            <option value="week">Last 7 Days</option>
          </select>
          
          <select name="department" value={filters.department} onChange={handleFilterChange} style={filterStyle}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select name="batch" value={filters.batch} onChange={handleFilterChange} style={filterStyle}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
      


      {/* ── CORE METRICS ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <MetricCard title="Total Students" value={metrics.totalStudents} />
        <MetricCard title="Placement Officers" value={metrics.totalPlacementOfficers} />
        <MetricCard title="Mentors" value={metrics.totalMentors} />
        <MetricCard 
          title="Unassigned Students" 
          value={metrics.unassignedStudents} 
          highlight={metrics.unassignedStudents > 0} 
        />
        <MetricCard title="Active Seekers" value={metrics.activeSeekers} />
        <MetricCard title="Placed Students" value={funnel.offers} />
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        
        {/* LEFT COLUMN: FUNNEL */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Placement Funnel</h2>
          <div style={{ 
            background: 'var(--color-surface)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '12px', 
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <FunnelStep label="Students" value={funnel.students} max={funnel.students} />
            <FunnelStep label="Active Search" value={funnel.activeSearch} max={funnel.students} />
            <FunnelStep label="Applied" value={funnel.activeSearch} max={funnel.students} /> {/* Note: currently using activeSearch as 'Applied' unique students */}
            <FunnelStep label="Interviewing" value={funnel.interviews} max={funnel.students} />
            <FunnelStep label="Offers" value={funnel.offers} max={funnel.students} />
          </div>
        </div>

        {/* RIGHT COLUMN: SIGNALS */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Support Signals</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <SignalGroup 
              title="Needs Follow Up" 
              count={signals.needsFollowUp.length} 
              items={signals.needsFollowUp} 
              renderItem={(s) => `${s.studentName} (${s.company})`}
            />
            
            <SignalGroup 
              title="Upcoming Interviews" 
              count={signals.upcomingInterviews.length} 
              items={signals.upcomingInterviews} 
              renderItem={(s) => `${s.studentName} at ${s.company}`}
            />
            
            <SignalGroup 
              title="High Activity, Low Conversion" 
              count={signals.strugglingSeekers.length} 
              items={signals.strugglingSeekers} 
              renderItem={(s) => `${s.studentName} (${s.applicationsCount} apps)`}
            />

          </div>
        </div>
      </div>

      {/* ── CHARTS ────────────────────────────────────────────── */}
      {charts && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>
          
          {/* MONTHLY TREND */}
          <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '1.05rem' }}>Monthly Trend</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" name="Offers" dataKey="offers" stroke="var(--color-success)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Interviews" dataKey="interviews" stroke="var(--color-brand-primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TOP RECRUITERS */}
          <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '1.05rem' }}>Top Recruiters</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.companyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="company" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'var(--color-bg)'}} contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text-primary)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="studentsSelected" name="Students Selected" fill="var(--color-brand-primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* DEPARTMENT STATS */}
      {metrics.departmentStats && metrics.departmentStats.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Department Breakdown</h2>
          <div style={{ 
            background: 'var(--color-surface)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '12px', 
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                  <tr>
                    <th style={thStyle}>Department</th>
                    <th style={thStyle}>Students</th>
                    <th style={thStyle}>Applications</th>
                    <th style={thStyle}>Offers</th>
                    <th style={thStyle}>Placement Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.departmentStats.map((dept, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>{dept.department}</td>
                      <td style={tdStyle}>{dept.students}</td>
                      <td style={tdStyle}>{dept.applications}</td>
                      <td style={tdStyle}>{dept.offers}</td>
                      <td style={tdStyle}>
                        <span style={{
                          background: 'rgba(22, 163, 74, 0.1)',
                          color: 'var(--color-success)',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          {dept.placementRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── SUBCOMPONENTS ──────────────────────────────────────────────

const filterStyle = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  padding: '0.4rem 0.8rem',
  borderRadius: '6px',
  fontSize: '0.85rem',
  outline: 'none'
};

const MetricCard = ({ title, value, highlight }) => (
  <div style={{ 
    background: 'var(--color-surface)', 
    border: '1px solid var(--color-border)', 
    borderRadius: '12px', 
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
      {title}
    </div>
    <div style={{ 
      fontSize: '2rem', 
      fontWeight: 800, 
      color: highlight ? 'var(--color-brand-primary)' : 'var(--color-text-primary)' 
    }}>
      {value}
    </div>
  </div>
);

const quickLinkStyle = {
  textDecoration: 'none',
  padding: '0.6rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  fontSize: '0.9rem',
  fontWeight: 600,
  transition: 'all 0.2s ease',
  boxShadow: 'var(--shadow-card)'
};

const FunnelStep = ({ label, value, max }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
      <div style={{ width: '120px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
        {label}
      </div>
      <div style={{ flex: 1, background: 'var(--color-surface-overlay)', height: '24px', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ 
          width: `${percentage}%`, 
          background: 'var(--gradient-brand)', 
          height: '100%',
          transition: 'width 0.3s ease'
        }}></div>
      </div>
      <div style={{ width: '50px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {value}
      </div>
    </div>
  );
};

const SignalGroup = ({ title, count, items, renderItem }) => (
  <div style={{ 
    background: 'var(--color-surface)', 
    border: '1px solid var(--color-border)', 
    borderRadius: '8px', 
    overflow: 'hidden'
  }}>
    <div style={{ 
      padding: '0.75rem 1rem', 
      background: 'var(--color-surface-overlay)', 
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</span>
      <span style={{ 
        background: count > 0 ? 'var(--color-danger)' : 'var(--color-bg)', 
        color: count > 0 ? '#fff' : 'var(--color-text-secondary)',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 700
      }}>
        {count}
      </span>
    </div>
    <div style={{ padding: '0.5rem 0' }}>
      {items.length === 0 ? (
        <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          No signals generated.
        </div>
      ) : (
        items.map((item, i) => (
          <div key={i} style={{ 
            padding: '0.5rem 1rem', 
            fontSize: '0.85rem', 
            color: 'var(--color-text-secondary)',
            borderBottom: i !== items.length - 1 ? '1px solid var(--color-border)' : 'none'
          }}>
            {renderItem(item)}
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {item.signal}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const thStyle = {
  padding: '16px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '16px',
  color: 'var(--color-text-primary)'
};

export default AdminDashboard;
