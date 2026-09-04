import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';

const OfficerStudents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialFilter = queryParams.get('filter');

  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [mentorFilter, setMentorFilter] = useState('');
  const [unassignedFilter, setUnassignedFilter] = useState(initialFilter === 'unassigned');
  
  // We use debounce for search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const { data } = await api.get('/officer/mentors');
        setMentors(data.data || []);
      } catch (err) {
        console.error('Failed to load mentors for filter');
      }
    };
    fetchMentors();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        let url = `/officer/students?page=${page}&limit=20`;
        if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
        if (unassignedFilter) url += `&unassigned=true`;
        if (mentorFilter && !unassignedFilter) url += `&mentorId=${mentorFilter}`;

        const { data } = await api.get(url);
        setStudents(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [page, debouncedSearch, mentorFilter, unassignedFilter]);

  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setPage(p => p + 1);

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  const handleExportCSV = async () => {
    try {
      // Fetch all students (large limit) for export
      const { data } = await api.get('/officer/students?limit=1000');
      const allStudents = data.data || [];
      
      if (allStudents.length === 0) {
        alert('No students to export.');
        return;
      }
      
      const headers = ['Name', 'Email', 'Department', 'Mentor', 'Applications', 'Interviews', 'Offers'];
      const csvRows = [headers.join(',')];
      
      allStudents.forEach(s => {
        const mentorName = mentors.find(m => m._id === s.mentorId)?.name || 'Unassigned';
        const row = [
          `"${s.name}"`,
          `"${s.email}"`,
          `"${s.department || ''}"`,
          `"${mentorName}"`,
          s.applicationCount || 0,
          s.interviewCount || 0,
          s.offerCount || 0
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to export data.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Student Directory</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Manage and oversee all students within the institution.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📥</span> Export CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)',
              background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', outline: 'none'
            }} 
          />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={unassignedFilter} 
              onChange={(e) => {
                setUnassignedFilter(e.target.checked);
                if (e.target.checked) setMentorFilter(''); // clear mentor filter if unassigned is checked
                setPage(1);
              }}
            />
            Show Unassigned Only
          </label>

          <select 
            value={mentorFilter}
            onChange={(e) => {
              setMentorFilter(e.target.value);
              setUnassignedFilter(false);
              setPage(1);
            }}
            disabled={unassignedFilter}
            style={{ 
              padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)',
              background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', outline: 'none',
              opacity: unassignedFilter ? 0.5 : 1
            }}
          >
            <option value="">All Mentors</option>
            {mentors.map(m => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading students...</div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>No students found.</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Department</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Mentor</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Apps</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Interviews</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Offers</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const assignedMentor = mentors.find(m => m._id === student.mentorId);
                  
                  return (
                    <tr 
                      key={student._id}
                      onClick={() => navigate(`/officer/students/${student._id}`)}
                      style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-surface-overlay)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{student.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{student.email}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                        {student.department || '-'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {assignedMentor ? (
                          <span style={{ color: 'var(--color-text-primary)' }}>{assignedMentor.name}</span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                        {student.applicationCount === null ? '🔒' : student.applicationCount || 0}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#f59e0b', fontWeight: 600 }}>
                        {student.interviewCount === null ? '🔒' : student.interviewCount || 0}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#10b981', fontWeight: 600 }}>
                        {student.offerCount === null ? '🔒' : student.offerCount || 0}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                          background: student.offerCount > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                          color: student.offerCount > 0 ? '#10b981' : '#3b82f6'
                        }}>
                          {student.offerCount > 0 ? 'Placed' : 'Active Search'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Page {page}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handlePrevPage} disabled={page === 1} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Previous</button>
              <button onClick={handleNextPage} disabled={students.length < 20} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerStudents;
