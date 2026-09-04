import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Skeleton from '../../components/ui/Skeleton';

const AdminOrganization = () => {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOfficers, setExpandedOfficers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const { data } = await api.get('/admin/officers/organization');
        setHierarchy(data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch organization hierarchy');
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const toggleOfficer = (officerId) => {
    setExpandedOfficers(prev => ({
      ...prev,
      [officerId]: !prev[officerId]
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <Skeleton height="200px" borderRadius="16px" style={{ marginBottom: '2rem' }} />
        <Skeleton height="100px" borderRadius="16px" style={{ marginBottom: '1rem' }} />
        <Skeleton height="100px" borderRadius="16px" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Organization Structure
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', margin: 0 }}>
          An overview of your institution's Placement Officers and their Mentors.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {hierarchy.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', margin: 0 }}>No Placement Officers found.</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Add a placement officer to build your organization.</p>
          </div>
        ) : (
          hierarchy.map(officer => {
            const isExpanded = expandedOfficers[officer._id];
            
            return (
              <div key={officer._id} style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                {/* Officer Header Row */}
                <div 
                  onClick={() => toggleOfficer(officer._id)}
                  style={{ 
                    padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    cursor: 'pointer', transition: 'background 0.2s', background: isExpanded ? 'var(--color-surface-overlay)' : 'transparent' 
                  }}
                  onMouseOver={(e) => !isExpanded && (e.currentTarget.style.background = 'var(--color-surface-overlay)')}
                  onMouseOut={(e) => !isExpanded && (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>
                      {officer.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{officer.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{officer.email}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{officer.mentorCount}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Mentors</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>{officer.studentCount}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Students</div>
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem', fontWeight: 700, width: '24px', textAlign: 'center' }}>
                      {isExpanded ? '−' : '+'}
                    </div>
                  </div>
                </div>

                {/* Expanded Mentors List */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    {officer.mentors.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        No mentors assigned to this officer.
                      </div>
                    ) : (
                      <div style={{ padding: '1rem 0' }}>
                        {officer.mentors.map(mentor => (
                          <div key={mentor._id} style={{ padding: '1rem 2rem 1rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                                {mentor.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{mentor.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{mentor.department || 'No Dept'}</div>
                              </div>
                            </div>
                            <div style={{ padding: '0.3rem 0.8rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                              {mentor.studentCount} Students
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
                      <button onClick={() => navigate(`/admin/officers/${officer._id}`)} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        View Officer Details →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminOrganization;
