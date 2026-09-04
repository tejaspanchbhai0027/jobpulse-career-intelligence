import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import AddRecommendationModal from '../../components/mentor/AddRecommendationModal';

const MentorStudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const [profileRes, recsRes] = await Promise.all([
          api.get(`/mentor/students/${id}`),
          api.get(`/mentor/students/${id}/recommendations`)
        ]);
        setStudent(profileRes.data.data.student);
        setApplications(profileRes.data.data.applications?.data || []);
        
        // Extract interviews from applications
        const ints = [];
        (profileRes.data.data.applications?.data || []).forEach(app => {
           if (app.interviews) {
              app.interviews.forEach(i => ints.push({ ...i, application: app }));
           }
        });
        setInterviews(ints.sort((a,b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)));
        
        setRecommendations(recsRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentProfile();
  }, [id]);

  const handleStatusChange = async (recId, newStatus) => {
    try {
      await api.patch(`/mentor/recommendations/${recId}/status`, { status: newStatus });
      setRecommendations(recs => recs.map(r => r._id === recId ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading student profile...</div>;
  if (error || !student) return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
        {error || 'Student not found'}
      </div>
      <button onClick={() => navigate('/mentor/students')} className="btn-secondary" style={{ marginTop: '1rem', padding: '0.6rem 1.2rem' }}>
        ← Back to Students
      </button>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'applications', label: 'Applications' },
    { id: 'interviews', label: 'Interviews' },
    { id: 'snapshot', label: 'Career Snapshot' },
    { id: 'mentorship', label: 'Mentorship' }
  ];

  const tabStyle = (isActive) => ({
    padding: '1rem 1.5rem',
    fontWeight: isActive ? 700 : 600,
    color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
    borderBottom: isActive ? '3px solid var(--color-brand-primary)' : '3px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'transparent',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none'
  });

  const isActive = student.applicationCount > 0;
  const stage = student.offerCount > 0 ? 'Placed' : student.interviewCount > 0 ? 'Interviewing' : isActive ? 'Applying' : 'Inactive';

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button onClick={() => navigate('/mentor/students')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', fontWeight: 600 }}>
        <span>←</span> Back to Students
      </button>

      {/* Header Card */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
          {student.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>{student.name}</h1>
            <span style={{ padding: '0.4rem 0.8rem', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700 }}>
              Stage: <span style={{ color: 'var(--color-brand-primary)' }}>{stage}</span>
            </span>
          </div>
          <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span>📧 {student.email}</span>
            {student.department && <span>🏢 {student.department}</span>}
            {student.batch && <span>📅 Class of {student.batch}</span>}
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-brand-primary)' }}>{student.applicationCount === null ? '🔒' : student.applicationCount || 0}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Applications</div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>{student.interviewCount === null ? '🔒' : student.interviewCount || 0}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Interviews</div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{student.offerCount === null ? '🔒' : student.offerCount || 0}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Offers</div>
        </div>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{new Date(student.createdAt).toLocaleDateString()}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Last Activity</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} style={tabStyle(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Career Target</h3>
            {student.jobSearchGoal ? (
              <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{student.jobSearchGoal}</p>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>Not specified or private 🔒</p>
            )}
          </div>
          
          <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Recent Applications</h3>
            {student.applicationCount === null ? (
              <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Student has hidden their application progress.</div>
            ) : applications.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)' }}>No applications recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applications.slice(0, 5).map(app => (
                  <div key={app._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{app.role}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{app.company}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: app.status === 'Offer' ? '#10b981' : 'var(--color-text-secondary)' }}>{app.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
          {applications.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)' }}>No applications found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.map(app => (
                <div key={app._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{app.role}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{app.company} • Applied on {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>{app.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'interviews' && (
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
          {interviews.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)' }}>No interviews found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {interviews.map(int => (
                <div key={int._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--color-surface-overlay)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{int.application?.company}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{int.application?.role} • Round {int.round || 1}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}>{new Date(int.scheduledAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{new Date(int.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'snapshot' && (
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
           <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Career Preferences</h3>
           {student.jobSearchGoal ? (
             <div style={{ color: 'var(--color-text-secondary)' }}>
               <p><strong>Goal:</strong> {student.jobSearchGoal}</p>
             </div>
           ) : (
             <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Career preferences are private or not set.</div>
           )}
        </div>
      )}

      {activeTab === 'mentorship' && (
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Mentorship Workspace
            </h2>
            <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              + Add Goal / Action
            </button>
          </div>

          <div>
            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0', background: 'var(--color-surface-overlay)', borderRadius: '8px' }}>
                No mentorship notes or goals yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendations.map(rec => (
                  <div key={rec._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1.5rem', background: 'var(--color-surface-overlay)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '1.05rem' }}>{rec.type}</span>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                            background: rec.priority === 'Urgent' ? 'rgba(239,68,68,0.1)' : rec.priority === 'Important' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                            color: rec.priority === 'Urgent' ? '#ef4444' : rec.priority === 'Important' ? '#f59e0b' : '#3b82f6'
                          }}>
                            {rec.priority}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {new Date(rec.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                          background: rec.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : rec.status === 'ACKNOWLEDGED' ? 'rgba(59,130,246,0.1)' : 'var(--color-bg)',
                          color: rec.status === 'COMPLETED' ? '#10b981' : rec.status === 'ACKNOWLEDGED' ? '#3b82f6' : 'var(--color-text-secondary)'
                        }}>
                          {rec.status}
                        </div>

                        {rec.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleStatusChange(rec._id, 'COMPLETED')}
                            style={{
                              background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
                              padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px' }}>
                      {rec.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <AddRecommendationModal
          studentId={id}
          onClose={() => setShowAddModal(false)}
          onSuccess={async () => {
            setShowAddModal(false);
            const { data } = await api.get(`/mentor/students/${id}/recommendations`);
            setRecommendations(data.data || []);
          }}
        />
      )}
    </div>
  );
};

export default MentorStudentProfile;
