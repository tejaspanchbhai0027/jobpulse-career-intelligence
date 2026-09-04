import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const Badge = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface-overlay)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</span>
  </div>
);

const StatBox = ({ label, value, highlight = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span style={{ fontSize: '2rem', fontWeight: 900, color: highlight ? 'var(--color-brand-primary)' : 'var(--color-text-primary)', lineHeight: 1 }}>{value}</span>
    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem', letterSpacing: '0.05em' }}>{label}</span>
  </div>
);

const OfficerStudentProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Assignment state
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState('');

  useEffect(() => {
    const fetchProfileAndMentors = async () => {
      try {
        const [profileRes, mentorsRes] = await Promise.all([
          api.get(`/officer/students/${id}`),
          api.get(`/officer/mentors`)
        ]);
        if (profileRes.data.success) {
          setData(profileRes.data.data);
          setSelectedMentor(profileRes.data.data.profile.mentorId || '');
        }
        if (mentorsRes.data.success) {
          setMentors(mentorsRes.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch student profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndMentors();
  }, [id]);

  const handleAssignMentor = async () => {
    if (!selectedMentor && data.profile.mentorId) {
      // Intentionally unassigning? We might not support that here. Let's just block empty assignments if they were previously unassigned
    }
    
    setIsAssigning(true);
    try {
      await api.patch(`/officer/students/${id}/mentor`, { mentorId: selectedMentor || null });
      // update local state
      setData({
        ...data,
        profile: {
          ...data.profile,
          mentorId: selectedMentor || null
        }
      });
      alert('Mentor assignment updated successfully!');
    } catch (err) {
      console.error('Failed to assign mentor:', err);
      alert('Failed to update mentor assignment.');
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading profile...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem' }}>
        <Link to="/officer/students" style={{ color: 'var(--color-brand-primary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>&larr; Back to Directory</Link>
        <div style={{ padding: '1rem', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '8px' }}>
          {error || 'Profile not found'}
        </div>
      </div>
    );
  }

  const { profile, stats, applications, interviews, resumes, skills, careerSignals } = data;
  const hasPrivacyRestrictions = !profile.privacySettings?.shareSalaryWithPlacement || !profile.privacySettings?.shareNotesWithPlacement;
  
  const assignedMentor = mentors.find(m => m._id === profile.mentorId);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* ── BREADCRUMB ────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/officer/students" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
          &larr; Back to Student Directory
        </Link>
      </div>

      {/* ── PROFILE OVERVIEW HEADER ───────────────────────────────── */}
      <div style={{ 
        background: 'var(--color-surface)', 
        padding: '2.5rem', 
        borderRadius: '16px', 
        border: '1px solid var(--color-border)',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            {profile.name}
          </h1>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginBottom: '1.25rem' }}>
            {profile.studentId || 'No ID'} • {profile.email} • Batch of {profile.batch || 'Unknown'}
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <Badge label="Department" value={profile.department || 'Unknown'} />
            <Badge label="Target Role" value={profile.jobSearchGoal || 'Unknown'} />
          </div>

          {/* Mentor Assignment Box */}
          <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'inline-block' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Mentor Assignment</div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select 
                value={selectedMentor} 
                onChange={(e) => setSelectedMentor(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              >
                <option value="">-- Unassigned --</option>
                {mentors.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
              {selectedMentor !== (profile.mentorId || '') && (
                <button 
                  onClick={handleAssignMentor} 
                  disabled={isAssigning}
                  className="btn-primary" 
                  style={{ padding: '0.6rem 1rem' }}
                >
                  {isAssigning ? 'Saving...' : 'Save Assignment'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', background: 'var(--color-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <StatBox label="Applications" value={stats.totalApps} />
          <StatBox label="Interviews" value={stats.interviews} />
          <StatBox label="Offers" value={stats.offers} highlight={stats.offers > 0} />
        </div>
      </div>

      {/* ── PRIVACY NOTICE ────────────────────────────────────────── */}
      {hasPrivacyRestrictions && (
        <div style={{ 
          background: 'rgba(217, 119, 6, 0.1)', 
          border: '1px solid var(--color-warning)', 
          padding: '1rem 1.5rem', 
          borderRadius: '12px', 
          marginBottom: '2rem',
          color: 'var(--color-warning)',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 500
        }}>
          <span>🔒</span>
          This student has enabled strict privacy controls. Certain fields (like Salary or Private Notes) are hidden from institution staff.
        </div>
      )}

      {/* ── TWO-COLUMN LAYOUT ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ACTIVITY & TIMELINE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Applications Table */}
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Application History</h2>
            </div>
            
            {profile.privacySettings?.applicationProgress === false ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>🔒</span>
                <div>Student has hidden application details from the institution.</div>
              </div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No applications recorded yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Company</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Role</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{app.companyName}</td>
                        <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{app.jobTitle}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                            background: app.status === 'Offer' ? 'rgba(16,185,129,0.1)' : 
                                        app.status === 'Interview' ? 'rgba(245,158,11,0.1)' :
                                        app.status === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'var(--color-surface-overlay)',
                            color: app.status === 'Offer' ? '#10b981' : 
                                   app.status === 'Interview' ? '#f59e0b' :
                                   app.status === 'Rejected' ? '#ef4444' : 'var(--color-text-secondary)'
                          }}>
                            {app.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                          {new Date(app.appliedDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Interviews Table */}
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>Interview History</h2>
            </div>
            
            {!interviews || interviews.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No interviews recorded yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface-overlay)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Company</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Round</th>
                      <th style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviews.map(int => (
                      <tr key={int._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{int.application?.company || 'Unknown'}</td>
                        <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{int.round || 1}</td>
                        <td style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                          {new Date(int.date).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: SKILLS & AI SIGNALS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Skills Section */}
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.5rem 0', color: 'var(--color-text-primary)' }}>Known Skills</h2>
            {profile.privacySettings?.skills === false ? (
               <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '1rem' }}>🔒 Skills hidden</div>
            ) : skills && skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {skills.map(skill => (
                  <span key={skill} style={{ 
                    padding: '0.4rem 0.8rem', background: 'var(--color-surface-overlay)', 
                    border: '1px solid var(--color-border)', borderRadius: '20px', 
                    fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' 
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No skills extracted yet.</div>
            )}
          </div>

          {/* Intervention Signals */}
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.5rem 0', color: 'var(--color-text-primary)' }}>⚠️ Intervention Signals</h2>
            {!careerSignals || careerSignals.length === 0 ? (
               <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '1rem' }}>No active intervention signals for this student.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {careerSignals.map((sig, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: 'var(--color-surface-overlay)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{sig.type}</strong>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: sig.priority === 'HIGH' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: sig.priority === 'HIGH' ? '#ef4444' : '#f59e0b' }}>
                        {sig.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{sig.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default OfficerStudentProfile;
