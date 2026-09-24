import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const OfficerInterventions = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);
  
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchInterventions = async () => {
      setLoading(true);
      try {
        const params = { 
          page, 
          limit: 25, 
          priority: priorityFilter,
          status: statusFilter,
        };
        if (searchQuery) params.search = searchQuery;
        if (isOverdue) params.overdue = 'true';

        const { data } = await api.get('/officer/interventions', { params });
        setSignals(data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch interventions');
      } finally {
        setLoading(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchInterventions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, priorityFilter, statusFilter, searchQuery, isOverdue]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  if (loading && signals.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading intervention radar...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>⚠️ Intervention Radar</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0' }}>Actionable signals requiring Placement Officer attention.</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
             <input 
              type="text" 
              placeholder="Search student..." 
              value={searchQuery}
              onChange={handleSearchChange}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-overlay)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                minWidth: '200px'
              }}
            />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text-primary)', fontWeight: 600 }}>
              <input type="checkbox" checked={isOverdue} onChange={(e) => { setIsOverdue(e.target.checked); setPage(1); }} />
              Overdue Only
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-surface-overlay)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].map(s => (
                <button 
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  style={{
                    padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
                    background: statusFilter === s ? 'var(--color-surface)' : 'transparent',
                    color: statusFilter === s ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: statusFilter === s ? 700 : 600,
                    boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-surface-overlay)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                <button 
                  key={p}
                  onClick={() => { setPriorityFilter(p); setPage(1); }}
                  style={{
                    padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
                    background: priorityFilter === p ? 'var(--color-surface)' : 'transparent',
                    color: priorityFilter === p ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: priorityFilter === p ? 700 : 600,
                    boxShadow: priorityFilter === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {p === 'ALL' ? 'All Priority' : p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {signals.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>All clear!</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>No pending interventions match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {signals.map((sig, idx) => {
            const isActuallyOverdue = sig.status !== 'RESOLVED' && sig.status !== 'CANCELLED' && sig.dueDate && new Date(sig.dueDate) < new Date();
            
            return (
            <div 
              key={sig._id || idx} 
              style={{ 
                background: 'var(--color-surface)', 
                borderRadius: '12px', 
                border: isActuallyOverdue ? '1px solid #ef4444' : '1px solid var(--color-border)', 
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.5rem',
                boxShadow: isActuallyOverdue ? '0 0 0 1px #ef4444' : 'var(--shadow-sm)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{sig.student?.name || 'Unknown Student'}</h3>
                  
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', 
                    background: sig.status === 'RESOLVED' ? 'rgba(16,185,129,0.1)' : sig.status === 'IN_PROGRESS' ? 'rgba(59,130,246,0.1)' : sig.status === 'CANCELLED' ? 'rgba(107,114,128,0.1)' : 'rgba(239,68,68,0.1)',
                    color: sig.status === 'RESOLVED' ? '#10b981' : sig.status === 'IN_PROGRESS' ? '#3b82f6' : sig.status === 'CANCELLED' ? '#6b7280' : '#ef4444',
                    border: '1px solid currentColor'
                  }}>
                    {sig.status}
                  </span>

                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', 
                    background: sig.priority === 'HIGH' ? 'rgba(239,68,68,0.1)' : sig.priority === 'MEDIUM' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', 
                    color: sig.priority === 'HIGH' ? '#ef4444' : sig.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' 
                  }}>
                    {sig.priority} PRIORITY
                  </span>
                  
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', borderRadius: '12px', 
                    background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' 
                  }}>
                    {sig.type?.replace(/_/g, ' ')}
                  </span>
                </div>
                
                {sig.title && <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)', fontSize: '1rem' }}>{sig.title}</h4>}
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                  {sig.reason}
                </p>
                
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span>🎓 Dept: {sig.student?.department || 'N/A'}</span>
                  <span>👨‍🏫 Mentor: {sig.student?.mentorId?.name || 'Unassigned'}</span>
                  <span>📅 Created: {new Date(sig.createdAt).toLocaleDateString()}</span>
                  {sig.dueDate && (
                    <span style={{ color: isActuallyOverdue ? '#ef4444' : 'inherit', fontWeight: isActuallyOverdue ? 700 : 'normal' }}>
                      ⏰ Due: {new Date(sig.dueDate).toLocaleDateString()} {isActuallyOverdue && '(OVERDUE)'}
                    </span>
                  )}
                  {sig.resolvedAt && <span>✅ Resolved: {new Date(sig.resolvedAt).toLocaleDateString()}</span>}
                </div>

                {sig.mentorNotes && (
                  <div style={{ background: 'var(--color-surface-overlay)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Mentor Notes:</strong> {sig.mentorNotes}
                  </div>
                )}
                {!sig.mentorNotes && sig.suggestedSupport && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-brand-primary)', fontWeight: 600 }}>
                    Recommended Action: {sig.suggestedSupport}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => navigate(`/officer/students/${sig.student?._id}`)}
                style={{
                  background: 'var(--color-brand-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                View Profile
              </button>
            </div>
          )})}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: page === 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              borderRadius: '6px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            Previous
          </button>
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: page === totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              borderRadius: '6px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OfficerInterventions;
