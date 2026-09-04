import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const AdminEmployers = () => {
  const [data, setData] = useState({ employers: [], roleDemand: [], skillDemand: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [filters, setFilters] = useState({ company: '', department: '', batch: '' });

  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'];
  const batches = [2024, 2025];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api.get(`/admin/employers?${params.toString()}`);
      if (res.data.success) {
        setData(res.data.data);
        setSelectedEmployer(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employer data.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleFilterChange = (e) => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  const maxApps = data.employers.length > 0 ? data.employers[0].applications : 1;
  const maxRoleApps = data.roleDemand.length > 0 ? data.roleDemand[0].applications : 1;
  const maxSkillCount = data.skillDemand.length > 0 ? data.skillDemand[0].count : 1;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* ── FILTER BAR ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '2rem', boxShadow: 'var(--shadow-card)' }}>
        <input
          type="text" name="company" placeholder="Search company..."
          value={filters.company} onChange={handleFilterChange}
          style={{ ...inputStyle, flex: 1, minWidth: '180px' }}
        />
        <select name="department" value={filters.department} onChange={handleFilterChange} style={inputStyle}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select name="batch" value={filters.batch} onChange={handleFilterChange} style={inputStyle}>
          <option value="">All Batches</option>
          {batches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading employer intelligence...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedEmployer ? '1fr 380px' : '1fr', gap: '2rem', alignItems: 'start' }}>

          {/* ── LEFT: MAIN CONTENT ────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* EMPLOYER PERFORMANCE TABLE */}
            <section style={cardStyle}>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={sectionTitleStyle}>Employer Performance</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Click a row to drill into department breakdown.
                </p>
              </div>

              {data.employers.length === 0 ? (
                <div style={emptyStyle}>No employer data available for this cohort.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={thStyle}>Company</th>
                        <th style={thStyle}>Applicants</th>
                        <th style={thStyle}>Volume</th>
                        <th style={thStyle}>Interviews</th>
                        <th style={thStyle}>Offers</th>
                        <th style={thStyle}>Response Rate</th>
                        <th style={thStyle}>Roles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.employers.map((emp, idx) => {
                        const isSelected = selectedEmployer?.company === emp.company;
                        return (
                          <tr
                            key={idx}
                            onClick={() => setSelectedEmployer(isSelected ? null : emp)}
                            style={{
                              borderBottom: '1px solid var(--color-border)',
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(37,99,235,0.07)' : 'transparent',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <td style={{ ...tdStyle, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                              {emp.company}
                              {isSelected && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-brand-primary)', fontWeight: 700 }}>▼</span>}
                            </td>
                            <td style={tdStyle}>{emp.applications}</td>
                            <td style={{ ...tdStyle, minWidth: '120px' }}>
                              <div style={{ height: '6px', background: 'var(--color-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(emp.applications / maxApps) * 100}%`, background: 'var(--color-brand-primary)', borderRadius: '3px' }} />
                              </div>
                            </td>
                            <td style={{ ...tdStyle, color: emp.interviews > 0 ? 'var(--color-brand-primary)' : 'var(--color-text-muted)', fontWeight: emp.interviews > 0 ? 700 : 400 }}>
                              {emp.interviews}
                            </td>
                            <td style={tdStyle}>
                              {emp.offers > 0 ? (
                                <span style={{ background: 'rgba(22,163,74,0.12)', color: 'var(--color-success)', padding: '3px 10px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem' }}>
                                  {emp.offers}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)' }}>0</span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: emp.responseRate > 30 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                              {emp.responseRate}%
                            </td>
                            <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                              {(emp.roles || []).slice(0, 2).join(', ')}{emp.roles?.length > 2 ? ` +${emp.roles.length - 2}` : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ROLE DEMAND */}
            <section style={cardStyle}>
              <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={sectionTitleStyle}>Role Demand</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Most applied-to job roles across the institution.</p>
              </div>
              {data.roleDemand.length === 0 ? (
                <div style={emptyStyle}>No role data available.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.roleDemand.map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ width: '200px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.role}>
                        {r.role}
                      </div>
                      <div style={{ flex: 1, height: '8px', background: 'var(--color-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(r.applications / maxRoleApps) * 100}%`, background: 'var(--color-text-primary)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', width: '80px', textAlign: 'right' }}>
                        {r.applications} apps
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', width: '90px', textAlign: 'right' }}>
                        {r.uniqueCompanies} companies
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SKILL DEMAND */}
            <section style={cardStyle}>
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={sectionTitleStyle}>Skill Demand</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Skills extracted from employer job descriptions collected in JobPulse.</p>
                  </div>
                  <div style={{ background: 'var(--color-bg)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Based on JD snapshots only
                  </div>
                </div>
              </div>
              {data.skillDemand.length === 0 ? (
                <div style={emptyStyle}>No skill data available. Add job descriptions to applications to generate skill demand data.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  {data.skillDemand.map((s, idx) => {
                    const intensity = (s.count / maxSkillCount);
                    const opacity = 0.3 + intensity * 0.7;
                    const size = 0.8 + intensity * 0.4;
                    return (
                      <div
                        key={idx}
                        title={`${s.count} job postings`}
                        style={{
                          background: `rgba(37,99,235,${opacity * 0.15})`,
                          border: `1px solid rgba(37,99,235,${opacity * 0.4})`,
                          color: `rgba(37,99,235,${0.6 + intensity * 0.4})`,
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: `${size}rem`,
                          fontWeight: 700,
                          cursor: 'default'
                        }}
                      >
                        {s.skill} <span style={{ fontWeight: 400, opacity: 0.7, fontSize: '0.85em' }}>{s.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT: EMPLOYER DETAIL PANEL ───────────────────── */}
          {selectedEmployer && (
            <div style={{ ...cardStyle, position: 'sticky', top: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{selectedEmployer.company}</h2>
                <button onClick={() => setSelectedEmployer(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.25rem', padding: '2px 6px' }}>✕</button>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <MiniStat label="Applications" value={selectedEmployer.applications} />
                <MiniStat label="Interviews" value={selectedEmployer.interviews} color="var(--color-brand-primary)" />
                <MiniStat label="Offers" value={selectedEmployer.offers} color="var(--color-success)" />
                <MiniStat label="Response Rate" value={`${selectedEmployer.responseRate}%`} color={selectedEmployer.responseRate > 25 ? 'var(--color-success)' : undefined} />
              </div>

              {/* Roles */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={detailHeaderStyle}>Roles Applied To</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                  {(selectedEmployer.roles || []).map((r, i) => (
                    <span key={i} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Department Breakdown */}
              {selectedEmployer.departmentBreakdown?.length > 0 && (
                <div>
                  <div style={detailHeaderStyle}>Applicants by Department</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                    {selectedEmployer.departmentBreakdown.map((d, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{d._id || 'Unknown'}</div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{d.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── SUBCOMPONENTS ───────────────────────────────────────────────

const MiniStat = ({ label, value, color }) => (
  <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: color || 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginTop: '0.35rem', letterSpacing: '0.05em' }}>{label}</div>
  </div>
);

const inputStyle = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  padding: '0.6rem 1rem',
  borderRadius: '8px',
  fontSize: '0.95rem',
  outline: 'none',
  fontWeight: 500,
};

const cardStyle = {
  background: 'var(--color-surface)',
  borderRadius: '16px',
  border: '1px solid var(--color-border)',
  padding: '2rem',
  boxShadow: 'var(--shadow-card)',
};

const sectionTitleStyle = {
  fontSize: '1.4rem',
  fontWeight: 800,
  color: 'var(--color-text-primary)',
  margin: '0 0 0.25rem 0',
  letterSpacing: '-0.01em',
};

const detailHeaderStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  letterSpacing: '0.05em',
};

const thStyle = {
  padding: '1rem 0.875rem',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
};

const tdStyle = {
  padding: '1.1rem 0.875rem',
  fontSize: '0.95rem',
  color: 'var(--color-text-secondary)',
};

const emptyStyle = {
  padding: '2rem',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: '0.95rem',
  fontStyle: 'italic',
};

export default AdminEmployers;
