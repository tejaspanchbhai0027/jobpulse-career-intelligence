import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const MentorStudents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        let url = `/mentor/students?page=1&limit=50`;
        if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
        if (department) url += `&department=${encodeURIComponent(department)}`;
        if (batch) url += `&batch=${encodeURIComponent(batch)}`;

        const { data } = await api.get(url);
        setStudents(data.data || []);
        setError('');
      } catch (err) {
        setError('Failed to load students.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [debouncedSearch, department, batch]);

  // Derived distinct values for filters
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
  const batches = [...new Set(students.map(s => s.batch).filter(Boolean))].sort((a,b) => b-a);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            MY STUDENTS
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Monitor progress and support your assigned students.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)',
                borderRadius: '8px', color: 'var(--color-text-primary)', outline: 'none'
              }}
            />
          </div>
          
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', outline: 'none' }}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          
          <select
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', outline: 'none' }}
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-overlay)' }}>
                <th style={thStyle}>STUDENT</th>
                <th style={thStyle}>APPLICATIONS</th>
                <th style={thStyle}>INTERVIEWS</th>
                <th style={thStyle}>OFFERS</th>
                <th style={thStyle}>LAST ACTIVITY</th>
                <th style={thStyle}>STAGE</th>
                <th style={thStyle}>ATTENTION</th>
                <th style={thStyle}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading students...</td></tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
                    <div style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>No students found</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      {search || department || batch ? 'Try adjusting your filters.' : 'No students have been assigned to you yet.'}
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  
                  // Compute derived UI values
                  const isActive = student.applicationCount > 0;
                  const stage = student.offerCount > 0 ? 'Placed' : student.interviewCount > 0 ? 'Interviewing' : isActive ? 'Applying' : 'Inactive';
                  
                  let attention = '—';
                  let attentionColor = 'var(--color-text-muted)';
                  
                  if (!isActive) {
                    attention = '⚠ Inactive';
                    attentionColor = '#f59e0b';
                  } else if (student.applicationCount > 5 && student.interviewCount === 0) {
                    attention = '⚠ Support Needed';
                    attentionColor = '#ef4444';
                  }

                  return (
                  <tr 
                    key={student._id} 
                    onClick={() => navigate(`/mentor/students/${student._id}`)}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-overlay)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{student.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{student.department || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-brand-primary)' }}>
                      {student.applicationCount === null ? '🔒' : student.applicationCount || 0}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#f59e0b' }}>
                      {student.interviewCount === null ? '🔒' : student.interviewCount || 0}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#10b981' }}>
                      {student.offerCount === null ? '🔒' : student.offerCount || 0}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                      {stage}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: attentionColor, fontSize: '0.85rem', fontWeight: 600 }}>
                      {attention}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <button 
                        style={{
                          padding: '0.4rem 0.8rem',
                          background: 'rgba(59,130,246,0.1)',
                          color: '#3b82f6',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const thStyle = { padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };

export default MentorStudents;
