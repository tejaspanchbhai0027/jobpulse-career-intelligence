import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';

const AdminStudentDirectory = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ students: [], total: 0, page: 1, totalPages: 1 });
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  
  // Bulk Assignment State
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [bulkPO, setBulkPO] = useState('');
  const [bulkMentor, setBulkMentor] = useState('');
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    department: '',
    batch: '',
    placementStatus: '',
    hasActivity: '',
    unassigned: ''
  });

  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'];
  const batches = [2024, 2025];

  useEffect(() => {
    fetchHierarchy();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchHierarchy = async () => {
    try {
      const response = await api.get('/admin/officers/organization');
      if (response.data.success) {
        setHierarchy(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch org hierarchy', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await api.get(`/admin/students?${queryParams.toString()}`);
      if (response.data.success) {
        setData({
          students: response.data.data,
          total: response.data.total,
          page: response.data.page,
          totalPages: response.data.totalPages
        });
        // Clear selection on page change or filter change
        setSelectedStudentIds(new Set());
      }
    } catch (err) {
      setError('Failed to fetch students. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= data.totalPages) {
      setFilters({ ...filters, page: newPage });
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudentIds(new Set(data.students.map(s => s._id)));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  const handleBulkAssign = async () => {
    if (selectedStudentIds.size === 0) return;
    setIsBulkAssigning(true);
    
    try {
      const payload = {
        studentIds: Array.from(selectedStudentIds)
      };
      if (bulkPO) payload.placementOfficerId = bulkPO;
      if (bulkMentor) payload.mentorId = bulkMentor;
      
      const response = await api.post('/admin/students/bulk-assignment', payload);
      if (response.data.success) {
        alert(response.data.message);
        setSelectedStudentIds(new Set());
        setBulkPO('');
        setBulkMentor('');
        fetchStudents();
      }
    } catch (err) {
      alert('Failed to bulk assign: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsBulkAssigning(false);
    }
  };

  // Build mentor list based on selected bulkPO
  const selectedOrgOfficer = hierarchy.find(o => o._id === bulkPO);
  const availableMentors = selectedOrgOfficer ? selectedOrgOfficer.mentors : [];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Student Directory</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Manage and oversee all students within the institution.</p>
      </div>

      {error && (
        <div style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* ── FILTERS BAR ──────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        background: 'var(--color-surface)', 
        padding: '1rem', 
        borderRadius: '8px', 
        border: '1px solid var(--color-border)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <input 
          type="text" 
          name="search" 
          placeholder="Search by name, email, or ID..." 
          value={filters.search}
          onChange={handleFilterChange}
          style={{ ...filterStyle, flex: 1, minWidth: '250px' }}
        />
        
        <select name="department" value={filters.department} onChange={handleFilterChange} style={filterStyle}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select name="batch" value={filters.batch} onChange={handleFilterChange} style={filterStyle}>
          <option value="">All Batches</option>
          {batches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select name="placementStatus" value={filters.placementStatus} onChange={handleFilterChange} style={filterStyle}>
          <option value="">All Placement Statuses</option>
          <option value="Placed">Placed (Has Offer)</option>
          <option value="Seeking">Seeking</option>
        </select>

        <select name="hasActivity" value={filters.hasActivity} onChange={handleFilterChange} style={filterStyle}>
          <option value="">All Application Activity</option>
          <option value="true">Active (Has Applications)</option>
          <option value="false">Inactive (0 Applications)</option>
        </select>
        
        {user?.role !== 'MENTOR' && (
          <select name="unassigned" value={filters.unassigned} onChange={handleFilterChange} style={filterStyle}>
            <option value="">All Assignment Status</option>
            <option value="true">Unassigned Only</option>
          </select>
        )}
      </div>

      {/* ── BULK ACTION BAR ──────────────────────────────────── */}
      {selectedStudentIds.size > 0 && user?.role !== 'MENTOR' && (
        <div style={{ 
          background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', 
          padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ color: '#3b82f6', fontWeight: 700 }}>
            {selectedStudentIds.size} Student{selectedStudentIds.size > 1 ? 's' : ''} Selected
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Assign To:</span>
            
            <select 
              value={bulkPO}
              onChange={(e) => {
                setBulkPO(e.target.value);
                setBulkMentor(''); // reset mentor when PO changes
              }}
              style={filterStyle}
            >
              <option value="">-- Select Officer --</option>
              {hierarchy.map(o => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>
            
            <select 
              value={bulkMentor}
              onChange={(e) => setBulkMentor(e.target.value)}
              disabled={!bulkPO}
              style={{ ...filterStyle, opacity: !bulkPO ? 0.5 : 1 }}
            >
              <option value="">-- Select Mentor --</option>
              {availableMentors.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>

            <button 
              onClick={handleBulkAssign}
              disabled={isBulkAssigning || (!bulkPO && !bulkMentor)}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem' }}
            >
              {isBulkAssigning ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      )}

      {/* ── TABLE ───────────────────────────────────────────── */}
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
                <th style={{ ...thStyle, width: '40px' }}>
                  {user?.role !== 'MENTOR' && (
                    <input 
                      type="checkbox" 
                      checked={data.students.length > 0 && selectedStudentIds.size === data.students.length}
                      onChange={toggleSelectAll}
                    />
                  )}
                </th>
                <th style={thStyle}>Student</th>
                <th style={thStyle}>Cohort</th>
                <th style={thStyle}>Apps</th>
                <th style={thStyle}>Interviews</th>
                <th style={thStyle}>Offers</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && data.students.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 0 }}>
                    <TableSkeleton rows={10} cols={7} />
                  </td>
                </tr>
              ) : data.students.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No students found matching your filters.
                  </td>
                </tr>
              ) : (
                data.students.map((student) => (
                  <tr key={student._id} style={{ borderBottom: '1px solid var(--color-border)', background: selectedStudentIds.has(student._id) ? 'rgba(59,130,246,0.05)' : 'transparent' }}>
                    <td style={tdStyle}>
                      {user?.role !== 'MENTOR' && (
                        <input 
                          type="checkbox" 
                          checked={selectedStudentIds.has(student._id)}
                          onChange={() => toggleSelect(student._id)}
                        />
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{student.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{student.studentId || 'No ID'} • {student.email}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ color: 'var(--color-text-primary)' }}>{student.department || '—'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Batch of {student.batch || '—'}</div>
                    </td>
                    <td style={tdStyle}>
                      {student.applicationCount === null ? (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>&#128274; Private</span>
                      ) : (
                        <Badge count={student.applicationCount} color="var(--color-text-secondary)" />
                      )}
                    </td>
                    <td style={tdStyle}>
                      {student.interviewCount === null ? (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>&#128274; Private</span>
                      ) : (
                        <Badge count={student.interviewCount} color={student.interviewCount > 0 ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)'} />
                      )}
                    </td>
                    <td style={tdStyle}>
                      {student.offerCount === null ? (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>&#128274;</span>
                      ) : student.offerCount > 0 ? (
                        <span style={{ 
                          background: 'rgba(22, 163, 74, 0.1)', 
                          color: 'var(--color-success)', 
                          padding: '4px 8px', 
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          Placed ({student.offerCount})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>0</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <Link 
                        to={`/admin/students/${student._id}`} 
                        style={{ 
                          color: 'var(--color-brand-primary)', 
                          textDecoration: 'none', 
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}
                      >
                        View Profile &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {data.totalPages > 1 && (
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid var(--color-border)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'var(--color-surface-overlay)'
          }}>
            <button 
              disabled={data.page === 1}
              onClick={() => handlePageChange(data.page - 1)}
              style={pageBtnStyle(data.page === 1)}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Page {data.page} of {data.totalPages}
            </span>
            <button 
              disabled={data.page === data.totalPages}
              onClick={() => handlePageChange(data.page + 1)}
              style={pageBtnStyle(data.page === data.totalPages)}
            >
              Next
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

const filterStyle = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.9rem',
  outline: 'none'
};

const thStyle = {
  padding: '1rem',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase'
};

const tdStyle = {
  padding: '1rem',
  fontSize: '0.95rem'
};

const Badge = ({ count, color }) => (
  <span style={{
    background: 'var(--color-bg)',
    color: color,
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 700,
    border: `1px solid ${color === 'var(--color-text-secondary)' ? 'var(--color-border)' : color}`
  }}>
    {count}
  </span>
);

const pageBtnStyle = (disabled) => ({
  background: disabled ? 'var(--color-bg)' : 'var(--color-surface)',
  color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600
});

export default AdminStudentDirectory;
