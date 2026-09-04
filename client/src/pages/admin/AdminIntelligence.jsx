import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const AdminIntelligence = () => {
  const [data, setData] = useState({ employerSignals: [], skillRadar: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    department: '',
    batch: '',
    role: '',
    company: ''
  });

  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'];
  const batches = [2024, 2025];

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIntelligence();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await api.get(`/admin/intelligence?${queryParams.toString()}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      


      {error && (
        <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* ── FILTERS BAR ──────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        background: 'var(--color-surface)', 
        padding: '1.25rem', 
        borderRadius: '12px', 
        border: '1px solid var(--color-border)',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        boxShadow: 'var(--shadow-card)'
      }}>
        <select name="department" value={filters.department} onChange={handleFilterChange} style={filterStyle}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select name="batch" value={filters.batch} onChange={handleFilterChange} style={filterStyle}>
          <option value="">All Batches</option>
          {batches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <input 
          type="text" 
          name="role" 
          placeholder="Filter by Target Role..." 
          value={filters.role}
          onChange={handleFilterChange}
          style={{ ...filterStyle, flex: 1, minWidth: '200px' }}
        />

        <input 
          type="text" 
          name="company" 
          placeholder="Filter by Company..." 
          value={filters.company}
          onChange={handleFilterChange}
          style={{ ...filterStyle, flex: 1, minWidth: '200px' }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          Crunching numbers...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* ── SKILL DEMAND RADAR ──────────────────────────────── */}
          <section style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={sectionHeaderStyle}>Skill Demand Radar</h2>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                  Comparing the skills employers want against the skills your students have.
                </div>
              </div>
              <div style={{ background: 'var(--color-bg)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Based on job postings collected in JobPulse.
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {data.skillRadar.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No skill data available for this cohort.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                      <th style={thStyle}>Skill</th>
                      <th style={{ ...thStyle, width: '35%' }}>Market Demand</th>
                      <th style={{ ...thStyle, width: '35%' }}>Student Coverage</th>
                      <th style={thStyle}>Gap Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.skillRadar.map((item, idx) => {
                      const gap = item.marketDemandScore - item.studentCoverageScore;
                      let gapStatus = 'Balanced';
                      let gapColor = 'var(--color-text-secondary)';
                      if (gap > 40) {
                        gapStatus = 'Critical Gap';
                        gapColor = 'var(--color-danger)';
                      } else if (gap > 20) {
                        gapStatus = 'Emerging Need';
                        gapColor = 'var(--color-warning)';
                      } else if (gap < -20) {
                        gapStatus = 'Oversupplied';
                        gapColor = 'var(--color-brand-primary)';
                      }

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.skill}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ flex: 1, height: '8px', background: 'var(--color-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${item.marketDemandScore}%`, background: 'var(--color-text-primary)' }} />
                              </div>
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', width: '30px' }}>{item.marketDemandScore}</span>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ flex: 1, height: '8px', background: 'var(--color-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${item.studentCoverageScore}%`, background: 'var(--color-brand-primary)' }} />
                              </div>
                              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', width: '30px' }}>{item.studentCoverageScore}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, color: gapColor, fontWeight: 600, fontSize: '0.9rem' }}>
                            {gapStatus}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* ── EMPLOYER SIGNALS ────────────────────────────────── */}
          <section style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={sectionHeaderStyle}>Employer Signals</h2>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                Track which companies are actively engaging with your students.
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {data.employerSignals.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No application data available for this cohort.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                      <th style={thStyle}>Company</th>
                      <th style={thStyle}>Roles Targetted</th>
                      <th style={thStyle}>Applications</th>
                      <th style={thStyle}>Interviews</th>
                      <th style={thStyle}>Offers</th>
                      <th style={thStyle}>Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.employerSignals.map((emp, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-text-primary)' }}>{emp.company}</td>
                        <td style={tdStyle}>{emp.rolesCount} unique roles</td>
                        <td style={tdStyle}>{emp.applications}</td>
                        <td style={tdStyle}>
                          <span style={{ color: emp.interviews > 0 ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)', fontWeight: emp.interviews > 0 ? 700 : 400 }}>
                            {emp.interviews}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {emp.offers > 0 ? (
                            <span style={{ background: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-success)', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              {emp.offers}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)' }}>0</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 600, color: emp.conversionRate > 20 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                            {Math.round(emp.conversionRate)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

        </div>
      )}
    </div>
  );
};

const filterStyle = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  padding: '0.6rem 1rem',
  borderRadius: '8px',
  fontSize: '0.95rem',
  outline: 'none',
  fontWeight: 500
};

const sectionHeaderStyle = {
  fontSize: '1.5rem',
  fontWeight: 800,
  color: 'var(--color-text-primary)',
  marginBottom: '0.25rem',
  letterSpacing: '-0.01em'
};

const thStyle = {
  padding: '1.25rem 1rem',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '1.25rem 1rem',
  fontSize: '0.95rem',
  color: 'var(--color-text-secondary)'
};

export default AdminIntelligence;
