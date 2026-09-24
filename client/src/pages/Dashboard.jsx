import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useApplications from '../hooks/useApplications';
import { useAllInterviews } from '../hooks/useInterviews';
import useTasks from '../hooks/useTasks';
import useReadiness from '../hooks/useReadiness';
import useOpportunities from '../hooks/useOpportunities';

const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
    padding: '24px',
    background: 'var(--color-surface)',
    border: `1px solid var(--color-border)`,
    borderRadius: '18px',
    flex: 1,
    minWidth: '180px',
    boxShadow: 'var(--shadow-card)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</div>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: color + '15', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
  </div>
);

const SkeletonLoader = () => (
  <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
    <div style={{ height: '40px', width: '300px', background: 'var(--color-surface-overlay)', borderRadius: '8px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}></div>
    <div style={{ height: '20px', width: '200px', background: 'var(--color-surface-overlay)', borderRadius: '8px', marginBottom: '32px', animation: 'pulse 1.5s infinite' }}></div>
    <div style={{ height: '200px', width: '100%', background: 'var(--color-surface)', borderRadius: '18px', marginBottom: '32px', animation: 'pulse 1.5s infinite' }}></div>
    <div style={{ display: 'flex', gap: '24px' }}>
      {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: '120px', background: 'var(--color-surface)', borderRadius: '18px', animation: 'pulse 1.5s infinite' }}></div>)}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applications, loading: appsLoading } = useApplications();
  const { interviews: allInterviews } = useAllInterviews();
  const { tasks, loading: tasksLoading } = useTasks();
  const { data: readinessData, loading: readinessLoading } = useReadiness();
  const { opportunities } = useOpportunities();

  // ── Metrics Calculation ──
  const stats = useMemo(() => {
    const total = applications.length;
    // In progress: Active stages excluding Wishlist, Offer, Rejected
    const inProgress = applications.filter(a => ['Applied', 'Assessment', 'Interview'].includes(a.status)).length;
    const offers = applications.filter(a => a.status === 'Offer').length;
    const followUp = applications.filter(a => a.needsFollowUp).length;
    return { total, inProgress, offers, followUp };
  }, [applications]);

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return allInterviews
      .filter(iv => new Date(iv.scheduledAt) >= now && (iv.result === 'Scheduled' || iv.result === 'Rescheduled'))
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [allInterviews]);
  
  const nextInterview = upcomingInterviews[0];

  // ── Next Actions & Overdue Tasks Calculation ──
  const { nextActions, overdueItems } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Get incomplete tasks
    const pendingTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
    
    // Get apps with next actions
    const followUpApps = applications.filter(a => a.followUpDate && a.followUpStatus !== 'Completed' && a.followUpStatus !== 'Not Required');

    let allItems = [
      ...pendingTasks.map(t => ({ id: t._id, type: 'Task', title: t.title, date: t.dueDate, priority: t.priority, ref: t, link: '/tasks' })),
      ...followUpApps.map(a => ({ id: a._id, type: 'FollowUp', title: a.nextAction || 'Follow up with recruiter', date: a.followUpDate, priority: a.isPriority ? 'High' : 'Medium', ref: a, link: '/applications' }))
    ];

    const nextActions = [];
    const overdueItems = [];

    allItems.forEach(item => {
      if (!item.date) {
        nextActions.push(item); // No date, just pending
      } else {
        const itemDateStr = new Date(item.date).toISOString().split('T')[0];
        if (itemDateStr < todayStr) {
          overdueItems.push(item);
        } else {
          nextActions.push(item);
        }
      }
    });

    nextActions.sort((a, b) => (!a.date ? 1 : !b.date ? -1 : new Date(a.date) - new Date(b.date)));
    overdueItems.sort((a, b) => new Date(a.date) - new Date(b.date));

    return { nextActions: nextActions.slice(0, 5), overdueItems: overdueItems.slice(0, 5) };
  }, [tasks, applications]);

  // ── Next Best Action Logic ──
  const action = useMemo(() => {
    if (!readinessData?.recommendedAction) {
      return { label: 'Getting Started', title: 'Loading Next Steps...', desc: 'Please wait...', link: '/dashboard', cta: '...' };
    }
    const rec = readinessData.recommendedAction;
    return {
      label: 'Recommended Action',
      title: rec.text.split('.')[0] || 'Next Step',
      desc: rec.text,
      link: rec.link,
      cta: rec.buttonText
    };
  }, [readinessData]);

  // ── Recent Applications Sort ──
  const recentApplications = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 4);
  }, [applications]);

  // Display Skeleton if initial fetch is incomplete
  if (appsLoading && applications.length === 0) {
    return (
      <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '32px', paddingTop: 'max(96px, env(safe-area-inset-top, 0px))' }}>
        <SkeletonLoader />
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '32px', paddingTop: 'max(96px, env(safe-area-inset-top, 0px))', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* HEADER */}
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
            {currentDate} • Here is your career pipeline overview.
          </p>
        </div>

        {/* HERO: NEXT BEST ACTION */}
        <div style={{ 
          background: 'var(--color-surface)', 
          padding: '32px', 
          borderRadius: '18px', 
          border: '1px solid var(--color-border)', 
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{action.label}</div>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{action.title}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', maxWidth: '600px' }}>{action.desc}</p>
          </div>
          <button onClick={() => navigate(action.link)} className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.85rem 2rem', borderRadius: '999px', fontSize: '0.95rem' }}>
            {action.cta}
          </button>
        </div>

        {/* KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <StatCard label="Total Applications" value={stats.total} color="var(--color-text-primary)" icon="📋" />
          <StatCard label="In Progress" value={stats.inProgress} color="var(--color-brand-primary)" icon="🚀" />
          <StatCard label="Upcoming Interviews" value={upcomingInterviews.length} color="#10b981" icon="🎙️" />
          <StatCard label="Offers" value={stats.offers} color="#f59e0b" icon="🎉" />
        </div>

        {/* ACTION CENTER: OVERDUE & NEXT ACTIONS */}
        {(overdueItems.length > 0 || nextActions.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
            {overdueItems.length > 0 && (
              <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '18px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: 'var(--shadow-card)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', color: '#ef4444' }}>⚠️ Overdue Items</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {overdueItems.map(item => (
                    <div key={item.id} onClick={() => navigate(item.link)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--color-surface-overlay)', borderRadius: '12px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.title}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Upcoming Actions</h3>
                <button onClick={() => navigate('/tasks')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>View All Tasks ↗</button>
              </div>
              
              {nextActions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {nextActions.map(item => (
                    <div key={item.id} onClick={() => navigate(item.link)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--color-surface-overlay)', borderRadius: '12px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-brand-primary)' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.title}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.date ? new Date(item.date).toLocaleDateString() : 'No date'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>No upcoming actions. You're all caught up!</div>
              )}
            </div>
          </div>
        )}

        {/* MIDDLE ROW: READINESS & QUICK ACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          {/* Career Readiness Widget */}
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Career Readiness</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {!readinessData ? 'Loading...' : (readinessData.profile?.percentage === 100 
                  ? 'Your profile is fully complete! See your full readiness report.'
                  : `Your profile is missing important fields like ${readinessData.profile?.missing[0] || 'Resume'}.`)}
              </p>
              <button onClick={() => navigate('/readiness')} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>View Full Report</button>
            </div>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-surface-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `4px solid ${!readinessData ? '#ccc' : (readinessData.profile?.percentage > 80 ? '#10b981' : readinessData.profile?.percentage > 50 ? '#f59e0b' : '#ef4444')}` }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{readinessData?.profile?.percentage || 0}%</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => navigate('/applications')} style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '12px', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--color-brand-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--color-border)'}>
                ➕ Add Application
              </button>
              <button onClick={() => navigate('/resume')} style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '12px', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--color-brand-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--color-border)'}>
                📄 Upload Resume
              </button>
              <button onClick={() => navigate('/interviews')} style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '12px', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--color-brand-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--color-border)'}>
                📅 Log Interview
              </button>
              <button onClick={() => navigate('/settings')} style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '12px', color: 'var(--color-text-primary)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--color-brand-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--color-border)'}>
                ⚙️ Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: INTERVIEW & RECENT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          
          {/* Upcoming Interview */}
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Next Interview</h3>
              <button onClick={() => navigate('/interviews')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>View Calendar ↗</button>
            </div>
            
            {nextInterview ? (
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ background: 'var(--color-surface-overlay)', borderRadius: '14px', padding: '1.25rem 1rem', textAlign: 'center', minWidth: '90px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-brand-primary)', fontWeight: 800, textTransform: 'uppercase' }}>{new Date(nextInterview.scheduledAt).toLocaleString('default', { month: 'short' })}</div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, margin: '0.2rem 0' }}>{new Date(nextInterview.scheduledAt).getDate()}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{nextInterview.application?.company || 'Unknown Company'}</h4>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>{nextInterview.application?.role || nextInterview.type || 'Interview'}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.75rem' }}>🕒 {new Date(nextInterview.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  
                  {nextInterview.preparation && nextInterview.preparation.checklist && nextInterview.preparation.checklist.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <span style={{ color: 'var(--color-brand-primary)' }}>✨</span>
                      Prep: {nextInterview.preparation.checklist.filter(c => c.completed).length} / {nextInterview.preparation.checklist.length} Tasks Complete
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <span style={{ color: '#f59e0b' }}>⚠️</span>
                      Prep Workspace Empty
                    </div>
                  )}
                  
                  <button onClick={() => navigate('/interviews')} style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: 'var(--color-surface-overlay)', border: '1px solid var(--color-brand-primary)', color: 'var(--color-brand-primary)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>
                    Open Prep Workspace
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>📅</div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>No upcoming interviews scheduled</div>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Keep applying and updating your board when you land an interview.</p>
                <button onClick={() => navigate('/applications')} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>View Pipeline</button>
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recent Applications</h3>
              <button onClick={() => navigate('/applications')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>View All ↗</button>
            </div>
            
            {recentApplications.length === 0 ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>📋</div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>No recent applications found</div>
                <p style={{ fontSize: '0.85rem' }}>Your most recently updated applications will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentApplications.map(app => (
                  <div key={app._id} onClick={() => navigate('/applications')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--color-surface-overlay)', borderRadius: '12px', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background='var(--color-surface-raised)'} onMouseLeave={e => e.currentTarget.style.background='var(--color-surface-overlay)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                        {app.company.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{app.company}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{app.role}</div>
                      </div>
                    </div>
                    <span style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* OPPORTUNITIES ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '18px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Upcoming Opportunities</h3>
              <button onClick={() => navigate('/opportunities')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>View Hub ↗</button>
            </div>
            
            {opportunities && opportunities.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {opportunities.slice(0, 3).map(opp => (
                  <div key={opp._id} onClick={() => navigate('/opportunities')} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--color-surface-overlay)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--color-border)', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--color-brand-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--color-border)'}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{opp.type}</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{opp.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{opp.company}</div>
                    {opp.deadline && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 'auto' }}>
                        ⏳ Due {new Date(opp.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>🌟</div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>No new opportunities found</div>
                <p style={{ fontSize: '0.85rem' }}>Check back later for new placement drives and job postings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;