import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Skeleton from '../../components/ui/Skeleton';

const AdminStudentProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [feedback, setFeedback] = useState([]);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackType, setFeedbackType] = useState('GENERAL');

  // Assignment State
  const [hierarchy, setHierarchy] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedPO, setSelectedPO] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/admin/students/${id}`);
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch student profile');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchFeedback = async () => {
      try {
        const res = await api.get(`/admin/students/${id}/feedback`);
        if (res.data.success) {
          setFeedback(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch feedback:', err);
      }
    };

    const fetchHierarchy = async () => {
      try {
        const res = await api.get('/admin/officers/organization');
        if (res.data.success) {
          setHierarchy(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch org hierarchy:', err);
      }
    };

    fetchProfile();
    fetchFeedback();
    fetchHierarchy();
  }, [id]);

  useEffect(() => {
    if (data?.profile) {
      setSelectedPO(data.profile.placementOfficerId || '');
      setSelectedMentor(data.profile.mentorId || '');
    }
  }, [data]);

  const handleAssignMentor = async () => {
    setIsAssigning(true);
    try {
      const res = await api.patch(`/admin/students/${id}/mentor`, {
        placementOfficerId: selectedPO || null,
        mentorId: selectedMentor || null
      });
      if (res.data.success) {
        setData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            placementOfficerId: selectedPO || null,
            mentorId: selectedMentor || null
          }
        }));
        alert('Assignment updated successfully!');
      }
    } catch (err) {
      alert('Failed to update assignment: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;
    try {
      const res = await api.post(`/admin/students/${id}/feedback`, { content: feedbackContent, type: feedbackType });
      if (res.data.success) {
        setFeedback([res.data.data, ...feedback]);
        setFeedbackContent('');
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <Skeleton height="150px" borderRadius="16px" style={{ marginBottom: '2rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          <Skeleton height="400px" borderRadius="16px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Skeleton height="200px" borderRadius="16px" />
            <Skeleton height="300px" borderRadius="16px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <Link to="/admin/students" style={{ color: 'var(--color-brand-primary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>&larr; Back to Directory</Link>
        <div style={{ padding: '1rem', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: '8px' }}>
          {error}
        </div>
      </div>
    );
  }

  const { profile, stats, applications, interviews, resumes, skills, careerSignals } = data;

  const hasPrivacyRestrictions = !profile.privacySettings?.shareSalaryWithPlacement || !profile.privacySettings?.shareNotesWithPlacement;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* ── BREADCRUMB ────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/students" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
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
        alignItems: 'center',
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
            <Badge label="Location" value={profile.location || 'Any'} />
          </div>
          
          {/* Mentor Assignment Box */}
          <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'inline-block' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Team Assignment</div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select 
                value={selectedPO} 
                onChange={(e) => {
                  setSelectedPO(e.target.value);
                  setSelectedMentor('');
                }}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              >
                <option value="">-- No Placement Officer --</option>
                {hierarchy.map(o => (
                  <option key={o._id} value={o._id}>{o.name}</option>
                ))}
              </select>
              <select 
                value={selectedMentor} 
                onChange={(e) => setSelectedMentor(e.target.value)}
                disabled={!selectedPO}
                style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', opacity: !selectedPO ? 0.5 : 1 }}
              >
                <option value="">-- No Mentor --</option>
                {(hierarchy.find(o => o._id === selectedPO)?.mentors || []).map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
              {(selectedPO !== (profile.placementOfficerId || '') || selectedMentor !== (profile.mentorId || '')) && (
                <button 
                  onClick={handleAssignMentor} 
                  disabled={isAssigning}
                  className="btn-primary" 
                  style={{ padding: '0.6rem 1rem' }}
                >
                  {isAssigning ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', background: 'var(--color-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <StatBox label="Applications" value={stats.totalApps} />
          <StatBox label="Interviews" value={stats.interviews} />
          <StatBox label="Offers" value={stats.offers} highlight={stats.offers > 0} />
          <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 0.5rem' }}></div>
          <StatBox label="Response Rate" value={`${stats.responseRate}%`} />
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
          <span style={{ fontSize: '1.2rem' }}>&#9888;</span>
          <span><strong>Privacy Notice:</strong> This student has restricted visibility for some fields (e.g., exact salary figures, private interview notes). This data has been securely scrubbed from your view.</span>
        </div>
      )}

      {/* ── MAIN CONTENT GRID ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        
        {/* LEFT COLUMN: ACTIVITY & SIGNALS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* CAREER SIGNALS */}
          <section>
            <h2 style={sectionHeaderStyle}>Career Intelligence Signals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.shared === false ? (
                <div style={privateStateStyle}>&#128274; PRIVATE DATA<br/>Student has opted out of sharing application progress.</div>
              ) : careerSignals && careerSignals.length > 0 ? (
                careerSignals.map((signal, idx) => (
                  <SignalCard key={idx} text={signal.text} evidence={signal.evidence} />
                ))
              ) : (
                <div style={emptyStateStyle}>No intelligence signals generated yet.</div>
              )}
            </div>
          </section>

          {/* APPLICATION ACTIVITY */}
          <section>
            <h2 style={sectionHeaderStyle}>Recent Application Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.shared === false ? (
                <div style={privateStateStyle}>&#128274; PRIVATE DATA<br/>Student has opted out of sharing application progress.</div>
              ) : applications.data.length === 0 ? (
                <div style={emptyStateStyle}>No applications recorded yet.</div>
              ) : (
                applications.data.slice(0, 10).map(app => (
                  <ApplicationCard key={app._id} app={app} />
                ))
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: RESUME, SKILLS & INTERVIEWS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* RESUMES */}
          <section>
            <h2 style={sectionHeaderStyle}>Resumes</h2>
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              {resumes.shared === false ? (
                <div style={privateStateStyle}>&#128274; PRIVATE DATA<br/>Student has opted out of sharing resumes.</div>
              ) : resumes.data && resumes.data.length > 0 ? (
                resumes.data.map((resume, idx) => (
                  <div key={resume._id} style={{ 
                    padding: '1.25rem', 
                    borderBottom: idx !== resumes.data.length - 1 ? '1px solid var(--color-border)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{resume.name}</div>
                      {resume.isDefault && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--color-brand-primary)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          Default
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      Target: {resume.targetRole || 'General'} • {resume.version}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No resumes uploaded.</div>
              )}
            </div>
          </section>

          {/* SKILLS */}
          <section>
            <h2 style={sectionHeaderStyle}>Top Skills Detected</h2>
            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {skills.shared === false ? (
                <div style={{...privateStateStyle, width: '100%', border: 'none'}}>&#128274; PRIVATE DATA<br/>Student has opted out of sharing skills.</div>
              ) : skills.data && skills.data.length > 0 ? (
                skills.data.map((skill, idx) => (
                  <span key={idx} style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {skill}
                  </span>
                ))
              ) : (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No skills extracted.</div>
              )}
            </div>
          </section>

          {/* INTERVIEW PROGRESS */}
          <section>
            <h2 style={sectionHeaderStyle}>Interview Progress</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {interviews.shared === false ? (
                <div style={privateStateStyle}>&#128274; PRIVATE DATA<br/>Student has opted out of sharing interview progress.</div>
              ) : interviews.data.length === 0 ? (
                <div style={emptyStateStyle}>No interviews scheduled.</div>
              ) : (
                interviews.data.map(int => (
                  <div key={int._id} style={{ 
                    background: 'var(--color-surface)', 
                    padding: '1.25rem', 
                    borderRadius: '12px', 
                    border: `1px solid ${new Date(int.scheduledAt) >= new Date() ? 'var(--color-brand-primary)' : 'var(--color-border)'}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {new Date(int.scheduledAt) >= new Date() && (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--color-brand-primary)' }} />
                    )}
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {int.application?.company || 'Unknown Company'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                      Round: {int.type}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      {new Date(int.scheduledAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: new Date(int.scheduledAt) >= new Date() ? 'var(--color-brand-primary)' : 'var(--color-text-muted)', marginTop: '0.75rem', fontWeight: 600 }}>
                      {int.result}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ADVISOR NOTES */}
          <section>
            <h2 style={sectionHeaderStyle}>Advisor Notes & Feedback</h2>
            <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <textarea 
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Leave advice or a note for the student..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                  required
                />
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                  <select 
                    value={feedbackType} 
                    onChange={(e) => setFeedbackType(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
                  >
                    <option value="GENERAL">General</option>
                    <option value="RESUME">Resume</option>
                    <option value="INTERVIEW">Interview</option>
                  </select>
                  <button type="submit" style={{ background: 'var(--color-brand-primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                    Send Feedback
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {feedback.length === 0 ? (
                  <div style={emptyStateStyle}>No feedback given yet.</div>
                ) : (
                  feedback.map(f => (
                    <div key={f._id} style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}>{f.type}</span>
                        <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                        {f.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

// ── SUBCOMPONENTS ──────────────────────────────────────────────

const sectionHeaderStyle = {
  fontSize: '1.25rem',
  fontWeight: 800,
  color: 'var(--color-text-primary)',
  marginBottom: '1.25rem',
  letterSpacing: '-0.01em'
};

const emptyStateStyle = {
  padding: '2rem', 
  textAlign: 'center', 
  background: 'var(--color-surface)', 
  border: '1px solid var(--color-border)', 
  borderRadius: '12px', 
  color: 'var(--color-text-secondary)',
  fontSize: '0.95rem'
};

const privateStateStyle = {
  padding: '2rem', 
  textAlign: 'center', 
  background: 'rgba(239,68,68,0.05)', 
  border: '1px dashed var(--color-danger)', 
  borderRadius: '12px', 
  color: 'var(--color-danger)',
  fontSize: '0.9rem',
  fontWeight: 500,
  lineHeight: 1.5
};

const Badge = ({ label, value }) => (
  <div style={{ 
    background: 'var(--color-surface-overlay)', 
    border: '1px solid var(--color-border)', 
    padding: '6px 12px', 
    borderRadius: '8px',
    fontSize: '0.85rem',
  }}>
    <span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>{label}:</span>
    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{value}</span>
  </div>
);

const StatBox = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: highlight ? 'var(--color-success)' : 'var(--color-text-primary)', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginTop: '0.5rem', letterSpacing: '0.05em' }}>
      {label}
    </div>
  </div>
);

const SignalCard = ({ text, evidence }) => {
  const [showEvidence, setShowEvidence] = useState(false);
  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      border: '1px solid var(--color-border)', 
      borderRadius: '12px', 
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ color: 'var(--color-brand-primary)', fontSize: '1.25rem', marginTop: '-2px' }}>&#10024;</div>
        <div style={{ flex: 1, fontSize: '1.05rem', color: 'var(--color-text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
          {text}
        </div>
      </div>
      <div>
        <button 
          onClick={() => setShowEvidence(!showEvidence)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {showEvidence ? 'Hide Evidence' : 'View Evidence'}
        </button>
        {showEvidence && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'var(--color-bg)', 
            borderLeft: '2px solid var(--color-border)',
            fontSize: '0.9rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5
          }}>
            {evidence}
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicationCard = ({ app }) => {
  const { id } = useParams();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/students/${id}/feedback`, {
        content,
        type: 'GENERAL',
        applicationId: app._id
      });
      setSuccess(true);
      setContent('');
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to submit application feedback', err);
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      padding: '1.5rem', 
      borderRadius: '12px', 
      border: '1px solid var(--color-border)',
      transition: 'transform 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.25rem 0' }}>
            {app.role}
          </h3>
          <div style={{ fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {app.company}
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem' }}>
        <div>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Applied</span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{new Date(app.dateApplied).toLocaleDateString()}</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Source</span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{app.source || '—'}</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Salary</span>
          {app._salaryHidden ? (
            <span style={{ color: 'var(--color-warning)', fontStyle: 'italic', fontSize: '0.85rem' }} title="Student has hidden salary info">Hidden</span>
          ) : (
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{app.salary || '—'}</span>
          )}
        </div>
      </div>
      
      {app.needsFollowUp && (
        <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 700, display: 'inline-block', background: 'rgba(220, 38, 38, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
          &#9888; Action Required: Needs Follow-up
        </div>
      )}

      <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
        {!showForm ? (
          <button 
            onClick={() => setShowForm(true)}
            style={{ background: 'transparent', border: '1px solid var(--color-brand-primary)', color: 'var(--color-brand-primary)', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Application Feedback
          </button>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Advice for ${app.company} application...`}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.85rem' }}
              required
            />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button type="submit" disabled={submitting} style={{ background: 'var(--color-brand-primary)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                {submitting ? 'Saving...' : 'Save Feedback'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', color: 'var(--color-text-muted)', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                Cancel
              </button>
              {success && <span style={{ color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>Saved!</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let bg = 'var(--color-bg)';
  let color = 'var(--color-text-secondary)';
  
  if (status === 'Offer') {
    bg = 'rgba(22, 163, 74, 0.1)';
    color = 'var(--color-success)';
  } else if (status === 'Interview') {
    bg = 'rgba(37, 99, 235, 0.1)';
    color = 'var(--color-brand-primary)';
  } else if (status === 'Rejected') {
    bg = 'rgba(220, 38, 38, 0.1)';
    color = 'var(--color-danger)';
  }

  return (
    <span style={{ 
      background: bg, 
      color: color, 
      padding: '4px 12px', 
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontWeight: 700,
      border: `1px solid ${color === 'var(--color-text-secondary)' ? 'var(--color-border)' : color}`
    }}>
      {status}
    </span>
  );
};

export default AdminStudentProfile;
