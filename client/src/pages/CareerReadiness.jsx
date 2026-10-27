import React from 'react';
import { useNavigate } from 'react-router-dom';
import useReadiness from '../hooks/useReadiness';

const ProgressBar = ({ percentage, color = 'var(--color-brand-primary)' }) => (
  <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-overlay)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
    <div style={{ width: `${percentage}%`, height: '100%', background: color, transition: 'width 0.5s ease' }} />
  </div>
);

const ReadinessCard = ({ title, percentage, color, children, icon, actionText, onAction }) => (
  <div style={{
    background: 'var(--color-surface)',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(32, 178, 170, 0.1)', color: 'var(--color-brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{title}</h3>
      </div>
      {percentage !== null && percentage !== undefined && (
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-primary)' }}>{percentage}%</div>
      )}
    </div>
    
    {percentage !== null && percentage !== undefined && (
      <ProgressBar percentage={percentage} color={'var(--color-brand-primary)'} />
    )}
    
    <div style={{ flex: 1 }}>{children}</div>
    
    {actionText && (
      <button onClick={onAction} className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
        {actionText}
      </button>
    )}
  </div>
);

const CareerReadiness = () => {
  const { data, loading, error } = useReadiness();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', animation: 'pulse 1.5s infinite' }}>Loading your readiness profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#ef4444', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Failed to Load</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { profile, resume, applications, interviews, tasks, skills, recommendedAction } = data;

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '36px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%', gap: '32px' }}>
        
        {/* HEADER */}
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Career Readiness</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginTop: '0.5rem', fontWeight: 500 }}>Track your preparation progress across key career pillars.</p>
        </div>

        {/* RECOMMENDED ACTION */}
        {recommendedAction && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(32, 178, 170, 0.1)', color: 'var(--color-brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎯</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Next Action</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '4px' }}>{recommendedAction.text}</div>
              </div>
            </div>
            <button onClick={() => navigate(recommendedAction.link)} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {recommendedAction.buttonText}
            </button>
          </div>
        )}

        {/* GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          {/* PROFILE */}
          <ReadinessCard title="Profile Completeness" percentage={profile.percentage} icon="👤" actionText="Edit Profile" onAction={() => navigate('/settings')}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>A complete profile helps you stand out and powers better AI recommendations.</p>
            {profile.missing.length > 0 ? (
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#ef4444' }}>Missing Fields:</div>
                <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {profile.missing.slice(0, 3).map((item, i) => <li key={i}>{item}</li>)}
                  {profile.missing.length > 3 && <li>+{profile.missing.length - 3} more</li>}
                </ul>
              </div>
            ) : (
              <div style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>✨ All key fields are filled out!</div>
            )}
          </ReadinessCard>

          {/* RESUME */}
          <ReadinessCard title="Resume Readiness" percentage={resume.percentage} icon="📄" actionText="Manage Resumes" onAction={() => navigate('/resume')}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Ensure your resume is tailored and ready for applications.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {resume.checklist.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: item.done ? '#10b981' : 'var(--color-surface-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>
                    {item.done ? '✓' : ''}
                  </div>
                  <span style={{ color: item.done ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              <strong>{resume.count}</strong> resume(s) uploaded
            </div>
          </ReadinessCard>

          {/* INTERVIEW PREP */}
          <ReadinessCard title="Interview Preparation" percentage={interviews.preparationProgress} icon="🎙️" actionText="View Interviews" onAction={() => navigate('/interviews')}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Track your preparation for upcoming interviews.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--color-surface-overlay)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{interviews.upcoming}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Upcoming</div>
              </div>
              <div style={{ background: 'var(--color-surface-overlay)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{interviews.completed}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div>
              </div>
            </div>
            {interviews.preparationProgress === null && interviews.upcoming === 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No upcoming interviews scheduled.</div>
            )}
            {interviews.preparationProgress === null && interviews.upcoming > 0 && (
              <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>No prep checklist items found.</div>
            )}
          </ReadinessCard>

          {/* TASK COMPLETION */}
          <ReadinessCard title="Task Management" percentage={tasks.percentage} icon="✅" actionText="View Tasks" onAction={() => navigate('/tasks')}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Stay on top of your job search action items.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Completed Tasks:</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{tasks.completed}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Pending Tasks:</span>
                <span style={{ fontWeight: 700 }}>{tasks.pending}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Overdue Tasks:</span>
                <span style={{ fontWeight: 700, color: tasks.overdue > 0 ? '#ef4444' : 'var(--color-text-secondary)' }}>{tasks.overdue}</span>
              </div>
            </div>
            {tasks.percentage === null && (
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No tasks created yet.</div>
            )}
          </ReadinessCard>

          {/* APPLICATION ACTIVITY */}
          <ReadinessCard title="Application Activity" icon="🚀" actionText="View Pipeline" onAction={() => navigate('/applications')}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Your job search pipeline health.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '8px 12px', background: 'var(--color-surface-overlay)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Total</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{applications.total}</span>
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--color-surface-overlay)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Active</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>{applications.active}</span>
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--color-surface-overlay)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Interviews</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>{applications.interviews}</span>
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--color-surface-overlay)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Offers</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{applications.offers}</span>
              </div>
            </div>
          </ReadinessCard>

          {/* SKILLS */}
          <ReadinessCard title="Extracted Skills" icon="🧠" actionText="Update Resume" onAction={() => navigate('/resume')}>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>Skills extracted from your default resume.</p>
            {skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills.slice(0, 10).map((skill, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: 'rgba(32, 178, 170, 0.1)', color: 'var(--color-brand-primary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {skill}
                  </span>
                ))}
                {skills.length > 10 && (
                  <span style={{ padding: '4px 10px', background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    +{skills.length - 10} more
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No skills extracted. Upload a resume to automatically extract skills.</div>
            )}
          </ReadinessCard>

        </div>
      </div>
    </div>
  );
};

export default CareerReadiness;
