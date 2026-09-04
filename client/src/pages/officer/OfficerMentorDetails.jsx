import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const OfficerMentorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [mentorRes, studentsRes] = await Promise.all([
          api.get(`/officer/mentors/${id}`),
          api.get(`/officer/students?mentorId=${id}&limit=100`) // Simplified pagination for the specific mentor
        ]);
        
        setMentor(mentorRes.data.data);
        setStudents(studentsRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch mentor details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading mentor profile...</div>;
  }

  if (error || !mentor) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error || 'Mentor not found'}
        </div>
        <button onClick={() => navigate('/officer/mentors')} className="btn-secondary" style={{ marginTop: '1rem', padding: '0.6rem 1.2rem' }}>
          ← Back to Mentors
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/officer/mentors')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', fontWeight: 600 }}>
        <span>←</span> Back to Mentors
      </button>

      {/* Header Card */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
          {mentor.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>{mentor.name}</h1>
          <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>📧 {mentor.email}</span>
            {mentor.department && <span>🏢 {mentor.department}</span>}
          </div>
        </div>
        <div>
          <div style={{ padding: '0.5rem 1rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{students.length}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Students</span>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>
        Assigned Students
      </h2>

      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
          No students currently assigned to this mentor.
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Department</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Apps</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Interviews</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Offers</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerMentorDetails;
