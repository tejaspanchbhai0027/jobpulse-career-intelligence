import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/super-admin/dashboard/metrics');
        // The API returns { data: { totalInstitutions, totalStudents, totalPlacementOfficers, totalMentors, recentInstitutions } }
        // BUT wait, looking at my updated controller, I changed the response of `getDashboardMetrics` slightly.
        // Wait, looking closely at the previous code for superAdminController.js, I replaced getPlatformMetrics with getDashboardMetrics and it returns those 5 keys inside data.
        setData(res.data.data);
      } catch (err) {
        setError('Failed to load platform metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading platform metrics...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>{error}</div>;
  }

  const { totalInstitutions, totalStudents, totalPlacementOfficers, totalMentors, recentInstitutions } = data;

  const statCardStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    textDecoration: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Platform Administration</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Welcome back, {user?.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link to="/super-admin/institutions" style={statCardStyle} className="hover-card">
          <div style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.1)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>🏫</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{totalInstitutions}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Institutions</div>
        </Link>
        <div style={{...statCardStyle, cursor: 'default'}} className="hover-card">
          <div style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>🎓</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{totalStudents}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Students</div>
        </div>
        <div style={{...statCardStyle, cursor: 'default'}} className="hover-card">
          <div style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>👨‍💼</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{totalPlacementOfficers}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Placement Officers</div>
        </div>
        <div style={{...statCardStyle, cursor: 'default'}} className="hover-card">
          <div style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>👨‍🏫</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{totalMentors}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mentors</div>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Recent Institutions</h2>
          <Link to="/super-admin/institutions" style={{ textDecoration: 'none', color: '#3B82F6', fontWeight: 600, fontSize: '0.9rem' }}>
            View All &rarr;
          </Link>
        </div>

        {recentInstitutions && recentInstitutions.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institution Name</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentInstitutions.map(inst => (
                <tr key={inst._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                    <Link to={`/super-admin/institutions/${inst._id}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>
                      {inst.name}
                    </Link>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600 }}>{inst.code}</td>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(inst.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            No institutions have been created yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
