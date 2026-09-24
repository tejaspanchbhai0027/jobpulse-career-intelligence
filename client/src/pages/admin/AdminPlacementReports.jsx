import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Skeleton from '../../components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminPlacementReports = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/placement-reports');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Skeleton height="60px" borderRadius="12px" style={{ marginBottom: '1rem' }} />
        <Skeleton height="400px" borderRadius="12px" />
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>Error: {error}</div>;
  }

  const { companyReport, driveReport, departmentReport } = data;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>
        Placement Reports
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
        {['company', 'drive', 'department'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
              color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab ? 700 : 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontSize: '1rem'
            }}
          >
            {tab} Report
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
        
        {activeTab === 'company' && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Company-wise Recruitment</h2>
            <div style={{ height: '350px', marginBottom: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyReport}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="company" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                  <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="applications" name="Applications" fill="#cbd5e1" radius={[4,4,0,0]} />
                  <Bar dataKey="interviews" name="Interviews" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="offers" name="Offers" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>Company</th>
                    <th style={thStyle}>Drives Hosted</th>
                    <th style={thStyle}>Total Apps</th>
                    <th style={thStyle}>Interviewed</th>
                    <th style={thStyle}>Offers Made</th>
                  </tr>
                </thead>
                <tbody>
                  {companyReport.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>{c.company}</td>
                      <td style={tdStyle}>{c.drivesCount}</td>
                      <td style={tdStyle}>{c.applications}</td>
                      <td style={tdStyle}>{c.interviews}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{c.offers}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'drive' && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Drive-wise Performance</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>Drive (Company - Role)</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Registered</th>
                    <th style={thStyle}>Applications</th>
                    <th style={thStyle}>Interviews</th>
                    <th style={thStyle}>Offers</th>
                  </tr>
                </thead>
                <tbody>
                  {driveReport.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>{d.company} - {d.role}</td>
                      <td style={tdStyle}>{new Date(d.date).toLocaleDateString()}</td>
                      <td style={tdStyle}>{d.status}</td>
                      <td style={tdStyle}>{d.registered}</td>
                      <td style={tdStyle}>{d.applications}</td>
                      <td style={tdStyle}>{d.interviews}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{d.offers}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'department' && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Department-wise Placements</h2>
            <div style={{ height: '350px', marginBottom: '2rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentReport}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="department" stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                  <YAxis stroke="var(--color-text-secondary)" tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="totalStudents" name="Total Students" fill="#64748b" radius={[4,4,0,0]} />
                  <Bar dataKey="placedCount" name="Placed Students" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>Department</th>
                    <th style={thStyle}>Total Students</th>
                    <th style={thStyle}>Applications</th>
                    <th style={thStyle}>Interviews</th>
                    <th style={thStyle}>Placed Students</th>
                    <th style={thStyle}>Placement Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentReport.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={tdStyle}>{d.department}</td>
                      <td style={tdStyle}>{d.totalStudents}</td>
                      <td style={tdStyle}>{d.applications}</td>
                      <td style={tdStyle}>{d.interviews}</td>
                      <td style={tdStyle}>{d.placedCount}</td>
                      <td style={tdStyle}>
                        <span style={{
                          background: 'rgba(22, 163, 74, 0.1)',
                          color: 'var(--color-success)',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}>
                          {d.placementRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

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

export default AdminPlacementReports;
