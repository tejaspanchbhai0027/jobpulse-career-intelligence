import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import CreateInterventionModal from '../../components/mentor/CreateInterventionModal';

const MentorStudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchStudentProfile = async () => {
      try {
        const [overviewRes, activityRes] = await Promise.all([
          api.get(`/mentor/students/${id}/overview`),
          api.get(`/mentor/students/${id}/activity`)
        ]);
        setData(overviewRes.data.data);
        setTimeline(activityRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load student profile');
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading student profile...</div>;
  if (error || !data) return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
        {error || 'Student not found'}
      </div>
      <button onClick={() => navigate('/mentor/students')} className="btn-secondary" style={{ marginTop: '1rem', padding: '0.6rem 1.2rem' }}>
        ← Back to Students
      </button>
    </div>
  );

  const { student, condition, pipeline, currentTasks, upcomingInterviews } = data;

  const getConditionColor = (status) => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'NEEDS_ATTENTION': return '#ef4444';
      case 'INACTIVE': return '#f59e0b';
      case 'INTERVIEW_PREPARATION_REQUIRED': return '#3b82f6';
      case 'FOLLOW_UP_REQUIRED': return '#8b5cf6';
      default: return 'var(--color-text-secondary)';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate('/mentor/students')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <span>←</span> Back to Students
        </button>
        <button 
          onClick={() => setShowCreateModal(true)}
          style={{ background: 'var(--gradient-brand)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          + Create Action Plan
        </button>
      </div>

      {/* A. Student Overview */}
      <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
          {student.name.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>{student.name}</h1>
            <span style={{ padding: '0.4rem 0.8rem', background: 'var(--color-surface-raised)', border: `1px solid ${getConditionColor(condition.status)}`, color: getConditionColor(condition.status), borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700 }}>
              {condition.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span>📧 {student.email}</span>
            {student.department && <span>🏢 {student.department}</span>}
            {student.batch && <span>📅 Class of {student.batch}</span>}
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            <strong>Condition Reason:</strong> {condition.reason}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* B. Career Pipeline */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>Career Pipeline</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>{pipeline.total}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Applications</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6' }}>{pipeline.interview}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Interviews</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>{pipeline.offer}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Offers</div>
            </div>
            <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444' }}>{pipeline.rejected}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Rejections</div>
            </div>
          </div>
        </div>

        {/* C. Resume and Readiness */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>Career Readiness</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: `conic-gradient(var(--color-brand-primary) ${student.profileCompletion}%, var(--color-border) 0)` }}>
              <div style={{ position: 'absolute', width: '68px', height: '68px', background: 'var(--color-surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                {student.profileCompletion}%
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Profile Completeness</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                {student.profileCompletion === 100 ? 'Fully prepared' : 'Missing key profile information'}
              </div>
            </div>
          </div>
        </div>

        {/* D. Current Tasks */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>Pending Tasks</h2>
          {currentTasks.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)' }}>No pending tasks.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentTasks.map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                return (
                  <div key={task._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: '8px', borderLeft: `3px solid ${isOverdue ? '#ef4444' : 'var(--color-brand-primary)'}` }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</div>
                      <div style={{ fontSize: '0.75rem', color: isOverdue ? '#ef4444' : 'var(--color-text-secondary)' }}>
                        {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No deadline'}
                        {isOverdue && ' (OVERDUE)'}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)', alignSelf: 'flex-start' }}>{task.priority}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* E. Activity Timeline */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>Activity Timeline</h2>
          {timeline.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)' }}>No recent activity.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 10, bottom: 10, left: 7, width: '2px', background: 'var(--color-border)' }}></div>
              {timeline.slice(0, 10).map((event, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--color-surface)', border: '2px solid var(--color-brand-primary)', flexShrink: 0, marginTop: '2px' }}></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{event.details}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(event.date).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* F. Recommended Mentor Action */}
        <div style={{ background: 'var(--gradient-brand)', borderRadius: '16px', padding: '1.5rem', color: 'white', gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Mentor Action Plan</h2>
          <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.5, opacity: 0.9 }}>
            {condition.status === 'ACTIVE' && 'Student is progressing well. Check in periodically.'}
            {condition.status === 'NEEDS_ATTENTION' && 'Intervention required. Please review their overdue tasks or open interventions and schedule a follow-up immediately.'}
            {condition.status === 'INACTIVE' && 'Student has gone cold. Reach out to schedule a planning session and assign an initial task.'}
            {condition.status === 'INTERVIEW_PREPARATION_REQUIRED' && 'Reach out to conduct a mock interview or share preparation materials for their upcoming interview.'}
            {condition.status === 'FOLLOW_UP_REQUIRED' && 'Pipeline is stalled. Help the student identify new opportunities or refine their application strategy.'}
            {condition.status === 'NO_DATA' && 'Guide the student to upload their resume and fill out their initial career profile.'}
          </p>
        </div>

      </div>

      {showCreateModal && (
        <CreateInterventionModal 
          preSelectedStudentId={student._id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchStudentProfile();
          }}
        />
      )}
    </div>
  );
};

export default MentorStudentProfile;
