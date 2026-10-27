import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

const OfficerPlacedStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchPlacedStudents = async () => {
      setLoading(true);
      try {
        let url = `/officer/students?page=${page}&limit=20&placementStatus=Placed`;
        if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;

        const { data } = await api.get(url);
        setStudents(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load placed students');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlacedStudents();
  }, [page, debouncedSearch]);

  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setPage(p => p + 1);

  const handleExportCSV = async () => {
    try {
      const { data } = await api.get('/officer/students?limit=1000&placementStatus=Placed');
      const allStudents = data.data || [];
      
      if (allStudents.length === 0) {
        alert('No placed students to export.');
        return;
      }
      
      const headers = ['Name', 'Email', 'Department', 'Offers', 'Applications'];
      const csvRows = [headers.join(',')];
      
      allStudents.forEach(s => {
        const row = [
          `"${s.name}"`,
          `"${s.email}"`,
          `"${s.department || ''}"`,
          s.offerCount || 0,
          s.applicationCount || 0
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `placed_students_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Placed Students
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Directory of all students who have successfully secured at least one offer.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleExportCSV}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '1.5rem' }}>{error}</div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search placed students..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '250px', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '0.95rem' }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading students...</div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>No placed students found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>Try adjusting your search criteria.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {students.map(student => (
              <div 
                key={student._id} 
                onClick={() => navigate(`/officer/students/${student._id}`)}
                style={{ 
                  background: 'var(--color-surface)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '12px', 
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>{student.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem' }}>
                      <span>{student.email}</span>
                      {student.department && <span>• {student.department}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{student.offerCount}</div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>Offers</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{student.applicationCount}</div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>Applications</div>
                  </div>
                  {student.offers && student.offers.length > 0 && student.offers.some(o => o.proofFileUrl) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {student.offers.filter(o => o.proofFileUrl).map((offer, idx) => (
                        <a 
                          key={offer._id || idx}
                          href={offer.proofFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(16,185,129,0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          📄 Offer Letter {idx > 0 ? idx + 1 : ''}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button 
              onClick={handlePrevPage}
              disabled={page === 1}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <div style={{ padding: '0.5rem 1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Page {page}
            </div>
            <button 
              onClick={handleNextPage}
              disabled={students.length < 20}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', fontWeight: 600, cursor: students.length < 20 ? 'not-allowed' : 'pointer', opacity: students.length < 20 ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OfficerPlacedStudents;
