import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Skeleton from '../../components/ui/Skeleton';

const AdminOfficerDetails = () => {
  const { id } = useParams();
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await api.get(`/admin/officers/${id}`);
        setOfficer(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch officer details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <Skeleton height="150px" borderRadius="16px" style={{ marginBottom: '2rem' }} />
        <Skeleton height="300px" borderRadius="16px" />
      </div>
    );
  }

  if (error || !officer) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error || 'Officer not found'}
        </div>
        <Link to="/admin/organization" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
          &larr; Back to Organization
        </Link>
      </div>
    );
  }

  const mentors = officer.mentors || [];
  const totalStudents = mentors.reduce((acc, m) => acc + m.studentCount, 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/organization" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
          &larr; Back to Organization
        </Link>
      </div>

      {/* Header Card */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
          {officer.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>{officer.name}</h1>
          <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>📧 {officer.email}</span>
            <span style={{ 
              padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
              background: officer.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: officer.isActive ? '#10b981' : '#ef4444'
            }}>
              {officer.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ padding: '0.5rem 1.5rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{mentors.length}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Mentors</span>
          </div>
          <div style={{ padding: '0.5rem 1.5rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-brand-primary)' }}>{totalStudents}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Students</span>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
        Managed Mentors
      </h2>

      {mentors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
          No mentors currently managed by this officer.
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Mentor</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Department</th>
                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Students</th>
              </tr>
            </thead>
            <tbody>
              {mentors.map(mentor => (
                <tr key={mentor._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{mentor.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {mentor.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                    {mentor.department || '-'}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--color-brand-primary)', textAlign: 'right' }}>
                    {mentor.studentCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOfficerDetails;
